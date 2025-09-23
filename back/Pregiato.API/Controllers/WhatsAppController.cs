using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Pregiato.API.Hubs;
using Pregiato.API.Services;
using Pregiato.Application.Interfaces;
using System.Text.Json;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WhatsAppController : ControllerBase
    {
        private readonly ILogger<WhatsAppController> _logger;
        private readonly IWhatsAppService _whatsAppService;
        private readonly RabbitBackgroundService _rabbit;
        private readonly IHubContext<WhatsAppHub> _hub;
        private static bool _sessionInitialized = false;
        private static DateTime _lastSessionUpdateUtc = DateTime.MinValue;

        public WhatsAppController(ILogger<WhatsAppController> logger, IWhatsAppService whatsAppService, RabbitBackgroundService rabbit, IHubContext<WhatsAppHub> hub)
        {
            _logger = logger;
            _whatsAppService = whatsAppService;
            _rabbit = rabbit;
            _hub = hub;
        }

        [HttpPost("generate-qr")]
        public IActionResult GenerateQr()
        {
            _logger.LogInformation("📥 Requisição de geração de QR recebida");
            
            // 🔄 SEMPRE limpar QR pendente anterior quando front solicita novo
            if (_rabbit.IsQrRequestPending())
            {
                _logger.LogInformation("🧹 Limpando QR pendente anterior para permitir nova geração");
                _rabbit.CancelQrRequest();
            }
            
            var result = _rabbit.BeginQrRequest();
            var created = result.created;
            var requestId = result.requestId;
            
            // Agora sempre deve ser criado, mas mantemos verificação por segurança
            if (!created)
            {
                _logger.LogWarning("⚠️ Falha inesperada ao criar novo QR request após limpeza");
                return Conflict(new { success = false, status = "pending", message = "Erro interno ao criar QR request.", requestId });
            }
            
            var cmd = new { command = "generate_qr", requestId, timestamp = DateTime.UtcNow.ToString("O") };
            _rabbit.PublishCommand(cmd);
            _logger.LogInformation("✅ Novo QR request criado com sucesso. RequestId: {RequestId}", requestId);
            return Ok(new { success = true, status = "command_sent", requestId });
        }

        [HttpPost("disconnect")]
        public IActionResult Disconnect()
        {
            _logger.LogInformation("📥 Requisição de desconexão recebida");
            _rabbit.CancelQrRequest();
            var cmd = new { command = "disconnect", timestamp = DateTime.UtcNow.ToString("O") };
            _rabbit.PublishCommand(cmd);
            return Ok(new { success = true, status = "command_sent" });
        }

        [HttpGet("qr-code/current")]
        public IActionResult GetCurrentQr()
        {
            var qr = _rabbit.GetCachedQr();
            if (string.IsNullOrEmpty(qr)) return NotFound(new { message = "Nenhum QR code disponível" });
            return Ok(new { qrCode = qr, timestamp = DateTime.UtcNow.ToString("O") });
        }

        public class QrRequest { public string qrCode { get; set; } = string.Empty; public string? requestId { get; set; } }

        [HttpPost("webhook/qr-code")]
        public async Task<IActionResult> ReceiveQr([FromBody] QrRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.qrCode))
                return BadRequest(new { success = false, message = "qrCode obrigatório" });
            var qr = req.qrCode.StartsWith("data:image/") ? req.qrCode : $"data:image/png;base64,{req.qrCode}";
            _rabbit.SetCachedQr(qr);
            if (_rabbit.IsQrRequestPending())
            {
                await _hub.Clients.Group("whatsapp").SendAsync("qr.update", new { qrCode = qr, timestamp = DateTime.UtcNow.ToString("O"), instanceId = "webhook", requestId = req.requestId });
                _logger.LogInformation("📤 QR Code emitido via SignalR (webhook) requestId={RequestId}", req.requestId);
            }
            else
            {
                _logger.LogInformation("🚫 Webhook de QR recebido sem pedido pendente. Apenas cacheado.");
            }
            return Ok(new { success = true });
        }

        public class SessionUpdatedRequest { public bool sessionConnected { get; set; } public string? connectedNumber { get; set; } public bool isFullyValidated { get; set; } }
        
        public class AuthenticationRequest 
        { 
            public bool sessionConnected { get; set; } 
            public string? connectedNumber { get; set; } 
            public string? connectedUserName { get; set; }
            public string? timestamp { get; set; }
            public object? extractionData { get; set; }
        }

        [HttpPost("session/updated")]
        public async Task<IActionResult> SessionUpdated([FromBody] SessionUpdatedRequest req)
        {
            var current = _rabbit.GetSessionStatus();
            
            // ✅ CORREÇÃO: Sempre atualizar o status, mas logar apenas mudanças significativas
            var isSame = current.sessionConnected == req.sessionConnected
                         && string.Equals(current.connectedNumber ?? string.Empty, req.connectedNumber ?? string.Empty, StringComparison.Ordinal)
                         && current.isFullyValidated == req.isFullyValidated;

            // Sempre atualizar o status (ZapBot pode estar corrigindo dados incorretos)
            _rabbit.SetSessionStatus(req.sessionConnected, req.connectedNumber, req.isFullyValidated);
            _sessionInitialized = true;
            _lastSessionUpdateUtc = DateTime.UtcNow;
            
            // Log apenas quando houver mudança real ou primeira vez
            if (!_sessionInitialized || !isSame)
            {
                _logger.LogInformation("📥 Webhook session/updated: connected={Connected} number={Number} validated={Validated} (mudança detectada)", 
                    req.sessionConnected, req.connectedNumber, req.isFullyValidated);
                
                // ✅ NOVO: Propagação em tempo real via SignalR
                await _hub.Clients.Group("whatsapp").SendAsync("bot.status.update", new {
                    sessionConnected = req.sessionConnected,
                    connectedNumber = req.connectedNumber,
                    isFullyValidated = req.isFullyValidated,
                    isConnected = req.sessionConnected,
                    status = req.sessionConnected ? (req.isFullyValidated ? "connected" : "connecting") : "disconnected",
                    lastActivity = DateTime.UtcNow.ToString("O")
                });
                
                _logger.LogInformation("📤 Status do bot propagado via SignalR para todos os clientes");
            }
            else
            {
                _logger.LogDebug("📥 Webhook session/updated: connected={Connected} number={Number} validated={Validated} (sem mudança)", 
                    req.sessionConnected, req.connectedNumber, req.isFullyValidated);
            }
            
            return Ok(new { success = true, updated = true });
        }

        [HttpPost("session/authenticated")]
        public async Task<IActionResult> SessionAuthenticated([FromBody] AuthenticationRequest req)
        {
            try
            {
                // ✅ Atualizar status interno
                _rabbit.SetSessionStatus(req.sessionConnected, req.connectedNumber, true);
                _sessionInitialized = true;
                _lastSessionUpdateUtc = DateTime.UtcNow;
                
                _logger.LogInformation("🎉 WhatsApp autenticado com sucesso! Número: {Number}, Usuário: {UserName}", 
                    req.connectedNumber, req.connectedUserName);
                
                // 🚀 EMITIR EVENTO ESPECÍFICO via SignalR para auto-refresh do frontend
                await _hub.Clients.Group("whatsapp").SendAsync("session.authenticated", new {
                    sessionConnected = req.sessionConnected,
                    connectedNumber = req.connectedNumber,
                    connectedUserName = req.connectedUserName,
                    isFullyValidated = true,
                    timestamp = req.timestamp ?? DateTime.UtcNow.ToString("O"),
                    extractionData = req.extractionData
                });
                
                _logger.LogInformation("📤 Evento session.authenticated emitido via SignalR para todos os clientes");
                
                return Ok(new { success = true, message = "Autenticação processada e propagada com sucesso" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao processar autenticação do WhatsApp");
                return StatusCode(500, new { success = false, message = "Erro interno ao processar autenticação" });
            }
        }

        /// <summary>
        /// Endpoint para broadcast de status em tempo real via SignalR
        /// </summary>
        [HttpPost("status/broadcast")]
        public async Task<IActionResult> BroadcastStatus([FromBody] BotStatusBroadcastRequest req)
        {
            try
            {
                _logger.LogInformation("📡 Recebendo broadcast de status do ZapBot: {Status}, {Connected}, {Number}", 
                    req.status, req.sessionConnected, req.connectedNumber);

                // ✅ Atualizar status interno
                _rabbit.SetSessionStatus(req.sessionConnected, req.connectedNumber, req.isFullyValidated);
                _sessionInitialized = true;
                _lastSessionUpdateUtc = DateTime.UtcNow;

                // 🚀 EMITIR STATUS EM TEMPO REAL via SignalR
                await _hub.Clients.Group("whatsapp").SendAsync("bot.status.update", new {
                    sessionConnected = req.sessionConnected,
                    connectedNumber = req.connectedNumber,
                    isFullyValidated = req.isFullyValidated,
                    status = req.status,
                    lastActivity = req.lastActivity,
                    timestamp = req.timestamp ?? DateTime.UtcNow.ToString("O"),
                    instanceId = req.instanceId
                });

                _logger.LogInformation("📤 Status broadcast emitido via SignalR para todos os clientes");

                return Ok(new { success = true, message = "Status broadcast enviado com sucesso" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao processar broadcast de status");
                return StatusCode(500, new { success = false, message = "Erro interno ao processar broadcast" });
            }
        }

        public class BotStatusBroadcastRequest
        {
            public bool sessionConnected { get; set; }
            public string? connectedNumber { get; set; }
            public bool isFullyValidated { get; set; }
            public string status { get; set; } = string.Empty;
            public string lastActivity { get; set; } = string.Empty;
            public string? timestamp { get; set; }
            public string? instanceId { get; set; }
        }

        [HttpGet("status")]
        [AllowAnonymous]
        public async Task<IActionResult> Status()
        {
            bool botUp = false;
            bool sessionConnected = false;
            bool isFullyValidated = false;
            string? connectedNumber = null;
            string status = "disconnected";
            string lastActivity = DateTime.UtcNow.ToString("O");

            try
            {
                // ✅ CORREÇÃO: Consultar diretamente o zap bot para obter status atual
                using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
                try
                {
                    // ✅ PRODUÇÃO: Usar URL do Zap Bot baseada no ambiente
                    var isProduction = Environment.GetEnvironmentVariable("RAILWAY_ENVIRONMENT") != null || 
                                     Environment.GetEnvironmentVariable("NODE_ENV") == "production";
                    var zapBotUrl = isProduction ? 
                        "https://zap-bot-production-b642.up.railway.app" : 
                        "http://localhost:3030";
                    var resp = await client.GetAsync($"{zapBotUrl}/status");
                    botUp = resp.IsSuccessStatusCode;
                    
                    if (botUp && resp.IsSuccessStatusCode)
                    {
                        var jsonContent = await resp.Content.ReadAsStringAsync();
                        var botStatus = JsonSerializer.Deserialize<JsonElement>(jsonContent);
                        
                        // Extrair dados do zap bot
                        sessionConnected = botStatus.TryGetProperty("sessionConnected", out var sessionConnectedProp) && sessionConnectedProp.GetBoolean();
                        isFullyValidated = botStatus.TryGetProperty("isFullyValidated", out var validatedProp) && validatedProp.GetBoolean();
                        connectedNumber = botStatus.TryGetProperty("connectedNumber", out var numberProp) ? numberProp.GetString() : null;
                        lastActivity = botStatus.TryGetProperty("lastActivity", out var activityProp) ? activityProp.GetString() ?? lastActivity : lastActivity;
                        
                        // Determinar status baseado nos dados do bot
                        if (sessionConnected && isFullyValidated)
                            status = "connected";
                        else if (sessionConnected)
                            status = "connecting";
                        else if (botUp)
                            status = "connecting";
                        else
                            status = "disconnected";
                            
                        _logger.LogInformation("📊 Status obtido do zap bot: connected={Connected}, validated={Validated}, number={Number}", 
                            sessionConnected, isFullyValidated, connectedNumber);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("⚠️ Erro ao consultar status do zap bot: {Error}", ex.Message);
                    botUp = false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro geral ao obter status");
            }

            var hasQr = !string.IsNullOrEmpty(_rabbit.GetCachedQr());

            return Ok(new
            {
                botUp,
                sessionConnected,
                isFullyValidated,
                isConnected = sessionConnected,
                connectedNumber,
                status,
                lastActivity,
                    queueMessageCount = 0,
                canGenerateQR = !sessionConnected,
                hasQRCode = hasQr
            });
        }

        [HttpPost("messages/send")]
        public IActionResult SendMessage([FromBody] SendMessageRequest req)
        {
            if (string.IsNullOrEmpty(req.Phone)) return BadRequest(new { error = "Número é obrigatório" });
            _rabbit.PublishCommand(new { command = "send_message", phone = req.Phone, message = req.Message, template = req.Template, data = req.Data, timestamp = DateTime.UtcNow });
            return Ok(new { success = true });
        }

        [HttpGet("queue/messages")]
        public async Task<IActionResult> GetQueueMessages()
        {
            return Ok(new { messages = new List<object>(), nextCheck = DateTime.UtcNow.AddSeconds(5) });
        }

        public class SendMessageRequest { public string Phone { get; set; } = string.Empty; public string? Message { get; set; } public string? Template { get; set; } public Dictionary<string, object>? Data { get; set; } }

        // Endpoint temporário para testar processamento de mensagens
        [HttpPost("test/message")]
        public IActionResult TestMessage([FromBody] TestMessageRequest req)
        {
            _logger.LogInformation("🧪 Teste de mensagem recebido: {From} -> {To}", req.from, req.to);
            
            // Simular mensagem WhatsApp
            var testMessage = new
            {
                externalMessageId = req.externalMessageId ?? $"test_{Guid.NewGuid()}",
                from = req.from,
                fromNormalized = req.fromNormalized ?? req.from?.Replace("-", "").Replace("(", "").Replace(")", "").Replace(" ", ""),
                to = req.to,
                body = req.body,
                type = req.type ?? "text",
                timestamp = req.timestamp ?? DateTime.UtcNow.ToString("O"),
                instanceId = "test",
                fromMe = false,
                isGroup = false,
                attachment = (object?)null
            };

            // Publicar na fila RabbitMQ
            _rabbit.PublishCommand(testMessage);
            
            return Ok(new { success = true, message = "Mensagem de teste enviada para processamento" });
        }

        public class TestMessageRequest 
        { 
            public string from { get; set; } = string.Empty; 
            public string? fromNormalized { get; set; }
            public string to { get; set; } = string.Empty; 
            public string body { get; set; } = string.Empty; 
            public string? type { get; set; }
            public string? timestamp { get; set; }
            public string? externalMessageId { get; set; }
        }
    }
}
