using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using FluentValidation;
using System.Text.Json;
using System.Text;
using RabbitMQ.Client;
using System.Net.Http;
using System.Threading.Tasks;

namespace Pregiato.API.Controllers
{
    public class QRCodeRequest
    {
        public string qrCode { get; set; }
    }

    public class WhatsAppMessageRequest
    {
        public string Id { get; set; }
        public string From { get; set; }
        public string To { get; set; }
        public string Body { get; set; }
        public string Type { get; set; }
        public long Timestamp { get; set; }
        public bool IsFromMe { get; set; }
    }

    public class WhatsAppMessage
    {
        public string Id { get; set; }
        public string From { get; set; }
        public string To { get; set; }
        public string Body { get; set; }
        public string Type { get; set; }
        public DateTime Timestamp { get; set; }
        public bool IsFromMe { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class WhatsAppController : ControllerBase
    {
        private readonly IWhatsAppService _whatsAppService;
        private readonly ILogger<WhatsAppController> _logger;
        private static IConnection? _rabbitConnection;
        private static IModel? _rabbitChannel;
        private static readonly object _lock = new object();
        private readonly HttpClient _httpClient;
        private static string? _currentQRCode;

        public WhatsAppController(IWhatsAppService whatsAppService, ILogger<WhatsAppController> logger, HttpClient httpClient)
        {
            _whatsAppService = whatsAppService;
            _logger = logger;
            _httpClient = httpClient;
            
            // Usar conexão singleton para evitar limite de conexões
            lock (_lock)
            {
                if (_rabbitConnection == null || _rabbitConnection.IsOpen == false)
                {
                    try
                    {
                        var factory = new ConnectionFactory
                        {
                            HostName = "mouse.rmq5.cloudamqp.com",
                            Port = 5672,
                            UserName = "ewxcrhtv",
                            Password = "DNcdH0NEeP4Fsgo2_w-vd47CqjelFk_S",
                            VirtualHost = "ewxcrhtv",
                            RequestedHeartbeat = TimeSpan.FromSeconds(60),
                            AutomaticRecoveryEnabled = true
                        };
                        
                        _rabbitConnection = factory.CreateConnection();
                        _rabbitChannel = _rabbitConnection.CreateModel();
                        
                        // Declarar filas apenas uma vez
                        _rabbitChannel.QueueDeclare("whatsapp.outgoing", durable: true, exclusive: false, autoDelete: false);
                        _rabbitChannel.QueueDeclare("whatsapp.incoming", durable: true, exclusive: false, autoDelete: false);
                        _rabbitChannel.QueueDeclare("chat.assign", durable: true, exclusive: false, autoDelete: false);
                        _rabbitChannel.QueueDeclare("notification.agent", durable: true, exclusive: false, autoDelete: false);
                        _rabbitChannel.QueueDeclare("report.update", durable: true, exclusive: false, autoDelete: false);
                        
                        _logger.LogInformation("✅ Conexão RabbitMQ estabelecida");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Erro ao conectar com RabbitMQ");
                    }
                }
            }
        }

        /// <summary>
        /// Gera QR code para conectar o WhatsApp
        /// </summary>
        [HttpPost("generate-qr")]
        public async Task<IActionResult> GenerateQRCode()
        {
            try
            {
                // Verificar se o bot está conectado
                var statusResult = await GetZapBotStatus();
                var status = (dynamic)statusResult;
                
                if (status?.isConnected == true)
                {
                    return BadRequest(new { error = "Bot já está conectado" });
                }

                // Enviar comando para gerar QR code via RabbitMQ
                if (_rabbitChannel != null && !_rabbitChannel.IsClosed)
                {
                    var qrCommand = new
                    {
                        command = "generate_qr",
                        timestamp = DateTime.UtcNow
                    };

                    var messageBody = JsonSerializer.Serialize(qrCommand);
                    var body = Encoding.UTF8.GetBytes(messageBody);

                    _rabbitChannel.BasicPublish(
                        exchange: "",
                        routingKey: "whatsapp.outgoing",
                        basicProperties: null,
                        body: body
                    );

                    _logger.LogInformation("Comando de geração de QR code enviado");
                    
                    // Aguardar até que o QR code seja gerado (máximo 10 segundos)
                    int maxAttempts = 10;
                    int currentAttempt = 0;
                    
                    while (currentAttempt < maxAttempts)
                    {
                        if (!string.IsNullOrEmpty(_currentQRCode))
                        {
                            return Ok(new { 
                                success = true, 
                                qrCode = _currentQRCode,
                                status = "generated"
                            });
                        }
                        
                        await Task.Delay(1000); // Esperar 1 segundo
                        currentAttempt++;
                    }
                    
                    // Se chegou aqui, não conseguiu obter o QR code no tempo esperado
                    return Ok(new { 
                        success = false, 
                        message = "Timeout ao aguardar QR code",
                        status = "timeout"
                    });
                }
                else
                {
                    return StatusCode(503, new { error = "RabbitMQ não disponível" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar QR code");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Obtém o QR code atual
        /// </summary>
        [HttpGet("qr-code")]
        public IActionResult GetQRCode()
        {
            _logger.LogInformation("Solicitação de QR code - _currentQRCode está vazio: {IsEmpty}", string.IsNullOrEmpty(_currentQRCode));
            
            if (string.IsNullOrEmpty(_currentQRCode))
            {
                return NotFound(new { message = "QR code não disponível" });
            }
            
            _logger.LogInformation("Retornando QR code - Tamanho: {QRCodeLength}", _currentQRCode.Length);
            return Ok(new { qrCode = _currentQRCode });
        }

        /// <summary>
        /// Webhook para receber QR code do bot
        /// </summary>
        [HttpPost("webhook/qr-code")]
        public async Task<IActionResult> ReceiveQRCode([FromBody] QRCodeRequest request)
        {
            try
            {
                _logger.LogInformation("QR Code recebido do zap-bot - Tamanho: {Size}", request.qrCode?.Length ?? 0);
                
                _currentQRCode = request.qrCode;
                
                return Ok(new { success = true, message = "QR code recebido" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao receber QR code");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("webhook/message")]
        public async Task<IActionResult> ReceiveMessage()
        {
            try
            {
                using var reader = new StreamReader(Request.Body);
                var requestBody = await reader.ReadToEndAsync();
                
                _logger.LogInformation("Request body recebido: {Body}", requestBody);
                
                var request = JsonSerializer.Deserialize<JsonElement>(requestBody);
                
                // Validação manual
                if (!request.TryGetProperty("id", out var idElement) || string.IsNullOrEmpty(idElement.GetString()))
                {
                    return BadRequest(new { success = false, message = "Id é obrigatório" });
                }

                if (!request.TryGetProperty("from", out var fromElement) || string.IsNullOrEmpty(fromElement.GetString()))
                {
                    return BadRequest(new { success = false, message = "From é obrigatório" });
                }

                if (!request.TryGetProperty("body", out var bodyElement) || string.IsNullOrEmpty(bodyElement.GetString()))
                {
                    return BadRequest(new { success = false, message = "Body é obrigatório" });
                }

                var from = fromElement.GetString();
                var to = request.TryGetProperty("to", out var toElement) ? toElement.GetString() : "";
                var type = request.TryGetProperty("type", out var typeElement) ? typeElement.GetString() : "text";
                var timestamp = request.TryGetProperty("timestamp", out var timestampElement) ? timestampElement.GetInt64() : DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                var isFromMe = request.TryGetProperty("isFromMe", out var isFromMeElement) ? isFromMeElement.GetBoolean() : false;

                _logger.LogInformation("Mensagem recebida do zap-bot - De: {From}, Para: {To}, Tipo: {Type}", 
                    from, to, type);

                // Processar a mensagem recebida
                var message = new WhatsAppMessage
                {
                    Id = idElement.GetString(),
                    From = from,
                    To = to,
                    Body = bodyElement.GetString(),
                    Type = type,
                    Timestamp = DateTimeOffset.FromUnixTimeMilliseconds(timestamp).DateTime,
                    IsFromMe = isFromMe
                };

                // Enviar mensagem para RabbitMQ para processamento pela fila de atendimento
                await ProcessIncomingMessage(message);

                _logger.LogInformation("Mensagem processada com sucesso: {MessageId}", message.Id);
                
                return Ok(new { success = true, message = "Mensagem processada" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar mensagem recebida");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("incoming-message")]
        public async Task<IActionResult> ReceiveIncomingMessage()
        {
            try
            {
                using var reader = new StreamReader(Request.Body);
                var requestBody = await reader.ReadToEndAsync();
                
                _logger.LogInformation("Mensagem recebida - Body: {Body}", requestBody);
                
                var request = JsonSerializer.Deserialize<JsonElement>(requestBody);
                
                // Validação manual
                if (!request.TryGetProperty("id", out var idElement) || string.IsNullOrEmpty(idElement.GetString()))
                {
                    return BadRequest(new { success = false, message = "Id é obrigatório" });
                }

                if (!request.TryGetProperty("from", out var fromElement) || string.IsNullOrEmpty(fromElement.GetString()))
                {
                    return BadRequest(new { success = false, message = "From é obrigatório" });
                }

                if (!request.TryGetProperty("body", out var bodyElement) || string.IsNullOrEmpty(bodyElement.GetString()))
                {
                    return BadRequest(new { success = false, message = "Body é obrigatório" });
                }

                var from = fromElement.GetString();
                var to = request.TryGetProperty("to", out var toElement) ? toElement.GetString() : "";
                var type = request.TryGetProperty("type", out var typeElement) ? typeElement.GetString() : "text";
                var timestamp = request.TryGetProperty("timestamp", out var timestampElement) ? timestampElement.GetInt64() : DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                var isFromMe = request.TryGetProperty("isFromMe", out var isFromMeElement) ? isFromMeElement.GetBoolean() : false;

                _logger.LogInformation("Mensagem recebida do zap-bot - De: {From}, Para: {To}, Tipo: {Type}", 
                    from, to, type);

                // Processar a mensagem recebida
                var message = new WhatsAppMessage
                {
                    Id = idElement.GetString(),
                    From = from,
                    To = to,
                    Body = bodyElement.GetString(),
                    Type = type,
                    Timestamp = DateTimeOffset.FromUnixTimeMilliseconds(timestamp).DateTime,
                    IsFromMe = isFromMe
                };

                // Enviar mensagem para RabbitMQ para processamento pela fila de atendimento
                await ProcessIncomingMessage(message);

                _logger.LogInformation("Mensagem processada com sucesso: {MessageId}", message.Id);
                
                return Ok(new { success = true, message = "Mensagem processada" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar mensagem recebida");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        private async Task ProcessIncomingMessage(WhatsAppMessage message)
        {
            try
            {
                // Enviar para fila de mensagens recebidas
                var messageData = new
                {
                    type = "incoming_message",
                    data = message,
                    timestamp = DateTime.UtcNow
                };

                var messageJson = JsonSerializer.Serialize(messageData);
                var body = Encoding.UTF8.GetBytes(messageJson);

                _rabbitChannel.BasicPublish(
                    exchange: "",
                    routingKey: "whatsapp.incoming",
                    basicProperties: null,
                    body: body
                );

                _logger.LogInformation("Mensagem enviada para fila whatsapp.incoming: {From}", message.From);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar mensagem recebida");
                throw;
            }
        }

        /// <summary>
        /// Obtém o status da conexão WhatsApp
        /// </summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            try
            {
                // Verificar status do zap-bot diretamente
                bool isConnected = false;
                
                try
                {
                    using var client = new HttpClient();
                    client.Timeout = TimeSpan.FromSeconds(5);
                    
                    var response = await client.GetAsync("http://localhost:3030/status");
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        var zapStatus = JsonSerializer.Deserialize<JsonElement>(content);
                        isConnected = zapStatus.GetProperty("isConnected").GetBoolean();
                        
                        _logger.LogInformation("Status do zap-bot: isConnected = {IsConnected}", isConnected);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Erro ao verificar status do zap-bot");
                    isConnected = false;
                }
                
                var statusResponse = new
                {
                    isConnected = isConnected,
                    status = isConnected ? "connected" : "disconnected",
                    lastActivity = DateTime.UtcNow.ToString("O"),
                    queueMessageCount = 0,
                    canGenerateQR = !isConnected,
                    hasQRCode = !string.IsNullOrEmpty(_currentQRCode)
                };

                return Ok(statusResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao obter status");
                return Ok(new
                {
                    isConnected = false,
                    status = "disconnected",
                    lastActivity = DateTime.UtcNow.ToString("O"),
                    queueMessageCount = 0,
                    canGenerateQR = true,
                    hasQRCode = !string.IsNullOrEmpty(_currentQRCode)
                });
            }
        }

        private async Task<dynamic> GetZapBotStatus()
        {
            try
            {
                using var client = new HttpClient();
                client.Timeout = TimeSpan.FromSeconds(5);
                
                _logger.LogInformation("Verificando status do zap-bot em http://localhost:3030/status");
                var response = await client.GetAsync("http://localhost:3030/status");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("Resposta do zap-bot: {Content}", content);
                    
                    var status = JsonSerializer.Deserialize<JsonElement>(content);
                    var isConnected = status.GetProperty("isConnected").GetBoolean();
                    
                    _logger.LogInformation("Status do zap-bot: isConnected = {IsConnected}", isConnected);
                    
                    // Retornar diretamente o valor lido
                    return new 
                    { 
                        isConnected = isConnected,
                        isFullyValidated = status.GetProperty("isFullyValidated").GetBoolean()
                    };
                }
                else
                {
                    _logger.LogWarning("Falha ao conectar com zap-bot: {StatusCode}", response.StatusCode);
                    return new { isConnected = false, isFullyValidated = false };
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erro ao verificar status do zap-bot");
                return new { isConnected = false, isFullyValidated = false };
            }
        }

        /// <summary>
        /// Envia mensagem via RabbitMQ
        /// </summary>
        [HttpPost("messages/send")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Phone))
                {
                    return BadRequest(new { error = "Número de telefone é obrigatório" });
                }

                if (_rabbitChannel == null || _rabbitChannel.IsClosed)
                {
                    return StatusCode(503, new { error = "RabbitMQ não disponível" });
                }

                var messageData = new
                {
                    phone = request.Phone,
                    message = request.Message,
                    template = request.Template,
                    data = request.Data
                };

                var messageBody = JsonSerializer.Serialize(messageData);
                var body = Encoding.UTF8.GetBytes(messageBody);

                _rabbitChannel.BasicPublish(
                    exchange: "",
                    routingKey: "whatsapp.outgoing",
                    basicProperties: null,
                    body: body
                );

                _logger.LogInformation("Mensagem enviada para fila: {Phone}", request.Phone);

                return Ok(new { success = true, message = "Mensagem enviada para fila" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar mensagem");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Obtém métricas da fila
        /// </summary>
        [HttpGet("queue/metrics")]
        public async Task<IActionResult> GetQueueMetrics()
        {
            try
            {
                if (_rabbitChannel == null || _rabbitChannel.IsClosed)
                {
                    return Ok(new
                    {
                        outgoingMessages = 0,
                        incomingMessages = 0,
                        pendingAssignments = 0,
                        timestamp = DateTime.UtcNow,
                        error = "RabbitMQ não disponível"
                    });
                }

                var outgoingQueue = _rabbitChannel.QueueDeclarePassive("whatsapp.outgoing");
                var incomingQueue = _rabbitChannel.QueueDeclarePassive("whatsapp.incoming");
                var assignQueue = _rabbitChannel.QueueDeclarePassive("chat.assign");

                var metrics = new
                {
                    outgoingMessages = outgoingQueue.MessageCount,
                    incomingMessages = incomingQueue.MessageCount,
                    pendingAssignments = assignQueue.MessageCount,
                    timestamp = DateTime.UtcNow
                };

                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao obter métricas da fila");
                return Ok(new
                {
                    outgoingMessages = 0,
                    incomingMessages = 0,
                    pendingAssignments = 0,
                    timestamp = DateTime.UtcNow,
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Obtém conversas na fila
        /// </summary>
        [HttpGet("queue/conversations")]
        public async Task<IActionResult> GetQueueConversations()
        {
            try
            {
                var conversations = await _whatsAppService.GetQueueConversationsAsync();
                return Ok(conversations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar conversas na fila");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Obtém mensagens da fila
        /// </summary>
        private static DateTime _lastQueueCheck = DateTime.MinValue;
        private static readonly TimeSpan _queueCheckInterval = TimeSpan.FromSeconds(5);

        [HttpGet("queue/messages")]
        public async Task<IActionResult> GetQueueMessages()
        {
            try
            {
                // Verificar se já passou o intervalo mínimo desde a última verificação
                var now = DateTime.UtcNow;
                if (now - _lastQueueCheck < _queueCheckInterval)
                {
                    return Ok(new { messages = new List<object>(), nextCheck = _lastQueueCheck.Add(_queueCheckInterval) });
                }

                _lastQueueCheck = now;
                var messages = new List<object>();
                
                // Consumir mensagens da fila whatsapp.incoming
                var result = _rabbitChannel.BasicGet("whatsapp.incoming", false);
                
                while (result != null)
                {
                    var messageBody = Encoding.UTF8.GetString(result.Body.Span);
                    var message = JsonSerializer.Deserialize<object>(messageBody);
                    
                    messages.Add(message);
                    
                    // Fazer ack da mensagem
                    _rabbitChannel.BasicAck(result.DeliveryTag, false);
                    
                    // Pegar próxima mensagem
                    result = _rabbitChannel.BasicGet("whatsapp.incoming", false);
                }

                return Ok(new { messages, nextCheck = _lastQueueCheck.Add(_queueCheckInterval) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao obter mensagens da fila");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Cria um novo contato
        /// </summary>
        [HttpPost("contacts")]
        public async Task<ActionResult<ContactDto>> CreateContact(CreateContactDto dto)
        {
            try
            {
                var contact = await _whatsAppService.CreateContactAsync(dto);
                return CreatedAtAction(nameof(GetContact), new { id = contact.Id }, contact);
            }
            catch (FluentValidation.ValidationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar contato");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Obtém um contato por ID
        /// </summary>
        [HttpGet("contacts/{id}")]
        public async Task<ActionResult<ContactDto>> GetContact(Guid id)
        {
            try
            {
                var contact = await _whatsAppService.GetContactByIdAsync(id);
                if (contact == null)
                    return NotFound(new { error = "Contato não encontrado" });

                return Ok(contact);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar contato {Id}", id);
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Cria uma nova conversa
        /// </summary>
        [HttpPost("conversations")]
        public async Task<ActionResult<ConversationDto>> CreateConversation(CreateConversationDto dto)
        {
            try
            {
                var conversation = await _whatsAppService.CreateConversationAsync(dto);
                return CreatedAtAction(nameof(GetConversation), new { id = conversation.Id }, conversation);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar conversa");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Obtém uma conversa por ID
        /// </summary>
        [HttpGet("conversations/{id}")]
        public async Task<ActionResult<ConversationDto>> GetConversation(Guid id)
        {
            try
            {
                var conversation = await _whatsAppService.GetConversationByIdAsync(id);
                if (conversation == null)
                    return NotFound(new { error = "Conversa não encontrada" });

                return Ok(conversation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar conversa {Id}", id);
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Atribui uma conversa a um operador
        /// </summary>
        [HttpPost("conversations/{id}/assign")]
        public async Task<ActionResult<ConversationDto>> AssignConversation(Guid id, [FromBody] Guid operatorId)
        {
            try
            {
                var conversation = await _whatsAppService.AssignConversationAsync(id, operatorId);
                if (conversation == null)
                    return NotFound(new { error = "Conversa não encontrada" });

                return Ok(conversation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atribuir conversa {Id} ao operador {OperatorId}", id, operatorId);
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Fecha uma conversa
        /// </summary>
        [HttpPost("conversations/{id}/close")]
        public async Task<ActionResult<ConversationDto>> CloseConversation(Guid id, [FromBody] string? reason = null)
        {
            try
            {
                var conversation = await _whatsAppService.CloseConversationAsync(id, reason);
                if (conversation == null)
                    return NotFound(new { error = "Conversa não encontrada" });

                return Ok(conversation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao fechar conversa {Id}", id);
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Obtém conversas por status
        /// </summary>
        [HttpGet("conversations")]
        public async Task<ActionResult<List<ConversationDto>>> GetConversations([FromQuery] string? status)
        {
            try
            {
                List<ConversationDto> conversations;
                
                if (string.IsNullOrEmpty(status))
                {
                    conversations = await _whatsAppService.GetAllConversationsAsync();
                }
                else
                {
                    var conversationStatus = status.ToLower() switch
                    {
                        "queued" => ConversationStatus.Queued,
                        "assigned" => ConversationStatus.Assigned,
                        "closed" => ConversationStatus.Closed,
                        _ => ConversationStatus.Queued
                    };
                    
                    conversations = await _whatsAppService.GetConversationsByStatusAsync(conversationStatus);
                }
                
                return Ok(conversations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar conversas");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Processa webhook de mensagem recebida
        /// </summary>
        [HttpPost("webhook/message")]
        public async Task<ActionResult> ProcessWebhookMessage([FromBody] WhatsAppMessageDto message)
        {
            try
            {
                await _whatsAppService.ProcessIncomingMessageAsync(message);
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar mensagem recebida");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        public class SendMessageRequest
        {
            public string Phone { get; set; } = string.Empty;
            public string? Message { get; set; }
            public string? Template { get; set; }
            public Dictionary<string, object>? Data { get; set; }
        }

        public class QRCodeWebhookRequest
        {
            public string qrCode { get; set; } = string.Empty;
            public string? sessionId { get; set; }
            public DateTime? timestamp { get; set; }
        }
    }
} 