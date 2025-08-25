using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pregiato.API.Hubs;
using Pregiato.Application.Interfaces;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;
using System.Collections.Concurrent;

namespace Pregiato.API.Services
{
    public class RabbitMQConfig
    {
        public string Protocol { get; set; } = "amqp";
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string VirtualHost { get; set; } = string.Empty;
        public string ConnectionString { get; set; } = string.Empty;
    }

    public class SessionStatus
    {
        public bool sessionConnected { get; set; }
        public string? connectedNumber { get; set; }
        public bool isFullyValidated { get; set; }
        public string lastActivity { get; set; } = string.Empty;
        public string instanceId { get; set; } = string.Empty;
        public long timestamp { get; set; }
    }

    public class RabbitBackgroundService : BackgroundService
    {
        private readonly ILogger<RabbitBackgroundService> _logger;
        private readonly IHubContext<WhatsAppHub> _hubContext;
        private readonly IServiceProvider _services;
        private readonly ConversationService _conversationService;
        private readonly IMemoryCache _cache;
        private readonly RabbitMQConfig _rabbitConfig;
        
        // Conexão real com RabbitMQ
        private IConnection? _connection;
        private IModel? _channel;
        private bool _connected = false;
        
        // Cache local para QR codes e status
        private string _qrCodeCache = string.Empty;
        private bool _qrRequestPending = false;
        private string _qrRequestId = string.Empty;
        
        // Status da sessão WhatsApp
        private bool _sessionConnected = false;
        private string? _connectedNumber = null;
        private bool _isFullyValidated = false;
        
        // Cache de status da sessão por instanceId
        private readonly Dictionary<string, SessionStatus> _sessionStatusCache = new();
        
        // Fila para processamento em batch de mensagens
        private readonly ConcurrentQueue<Message> _messageBatchQueue = new();

