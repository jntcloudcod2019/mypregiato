using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Pregiato.API.Hubs;
using Pregiato.API.Services;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;
using System.Text.Json;
using System.Text;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatsController : ControllerBase
    {
        private readonly ChatLogService _chatService;
        private readonly PregiatoDbContext _db;
        private readonly IHubContext<WhatsAppHub> _hub;
        private readonly RabbitBackgroundService _rabbit;

        public ChatsController(ChatLogService chatService, PregiatoDbContext db, IHubContext<WhatsAppHub> hub, RabbitBackgroundService rabbit)
        {
            _chatService = chatService;
            _db = db;
            _hub = hub;
            _rabbit = rabbit;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var (items, total) = await _chatService.ListAsync(search, Math.Max(page, 1), Math.Clamp(pageSize, 1, 100));
            return Ok(new { items, total });
        }

        [HttpGet("{id:guid}/messages")]
        public async Task<IActionResult> GetMessages(Guid id, [FromQuery] long? cursorTs = null, [FromQuery] int limit = 50)
        {
            var chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.Id == id);
            if (chat == null) return NotFound();
            var payload = _chatService.Deserialize(chat.PayloadJson);
            var messages = payload.Messages.OrderByDescending(m => m.Ts);
            if (cursorTs.HasValue)
            {
                var cursor = DateTimeOffset.FromUnixTimeMilliseconds(cursorTs.Value).UtcDateTime;
                messages = messages.Where(m => m.Ts < cursor).OrderByDescending(m => m.Ts);
            }
            var slice = messages.Take(Math.Clamp(limit, 1, 200)).ToList();
            var nextCursor = slice.Count > 0 ? new DateTimeOffset(slice.Last().Ts).ToUnixTimeMilliseconds() : (long?)null;
            return Ok(new { messages = slice.OrderBy(m => m.Ts), nextCursor });
        }

        public class SendRequest { public string text { get; set; } = string.Empty; public string clientMessageId { get; set; } = string.Empty; }

        [HttpPost("{id:guid}/messages")]
        public async Task<IActionResult> Send(Guid id, [FromBody] SendRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.text) || string.IsNullOrWhiteSpace(req.clientMessageId))
                return BadRequest(new { error = "text e clientMessageId são obrigatórios" });

            var chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.Id == id);
            if (chat == null) return NotFound();

            var (updatedChat, msg) = await _chatService.AddOutboundPendingAsync(id, req.text, req.clientMessageId, DateTime.UtcNow);

            await _hub.Clients.Group("whatsapp").SendAsync("message.outbound", new { chatId = updatedChat.Id, message = msg });

            // Publicar para envio via Rabbit
            var payload = _chatService.Deserialize(updatedChat.PayloadJson);
            var to = payload.Contact?.PhoneE164 ?? updatedChat.ContactPhoneE164;
            var cmd = new { command = "send_message", toNormalized = to, body = req.text, clientMessageId = req.clientMessageId, chatId = updatedChat.Id };
            _rabbit.PublishCommand(cmd);

            return Ok(new { success = true, message = msg });
        }

        public class ReadRequest { public long readUpToTs { get; set; } }

        [HttpPost("{id:guid}/read")]
        public async Task<IActionResult> Read(Guid id, [FromBody] ReadRequest req)
        {
            var ts = DateTimeOffset.FromUnixTimeMilliseconds(req.readUpToTs).UtcDateTime;
            await _chatService.MarkReadUpToAsync(id, ts);
            await _hub.Clients.Group("whatsapp").SendAsync("chat.read", new { chatId = id, readUpToTs = req.readUpToTs });
            return Ok(new { success = true });
        }
    }
}
