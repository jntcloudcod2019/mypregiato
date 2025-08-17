using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Pregiato.API.Hubs;
using Pregiato.Application.Interfaces;
using System;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Pregiato.API.Services
{
    public class RabbitBackgroundService : BackgroundService
    {
        private readonly ILogger<RabbitBackgroundService> _logger;
        private readonly IHubContext<WhatsAppHub> _hubContext;
        private readonly IServiceProvider _services;
        private readonly IMemoryCache _cache;
        
        // Flag para simular conexão com RabbitMQ (em produção, isso seria uma conexão real)
        private bool _connected = false;
        private string _qrCodeCache = string.Empty;
        private bool _qrRequestPending = false;
        private string _qrRequestId = string.Empty;
        
        // Status da sessão WhatsApp
        private bool _sessionConnected = false;
        private string? _connectedNumber = null;
        private bool _isFullyValidated = false;

        public RabbitBackgroundService(
            ILogger<RabbitBackgroundService> logger,
            IHubContext<WhatsAppHub> hubContext,
            IServiceProvider services,
            IMemoryCache cache)
        {
            _logger = logger;
            _hubContext = hubContext;
            _services = services;
            _cache = cache;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("RabbitMQ Background Service iniciado");
            
            try
            {
                // Simular conexão com RabbitMQ (em produção, isso seria uma conexão real)
                await Task.Delay(2000, stoppingToken); // Simular tempo de conexão
                _connected = true;
                _logger.LogInformation("Conectado ao serviço de mensagens");
                
                // Notificar clientes que o serviço está conectado
                await _hubContext.Clients.Group("whatsapp").SendAsync("service.status", new { 
                    service = "rabbit", 
                    status = "connected" 
                }, stoppingToken);

                // Loop principal para manter o serviço rodando
                while (!stoppingToken.IsCancellationRequested)
                {
                    // Em uma implementação real, aqui haveria código para consumir mensagens
                    // do RabbitMQ e processá-las
                    await Task.Delay(5000, stoppingToken);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _connected = false;
                _logger.LogError(ex, "Erro no serviço RabbitMQ");
                
                // Notificar clientes que o serviço teve erro
                await _hubContext.Clients.Group("whatsapp").SendAsync("service.status", new { 
                    service = "rabbit", 
                    status = "error",
                    message = ex.Message
                }, stoppingToken);
                
                throw;
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Desconectando do serviço de mensagens...");
            _connected = false;
            
            // Notificar clientes que o serviço está desconectando
            await _hubContext.Clients.Group("whatsapp").SendAsync("service.status", new { 
                service = "rabbit", 
                status = "disconnecting" 
            }, cancellationToken);
            
            await base.StopAsync(cancellationToken);
        }

        public bool IsConnected => _connected;

        // Método para enviar mensagens (para demonstrar como seria usado)
        public async Task PublishAsync<T>(string routingKey, T message, CancellationToken cancellationToken = default)
        {
            if (!_connected)
            {
                throw new InvalidOperationException("Serviço de mensagens não está conectado");
            }

            try
            {
                // Simular envio da mensagem para RabbitMQ
                var messageJson = JsonSerializer.Serialize(message);
                _logger.LogInformation("Mensagem enviada: {RoutingKey} - {Message}", routingKey, messageJson);
                
                // Em um sistema real, aqui a mensagem seria publicada para o RabbitMQ
                await Task.Delay(100, cancellationToken); // Simular tempo de envio
                
                return;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao publicar mensagem");
                throw;
            }
        }
        
        // Métodos para gerenciamento de QR Code
        public (bool created, string requestId) BeginQrRequest()
        {
            if (_qrRequestPending)
            {
                return (false, _qrRequestId);
            }
            
            _qrRequestId = Guid.NewGuid().ToString();
            _qrRequestPending = true;
            _logger.LogInformation("Iniciado pedido de QR Code. RequestId: {RequestId}", _qrRequestId);
            return (true, _qrRequestId);
        }
        
        public void CancelQrRequest()
        {
            if (_qrRequestPending)
            {
                _logger.LogInformation("Cancelado pedido de QR Code. RequestId: {RequestId}", _qrRequestId);
                _qrRequestPending = false;
                _qrRequestId = string.Empty;
            }
        }
        
        public bool IsQrRequestPending()
        {
            return _qrRequestPending;
        }
        
        public void SetCachedQr(string qrCode)
        {
            _qrCodeCache = qrCode;
        }
        
        public string GetCachedQr()
        {
            return _qrCodeCache;
        }
        
        // Métodos para gerenciamento de status da sessão
        public void SetSessionStatus(bool connected, string? number, bool validated)
        {
            _sessionConnected = connected;
            _connectedNumber = number;
            _isFullyValidated = validated;
        }
        
        public (bool sessionConnected, string? connectedNumber, bool isFullyValidated) GetSessionStatus()
        {
            return (_sessionConnected, _connectedNumber, _isFullyValidated);
        }
        
        // Método para publicar comandos
        public void PublishCommand<T>(T command)
        {
            try
            {
                var json = JsonSerializer.Serialize(command);
                _logger.LogInformation("Comando publicado: {Command}", json);
                // Em um sistema real, aqui o comando seria enviado para o RabbitMQ
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao publicar comando");
            }
        }
    }
}