        public RabbitBackgroundService(
            ILogger<RabbitBackgroundService> logger,
            IHubContext<WhatsAppHub> hubContext,
            IServiceProvider services,
            IMemoryCache cache,
            IOptions<RabbitMQConfig> rabbitConfig,
            ConversationService conversationService)
        {
            _logger = logger;
            _hubContext = hubContext;
            _services = services;
            _cache = cache;
            _rabbitConfig = rabbitConfig.Value;
            _conversationService = conversationService;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("RabbitMQ Background Service iniciado");
            
            // Loop principal para manter o serviço rodando
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Tentar conectar ao RabbitMQ se não estiver conectado
                    if (_connection?.IsOpen != true)
                    {
                        _logger.LogInformation("Tentando conectar ao RabbitMQ...");
                        await ConnectToRabbitMQAsync();
                        
                        // Só configurar filas e consumidores se a conexão foi bem-sucedida
                        if (_connected && _connection?.IsOpen == true)
                        {
                            // Configurar filas
                            SetupQueues();
                            
                            // Configurar consumidores
                            SetupConsumers();
                            
                            // Iniciar worker de batch processing
                            _ = Task.Run(async () => await ProcessMessageBatchAsync(stoppingToken), stoppingToken);
                
                // Notificar clientes que o serviço está conectado
                await _hubContext.Clients.Group("whatsapp").SendAsync("service.status", new { 
                    service = "rabbit", 
                    status = "connected" 
                }, stoppingToken);

                            _logger.LogInformation("✅ RabbitMQ conectado e configurado");
                        }
                        else
                        {
                            _logger.LogWarning("⚠️ Não foi possível conectar ao RabbitMQ. Tentando novamente em breve...");
                        }
                    }
                    
                    // Verificar se a conexão ainda está ativa
                    if (_connection?.IsOpen == true)
                    {
                        // Serviço está funcionando normalmente
                        await Task.Delay(30000, stoppingToken); // Verificar a cada 30 segundos
                    }
                    else
                    {
                        // Aguardar antes de tentar reconectar
                        await Task.Delay(10000, stoppingToken); // Tentar reconectar a cada 10 segundos
                    }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _connected = false;
                    _logger.LogWarning("⚠️ Erro temporário no serviço RabbitMQ: {Message}", ex.Message);
                
                // Notificar clientes que o serviço teve erro
                    try
                    {
                await _hubContext.Clients.Group("whatsapp").SendAsync("service.status", new { 
                    service = "rabbit", 
                    status = "error",
                    message = ex.Message
                }, stoppingToken);
                    }
                    catch (Exception notifyEx)
                    {
                        _logger.LogWarning("Não foi possível notificar clientes sobre erro RabbitMQ: {Message}", notifyEx.Message);
                    }
                    
                    // Aguardar antes de tentar novamente
                    await Task.Delay(15000, stoppingToken);
                }
            }
        }

        private async Task ConnectToRabbitMQAsync()
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = _rabbitConfig.Host,
                    Port = _rabbitConfig.Port,
                    UserName = _rabbitConfig.Username,
                    Password = _rabbitConfig.Password,
                    VirtualHost = _rabbitConfig.VirtualHost,
                    AutomaticRecoveryEnabled = true,
                    NetworkRecoveryInterval = TimeSpan.FromSeconds(10),
                    RequestedConnectionTimeout = TimeSpan.FromSeconds(30),
                    SocketReadTimeout = TimeSpan.FromSeconds(30),
                    SocketWriteTimeout = TimeSpan.FromSeconds(30)
                };

                // Configurar SSL/TLS se for AMQPS
                if (_rabbitConfig.Protocol == "amqps")
                {
                    factory.Ssl.Enabled = true;
                    factory.Ssl.ServerName = _rabbitConfig.Host;
                    factory.Ssl.AcceptablePolicyErrors = System.Net.Security.SslPolicyErrors.RemoteCertificateNameMismatch |
                                                          System.Net.Security.SslPolicyErrors.RemoteCertificateChainErrors;
                }

                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();
                _connected = true;
                
                _logger.LogInformation("✅ Conexão RabbitMQ estabelecida com {Protocol}://{Host}:{Port}", 
                    _rabbitConfig.Protocol, _rabbitConfig.Host, _rabbitConfig.Port);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("❌ Falha ao conectar ao RabbitMQ ({Protocol}://{Host}:{Port}): {Message}", 
                    _rabbitConfig.Protocol, _rabbitConfig.Host, _rabbitConfig.Port, ex.Message);
                _connected = false;
                // Não lançar exceção para não falhar a inicialização da aplicação
            }
        }

        private void SetupQueues()
        {
            if (_channel == null) return;

            // Declarar filas
            _channel.QueueDeclare("whatsapp.outgoing", durable: true, exclusive: false, autoDelete: false);
            _channel.QueueDeclare("out.qrcode", durable: true, exclusive: false, autoDelete: false);
            _channel.QueueDeclare("whatsapp.incoming", durable: true, exclusive: false, autoDelete: false);
            _channel.QueueDeclare("session.status", durable: true, exclusive: false, autoDelete: false);
            _channel.QueueDeclare("chat.assign", durable: true, exclusive: false, autoDelete: false);
            _channel.QueueDeclare("notification.agent", durable: true, exclusive: false, autoDelete: false);
            _channel.QueueDeclare("report.update", durable: true, exclusive: false, autoDelete: false);
            
            _logger.LogInformation("📋 Filas RabbitMQ configuradas");
        }

        private void SetupConsumers()
        {
            if (_channel == null) return;

            // Consumidor para QR codes
            var qrConsumer = new EventingBasicConsumer(_channel);
            qrConsumer.Received += async (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);
                    var qrMessage = JsonSerializer.Deserialize<QRCodeMessage>(message);
                    
                    if (qrMessage != null)
                    {
                        _logger.LogInformation("📱 QR Code recebido via RabbitMQ");
                        SetCachedQr(qrMessage.qrCode);
                        
                        // Notificar clientes via SignalR
                        await _hubContext.Clients.Group("whatsapp").SendAsync("qr.update", new { 
                            qrCode = qrMessage.qrCode, 
                            timestamp = qrMessage.timestamp,
                            instanceId = qrMessage.instanceId,
                            requestId = qrMessage.requestId
                        });
                    }
                    
                    _channel.BasicAck(ea.DeliveryTag, false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao processar QR code");
                    _channel.BasicNack(ea.DeliveryTag, false, true);
                }
            };
            
            _channel.BasicConsume("out.qrcode", false, qrConsumer);
            _logger.LogInformation("🎧 Consumidor de QR codes configurado");

            // Consumidor para mensagens WhatsApp recebidas
            var messageConsumer = new EventingBasicConsumer(_channel);
            messageConsumer.Received += async (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);
                    var whatsappMessage = JsonSerializer.Deserialize<WhatsAppMessage>(message);
                    
                    if (whatsappMessage != null)
                    {
                        _logger.LogInformation("📨 Mensagem WhatsApp recebida via RabbitMQ: {From} -> {To}", 
                            whatsappMessage.from, whatsappMessage.to);
                        
                        // Usar chatId do payload se disponível, senão gerar baseado no fromNormalized
                        var chatId = !string.IsNullOrEmpty(whatsappMessage.chatId) 
                            ? whatsappMessage.chatId 
                            : $"chat_{whatsappMessage.fromNormalized}";
                        
                        // Notificar clientes via SignalR com chatId correto
                        await _hubContext.Clients.Group("whatsapp").SendAsync("message.inbound", new { 
                            chatId = chatId,
                            fromNormalized = whatsappMessage.fromNormalized,
                            message = new {
                                id = whatsappMessage.externalMessageId,
                                externalMessageId = whatsappMessage.externalMessageId,
                                fromMe = whatsappMessage.fromMe,
                                text = whatsappMessage.body,
                                body = whatsappMessage.body,
                                ts = whatsappMessage.timestamp,
                                timestamp = whatsappMessage.timestamp,
                                type = whatsappMessage.type,
                                attachment = whatsappMessage.attachment
                            }
                        });
                        
                        // Adicionar mensagem à fila de batch processing
                        var messageEntity = new Message
                        {
                            Id = Guid.NewGuid(),
                            ConversationId = Guid.Parse(chatId.Replace("chat_", "")), // Converter chatId para Guid
                            Direction = MessageDirection.In,
                            Type = GetMessageType(whatsappMessage.type),
                            Body = whatsappMessage.body,
                            MediaUrl = whatsappMessage.attachment?.dataUrl,
                            ClientMessageId = whatsappMessage.externalMessageId,
                            CreatedAt = DateTime.Parse(whatsappMessage.timestamp)
                        };
                        
                        _messageBatchQueue.Enqueue(messageEntity);
                        
                        // Processar a mensagem para criar/atualizar chat
                        await ProcessIncomingMessage(whatsappMessage);
                    }
                    
                    _channel.BasicAck(ea.DeliveryTag, false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao processar mensagem WhatsApp");
                    _channel.BasicNack(ea.DeliveryTag, false, true);
                }
            };
            
            _channel.BasicConsume("whatsapp.incoming", false, messageConsumer);
            _logger.LogInformation("🎧 Consumidor de mensagens WhatsApp configurado");

            // Consumidor para status da sessão
            var sessionStatusConsumer = new EventingBasicConsumer(_channel);
            sessionStatusConsumer.Received += async (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);
                    var sessionStatus = JsonSerializer.Deserialize<SessionStatus>(message);
                    
                    if (sessionStatus != null)
                    {
                        _logger.LogInformation("💓 Status da sessão recebido: {InstanceId} - {Status}", 
                            sessionStatus.instanceId, sessionStatus.sessionConnected ? "ONLINE" : "OFFLINE");
                        
                        // Atualizar cache de status
                        _sessionStatusCache[sessionStatus.instanceId] = sessionStatus;
                        
                        // Atualizar status global
                        _sessionConnected = sessionStatus.sessionConnected;
                        _connectedNumber = sessionStatus.connectedNumber;
                        _isFullyValidated = sessionStatus.isFullyValidated;
                        
                        // Notificar clientes via SignalR
                        await _hubContext.Clients.Group("whatsapp").SendAsync("bot.status.update", new { 
                            sessionConnected = sessionStatus.sessionConnected,
                            connectedNumber = sessionStatus.connectedNumber,
                            isFullyValidated = sessionStatus.isFullyValidated,
                            lastActivity = sessionStatus.lastActivity,
                            instanceId = sessionStatus.instanceId,
                            timestamp = sessionStatus.timestamp
                        });
                    }
                    
                    _channel.BasicAck(ea.DeliveryTag, false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao processar status da sessão");
                    _channel.BasicNack(ea.DeliveryTag, false, true);
                }
            };
            
            _channel.BasicConsume("session.status", false, sessionStatusConsumer);
            _logger.LogInformation("🎧 Consumidor de status da sessão configurado");
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Desconectando do RabbitMQ...");
            _connected = false;
            
            // Fechar conexão
            _channel?.Close();
            _connection?.Close();
            
            // Notificar clientes que o serviço está desconectando
            await _hubContext.Clients.Group("whatsapp").SendAsync("service.status", new { 
                service = "rabbit", 
                status = "disconnecting" 
            }, cancellationToken);
            
            await base.StopAsync(cancellationToken);
        }

        public bool IsConnected => _connected && _connection?.IsOpen == true;

        // Método para enviar mensagens
        public async Task PublishAsync<T>(string routingKey, T message, CancellationToken cancellationToken = default)
        {
            if (!IsConnected)
            {
                throw new InvalidOperationException("RabbitMQ não está conectado");
            }

            try
            {
                var messageJson = JsonSerializer.Serialize(message);
                var body = Encoding.UTF8.GetBytes(messageJson);
                
                _channel?.BasicPublish(
                    exchange: "",
                    routingKey: routingKey,
                    basicProperties: null,
                    body: body
                );
                
                _logger.LogInformation("📤 Mensagem enviada para RabbitMQ: {RoutingKey} - {Message}", routingKey, messageJson);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao publicar mensagem no RabbitMQ");
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
                _logger.LogInformation("🔍 Tentando publicar comando no RabbitMQ...");
                
                if (_channel == null)
                {
                    _logger.LogError("❌ Canal RabbitMQ não está disponível");
                    return;
                }
                
                if (!_channel.IsOpen)
                {
                    _logger.LogError("❌ Canal RabbitMQ não está aberto");
                    return;
                }
                
                var json = JsonSerializer.Serialize(command);
                var body = Encoding.UTF8.GetBytes(json);
                
                _logger.LogInformation("📤 Publicando comando: {Command}", json);
                _logger.LogInformation("📤 Routing Key: whatsapp.outgoing");
                _logger.LogInformation("📤 Body length: {Length} bytes", body.Length);
                _logger.LogInformation("📤 Body as string: {BodyString}", Encoding.UTF8.GetString(body));
                
                // Verificar se há caracteres especiais
                var bodyHex = BitConverter.ToString(body);
                _logger.LogInformation("📤 Body hex: {BodyHex}", bodyHex);
                
                _channel.BasicPublish(
                    exchange: "",
                    routingKey: "whatsapp.outgoing",
                    basicProperties: null,
                    body: body
                );
                
                _logger.LogInformation("✅ Comando enviado para RabbitMQ com sucesso: {Command}", json);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao publicar comando no RabbitMQ: {Message}", ex.Message);
            }
        }

        // Método para converter tipo de mensagem
        private MessageType GetMessageType(string type)
        {
            return type?.ToLower() switch
            {
                "image" => MessageType.Image,
                "audio" => MessageType.Audio,
                "document" => MessageType.Document,
                "video" => MessageType.Video,
                _ => MessageType.Text
            };
        }

        // Método para processar mensagens em batch
        private async Task ProcessMessageBatchAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var messages = new List<Message>();
                    
                    // Coletar mensagens da fila (máximo 100 por batch)
                    while (_messageBatchQueue.TryDequeue(out var message) && messages.Count < 100)
                    {
                        messages.Add(message);
                    }
                    
                    if (messages.Any())
                    {
                        using var scope = _services.CreateScope();
                        var context = scope.ServiceProvider.GetRequiredService<PregiatoDbContext>();
                        
                        using var transaction = await context.Database.BeginTransactionAsync(stoppingToken);
                        try
                        {
                            await context.Messages.AddRangeAsync(messages, stoppingToken);
                            await context.SaveChangesAsync(stoppingToken);
                            await transaction.CommitAsync(stoppingToken);
                            
                            _logger.LogInformation("✅ Salvas {Count} mensagens em batch", messages.Count);
                        }
                        catch (Exception ex)
                        {
                            await transaction.RollbackAsync(stoppingToken);
                            _logger.LogError(ex, "❌ Erro ao salvar mensagens em batch");
                            
                            // Recolocar mensagens na fila
                            foreach (var msg in messages)
                            {
                                _messageBatchQueue.Enqueue(msg);
                            }
                        }
                    }
                    
                    // Aguardar 2 segundos antes do próximo batch
                    await Task.Delay(2000, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erro no processamento de batch");
                    await Task.Delay(5000, stoppingToken); // Aguardar mais tempo em caso de erro
                }
            }
        }

        // Método para processar mensagens recebidas
        private async Task ProcessIncomingMessage(WhatsAppMessage message)
        {
            try
            {             
                // Criar um escopo para resolver serviços com escopo
                using var scope = _services.CreateScope();
                var attendanceService = scope.ServiceProvider.GetService<AttendanceService>();
                var context = scope.ServiceProvider.GetService<PregiatoDbContext>();
                
                if (attendanceService != null && context != null)
                {
                    // CORREÇÃO: Usar normalização consistente para evitar duplicação de chats
                    var normalizedPhone = ContentTypeHelper.NormalizePhoneE164Br(message.from, message.isGroup);
                    
                    // Log detalhado para debug de normalização
                    _logger.LogDebug("🔧 Normalização: original={Original}, normalizado={Normalized}, isGroup={IsGroup}", 
                        message.from, normalizedPhone, message.isGroup);
                    
                    // Primeiro, criar ou obter o ChatLog usando o número normalizado
                    var chatLog = await context.ChatLogs
                        .FirstOrDefaultAsync(c => c.ContactPhoneE164 == normalizedPhone);
                    
                    _logger.LogInformation("📨 Processando mensagem de {From} (normalized: {FromNormalized}) - ChatLog existente: {ChatLogExists}", 
                        message.from, normalizedPhone, chatLog != null);
                    
                    if (chatLog == null)
                    {
                        // Criar novo ChatLog - NÃO salvar no banco ainda, apenas em memória
                        var newChatLog = new ChatLog
                        {
                            Id = Guid.NewGuid(),
                            ChatId = Guid.NewGuid(),
                            ContactPhoneE164 = normalizedPhone, // Usar número normalizado
                            PhoneNumber = normalizedPhone,
                            Title = $"Chat com {normalizedPhone}",
                            PayloadJson = "{}",
                            UnreadCount = 1,
                            LastMessageAt = DateTime.Parse(message.timestamp),
                            LastMessagePreview = message.body?.Length > 200 ? message.body.Substring(0, 200) : message.body,
                            Timestamp = DateTime.Parse(message.timestamp),
                            Direction = "inbound",
                            Content = "", // Não salvar conteúdo individual
                            ContentType = ContentTypeHelper.GetShortContentType(message.type),
                            MessageId = message.externalMessageId
                        };
                        
                        // Inicializar PayloadJson com a primeira mensagem
                        var initialPayload = new Dictionary<string, object>
                        {
                            ["messages"] = new List<object>
                            {
                                new
                                {
                                    id = message.externalMessageId,
                                    from = message.from,
                                    body = message.body,
                                    type = message.type,
                                    timestamp = message.timestamp,
                                    direction = "inbound"
                                }
                            }
                        };
                        
                        newChatLog.PayloadJson = System.Text.Json.JsonSerializer.Serialize(initialPayload);
                        
                        // Salvar no banco apenas o registro inicial
                        await context.ChatLogs.AddAsync(newChatLog);
                        await context.SaveChangesAsync();
                        
                        _logger.LogInformation("📝 ✅ NOVO ChatLog criado para {From}: ChatId={ChatId}, ChatLogId={ChatLogId}", 
                            message.from, newChatLog.ChatId, newChatLog.Id);
                        
                        chatLog = newChatLog;
                    }
                    else
                    {
                        // Atualizar ChatLog existente - apenas preview e contadores
                        chatLog.UnreadCount++;
                        chatLog.LastMessageAt = DateTime.Parse(message.timestamp);
                        chatLog.LastMessagePreview = message.body?.Length > 200 ? message.body.Substring(0, 200) : message.body;
                        chatLog.UpdatedAt = DateTime.UtcNow;
                        
                        // Adicionar nova mensagem ao payload existente
                        var payload = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(chatLog.PayloadJson) ?? new Dictionary<string, object>();
                        if (!payload.ContainsKey("messages"))
                        {
                            payload["messages"] = new List<object>();
                        }
                        
                        var messages = (payload["messages"] as List<object>) ?? new List<object>();
                        
                        // Verificar se a mensagem já existe para evitar duplicação
                        var messageExists = messages.Any(m => 
                        {
                            if (m is System.Text.Json.JsonElement element)
                            {
                                return element.TryGetProperty("id", out var idElement) && 
                                       idElement.GetString() == message.externalMessageId;
                            }
                            return false;
                        });
                        
                        if (!messageExists)
                        {
                            messages.Add(new
                            {
                                id = message.externalMessageId,
                                from = message.from,
                                body = message.body,
                                type = message.type,
                                timestamp = message.timestamp,
                                direction = "inbound"
                            });
                            
                            payload["messages"] = messages;
                            chatLog.PayloadJson = System.Text.Json.JsonSerializer.Serialize(payload);
                        }
                        
                        // Salvar apenas as atualizações de preview e contadores
                        await context.SaveChangesAsync();
                        
                        _logger.LogInformation("📝 ✅ ChatLog ATUALIZADO para {From}: ChatId={ChatId}, ChatLogId={ChatLogId}, UnreadCount={UnreadCount}, Messages={MessageCount}", 
                            message.from, chatLog.ChatId, chatLog.Id, chatLog.UnreadCount, messages.Count);
                    }
                    
                    // Criar ou atualizar AttendanceTicket
                    var ticket = await attendanceService.AssignAsync(chatLog.ChatId, "system", "Sistema", chatLog.Id);
                    
                    _logger.LogInformation("📨 Chat processado para {From}: {ChatId}", message.from, chatLog.ChatId);
                    
                    // Notificar clientes sobre nova mensagem
                    await _hubContext.Clients.Group("whatsapp").SendAsync("message.inbound", new { 
                        chatId = chatLog.ChatId,
                        message = new {
                            id = message.externalMessageId,
                            externalMessageId = message.externalMessageId,
                            from = message.from,
                            fromNormalized = normalizedPhone, // Usar número normalizado
                            body = message.body,
                            text = message.body,
                            type = message.type,
                            timestamp = message.timestamp,
                            ts = message.timestamp,
                            fromMe = false,
                            isGroup = message.isGroup,
                            attachment = message.attachment
                        }
                    });
                }
                else
                {
                    _logger.LogWarning("📨 AttendanceService ou DbContext não disponível para processar mensagem de {From}", message.from);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar mensagem recebida: {From}", message.from);
            }
        }
    }
}

