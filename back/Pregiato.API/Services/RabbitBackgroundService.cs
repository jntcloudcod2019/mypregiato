using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Pregiato.API.Hubs;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Pregiato.API.Services
{
    public class RabbitBackgroundService : BackgroundService
    {
        private readonly ILogger<RabbitBackgroundService> _logger;
        private readonly IHubContext<WhatsAppHub> _hubContext;
        private readonly IMemoryCache _cache;
        private readonly IServiceScopeFactory _scopeFactory;
        private IConnection? _connection;
        private IModel? _channel;
        private bool _qrConsumerStarted;
        private bool _incomingConsumerStarted;
        private bool _statusConsumerStarted;

        private const string QrQueue = "out.qrcode";
        private const string IncomingQueue = "whatsapp.incoming";
        private const string OutgoingQueue = "whatsapp.outgoing";
        private const string StatusQueue = "whatsapp.message-status";

        public const string QrCacheKey = "last_qr";
        public const string StatusCacheKey = "session_status";
        private static readonly TimeSpan QrCacheTtl = TimeSpan.FromMinutes(3);
        private static readonly TimeSpan StatusCacheTtl = TimeSpan.FromMinutes(5);

        private readonly object _qrLock = new();
        private bool _qrRequestPending = false;
        private string? _qrRequestId = null;
        private DateTime? _qrRequestAt = null;
        private static readonly TimeSpan QrRequestTtl = TimeSpan.FromMinutes(2);

        public RabbitBackgroundService(ILogger<RabbitBackgroundService> logger, IHubContext<WhatsAppHub> hubContext, IMemoryCache cache, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _hubContext = hubContext;
            _cache = cache;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    EnsureConnection();
                    EnsureQrConsumer();
                    EnsureIncomingConsumer();
                    EnsureStatusConsumer();

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
            if (_connection != null && _connection.IsOpen && _channel != null && _channel.IsOpen) return;

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
            _channel.QueueDeclare(IncomingQueue, durable: true, exclusive: false, autoDelete: false);
            _channel.QueueDeclare(OutgoingQueue, durable: true, exclusive: false, autoDelete: false);
            _channel.QueueDeclare(StatusQueue, durable: true, exclusive: false, autoDelete: false);

            _qrConsumerStarted = false;
            _incomingConsumerStarted = false;
            _statusConsumerStarted = false;
            _logger.LogInformation("✅ Conexão RabbitMQ estabelecida no HostedService");
        }

        private void EnsureQrConsumer()
        {
            if (_qrConsumerStarted || _channel == null || _channel.IsClosed) return;

            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += async (_, ea) =>
            {
                try
                {
                    var message = Encoding.UTF8.GetString(ea.Body.ToArray());
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
                        if (!qr.StartsWith("data:image/")) qr = $"data:image/png;base64,{qr}";
                        _cache.Set(QrCacheKey, qr, QrCacheTtl);
                        await _hubContext.Clients.Group("whatsapp").SendAsync("qr.update", new { qrCode = qr, timestamp = DateTime.UtcNow.ToString("O"), instanceId = json.TryGetProperty("instanceId", out var iid) ? iid.GetString() : "rabbit", requestId = requestIdSnapshot });
                        _logger.LogInformation("📤 QR Code emitido via SignalR (rabbit) requestId={RequestId}", requestIdSnapshot);
                        lock (_qrLock)
                        {
                            _qrRequestPending = false;
                            _qrRequestAt = null;
                        }
                    }
                    _channel.BasicAck(ea.DeliveryTag, false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao processar {Queue}", QrQueue);
                    _channel?.BasicNack(ea.DeliveryTag, false, false);
                }
            };
            _channel.BasicConsume(QrQueue, autoAck: false, consumer);
            _qrConsumerStarted = true;
        }

        private void EnsureIncomingConsumer()
        {
            if (_incomingConsumerStarted || _channel == null || _channel.IsClosed) return;
            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += async (_, ea) =>
            {
                try
                {
                    var message = Encoding.UTF8.GetString(ea.Body.ToArray());
                    var json = JsonSerializer.Deserialize<JsonElement>(message);
                    var from = json.GetProperty("from").GetString();
                    var body = json.TryGetProperty("body", out var b) ? b.GetString() : string.Empty;
                    var ts = json.TryGetProperty("timestamp", out var t) ? DateTime.Parse(t.GetString()!) : DateTime.UtcNow;
                    var externalId = json.TryGetProperty("externalMessageId", out var eid) ? eid.GetString() : json.TryGetProperty("messageId", out var mid) ? mid.GetString() : Guid.NewGuid().ToString("N");

                    using var scope = _scopeFactory.CreateScope();
                    var chatService = scope.ServiceProvider.GetRequiredService<ChatLogService>();
                    var attendanceService = scope.ServiceProvider.GetRequiredService<AttendanceService>();
                    var (chat, msg, created) = await chatService.UpsertInboundAsync(from!, body!, ts, externalId!);
                    // garante ticket aberto (apenas 1 não finalizado por chat)
                    await attendanceService.EnsureOpenTicketAsync(chat.Id);

                    await _hubContext.Clients.Group("whatsapp").SendAsync("message.inbound", new { chatId = chat.Id, message = msg });
                    await _hubContext.Clients.Group("whatsapp").SendAsync(created ? "chat.created" : "chat.updated", new { chatId = chat.Id, title = chat.Title, unread = chat.UnreadCount, lastMessage = chat.LastMessagePreview, updatedAt = chat.LastMessageAt });
                    var (inQueue, inService, avg) = await attendanceService.GetDashboardAsync();
                    await _hubContext.Clients.Group("whatsapp").SendAsync("dashboard.update", new { inQueue, inService, avgServiceTimeSec = avg });

                    _channel.BasicAck(ea.DeliveryTag, false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao processar {Queue}", IncomingQueue);
                    _channel?.BasicNack(ea.DeliveryTag, false, true);
                }
            };
            _channel.BasicConsume(IncomingQueue, autoAck: false, consumer);
            _incomingConsumerStarted = true;
        }

        private void EnsureStatusConsumer()
        {
            if (_statusConsumerStarted || _channel == null || _channel.IsClosed) return;
            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += async (_, ea) =>
            {
                try
                {
                    var message = Encoding.UTF8.GetString(ea.Body.ToArray());
                    var json = JsonSerializer.Deserialize<JsonElement>(message);
                    var chatId = json.TryGetProperty("chatId", out var cid) ? Guid.Parse(cid.GetString()!) : Guid.Empty;
                    var messageId = json.TryGetProperty("messageId", out var mid) ? mid.GetString() : json.TryGetProperty("externalMessageId", out var eid) ? eid.GetString() : null;
                    var status = json.TryGetProperty("status", out var st) ? st.GetString() : null;
                    if (chatId != Guid.Empty && messageId != null && status != null)
                    {
                        using var scope = _scopeFactory.CreateScope();
                        var chatService = scope.ServiceProvider.GetRequiredService<ChatLogService>();
                        await chatService.UpdateStatusAsync(chatId, messageId!, status!);
                        await _hubContext.Clients.Group("whatsapp").SendAsync("message.status", new { chatId, messageId, status });
                    }
                    _channel.BasicAck(ea.DeliveryTag, false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao processar {Queue}", StatusQueue);
                    _channel?.BasicNack(ea.DeliveryTag, false, true);
                }
            };
            _channel.BasicConsume(StatusQueue, autoAck: false, consumer);
            _statusConsumerStarted = true;
        }

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

            _channel.BasicPublish("", OutgoingQueue, props, body);
            _logger.LogInformation("📨 Comando publicado em {Queue}: {Json}", OutgoingQueue, json);
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
