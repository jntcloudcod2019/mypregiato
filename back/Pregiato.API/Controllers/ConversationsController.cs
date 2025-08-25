using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Pregiato.API.Hubs;
using Pregiato.API.Services;
using Pregiato.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConversationsController : ControllerBase
    {
        private readonly ConversationService _conversationService;
        private readonly PregiatoDbContext _db;
        private readonly IHubContext<WhatsAppHub> _hub;
        private readonly ILogger<ConversationsController> _logger;
        private readonly RabbitBackgroundService _rabbit;

        public ConversationsController(
            ConversationService conversationService, 
            PregiatoDbContext db, 
            IHubContext<WhatsAppHub> hub, 
            ILogger<ConversationsController> logger,
            RabbitBackgroundService rabbit)
        {
            _conversationService = conversationService;
            _db = db;
            _hub = hub;
            _logger = logger;
            _rabbit = rabbit;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var (items, total) = await _conversationService.ListConversationsAsync(search, page, pageSize);
            return Ok(new { items, total });
        }

        [HttpGet("{id:guid}/messages")]
        public async Task<IActionResult> GetMessages(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var conversation = await _db.Conversations
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt))
                .FirstOrDefaultAsync(c => c.Id == id);

            if (conversation == null)
                return NotFound();

            var messages = conversation.Messages
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new
                {
                    id = m.ExternalMessageId,
                    body = m.Body,
                    type = m.Type.ToString().ToLower(),
                    timestamp = m.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    fromMe = m.Direction == Core.Entities.MessageDirection.Out,
                    payload = m.PayloadJson
                })
                .ToList();

            return Ok(new { messages, total = conversation.Messages.Count });
        }

        [HttpPost("{id:guid}/send")]
        public async Task<IActionResult> Send(Guid id, [FromBody] SendMessageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Text))
                return BadRequest(new { error = "Texto é obrigatório" });

            var conversation = await _db.Conversations
                .Include(c => c.Contact)
                .FirstOrDefaultAsync(c => c.Id == id);
                
            if (conversation == null)
                return NotFound();

            // Adicionar mensagem de saída
            var message = await _conversationService.AddMessageAsync(
                id,
                request.ClientMessageId ?? Guid.NewGuid().ToString(),
                request.Text,
                "text",
                true, // fromMe = true
                System.Text.Json.JsonSerializer.Serialize(new { body = request.Text, type = "text" }));

            // Emitir evento via SignalR
            await _hub.Clients.Group("whatsapp").SendAsync("message.outbound", new
            {
                conversationId = id.ToString(),
                messageId = message.Id.ToString(),
                text = request.Text,
                timestamp = message.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            });

            // INTEGRAÇÃO COM RABBITMQ: Enviar para WhatsApp
            if (conversation.Contact != null)
            {
                var phoneNumber = conversation.Contact.Phone;
                if (!string.IsNullOrWhiteSpace(phoneNumber))
                {
                    // Normalizar número de telefone
                    var normalizedPhone = NormalizePhoneNumber(phoneNumber);
                    
                    // Publicar comando para RabbitMQ
                    var cmd = new
                    {
                        command = "send_message",
                        to = normalizedPhone,
                        isGroup = false,
                        body = request.Text,
                        clientMessageId = request.ClientMessageId ?? message.Id.ToString(),
                        conversationId = id.ToString(),
                        attachment = request.Attachment
                    };
                    
                    await _rabbit.PublishAsync("whatsapp.outgoing", cmd);
                    _logger.LogInformation($"📤 Mensagem enviada para RabbitMQ: {normalizedPhone}");
                }
            }

            return Ok(new { success = true, messageId = message.Id });
        }

        private string NormalizePhoneNumber(string phone)
        {
            // Remover caracteres não numéricos
            var clean = new string(phone.Where(char.IsDigit).ToArray());
            
            // Adicionar código do país se não tiver
            if (!clean.StartsWith("55") && clean.Length == 11)
            {
                clean = "55" + clean;
            }
            
            return clean;
        }
    }

    public class SendMessageRequest
    {
        public string Text { get; set; } = string.Empty;
        public string? ClientMessageId { get; set; }
        public AttachmentDto? Attachment { get; set; }
    }

    public class AttachmentDto
    {
        public string DataUrl { get; set; } = string.Empty;
        public string MimeType { get; set; } = string.Empty;
        public string? FileName { get; set; }
        public string? MediaType { get; set; }
    }
}