namespace Pregiato.API.Services
{
    public class QRCodeMessage
    {
        public string qrCode { get; set; } = string.Empty;
        public string timestamp { get; set; } = string.Empty;
        public string instanceId { get; set; } = string.Empty;
        public string? requestId { get; set; }
        public string type { get; set; } = string.Empty;
    }

    public class WhatsAppMessage
    {
        public string externalMessageId { get; set; } = string.Empty;
        public string from { get; set; } = string.Empty;
        public string fromNormalized { get; set; } = string.Empty;
        public string to { get; set; } = string.Empty;
        public string body { get; set; } = string.Empty;
        public string type { get; set; } = string.Empty;
        public WhatsAppAttachment? attachment { get; set; }
        public string timestamp { get; set; } = string.Empty;
        public string instanceId { get; set; } = string.Empty;
        public bool fromMe { get; set; }
        public bool isGroup { get; set; }
        public bool simulated { get; set; }
        public string? chatId { get; set; }
    }

    public class WhatsAppAttachment
    {
        public string? dataUrl { get; set; }
        public string? mimeType { get; set; }
        public string? fileName { get; set; }
        public string? mediaType { get; set; }
    }

    /// <summary>
    /// Converte tipos de conteúdo longos para versões curtas que cabem no banco
    /// </summary>
    public static class ContentTypeHelper
    {
        public static string GetShortContentType(string contentType)
        {
            if (string.IsNullOrEmpty(contentType))
                return "text";
                
            // Mapear tipos longos para versões curtas
            return contentType.ToLower() switch
            {
                "application/octet-stream" => "file",
                "image/jpeg" => "image",
                "image/png" => "image", 
                "image/gif" => "image",
                "image/webp" => "image",
                "video/mp4" => "video",
                "video/avi" => "video",
                "video/mov" => "video",
                "audio/mpeg" => "audio",
                "audio/wav" => "audio",
                "audio/ogg" => "audio",
                "audio/webm" => "audio",
                "application/pdf" => "doc",
                "application/msword" => "doc",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => "doc",
                "text/plain" => "text",
                "text/html" => "text",
                _ => contentType.Length > 20 ? contentType.Substring(0, 20) : contentType
            };
        }

        /// <summary>
        /// Normaliza um número de telefone ou ID de grupo para um formato padrão
        /// CORRIGIDA para evitar duplicação de chats - conforme análise de engenharia reversa
        /// </summary>
        /// <param name="phone">Número de telefone ou ID de grupo</param>
        /// <param name="isGroup">Se é um ID de grupo</param>
        /// <returns>Número normalizado</returns>
        public static string NormalizePhoneE164Br(string phone, bool isGroup = false)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return string.Empty;
            
            // Remover todos os caracteres não numéricos
            var digits = new string(phone.Where(char.IsDigit).ToArray());
            
            // Para grupos, sempre retornar apenas os dígitos (sem @g.us)
            // O @g.us será adicionado apenas quando necessário
            if (isGroup || (digits.StartsWith("120") && digits.Length >= 18))
            {
                return digits;
            }
            
            // Para números individuais brasileiros, aplicar formato E.164 BR
            // Números brasileiros: 10 ou 11 dígitos (DDD + número)
            if (digits.Length == 10 || digits.Length == 11)
            {
                return $"55{digits}";
            }
            
            // Se já tiver código do país (12+ dígitos) ou outro formato, retornar como está
            return digits;
        }
    }
}
