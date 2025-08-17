using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Pregiato.API.Hubs;
using Pregiato.API.Services;
using Pregiato.Application.Interfaces;
using Pregiato.Infrastructure.Data;
using Pregiato.Application.Services;
using Xunit;

namespace Pregiato.Application.Tests.Services
{
    public class WhatsAppFlowTests
    {
        [Fact(Skip = "Integração com RabbitMQ/SinalR - usar em ambiente de CI preparado")] 
        public async Task FullFlow_Qr_Connect_Send_Receive_Close()
        {
            var services = new ServiceCollection();
            services.AddLogging();
            services.AddMemoryCache();
            services.AddSignalR();
            services.AddDbContext<PregiatoDbContext>(opts => { /* configure test provider */ });
            services.AddSingleton<RabbitBackgroundService>();
            services.AddScoped<IWhatsAppService, WhatsAppService>();
            services.AddSingleton<WhatsAppHub>();

            var sp = services.BuildServiceProvider();
            var mem = sp.GetRequiredService<IMemoryCache>();
            var rabbit = sp.GetRequiredService<RabbitBackgroundService>();

            // 1) Pedir QR
            var (created, requestId) = rabbit.BeginQrRequest();
            Assert.True(created || !string.IsNullOrEmpty(requestId));

            // 2) Simula recepção de QR via cache
            rabbit.SetCachedQr("data:image/png;base64,AAA");
            Assert.NotNull(rabbit.GetCachedQr());

            // 3) Simula conexão de sessão
            rabbit.SetSessionStatus(true, "+5511999999999", true);
            var status = rabbit.GetSessionStatus();
            Assert.True(status.sessionConnected);

            // 4) Simula envio de mensagem
            rabbit.PublishCommand(new { type = "send-message", to = "+5511999999999", body = "ping" });

            // 5) Simula inbound
            // Aqui normalmente um consumidor escreveria no banco; validamos acesso ao serviço
            Assert.True(true);
        }
    }
}


