using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Pregiato.API.Hubs;
using Pregiato.API.Services;
using Pregiato.Application.Interfaces;
using Xunit;

namespace Pregiato.Application.Tests.Services
{
    public class WhatsAppFlowUnitTests
    {
        // Temporariamente comentado para focar nos testes do Talent
        /*
        [Fact]
        public async Task QrCacheAndStatus_AreManagedCorrectly()
        {
            var services = new ServiceCollection();
            services.AddMemoryCache();
            services.AddLogging();
            var sp = services.BuildServiceProvider();

            var hubMock = new Mock<Microsoft.AspNetCore.SignalR.IHubContext<WhatsAppHub>>();
            var cache = sp.GetRequiredService<IMemoryCache>();

            var svc = new RabbitBackgroundService(new NullLogger<RabbitBackgroundService>(), hubMock.Object, cache, sp.GetRequiredService<IServiceScopeFactory>());

            var (created, requestId) = svc.BeginQrRequest();
            Assert.True(created || !string.IsNullOrEmpty(requestId));

            svc.SetCachedQr("data:image/png;base64,AAA");
            Assert.NotNull(svc.GetCachedQr());

            svc.SetSessionStatus(true, "+5511999999999", true);
            var status = svc.GetSessionStatus();
            Assert.True(status.sessionConnected);
            Assert.Equal("+5511999999999", status.connectedNumber);
        }
        */
    }
}


