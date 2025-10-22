using PuppeteerSharp;

namespace Pregiato.API.Interfaces
{
    public interface IBrowserService : IAsyncDisposable
    {
        Task<IBrowser> GetBrowserAsync();
    }
}

