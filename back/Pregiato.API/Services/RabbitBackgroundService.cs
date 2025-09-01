using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pregiato.API.Hubs;
using Pregiato.Core.Interfaces;
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
using Pregiato.Application.Services;
using Pregiato.API.Services;

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

    public class MessageStatusUpdate
    {
        public string phone { get; set; } = string.Empty;
        public string messageId { get; set; } = string.Empty;
        public string status { get; set; } = string.Empty; // "sent", "delivered", "read", "failed"
        public string timestamp { get; set; } = string.Empty;
        public string instanceId { get; set; } = string.Empty;
    }

    public class RabbitBackgroundService : BackgroundService
    {
        private readonly ILogger<RabbitBackgroundService> _logger;
        private readonly IHubContext<WhatsAppHub> _hubContext;
        private readonly IServiceProvider _services;
        private readonly MediaStorageService _mediaStorageService;
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
        private DateTime _qrRequestStartTime = DateTime.MinValue;
        
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
            ConversationService conversationService,
            MediaStorageService mediaStorageService)
        {
            _logger = logger;
            _hubContext = hubContext;
            _services = services;
            _cache = cache;
            _mediaStorageService = mediaStorageService;
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
                catch (OperationCanceledException)
                {
                    // ✅ Tratar cancelamento como operação normal
                    _logger.LogInformation("RabbitMQ Background Service cancelado graciosamente");
                    break;
                }
                catch (Exception ex)
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
            
            _logger.LogInformation("RabbitMQ Background Service finalizado");
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

                        // Converter chatId para Guid usando abordagem simples e segura
                        Guid conversationId;
                        try
                        {
                            // Tentar converter diretamente se for um GUID válido
                            if (Guid.TryParse(chatId.Replace("chat_", ""), out Guid directGuid))
                            {
                                conversationId = directGuid;
                            }
                            else
                            {
                                // Para casos onde não é GUID, gerar um baseado no telefone
                                var phoneHash = whatsappMessage.fromNormalized?.GetHashCode() ?? 0;
                                conversationId = Guid.Parse($"{Math.Abs(phoneHash):X8}-0000-0000-0000-000000000000");
                            }
                        }
                        catch
                        {
                            // Fallback: usar um GUID baseado no timestamp e telefone
                            var fallbackId = $"{DateTime.UtcNow.Ticks}_{whatsappMessage.fromNormalized}".GetHashCode();
                            conversationId = Guid.Parse($"{Math.Abs(fallbackId):X8}-0000-0000-0000-000000000001");
                        }

                        // Processar a mensagem para criar/atualizar chat e obter ConversationId
                        conversationId = await ProcessIncomingMessage(whatsappMessage);

                        if (conversationId != Guid.Empty)
                        {
                            // Criar entidade de mensagem mais robusta com todos os campos
                            var messageEntity = CreateRobustMessageEntity(whatsappMessage, conversationId);
                            _messageBatchQueue.Enqueue(messageEntity);
                        }
                    }

                    _channel.BasicAck(ea.DeliveryTag, false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erro crítico no processamento da mensagem RabbitMQ");
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

            // Consumidor para status de mensagens enviadas (novo - resiliência)
            var messageStatusConsumer = new EventingBasicConsumer(_channel);
            messageStatusConsumer.Received += async (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);
                    var messageStatus = JsonSerializer.Deserialize<MessageStatusUpdate>(message);
                    
                    _logger.LogInformation("📤 Status de mensagem recebido: {Phone} - {Status} - {MessageId}", 
                        messageStatus?.phone, messageStatus?.status, messageStatus?.messageId);

                    if (messageStatus != null && !string.IsNullOrEmpty(messageStatus.messageId))
                    {
                        await ProcessMessageStatusUpdate(messageStatus);
                        
                        // Emitir via SignalR para frontend
                        await _hubContext.Clients.All.SendAsync("messageStatus.update", new
                        {
                            phone = messageStatus.phone,
                            messageId = messageStatus.messageId,
                            status = messageStatus.status,
                            timestamp = messageStatus.timestamp,
                            instanceId = messageStatus.instanceId
                        });
                    }

                    _channel.BasicAck(ea.DeliveryTag, false);
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "❌ Erro ao deserializar status de mensagem");
                    _channel.BasicNack(ea.DeliveryTag, false, false); // Não rejeitar pois é erro de formato
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erro ao processar status de mensagem");
                    _channel.BasicNack(ea.DeliveryTag, false, true); // Rejeitar para retry
                }
            };
            
            _channel.BasicConsume("whatsapp.message-status", false, messageStatusConsumer);
            _logger.LogInformation("🎧 Consumidor de status de mensagens configurado");
        }

        private async Task ProcessMessageStatusUpdate(MessageStatusUpdate messageStatus)
        {
            try
            {
                using var scope = _services.CreateScope();
                using var context = scope.ServiceProvider.GetRequiredService<PregiatoDbContext>();

                // Procurar a mensagem pelo messageId (ExternalMessageId ou ClientMessageId)
                var message = await context.Messages
                    .FirstOrDefaultAsync(m => 
                        m.ExternalMessageId == messageStatus.messageId || 
                        m.ClientMessageId == messageStatus.messageId);

                if (message != null)
                {
                    // Mapear status do zap bot para status do sistema
                    var newStatus = messageStatus.status.ToLower() switch
                    {
                        "sent" => MessageStatus.Sent,
                        "delivered" => MessageStatus.Delivered, 
                        "read" => MessageStatus.Read,
                        "failed" => MessageStatus.Failed,
                        _ => message.Status // Manter status atual se não reconhecer
                    };

                    if (newStatus != message.Status)
                    {
                        message.Status = newStatus;
                        message.UpdatedAt = DateTime.UtcNow;
                        
                        await context.SaveChangesAsync();
                        
                        _logger.LogInformation("✅ Status da mensagem atualizado: {MessageId} -> {Status}", 
                            messageStatus.messageId, newStatus);
                    }
                }
                else
                {
                    _logger.LogWarning("⚠️ Mensagem não encontrada para status update: {MessageId}", 
                        messageStatus.messageId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao processar status update para mensagem {MessageId}", 
                    messageStatus.messageId);
                throw; // Re-throw para o consumer tratar
            }
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
            // Verificar se há timeout (QR pendente há mais de 5 minutos)
            if (_qrRequestPending)
            {
                var timeSinceRequest = DateTime.UtcNow - _qrRequestStartTime;
                if (timeSinceRequest.TotalMinutes > 5)
                {
                    _logger.LogWarning("QR Request timeout após {Minutes} minutos. Limpando estado.", timeSinceRequest.TotalMinutes);
                    CancelQrRequest();
                }
                else
                {
                    return (false, _qrRequestId);
                }
            }
            
            _qrRequestId = Guid.NewGuid().ToString();
            _qrRequestPending = true;
            _qrRequestStartTime = DateTime.UtcNow;
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

        // Método para converter tipo de mensagem - UNIFICADO
        private MessageType GetMessageType(string type)
        {
            return type?.ToLower() switch
            {
                // Tipos básicos
                "text" => MessageType.Text,
                "image" => MessageType.Image,
                "video" => MessageType.Video,
                "audio" => MessageType.Audio,
                "document" => MessageType.Document,
                
                // Novos tipos unificados
                "voice" => MessageType.Voice,        // Nota de voz
                "sticker" => MessageType.Sticker,   // Figurinha
                "location" => MessageType.Location, // Localização
                "contact" => MessageType.Contact,   // Contato
                "system" => MessageType.System,     // Mensagem do sistema
                
                // Tipos legados (mapeamento)
                "ptt" => MessageType.Voice,         // Push-to-talk
                "chat" => MessageType.Text,
                
                // Default
                _ => MessageType.Text
            };
        }

        // Método para criar entidade de mensagem robusta com todos os campos
        private Message CreateRobustMessageEntity(WhatsAppMessage whatsappMessage, Guid conversationId)
        {
            try
            {
                // Validar e sanitizar dados
                var messageType = GetMessageType(whatsappMessage.type);
                var timestamp = ParseTimestampSafely(whatsappMessage.timestamp);
                
                // Para mensagens de mídia, usar o base64 como body se não houver texto
                var sanitizedBody = GetMessageBodyWithMedia(whatsappMessage, messageType);

                var messageEntity = new Message
                {
                    Id = Guid.NewGuid(),
                    ConversationId = conversationId,
                    Direction = MessageDirection.In,
                    Type = messageType,
                    Body = sanitizedBody,
                    ExternalMessageId = TruncateString(whatsappMessage.externalMessageId, 128),
                    ClientMessageId = TruncateString(whatsappMessage.externalMessageId, 50), // Corrigido para 50 chars
                    CreatedAt = timestamp,
                    Status = MessageStatus.Delivered, // Mensagem já foi recebida
                    PayloadJson = System.Text.Json.JsonSerializer.Serialize(whatsappMessage)
                };

                // Processar attachment se existir
                if (whatsappMessage.attachment != null)
                {
                    ProcessAttachmentForMessage(messageEntity, whatsappMessage.attachment);
                }

                // === PROCESSAR LOCALIZAÇÃO ===
                if (whatsappMessage.location != null)
                {
                    messageEntity.Latitude = whatsappMessage.location.latitude;
                    messageEntity.Longitude = whatsappMessage.location.longitude;
                    messageEntity.LocationAddress = TruncateString(whatsappMessage.location.address, 500);
                    
                    _logger.LogDebug("📍 Localização processada: {Lat}, {Lng}", 
                        messageEntity.Latitude, messageEntity.Longitude);
                }

                // === PROCESSAR CONTATO ===
                if (whatsappMessage.contact != null)
                {
                    messageEntity.ContactName = TruncateString(whatsappMessage.contact.name, 200);
                    messageEntity.ContactPhone = TruncateString(whatsappMessage.contact.phone, 50);
                    
                    _logger.LogDebug("👤 Contato processado: {Name} ({Phone})", 
                        messageEntity.ContactName, messageEntity.ContactPhone);
                }

                _logger.LogDebug("✅ Entidade de mensagem unificada criada: {MessageId} - Tipo: {Type}", 
                    messageEntity.ExternalMessageId, messageEntity.Type);

                return messageEntity;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao criar entidade de mensagem para {MessageId}", 
                    whatsappMessage.externalMessageId);

                // Retornar mensagem de erro básica para não quebrar o fluxo
                return CreateErrorMessage(whatsappMessage, conversationId, ex.Message);
            }
        }

        // Método para processar attachment e preencher campos de mídia
        private void ProcessAttachmentForMessage(Message messageEntity, WhatsAppAttachment attachment)
        {
            try
            {
                _logger.LogDebug("📎 Processando attachment: FileName='{FileName}' ({Length} chars), MimeType='{MimeType}', DataUrl Length={DataUrlLength}", 
                    attachment.fileName, attachment.fileName?.Length ?? 0, attachment.mimeType, attachment.dataUrl?.Length ?? 0);

                // Definir MediaUrl (truncar para evitar erro de campo muito longo)
                messageEntity.MediaUrl = TruncateString(attachment.dataUrl, 500);
                
                // Preencher MimeType (truncar para evitar erro)
                messageEntity.MimeType = TruncateString(attachment.mimeType, 100);
                
                // Preencher FileName (extrair apenas o nome do arquivo se for um path)
                var fileName = ExtractFileName(attachment.fileName);
                messageEntity.FileName = TruncateString(fileName, 100);

                _logger.LogInformation("📎 Attachment processado com sucesso: FileName='{FileName}' ({Length} chars), MimeType='{MimeType}'", 
                    messageEntity.FileName, messageEntity.FileName?.Length ?? 0, messageEntity.MimeType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao processar attachment para mensagem {MessageId}: FileName='{FileName}', MimeType='{MimeType}'", 
                    messageEntity.ExternalMessageId, attachment.fileName, attachment.mimeType);
                
                // Continuar sem attachment em caso de erro
                messageEntity.MediaUrl = null;
                messageEntity.MimeType = null;
                messageEntity.FileName = null;
            }
        }

        // Método para extrair apenas o nome do arquivo de um path
        private string? ExtractFileName(string? fileName)
        {
            if (string.IsNullOrEmpty(fileName))
                return null;

            try
            {
                // Se for um path completo, extrair apenas o nome do arquivo
                if (fileName.Contains('/') || fileName.Contains('\\'))
                {
                    return Path.GetFileName(fileName);
                }

                return fileName;
            }
            catch
            {
                // Em caso de erro, retornar um nome seguro
                return "media_file";
            }
        }

        // Método para criar mensagem de erro quando falha o processamento
        private Message CreateErrorMessage(WhatsAppMessage whatsappMessage, Guid conversationId, string errorMessage)
        {
            return new Message
            {
                Id = Guid.NewGuid(),
                ConversationId = conversationId,
                Direction = MessageDirection.In,
                Type = MessageType.Text,
                Body = $"[ERRO] Falha ao processar mensagem: {errorMessage}",
                ExternalMessageId = TruncateString(whatsappMessage.externalMessageId ?? Guid.NewGuid().ToString(), 128),
                ClientMessageId = TruncateString(whatsappMessage.externalMessageId ?? Guid.NewGuid().ToString(), 50), // Corrigido para 50 chars
                CreatedAt = DateTime.UtcNow,
                Status = MessageStatus.Failed,
                InternalNote = $"Erro de processamento: {errorMessage}",
                PayloadJson = System.Text.Json.JsonSerializer.Serialize(new { 
                    error = true, 
                    originalMessage = whatsappMessage, 
                    errorMessage = errorMessage 
                })
            };
        }

        // Métodos auxiliares para sanitização e validação
        private string SanitizeMessageBody(string body)
        {
            if (string.IsNullOrEmpty(body))
                return string.Empty;

            try
            {
                // Usar serviço de resiliência para emojis se disponível
                using var scope = _services.CreateScope();
                var emojiService = scope.ServiceProvider.GetService<IEmojiResilienceService>();
                
                if (emojiService != null)
                {
                    var result = emojiService.ProcessText(body, EmojiProcessingStrategy.Hybrid);
                    
                    if (result.Issues.Count > 0)
                    {
                        _logger.LogWarning("Issues no processamento de emoji: {Issues}", string.Join(", ", result.Issues));
                    }
                    
                    return result.Processed;
                }
                
                // Fallback para método tradicional se serviço não estiver disponível
                return SanitizeMessageBodyLegacy(body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao sanitizar mensagem com serviço de resiliência, usando fallback");
                return SanitizeMessageBodyLegacy(body);
            }
        }

        private string SanitizeMessageBodyLegacy(string body)
        {
            // Método legado mantido como fallback
            if (string.IsNullOrEmpty(body))
                return string.Empty;

            // Limitar a 4000 caracteres (limite do banco)
            var sanitized = body.Length > 4000 ? body.Substring(0, 3997) + "..." : body;
            
            // Remover caracteres de controle que possam causar problemas
            sanitized = System.Text.RegularExpressions.Regex.Replace(sanitized, @"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "");
            
            return sanitized;
        }

        // Método para obter corpo da mensagem incluindo mídia base64
        private string GetMessageBodyWithMedia(WhatsAppMessage whatsappMessage, MessageType messageType)
        {
            // Se há texto na mensagem, usar ele
            if (!string.IsNullOrEmpty(whatsappMessage.body))
            {
                return SanitizeMessageBody(whatsappMessage.body);
            }
            
            // Para mensagens de mídia sem texto, usar o base64 como conteúdo
            if (whatsappMessage.attachment?.dataUrl != null && 
                (messageType == MessageType.Audio || messageType == MessageType.Voice || 
                 messageType == MessageType.Image || messageType == MessageType.Video))
            {
                _logger.LogInformation("💾 Salvando base64 no body para mensagem {Type}: {Length} chars", 
                    messageType, whatsappMessage.attachment.dataUrl.Length);
                return whatsappMessage.attachment.dataUrl;
            }
            
            return "";
        }

        private DateTime ParseTimestampSafely(string timestamp)
        {
            if (string.IsNullOrEmpty(timestamp))
                return DateTime.UtcNow;

            try
            {
                return DateTime.Parse(timestamp);
            }
            catch
            {
                _logger.LogWarning("⚠️ Timestamp inválido: {Timestamp}. Usando timestamp atual.", timestamp);
                return DateTime.UtcNow;
            }
        }

        private string? TruncateString(string? value, int maxLength)
        {
            if (string.IsNullOrEmpty(value))
                return null;

            return value.Length > maxLength ? value.Substring(0, maxLength) : value;
        }

        // Método para criar conversação de fallback quando o processamento principal falha
        private async Task<Guid> CreateFallbackConversation(WhatsAppMessage whatsappMessage)
        {
            try
            {
                _logger.LogInformation(" Criando conversação de fallback para {From}", whatsappMessage.from);
                
                using var scope = _services.CreateScope();
                var context = scope.ServiceProvider.GetService<PregiatoDbContext>();
                
                if (context != null)
                {
                    var normalizedPhone = ChatHelper.NormalizePhoneE164Br(whatsappMessage.from, whatsappMessage.isGroup);
                    
                    // Verificar se já existe uma conversa para este telefone
                    var existingConversation = await context.Conversations
                        .FirstOrDefaultAsync(c => c.PeerE164 == normalizedPhone);
                        
                    if (existingConversation != null)
                    {
                        return existingConversation.Id;
                    }
                    
                    // Criar nova conversa básica
                    var newConversation = new Conversation
                    {
                        Id = Guid.NewGuid(),
                        PeerE164 = normalizedPhone,
                        InstanceId = whatsappMessage.instanceId,
                        IsGroup = whatsappMessage.isGroup,
                        Title = $"Chat com {normalizedPhone}",
                        LastMessageAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow,
                        // Campos obrigatórios para compatibilidade
                        ContactId = null, // OPCIONAL - para conversas WhatsApp sem Contact
                        Channel = "whatsapp",
                        Status = ConversationStatus.Queued,
                        Priority = ConversationPriority.Normal
                    };
                    
                    await context.Conversations.AddAsync(newConversation);
                    await context.SaveChangesAsync();
                    
                    _logger.LogInformation("✅ Conversação de fallback criada: {ConversationId}", newConversation.Id);
                    return newConversation.Id;
                }
                
                return Guid.Empty;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, " Falha ao criar conversação de fallback para {From}", whatsappMessage.from);
                return Guid.Empty;
            }
        }

        // Método para decidir se deve reencaminhar mensagem com erro
        private bool ShouldRequeueMessage(Exception ex, WhatsAppMessage? whatsappMessage)
        {
            // Não reencaminhar em casos de:
            // 1. JSON inválido
            // 2. Dados corrompidos
            // 3. Violação de constraints do banco
            if (ex is JsonException || 
                ex is ArgumentException ||
                ex is Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                _logger.LogWarning("Não reencaminhando mensagem devido ao tipo de erro: {ExceptionType}", ex.GetType().Name);
                return false;
            }
            
            // Reencaminhar em casos de:
            // 1. Problemas temporários de conectividade
            // 2. Timeouts
            // 3. Problemas de infraestrutura
            if (ex is HttpRequestException ||
                ex is TaskCanceledException ||
                ex is OperationCanceledException)
            {
                _logger.LogInformation("🔄 Reencaminhando mensagem devido a erro temporário: {ExceptionType}", ex.GetType().Name);
                return true;
            }
            
            // Por padrão, não reencaminhar para evitar loops infinitos
            return false;
        }

        // Método para processar mensagens em batch
        private async Task ProcessMessageBatchAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Processamento de batch iniciado");
            
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
                        
                        // Usar CreateExecutionStrategy para suportar retry com transações
                        var strategy = context.Database.CreateExecutionStrategy();
                        await strategy.ExecuteAsync(async () =>
                        {
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
                                throw; // Re-throw para que o execution strategy possa tentar novamente
                            }
                        });
                    }
                    
                    // Aguardar 2 segundos antes do próximo batch
                    await Task.Delay(2000, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // ✅ Tratar cancelamento como operação normal
                    _logger.LogInformation("Processamento de batch cancelado graciosamente");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erro no processamento de batch");
                    await Task.Delay(5000, stoppingToken); // Aguardar mais tempo em caso de erro
                }
            }
            
            _logger.LogInformation("Processamento de batch finalizado");
        }

        // Método para processar mensagens recebidas
        private async Task<Guid> ProcessIncomingMessage(WhatsAppMessage message)
        {
            try
            {             
                using var scope = _services.CreateScope();
                var conversationService = scope.ServiceProvider.GetRequiredService<IConversationService>();
                var attendanceService = scope.ServiceProvider.GetService<AttendanceService>();
                var context = scope.ServiceProvider.GetService<PregiatoDbContext>();
                
                if (conversationService != null && context != null)
                {
                    var normalizedPhone = ChatHelper.NormalizePhoneE164Br(message.from, message.isGroup);
                    
                    _logger.LogInformation("🔢 NORMALIZAÇÃO DEBUG: from={From}, isGroup={IsGroup}, normalizedPhone={NormalizedPhone}", 
                        message.from, message.isGroup, normalizedPhone);
                    
                    // 1. Criar ou obter Conversation via Service
                    var conversation = await conversationService.GetOrCreateConversationAsync(
                        normalizedPhone, 
                        message.instanceId, 
                        message.isGroup, 
                        $"Chat com {normalizedPhone}"
                    );
                    
                    // 2. Processar ChatLog com verificação resiliente anti-duplicação
                    _logger.LogInformation("🔍 Buscando ChatLog existente para {Phone}", normalizedPhone);
                    
                    // DEBUG: Verificar quantos chats existem para este número
                    var totalChatsForPhone = await context.ChatLogs
                        .Where(c => c.ContactPhoneE164 == normalizedPhone)
                        .CountAsync();
                        
                    _logger.LogInformation("📊 Total de chats existentes para {Phone}: {Count}", normalizedPhone, totalChatsForPhone);
                    
                    var chatLog = await context.ChatLogs
                        .Where(c => c.ContactPhoneE164 == normalizedPhone)
                        .OrderByDescending(c => c.LastMessageAt)
                        .FirstOrDefaultAsync();
                    
                    if (chatLog != null)
                    {
                        _logger.LogInformation("✅ ChatLog ENCONTRADO para {Phone}: {ChatLogId} (criado em {CreatedAt})", 
                            normalizedPhone, chatLog.Id, chatLog.LastMessageAt);
                    }
                    else
                    {
                        _logger.LogInformation("❌ ChatLog NÃO ENCONTRADO para {Phone}. Verificando por ChatId da conversa...", normalizedPhone);
                        
                        // NOVA REGRA: Se não encontrar por número, tentar por ChatId da conversa
                        chatLog = await context.ChatLogs
                            .Where(c => c.ChatId == conversation.Id)
                            .FirstOrDefaultAsync();
                            
                        if (chatLog != null)
                        {
                            _logger.LogInformation("✅ ChatLog encontrado por ConversationId {ConversationId}: {ChatLogId}", 
                                conversation.Id, chatLog.Id);
                        }
                        else
                        {
                            _logger.LogInformation("❌ Nenhum ChatLog encontrado. Será criado novo ChatLog para {Phone}", normalizedPhone);
                        }
                    }
                    
                    // NOVA REGRA: Verificar múltiplos chats para o mesmo número e consolidar
                    var duplicateChats = await context.ChatLogs
                        .Where(c => c.ContactPhoneE164 == normalizedPhone && c.Id != (chatLog != null ? chatLog.Id : Guid.Empty))
                        .ToListAsync();
                    
                    if (duplicateChats.Any())
                    {
                        _logger.LogWarning("🔄 Encontrados {Count} chats duplicados para {Phone}. Consolidando...", 
                            duplicateChats.Count, normalizedPhone);
                        
                        // Consolidar mensagens dos chats duplicados no chat principal
                        if (chatLog != null)
                        {
                            await ChatHelper.ConsolidateDuplicateChats(chatLog, duplicateChats, context, scope, _logger);
                        }
                    }
                    
                    if (chatLog == null)
                    {
                        _logger.LogInformation("🆕 CRIANDO NOVO ChatLog para {Phone} (não encontrado nenhum existente)", normalizedPhone);
                        // Criar novo ChatLog
                        var newChatLog = new ChatLog
                        {
                            Id = Guid.NewGuid(),
                            ChatId = conversation.Id, // Usar o ID da Conversation
                            ContactPhoneE164 = normalizedPhone,
                            PhoneNumber = normalizedPhone,
                            Title = $"Chat com {normalizedPhone}",
                            PayloadJson = "{}",
                            UnreadCount = 1,
                            LastMessageAt = DateTime.Parse(message.timestamp),
                            LastMessagePreview = message.body?.Length > 200 ? message.body.Substring(0, 200) : message.body,
                            Timestamp = DateTime.Parse(message.timestamp),
                            Direction = "inbound",
                            Content = "",
                            ContentType = ContentTypeHelper.GetShortContentType(message.type),
                            MessageId = message.externalMessageId
                        };
                        
                        await context.ChatLogs.AddAsync(newChatLog);
                        await context.SaveChangesAsync();
                        
                        // CORREÇÃO: Criar ChatPayload completo com ContactInfo e MessageInfo
                        var chatLogService = scope.ServiceProvider.GetRequiredService<ChatLogService>();
                        
                        // Criar ContactInfo
                        var contactInfo = new ChatLogService.ContactInfo
                        {
                            Name = $"Cliente {normalizedPhone}",
                            PhoneE164 = normalizedPhone,
                            ProfilePic = null
                        };
                        
                        // Processar mídia se existir
                        string mediaUrl = null;
                        if (message.attachment != null && !string.IsNullOrEmpty(message.attachment.dataUrl))
                        {
                            try
                            {
                                mediaUrl = await _mediaStorageService.StoreMediaAsync(
                                    message.attachment.dataUrl ?? string.Empty,
                                    message.attachment.mimeType ?? "application/octet-stream",
                                    message.attachment.fileName ?? "unknown"
                                );
                                _logger.LogInformation("🎬 Mídia processada e armazenada: {MediaUrl}", mediaUrl);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "❌ Erro ao processar mídia: {Filename}", message.attachment.fileName);
                            }
                        }

                        // === DEBUG DETALHADO PARA MENSAGENS DE ÁUDIO ===
                       

                        // Criar MessageInfo COMPLETO conforme exemplo JSON
                        var messageInfo = CreateCompleteMessageInfo(message, mediaUrl);
                        
                        _logger.LogInformation("💾 MessageInfo criado para PayloadJson: Type={Type}, Body_Length={BodyLength}, MediaUrl={MediaUrl}", 
                            messageInfo.Type, messageInfo.body?.Length ?? 0, messageInfo.MediaUrl);
                        
                        // Criar ChatPayload completo
                        var chatPayload = new ChatLogService.ChatPayload
                        {
                            Contact = contactInfo,
                            Messages = new List<ChatLogService.MessageInfo> { messageInfo }
                        };
                        
                        // Atualizar o PayloadJson do ChatLog com configuração adequada para base64
                        var jsonOptions = new JsonSerializerOptions
                        {
                            PropertyNamingPolicy = null, // Manter nomes originais das propriedades
                            WriteIndented = false, // JSON compacto
                            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping // Evitar escape excessivo
                        };
                        
                        newChatLog.PayloadJson = JsonSerializer.Serialize(chatPayload, jsonOptions);
                        await context.SaveChangesAsync();
                        
                        _logger.LogInformation("📝 ✅ NOVO ChatLog criado para {From}: ChatId={ChatId}, ChatLogId={ChatLogId}", 
                            message.from, newChatLog.ChatId, newChatLog.Id);
                        
                        // 🚀 NOVO: Emitir evento chat.created via SignalR
                        await _hubContext.Clients.Group("whatsapp").SendAsync("chat.created", new {
                            chatId = newChatLog.Id.ToString(),
                            chat = new {
                                id = newChatLog.Id.ToString(),
                                title = newChatLog.Title,
                                contactPhoneE164 = newChatLog.ContactPhoneE164,
                                lastMessageAt = newChatLog.LastMessageAt?.ToString("O"),
                                lastMessagePreview = newChatLog.LastMessagePreview,
                                unreadCount = newChatLog.UnreadCount
                            }
                        });
                        
                        _logger.LogInformation("📡 ✅ Evento chat.created emitido para ChatLog: {ChatLogId}", newChatLog.Id);
                    }
                    else
                    {
                        // CORREÇÃO: Adicionar mensagem ao ChatLog existente usando ChatPayload
                        _logger.LogInformation("🔄 INCREMENTANDO mensagem ao ChatLog existente {ChatLogId} para {Phone} (encontrado chat existente)", 
                            chatLog.Id, normalizedPhone);
                        
                        var chatLogService = scope.ServiceProvider.GetRequiredService<ChatLogService>();
                        
                        // Deserializar o PayloadJson existente
                        _logger.LogInformation("📋 Deserializando PayloadJson existente (tamanho: {Size} chars)", 
                            chatLog.PayloadJson?.Length ?? 0);
                        
                        var existingPayload = chatLogService.Deserialize(chatLog.PayloadJson);
                        
                        // CORREÇÃO: Garantir que o ContactInfo esteja preenchido
                        if (existingPayload.Contact == null)
                        {
                            existingPayload.Contact = new ChatLogService.ContactInfo
                            {
                                Name = $"Cliente {normalizedPhone}",
                                PhoneE164 = normalizedPhone,
                                ProfilePic = null
                            };
                            _logger.LogInformation("📋 ContactInfo criado para chat existente: {Phone}", normalizedPhone);
                        }
                        else if (existingPayload.Contact.PhoneE164 == "N/A")
                        {
                            // Atualizar ContactInfo migrado do formato antigo
                            existingPayload.Contact.PhoneE164 = normalizedPhone;
                            existingPayload.Contact.Name = $"Cliente {normalizedPhone}";
                            _logger.LogInformation("📋 ContactInfo atualizado para migração: {Phone}", normalizedPhone);
                        }
                        
                        _logger.LogInformation("📊 PayloadJson carregado: {MessageCount} mensagens existentes", 
                            existingPayload?.Messages?.Count ?? 0);
                        
                        // Processar mídia se existir
                        string mediaUrl = null;
                        if (message.attachment != null && !string.IsNullOrEmpty(message.attachment.dataUrl))
                        {
                            try
                            {
                                mediaUrl = await _mediaStorageService.StoreMediaAsync(
                                    message.attachment.dataUrl ?? string.Empty,
                                    message.attachment.mimeType ?? "application/octet-stream",
                                    message.attachment.fileName ?? "unknown"
                                );
                                _logger.LogInformation("🎬 Mídia processada e armazenada: {MediaUrl}", mediaUrl);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "❌ Erro ao processar mídia: {Filename}", message.attachment.fileName);
                            }
                        }

                        // === DEBUG RÁPIDO PARA ÁUDIO ===
                        if (message.type == "audio" || message.type == "voice")
                        {
                            _logger.LogInformation("🎵 [AUDIO] body: {HasBody}, attachment: {HasAttachment}, mimeType: {MimeType}", 
                                !string.IsNullOrEmpty(message.body) ? $"{message.body.Length}chars" : "VAZIO",
                                message.attachment != null ? "SIM" : "NÃO", 
                                message.attachment?.mimeType ?? "NULL");
                        }

                        // Criar nova MessageInfo COMPLETO conforme exemplo JSON
                        var messageInfo = CreateCompleteMessageInfo(message, mediaUrl);
                        
                        _logger.LogInformation("💾 MessageInfo criado para chat existente: Type={Type}, Body_Length={BodyLength}, MediaUrl={MediaUrl}", 
                            messageInfo.Type, messageInfo.body?.Length ?? 0, messageInfo.MediaUrl);
                        
                        // VERIFICAR SE A MENSAGEM JÁ EXISTS (evitar duplicatas)
                        _logger.LogInformation("🔍 Verificando duplicata para MessageId: {MessageId}", messageInfo.Id);
                        
                        var existingMessage = existingPayload.Messages?.FirstOrDefault(m => m.Id == messageInfo.Id);
                        if (existingMessage == null)
                        {
                            // Adicionar mensagem ao payload existente
                            existingPayload.Messages.Add(messageInfo);
                            
                            _logger.LogInformation("📝 ✅ Nova mensagem ADICIONADA ao PayloadJson: {MessageId} (Total: {Count} mensagens)", 
                                messageInfo.Id, existingPayload.Messages.Count);
                        }
                        else
                        {
                            _logger.LogWarning("⚠️ Mensagem DUPLICADA detectada, ignorando: {MessageId}", messageInfo.Id);
                            return conversation.Id; // Retornar sem atualizar
                        }
                        
                        // Ordenar mensagens por timestamp para manter cronologia
                        existingPayload.Messages = existingPayload.Messages
                            .OrderBy(m => DateTime.TryParse(m.timestamp, out var dt) ? dt : DateTime.MinValue)
                            .ToList();
                        
                        // Atualizar o PayloadJson com configuração adequada para base64
                        var jsonOptions = new JsonSerializerOptions
                        {
                            PropertyNamingPolicy = null, // Manter nomes originais das propriedades
                            WriteIndented = false, // JSON compacto
                            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping // Evitar escape excessivo
                        };
                        
                        var newPayloadJson = JsonSerializer.Serialize(existingPayload, jsonOptions);
                        
                        _logger.LogInformation("💾 Atualizando PayloadJson (antes: {OldSize} chars, depois: {NewSize} chars)", 
                            chatLog.PayloadJson?.Length ?? 0, newPayloadJson.Length);
                        
                        chatLog.PayloadJson = newPayloadJson;
                        chatLog.LastMessageAt = DateTime.Parse(message.timestamp);
                        chatLog.LastMessagePreview = message.body?.Length > 200 ? message.body.Substring(0, 200) : message.body;
                        chatLog.UnreadCount++;
                        
                        await context.SaveChangesAsync();
                        
                        _logger.LogInformation("✅ ChatLog atualizado com SUCESSO: {ChatLogId} - {MessageCount} mensagens no PayloadJson", 
                            chatLog.Id, existingPayload.Messages.Count);
                        
                        _logger.LogInformation("📝 ✅ Mensagem adicionada ao ChatLog existente: ChatId={ChatId}, ChatLogId={ChatLogId}", 
                            chatLog.ChatId, chatLog.Id);
                        
                        // 🚀 NOVO: Emitir evento chat.updated via SignalR
                        await _hubContext.Clients.Group("whatsapp").SendAsync("chat.updated", new {
                            chatId = chatLog.Id.ToString(),
                            chat = new {
                                id = chatLog.Id.ToString(),
                                title = chatLog.Title,
                                contactPhoneE164 = chatLog.ContactPhoneE164,
                                lastMessageAt = chatLog.LastMessageAt?.ToString("O"),
                                lastMessagePreview = chatLog.LastMessagePreview,
                                unreadCount = chatLog.UnreadCount
                            }
                        });
                        
                        _logger.LogInformation("📡 ✅ Evento chat.updated emitido para ChatLog: {ChatLogId}", chatLog.Id);
                    }
                    
                    // 3. Criar AttendanceTicket
                    if (attendanceService != null)
                    {
                        if (chatLog != null)
                        {
                            var ticket = await attendanceService.AssignAsync(chatLog.ChatId, "system", "Sistema", chatLog.Id);
                            _logger.LogInformation("🎫 AttendanceTicket criado: {TicketId}", ticket.Id);
                        }
                    }
                    
                    // 4. Retornar ConversationId para uso na Message
                    return conversation.Id;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao processar mensagem recebida");
            }
            
            return Guid.Empty;
        }

        /// <summary>
        /// Cria MessageInfo COMPLETO conforme estrutura do exemplo JSON
        /// Garante que todos os campos sejam populados corretamente
        /// </summary>
        private ChatLogService.MessageInfo CreateCompleteMessageInfo(WhatsAppMessage message, string? mediaUrl)
        {
            var messageInfo = new ChatLogService.MessageInfo
            {
                Id = message.externalMessageId,
                from = message.from,
                timestamp = message.timestamp,
                Direction = "inbound",
                Type = message.type?.ToLower(), // SEMPRE string lowercase para consistência
                Status = "delivered",
                MediaUrl = mediaUrl,
                IsRead = false
            };

            // === GARANTIR QUE O BODY CONTENHA BASE64 PARA ÁUDIO ===
            if ((message.type == "audio" || message.type == "voice"))
            {
                // Para áudio/voice, usar PRIMEIRO o attachment.dataUrl, depois o body da mensagem
                if (!string.IsNullOrEmpty(message.attachment?.dataUrl))
                {
                    messageInfo.body = message.attachment.dataUrl;
                    _logger.LogInformation("🎵 ÁUDIO: Body populado com base64 do attachment ({Length} chars)", messageInfo.body.Length);
                }
                else if (!string.IsNullOrEmpty(message.body))
                {
                    messageInfo.body = message.body;
                    _logger.LogInformation("🎵 ÁUDIO: Body populado com base64 do body original ({Length} chars)", messageInfo.body.Length);
                }
                else
                {
                    messageInfo.body = "";
                    _logger.LogWarning("⚠️ ÁUDIO: Nenhum base64 encontrado no attachment.dataUrl nem no body!");
                }
            }
            else
            {
                // Para outros tipos, usar o body original
                messageInfo.body = message.body ?? "";
            }

            // === POPULAR CAMPOS DE MÍDIA ===
            if (message.attachment != null)
            {
                messageInfo.mimeType = message.attachment.mimeType;
                messageInfo.fileName = message.attachment.fileName ?? $"{message.type}-message.{GetFileExtensionFromMimeType(message.attachment.mimeType)}";
                
                // Calcular tamanho aproximado do base64 (sem prefixo data:)
                if (!string.IsNullOrEmpty(message.attachment.dataUrl))
                {
                    var base64Data = message.attachment.dataUrl.Contains(",") 
                        ? message.attachment.dataUrl.Split(',')[1] 
                        : message.attachment.dataUrl;
                    messageInfo.size = (long)(base64Data.Length * 0.75); // Base64 é ~133% do tamanho original
                }

                // Para áudio/vídeo, estimar duração baseada no tamanho
                if (message.type == "audio" || message.type == "voice")
                {
                    messageInfo.duration = EstimateAudioDuration(messageInfo.size ?? 0);
                }

                // Para imagens/vídeos, thumbnail poderia ser gerada (por agora null)
                if (message.type == "image" || message.type == "video")
                {
                    messageInfo.thumbnail = null; // TODO: Implementar geração de thumbnail
                }
            }

            // === CAMPOS DE LOCALIZAÇÃO ===
            // TODO: Implementar quando recebermos mensagens de localização
            messageInfo.latitude = null;
            messageInfo.longitude = null; 
            messageInfo.locationAddress = null;

            // === CAMPOS DE CONTATO ===
            // TODO: Implementar quando recebermos contatos compartilhados
            messageInfo.contactName = null;
            messageInfo.contactPhone = null;

            _logger.LogInformation("📝 MessageInfo COMPLETO criado: Type={Type}, Body_Length={BodyLength}, FileName={FileName}, MimeType={MimeType}",
                messageInfo.Type, messageInfo.body?.Length ?? 0, messageInfo.fileName, messageInfo.mimeType);

            return messageInfo;
        }

        /// <summary>
        /// Obtém extensão de arquivo baseada no MIME type
        /// </summary>
        private string GetFileExtensionFromMimeType(string? mimeType)
        {
            return mimeType?.ToLower() switch
            {
                "audio/mpeg" => "mp3",
                "audio/ogg" => "ogg", 
                "audio/wav" => "wav",
                "audio/webm" => "webm",
                "image/jpeg" => "jpg",
                "image/png" => "png",
                "image/gif" => "gif",
                "image/webp" => "webp",
                "video/mp4" => "mp4",
                "video/avi" => "avi",
                "video/mov" => "mov",
                "application/pdf" => "pdf",
                "text/plain" => "txt",
                _ => "bin"
            };
        }

        /// <summary>
        /// Estima duração de áudio baseada no tamanho do arquivo
        /// Heurística: ~8KB por segundo para MP3 de qualidade média
        /// </summary>
        private int EstimateAudioDuration(long fileSizeBytes)
        {
            if (fileSizeBytes <= 0) return 0;
            
            const int avgBytesPerSecond = 8192; // ~8KB/s para MP3 128kbps
            return Math.Max(1, (int)(fileSizeBytes / avgBytesPerSecond));
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

    /// <summary>
    /// Classe unificada para receber payloads do Zap-Blaster
    /// Compatível com WhatsAppIncomingMessageDto do Application layer
    /// </summary>
    public class WhatsAppMessage
    {
        // === CAMPOS OBRIGATÓRIOS ===
        public string externalMessageId { get; set; } = string.Empty;
        public string from { get; set; } = string.Empty;
        public string fromNormalized { get; set; } = string.Empty;
        public string to { get; set; } = string.Empty;
        public string type { get; set; } = string.Empty;
        public string timestamp { get; set; } = string.Empty;
        public string instanceId { get; set; } = string.Empty;
        public bool fromMe { get; set; }
        public bool isGroup { get; set; }
        public string? chatId { get; set; }

        // === CAMPOS OPCIONAIS ===
        public string? body { get; set; } = string.Empty;
        public bool simulated { get; set; }

        // === MÍDIA UNIFICADA ===
        public WhatsAppAttachment? attachment { get; set; }

        // === LOCALIZAÇÃO ===
        public WhatsAppLocation? location { get; set; }

        // === CONTATO ===
        public WhatsAppContact? contact { get; set; }
    }

    /// <summary>
    /// Classe unificada para attachments
    /// </summary>
    public class WhatsAppAttachment
    {
        public string? dataUrl { get; set; }
        public string? mediaUrl { get; set; }
        public string? mimeType { get; set; }
        public string? fileName { get; set; }
        public string? mediaType { get; set; }
        public long? fileSize { get; set; }
        public int? duration { get; set; }
        public int? width { get; set; }
        public int? height { get; set; }
        public string? thumbnail { get; set; }
    }

    /// <summary>
    /// Classe para dados de localização
    /// </summary>
    public class WhatsAppLocation
    {
        public decimal latitude { get; set; }
        public decimal longitude { get; set; }
        public string? address { get; set; }
    }

    /// <summary>
    /// Classe para dados de contato
    /// </summary>
    public class WhatsAppContact
    {
        public string name { get; set; } = string.Empty;
        public string? phone { get; set; }
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


    }
}
