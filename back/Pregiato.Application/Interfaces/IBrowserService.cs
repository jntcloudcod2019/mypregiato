using PuppeteerSharp;

namespace Pregiato.Application.Interfaces
{
    public interface IBrowserService : IAsyncDisposable
    {
        Task<IBrowser> GetBrowserAsync();
    }
}

