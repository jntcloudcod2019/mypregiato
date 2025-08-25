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
            var result = _rabbit.BeginQrRequest();
            var created = result.created;
            var requestId = result.requestId;
            if (!created)
            {
                return Conflict(new { success = false, status = "pending", message = "Há um pedido de QR pendente.", requestId });
            }
            var cmd = new { command = "generate_qr", requestId, timestamp = DateTime.UtcNow.ToString("O") };
            _rabbit.PublishCommand(cmd);
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

        [HttpPost("session/updated")]
        public IActionResult SessionUpdated([FromBody] SessionUpdatedRequest req)
        {
            var current = _rabbit.GetSessionStatus();
            // Ignorar chamadas repetidas com mesmo estado (somente 1x no início, ou quando houver mudança)
            var isSame = current.sessionConnected == req.sessionConnected
                         && string.Equals(current.connectedNumber ?? string.Empty, req.connectedNumber ?? string.Empty, StringComparison.Ordinal)
                         && current.isFullyValidated == req.isFullyValidated;

            // Se já inicializado e não houve mudança, ignorar (responder OK e não logar)
            if (_sessionInitialized && isSame)
            {
                return Ok(new { success = true, skipped = true });
            }

            // Atualizar somente quando houver mudança real ou primeira vez
            _rabbit.SetSessionStatus(req.sessionConnected, req.connectedNumber, req.isFullyValidated);
            _sessionInitialized = true;
            _lastSessionUpdateUtc = DateTime.UtcNow;
            
            // Log apenas quando houver mudança real
            _logger.LogInformation("📥 Webhook session/updated: connected={Connected} number={Number} validated={Validated} (mudança detectada)", 
                req.sessionConnected, req.connectedNumber, req.isFullyValidated);
            
            return Ok(new { success = true, updated = true });
        }

        [HttpGet("status")]
        public async Task<IActionResult> Status()
        {
            var (sessionConnectedCached, numberCached, validatedCached) = _rabbit.GetSessionStatus();
            bool botUp = false;
            bool sessionConnected = sessionConnectedCached;
            bool isFullyValidated = validatedCached;
            string? connectedNumber = numberCached;

            try
            {
                // Confiar prioritariamente no cache atualizado via /session/updated (batimento do bot)
                // Opcionalmente, podemos pingar a porta 3030 apenas para saber se o processo está UP
                using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
                try
                {
                    var resp = await client.GetAsync("http://localhost:3030/status");
                    botUp = resp.IsSuccessStatusCode;
                }
                catch
                {
                    botUp = false;
                }
            }
            catch { }

            var hasQr = !string.IsNullOrEmpty(_rabbit.GetCachedQr());

            return Ok(new
            {
                botUp,
                sessionConnected,
                isFullyValidated,
                isConnected = sessionConnected,
                connectedNumber,
                status = sessionConnected ? "connected" : (botUp ? "connecting" : "disconnected"),
                    lastActivity = DateTime.UtcNow.ToString("O"),
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
    }
}
