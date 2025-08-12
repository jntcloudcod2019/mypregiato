using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Pregiato.API.Hubs;
using Pregiato.API.Services;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using FluentValidation;
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

        public WhatsAppController(
            ILogger<WhatsAppController> logger,
            IWhatsAppService whatsAppService,
            RabbitBackgroundService rabbit,
            IHubContext<WhatsAppHub> hub)
        {
            _logger = logger;
            _whatsAppService = whatsAppService;
            _rabbit = rabbit;
            _hub = hub;
        }

        // POST api/whatsapp/generate-qr
        [HttpPost("generate-qr")]
        public IActionResult GenerateQr()
        {
            _logger.LogInformation("📥 Requisição de geração de QR recebida");

            var (created, requestId) = _rabbit.BeginQrRequest();
            if (!created)
            {
                _logger.LogWarning("Pedido de QR já pendente. requestId={RequestId}", requestId);
                return Ok(new { success = true, status = "pending", requestId });
            }

            var cmd = new { command = "generate_qr", requestId, timestamp = DateTime.UtcNow };
            _rabbit.PublishCommand(cmd);
            return Ok(new { success = true, status = "command_sent", requestId });
        }

        // POST api/whatsapp/disconnect
        [HttpPost("disconnect")]
        public IActionResult Disconnect()
        {
            _logger.LogInformation("📥 Requisição de desconexão recebida");
            _rabbit.CancelQrRequest();
            var cmd = new { command = "disconnect", timestamp = DateTime.UtcNow };
            _rabbit.PublishCommand(cmd);
            return Ok(new { success = true, status = "command_sent" });
        }

        // GET api/whatsapp/qr-code/current (fallback)
        [HttpGet("qr-code/current")]
        public IActionResult GetCurrentQr()
        {
            var qr = _rabbit.GetCachedQr();
            if (string.IsNullOrEmpty(qr)) return NotFound(new { message = "Nenhum QR code disponível" });
            return Ok(new { qrCode = qr, timestamp = DateTime.UtcNow.ToString("O") });
        }

        // POST api/whatsapp/webhook/qr-code (opcional)
        public class QrRequest { public string qrCode { get; set; } = string.Empty; public string? requestId { get; set; } }

        [HttpPost("webhook/qr-code")]
        public async Task<IActionResult> ReceiveQr([FromBody] QrRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.qrCode))
                return BadRequest(new { success = false, message = "qrCode obrigatório" });

            var qr = req.qrCode.StartsWith("data:image/") ? req.qrCode : $"data:image/png;base64,{req.qrCode}";

            // sempre cachear para fallback
            _rabbit.SetCachedQr(qr);

            // Só emitir para o front se houver um pedido pendente
            if (_rabbit.IsQrRequestPending())
            {
                await _hub.Clients.Group("whatsapp").SendAsync("qr.update", new
                {
                    qrCode = qr,
                    timestamp = DateTime.UtcNow.ToString("O"),
                    instanceId = "webhook",
                    requestId = req.requestId
                });
                _logger.LogInformation("📤 QR Code emitido via SignalR (webhook) requestId={RequestId}", req.requestId);
            }
            else
            {
                _logger.LogInformation("🚫 Webhook de QR recebido sem pedido pendente. Apenas cacheado.");
            }

            return Ok(new { success = true });
        }

        // GET api/whatsapp/status
        [HttpGet("status")]
        public async Task<IActionResult> Status()
        {
            bool botUp = false;
            bool sessionConnected = false;
            bool isFullyValidated = false;
            string? connectedNumber = null;

            try
            {
                using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
                var resp = await client.GetAsync("http://localhost:3030/status");
                if (resp.IsSuccessStatusCode)
                {
                    botUp = true;
                    var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync()).RootElement;
                    if (json.TryGetProperty("isConnected", out var c) && c.GetBoolean())
                    {
                        sessionConnected = true;
                    }
                    if (json.TryGetProperty("connectedNumber", out var n))
                    {
                        connectedNumber = n.GetString();
                        sessionConnected = !string.IsNullOrEmpty(connectedNumber);
                    }
                    if (json.TryGetProperty("isFullyValidated", out var f))
                    {
                        isFullyValidated = f.GetBoolean();
                    }
                }
            }
            catch { botUp = false; }

            var hasQr = !string.IsNullOrEmpty(_rabbit.GetCachedQr());

            return Ok(new
            {
                botUp,
                sessionConnected,
                isFullyValidated,
                isConnected = sessionConnected && !string.IsNullOrEmpty(connectedNumber),
                connectedNumber,
                status = sessionConnected ? "connected" : "disconnected",
                lastActivity = DateTime.UtcNow.ToString("O"),
                queueMessageCount = 0,
                canGenerateQR = !sessionConnected,
                hasQRCode = hasQr
            });
        }

        public class SendMessageRequest
        {
            public string Phone { get; set; } = string.Empty;
            public string? Message { get; set; }
            public string? Template { get; set; }
            public Dictionary<string, object>? Data { get; set; }
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
    }
}
