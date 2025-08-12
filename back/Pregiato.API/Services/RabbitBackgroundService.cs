using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Pregiato.API.Hubs;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Pregiato.API.Services
{
    public class RabbitBackgroundService : BackgroundService
    {
        private readonly ILogger<RabbitBackgroundService> _logger;
        private readonly IHubContext<WhatsAppHub> _hubContext;
        private readonly IMemoryCache _cache;
        private IConnection? _connection;
        private IModel? _channel;
        private bool _consumerStarted;

        private const string QrQueue = "out.qrcode";
        public const string QrCacheKey = "last_qr";
        public const string StatusCacheKey = "session_status";
        private static readonly TimeSpan QrCacheTtl = TimeSpan.FromMinutes(3);
        private static readonly TimeSpan StatusCacheTtl = TimeSpan.FromMinutes(5);

        // Controle de idempotência / pedido pendente
        private readonly object _qrLock = new();
        private bool _qrRequestPending = false;
        private string? _qrRequestId = null;
        private DateTime? _qrRequestAt = null;
        private static readonly TimeSpan QrRequestTtl = TimeSpan.FromMinutes(2);

        public RabbitBackgroundService(ILogger<RabbitBackgroundService> logger, IHubContext<WhatsAppHub> hubContext, IMemoryCache cache)
        {
            _logger = logger;
            _hubContext = hubContext;
            _cache = cache;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    EnsureConnection();
                    EnsureConsumer();

                    // Expirar pedido pendente se passar do TTL
                    lock (_qrLock)
                    {
                        if (_qrRequestPending && _qrRequestAt.HasValue && DateTime.UtcNow - _qrRequestAt.Value > QrRequestTtl)
                        {
                            _logger.LogWarning("⏳ Expirando pedido de QR pendente (requestId={RequestId})", _qrRequestId);
                            _qrRequestPending = false;
                            _qrRequestId = null;
                            _qrRequestAt = null;
                        }
                    }

                    await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro no loop do RabbitBackgroundService");
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
            }
        }

        private void EnsureConnection()
        {
            if (_connection != null && _connection.IsOpen && _channel != null && _channel.IsOpen)
            {
                return;
            }

            CloseConnection();

            var factory = new ConnectionFactory
            {
                HostName = "mouse.rmq5.cloudamqp.com",
                VirtualHost = "ewxcrhtv",
                UserName = "ewxcrhtv",
                Password = "DNcdH0NEeP4Fsgo2_w-vd47CqjelFk_S",
                Port = 5672,
                AutomaticRecoveryEnabled = true,
                NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();

            _channel.QueueDeclare(QrQueue, durable: true, exclusive: false, autoDelete: false);

            _consumerStarted = false;
            _logger.LogInformation("✅ Conexão RabbitMQ estabelecida no HostedService");
        }

        private void EnsureConsumer()
        {
            if (_consumerStarted || _channel == null || _channel.IsClosed) return;

            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += async (_, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);
                    _logger.LogInformation("📥 Mensagem recebida em {Queue}: {Message}", QrQueue, message);
                    var json = JsonSerializer.Deserialize<JsonElement>(message);

                    bool shouldEmit;
                    string? requestIdSnapshot;
                    lock (_qrLock)
                    {
                        shouldEmit = _qrRequestPending;
                        requestIdSnapshot = _qrRequestId;
                    }

                    if (!shouldEmit)
                    {
                        _logger.LogInformation("🚫 QR recebido sem pedido pendente. Ignorando evento.");
                        _channel.BasicAck(ea.DeliveryTag, false);
                        return;
                    }

                    if (json.TryGetProperty("qrCode", out var qrProp))
                    {
                        var qr = qrProp.GetString() ?? string.Empty;
                        if (!qr.StartsWith("data:image/"))
                        {
                            qr = $"data:image/png;base64,{qr}";
                        }

                        _cache.Set(QrCacheKey, qr, QrCacheTtl);

                        await _hubContext.Clients.Group("whatsapp").SendAsync("qr.update", new
                        {
                            qrCode = qr,
                            timestamp = DateTime.UtcNow.ToString("O"),
                            instanceId = json.TryGetProperty("instanceId", out var iid) ? iid.GetString() : "rabbit",
                            requestId = requestIdSnapshot
                        });

                        _logger.LogInformation("📤 QR Code emitido via SignalR (rabbit) tamanho={Length} requestId={RequestId}", qr.Length, requestIdSnapshot);

                        // limpar pedido APÓS sucesso na emissão
                        lock (_qrLock)
                        {
                            _qrRequestPending = false;
                            _qrRequestAt = null;
                            _logger.LogInformation("✅ Pedido de QR concluído requestId={RequestId}", requestIdSnapshot);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("⚠️ Mensagem não possui campo qrCode. Mantendo pedido pendente. requestId={RequestId}", requestIdSnapshot);
                    }

                    _channel.BasicAck(ea.DeliveryTag, false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao processar mensagem da fila {Queue}", QrQueue);
                    _channel?.BasicNack(ea.DeliveryTag, false, false);
                }
            };

            _channel.BasicConsume(QrQueue, autoAck: false, consumer);
            _consumerStarted = true;
            _logger.LogInformation("🎧 Consumer da fila {Queue} iniciado", QrQueue);
        }

        // API de controle de pedido de QR
        public (bool created, string? requestId) BeginQrRequest()
        {
            lock (_qrLock)
            {
                if (_qrRequestPending)
                {
                    _logger.LogInformation("ℹ️ Pedido de QR já pendente requestId={RequestId}", _qrRequestId);
                    return (false, _qrRequestId);
                }
                _qrRequestPending = true;
                _qrRequestId = Guid.NewGuid().ToString("N");
                _qrRequestAt = DateTime.UtcNow;
                _logger.LogInformation("🟢 Pedido de QR aberto requestId={RequestId}", _qrRequestId);
                return (true, _qrRequestId);
            }
        }

        public void CancelQrRequest()
        {
            lock (_qrLock)
            {
                _qrRequestPending = false;
                _qrRequestId = null;
                _qrRequestAt = null;
                _logger.LogInformation("🛑 Pedido de QR cancelado");
            }
        }

        public bool IsQrRequestPending()
        {
            lock (_qrLock) return _qrRequestPending;
        }

        public void PublishCommand(object command)
        {
            EnsureConnection();
            var json = JsonSerializer.Serialize(command);
            var body = Encoding.UTF8.GetBytes(json);
            var props = _channel!.CreateBasicProperties();
            props.Persistent = true;
            props.ContentType = "application/json";
            props.MessageId = Guid.NewGuid().ToString();
            props.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());

            _channel.BasicPublish("", "whatsapp.outgoing", props, body);
            _logger.LogInformation("📨 Comando publicado em whatsapp.outgoing: {Json}", json);
        }

        public string? GetCachedQr()
        {
            _cache.TryGetValue<string>(QrCacheKey, out var qr);
            return qr;
        }

        public void SetCachedQr(string qr)
        {
            _cache.Set(QrCacheKey, qr, QrCacheTtl);
        }

        // Status: get/set
        public (bool sessionConnected, string? connectedNumber, bool isFullyValidated) GetSessionStatus()
        {
            if (_cache.TryGetValue(StatusCacheKey, out (bool sessionConnected, string? connectedNumber, bool isFullyValidated) status))
            {
                return status;
            }
            return (false, null, false);
        }

        public void SetSessionStatus(bool sessionConnected, string? connectedNumber, bool isFullyValidated)
        {
            _cache.Set(StatusCacheKey, (sessionConnected, connectedNumber, isFullyValidated), StatusCacheTtl);
            _logger.LogInformation("🟢 Status de sessão atualizado: connected={Connected} number={Number} validated={Validated}", sessionConnected, connectedNumber, isFullyValidated);
        }

        private void CloseConnection()
        {
            try
            {
                _channel?.Close();
                _channel?.Dispose();
                _channel = null;
                _connection?.Close();
                _connection?.Dispose();
                _connection = null;
            }
            catch { }
        }

        public override void Dispose()
        {
            CloseConnection();
            base.Dispose();
        }
    }
}
