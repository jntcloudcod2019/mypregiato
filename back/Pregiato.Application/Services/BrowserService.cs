using Pregiato.Application.Interfaces;
using PuppeteerSharp;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Pregiato.Application.Services
{
    public class BrowserService : IBrowserService, IAsyncDisposable
    {
        private static IBrowser? _browser;
        private static readonly SemaphoreSlim _semaphore = new(1, 1);
        private const string BrowserCachePath = "Files/.local-browser"; 
        private const int MaxRetries = 3;
        private const int TimeoutSeconds = 60;
        private readonly ILogger<BrowserService> _logger;
        private static BrowserFetcher? _browserFetcher;

        public BrowserService(ILogger<BrowserService> logger)
        {
            _logger = logger;
            Console.WriteLine("[BROWSER_SERVICE] 🚀 Inicializando BrowserService");
            
            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), BrowserCachePath);
            Console.WriteLine($"[BROWSER_SERVICE] 📁 Caminho do cache do navegador: {fullPath}");
            
            if (!Directory.Exists(fullPath))
            {
                Console.WriteLine($"[BROWSER_SERVICE] 📂 Criando diretório de cache...");
                Directory.CreateDirectory(fullPath);
            }
            
            // Inicializa o BrowserFetcher apontando para o diretório de cache local
            try
            {
                _browserFetcher = new BrowserFetcher(new BrowserFetcherOptions
                {
                    Path = fullPath
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[BROWSER_SERVICE] ⚠️ Falha ao inicializar BrowserFetcher com opções: {ex.Message}. Tentando construtor padrão.");
                _browserFetcher = new BrowserFetcher();
            }

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
                while (retryCount < MaxRetries)
                {
                    try
                    {
                        Console.WriteLine($"[BROWSER_SERVICE] 🔄 Tentativa {retryCount + 1} de {MaxRetries}");

                        // Garantir que temos um executável local de Chromium
                        if (_browserFetcher == null)
                        {
                            throw new InvalidOperationException("BrowserFetcher não inicializado.");
                        }

                        RevisionInfo revisionInfo;
                        try
                        {
                            revisionInfo = await _browserFetcher.GetRevisionInfoAsync(BrowserFetcher.DefaultChromiumRevision);
                        }
                        catch
                        {
                            // Algumas versões exigem chamada sem parâmetro
                            revisionInfo = await _browserFetcher.GetRevisionInfoAsync();
                        }

                        if (!revisionInfo.Local)
                        {
                            Console.WriteLine("[BROWSER_SERVICE] ⬇️ Baixando Chromium...");
                            try
                            {
                                await _browserFetcher.DownloadAsync(BrowserFetcher.DefaultChromiumRevision);
                            }
                            catch
                            {
                                await _browserFetcher.DownloadAsync();
                            }
                            revisionInfo = await _browserFetcher.GetRevisionInfoAsync(BrowserFetcher.DefaultChromiumRevision);
                        }

                        if (string.IsNullOrWhiteSpace(revisionInfo.ExecutablePath))
                        {
                            throw new InvalidOperationException("Caminho do executável do Chromium não encontrado.");
                        }

                        Console.WriteLine($"[BROWSER_SERVICE] 🚀 Lançando navegador em: {revisionInfo.ExecutablePath}");
                        _browser = await Puppeteer.LaunchAsync(new LaunchOptions
                        {
                            Headless = true,
                            ExecutablePath = revisionInfo.ExecutablePath,
                            Args = new[]
                            {
                                "--no-sandbox",
                                "--disable-setuid-sandbox",
                                "--disable-dev-shm-usage",
                                "--disable-gpu",
                                "--no-first-run",
                                "--disable-extensions",
                                "--disable-default-apps"
                            }
                        });

                        _browser.Disconnected += (_, _) =>
                        {
                            Console.WriteLine("[BROWSER_SERVICE] ⚠️ Navegador desconectado");
                            CleanupBrowser();
                        };

                        Console.WriteLine("[BROWSER_SERVICE] ✅ Navegador lançado com sucesso");
                        return _browser;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[BROWSER_SERVICE] ❌ Erro na tentativa {retryCount + 1}: {ex.Message}");
                        _logger.LogError(ex, "Falha ao processar a inicialização do navegador (tentativa {Attempt})", retryCount + 1);
                        CleanupBrowser();
                        retryCount++;
                        await Task.Delay(TimeSpan.FromSeconds(Math.Min(5, retryCount)));
                    }
                }

                throw new TimeoutException($"Falha após {MaxRetries} tentativas de conexão.");
            }
            finally
            {
                _semaphore.Release();
                Console.WriteLine("[BROWSER_SERVICE] 🔓 Semáforo liberado");
            }
        }

        private void CleanupBrowser()
        {
            Console.WriteLine("[BROWSER_SERVICE] 🧹 Limpando recursos do navegador...");
            
            _browser?.Dispose();
            _browser = null;
            
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

