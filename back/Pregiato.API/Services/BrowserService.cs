using Pregiato.API.Interfaces;
using PuppeteerSharp;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Pregiato.API.Services
{
    public class BrowserService : IBrowserService, IAsyncDisposable
    {
        private static IBrowser? _browser;
        private static readonly SemaphoreSlim _semaphore = new(1, 1);
        private const string BrowserCachePath = "Files/.local-browser"; 
        private const int MaxRetries = 3;
        private const int TimeoutSeconds = 60;
        private static BrowserFetcher? _browserFetcher;

        private static MemoryStream? _browserCacheMemoryStream;

        public BrowserService()
        {
            Console.WriteLine("[BROWSER_SERVICE] 🚀 Inicializando BrowserService");
            
            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), BrowserCachePath);
            Console.WriteLine($"[BROWSER_SERVICE] 📁 Caminho do cache do navegador: {fullPath}");
            
            if (!Directory.Exists(fullPath))
            {
                Console.WriteLine($"[BROWSER_SERVICE] 📂 Criando diretório de cache...");
                Directory.CreateDirectory(fullPath);
            }

            _browserFetcher = new BrowserFetcher(new BrowserFetcherOptions
            {
                Path = fullPath
            });
            
            Console.WriteLine("[BROWSER_SERVICE] ✅ BrowserService inicializado");
        }

        public async Task<IBrowser> GetBrowserAsync()
        {
            Console.WriteLine("[BROWSER_SERVICE] 🔍 Verificando conexão do navegador...");
            
            if (_browser != null && _browser.IsConnected)
            {
                Console.WriteLine("[BROWSER_SERVICE] ✅ Navegador já conectado, reutilizando instância");
                return _browser;
            }

            await _semaphore.WaitAsync();
            try
            {
                Console.WriteLine("[BROWSER_SERVICE] 🔒 Semáforo adquirido, iniciando processo de conexão");
                int retryCount = 0;
                RevisionInfo? revisionInfo = null;

                while (retryCount < MaxRetries)
                {
                    try
                    {
                        Console.WriteLine($"[BROWSER_SERVICE] 🔄 Tentativa {retryCount + 1} de {MaxRetries}");
                        
                        if (_browser == null || !_browser.IsConnected)
                        {
                            if (_browserCacheMemoryStream == null)
                            {
                                Console.WriteLine("[BROWSER_SERVICE] 🔍 Verificando revisão do navegador...");
                                revisionInfo = await _browserFetcher.GetRevisionInfoAsync();

                                if (revisionInfo.Local)
                                {
                                    Console.WriteLine($"[BROWSER_SERVICE] ✅ Navegador encontrado localmente: {revisionInfo.ExecutablePath}");
                                    return await LaunchBrowserAsync(revisionInfo.ExecutablePath);
                                }
                                else
                                {
                                    Console.WriteLine("[BROWSER_SERVICE] 📥 Baixando Chromium...");
                                    await _browserFetcher.DownloadAsync(BrowserFetcher.DefaultChromiumRevision);
                                    revisionInfo = await _browserFetcher.GetRevisionInfoAsync();
                                    Console.WriteLine($"[BROWSER_SERVICE] ✅ Chromium baixado: {revisionInfo.ExecutablePath}");
                                }
                            }

                            if (_browserCacheMemoryStream == null && revisionInfo != null && !revisionInfo.Local)
                            {
                                Console.WriteLine("[BROWSER_SERVICE] 📥 Baixando Chromium (segunda tentativa)...");
                                await _browserFetcher.DownloadAsync(BrowserFetcher.DefaultChromiumRevision);
                                revisionInfo = await _browserFetcher.GetRevisionInfoAsync();
                            }

                            if (revisionInfo != null && !revisionInfo.Local)
                            {
                                Console.WriteLine("[BROWSER_SERVICE] ❌ Navegador não encontrado no cache ou no disco");
                                throw new InvalidOperationException("Não foi possível encontrar o navegador no cache ou no disco.");
                            }

                            string? executablePathToUse = _browserCacheMemoryStream != null
                                ? await GetExecutableFromMemoryStream() 
                                : revisionInfo?.ExecutablePath;

                            if (string.IsNullOrEmpty(executablePathToUse))
                            {
                                Console.WriteLine("[BROWSER_SERVICE] ❌ Caminho do executável não encontrado");
                                throw new InvalidOperationException("O caminho do executável do navegador não foi encontrado.");
                            }

                            Console.WriteLine($"[BROWSER_SERVICE] 🚀 Lançando navegador: {executablePathToUse}");
                            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(TimeoutSeconds));

                            return await LaunchBrowserAsync(executablePathToUse);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[BROWSER_SERVICE] ❌ Erro na tentativa {retryCount + 1}: {ex.Message}");
                        retryCount++;
                        
                        if (retryCount >= MaxRetries)
                        {
                            CleanupBrowser();
                            Console.WriteLine($"[BROWSER_SERVICE] ❌ Falha após {MaxRetries} tentativas");
                            throw new ApplicationException("Falha ao processar a inicialização do navegador", ex);
                        }
                        
                        Console.WriteLine($"[BROWSER_SERVICE] ⏳ Aguardando antes da próxima tentativa...");
                        await Task.Delay(1000 * retryCount); // Backoff exponencial
                    }
                }

                Console.WriteLine($"[BROWSER_SERVICE] ❌ Timeout após {MaxRetries} tentativas");
                throw new TimeoutException($"Falha após {MaxRetries} tentativas de conexão.");
            }
            finally
            {
                _semaphore.Release();
                Console.WriteLine("[BROWSER_SERVICE] 🔓 Semáforo liberado");
            }
        }

        private async Task<IBrowser> LaunchBrowserAsync(string executablePath)
        {
            Console.WriteLine($"[BROWSER_SERVICE] 🎬 Lançando navegador com ExecutablePath: {executablePath}");
            
            _browser = await Puppeteer.LaunchAsync(new LaunchOptions
            {
                Headless = true,
                ExecutablePath = executablePath,
                Args = new[] { 
                    "--no-sandbox", 
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--no-first-run",
                    "--disable-extensions",
                    "--disable-default-apps"
                }
            });

            _browser.Disconnected += (_, _) => {
                Console.WriteLine("[BROWSER_SERVICE] ⚠️ Navegador desconectado");
                CleanupBrowser();
            };

            Console.WriteLine("[BROWSER_SERVICE] ✅ Navegador lançado com sucesso");
            return _browser;
        }

        private async Task<string> GetExecutableFromMemoryStream()
        {
            Console.WriteLine("[BROWSER_SERVICE] 📄 Extraindo executável da memória...");
            
            if (_browserCacheMemoryStream == null)
            {
                Console.WriteLine("[BROWSER_SERVICE] ❌ Navegador não disponível na memória");
                throw new InvalidOperationException("O navegador não está disponível na memória.");
            }

            var tempFilePath = Path.GetTempFileName();
            Console.WriteLine($"[BROWSER_SERVICE] 📁 Arquivo temporário: {tempFilePath}");
            
            await using (var tempFileStream = new FileStream(tempFilePath, FileMode.Create))
            {
                _browserCacheMemoryStream.Seek(0, SeekOrigin.Begin);
                await _browserCacheMemoryStream.CopyToAsync(tempFileStream);
            }

            Console.WriteLine("[BROWSER_SERVICE] ✅ Executável extraído com sucesso");
            return tempFilePath;
        }

        private void CleanupBrowser()
        {
            Console.WriteLine("[BROWSER_SERVICE] 🧹 Limpando recursos do navegador...");
            
            _browser?.Dispose();
            _browser = null;
            _browserCacheMemoryStream?.Dispose();
            _browserCacheMemoryStream = null;
            
            Console.WriteLine("[BROWSER_SERVICE] ✅ Recursos limpos");
        }

        public async ValueTask DisposeAsync()
        {
            Console.WriteLine("[BROWSER_SERVICE] 🛑 Encerrando BrowserService...");
            
            if (_browser != null)
            {
                await _browser.CloseAsync();
                CleanupBrowser();
            }
            _semaphore.Dispose();
            GC.SuppressFinalize(this);
            
            Console.WriteLine("[BROWSER_SERVICE] ✅ BrowserService encerrado");
        }
    }
}

