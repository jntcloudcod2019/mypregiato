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
                        
                        if (_browser == null || !_browser.IsConnected)
                        {
                            Console.WriteLine("[BROWSER_SERVICE] 📥 Baixando/verificando Chromium...");
                            
                            var browserFetcher = new BrowserFetcher(new BrowserFetcherOptions
                            {
                                Path = Path.Combine(Directory.GetCurrentDirectory(), BrowserCachePath)
                            });
                            
                            await browserFetcher.DownloadAsync();
                            Console.WriteLine("[BROWSER_SERVICE] ✅ Chromium pronto");

                            Console.WriteLine($"[BROWSER_SERVICE] 🚀 Lançando navegador...");
                            _browser = await Puppeteer.LaunchAsync(new LaunchOptions
                            {
                                Headless = true,
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
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[BROWSER_SERVICE] ❌ Erro na tentativa {retryCount + 1}: {ex.Message}");
                        retryCount++;
                        
                        if (retryCount >= MaxRetries)
                        {
                            CleanupBrowser();
                            Console.WriteLine($"[BROWSER_SERVICE] ❌ Falha após {MaxRetries} tentativas");
                            _logger.LogError(ex, "Falha ao processar a inicialização do navegador");
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

