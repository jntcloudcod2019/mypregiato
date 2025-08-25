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
        private readonly ILogger<ChatsController> _logger;

        public ChatsController(ChatLogService chatService, PregiatoDbContext db, IHubContext<WhatsAppHub> hub, RabbitBackgroundService rabbit, ILogger<ChatsController> logger)
        {
            _chatService = chatService;
            _db = db;
            _hub = hub;
            _rabbit = rabbit;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var (items, total) = await _chatService.ListAsync(search, Math.Max(page, 1), Math.Clamp(pageSize, 1, 100));
            // Deduplicar por contato/título no retorno para evitar itens duplicados no front
            var seen = new HashSet<string>();
            var unique = new List<ChatLog>();
            foreach (var c in items)
            {
                var key = $"{c.ContactPhoneE164}|{c.Title}";
                if (seen.Add(key)) unique.Add(c);
            }
            return Ok(new { items = unique, total });
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

        public class SendRequest {
            public string text { get; set; } = string.Empty;
            public string clientMessageId { get; set; } = string.Empty;
            public AttachmentDto? attachment { get; set; }
        }

        public class AttachmentDto {
            public string dataUrl { get; set; } = string.Empty; // data:mime;base64,...
            public string mimeType { get; set; } = string.Empty;
            public string? fileName { get; set; }
            public string? mediaType { get; set; } // image | file
        }

        [HttpPost("{id:guid}/send")]
        public async Task<IActionResult> Send(Guid id, [FromBody] SendRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.text) || string.IsNullOrWhiteSpace(req.clientMessageId))
                return BadRequest(new { error = "text e clientMessageId são obrigatórios" });

            var chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.Id == id);
            if (chat == null) return NotFound();

            var (updatedChat, msg) = await _chatService.AddOutboundPendingAsync(id, req.text, req.clientMessageId, DateTime.UtcNow, 
                req.attachment != null ? new ChatLogService.ChatAttachment { 
                    DataUrl = req.attachment.dataUrl, 
                    MimeType = req.attachment.mimeType, 
                    FileName = req.attachment.fileName, 
                    MediaType = req.attachment.mediaType 
                } : null);

            await _hub.Clients.Group("whatsapp").SendAsync("message.outbound", new { chatId = updatedChat.Id, message = msg });

            // Publicar para envio via Rabbit
            var payload = _chatService.Deserialize(updatedChat.PayloadJson);
            var to = payload.Contact?.PhoneE164;
            if (string.IsNullOrWhiteSpace(to)) to = updatedChat.ContactPhoneE164;
            if (string.IsNullOrWhiteSpace(to))
            {
                return BadRequest(new { error = "Telefone do contato não encontrado para este chat." });
            }
            
            // CORREÇÃO: Usar normalização consistente para evitar duplicação
            // Heurística para grupos: IDs de grupo podem vir como "...@g.us" ou iniciar com 120 e ter >= 18 dígitos
            var isGroup = (to?.EndsWith("@g.us") ?? false) || (to?.StartsWith("120") == true && to!.Length >= 18);
            
            // Remover sufixo @g.us ou @c.us para normalização
            var toClean = to ?? string.Empty;
            if (toClean.EndsWith("@g.us") || toClean.EndsWith("@c.us")) {
                toClean = toClean.Split('@')[0];
            }
            
            // Aplicar normalização consistente
            var toNormalized = NormalizePhoneE164Br(toClean, isGroup);
            
            // Log para debug de normalização
            _logger.LogDebug($"🔧 Normalização em Send: original={to}, limpo={toClean}, normalizado={toNormalized}, isGroup={isGroup}");
            
            // Publicar comando para RabbitMQ
            var cmd = new
            {
                command = "send_message",
                to = toNormalized,
                isGroup = isGroup,
                body = req.text,
                clientMessageId = req.clientMessageId,
                chatId = updatedChat.ChatId,
                attachment = req.attachment
            };
            
            await _rabbit.PublishAsync("whatsapp.outgoing", cmd);
            
            return Ok(new { success = true, messageId = req.clientMessageId });
        }
        
        /// <summary>
        /// Normaliza um número de telefone ou ID de grupo para um formato padrão
        /// CORRIGIDA para evitar duplicação de chats - conforme análise de engenharia reversa
        /// </summary>
        /// <param name="phone">Número de telefone ou ID de grupo</param>
        /// <param name="isGroup">Se é um ID de grupo</param>
        /// <returns>Número normalizado</returns>
        private static string NormalizePhoneE164Br(string phone, bool isGroup = false)
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

        public class ReadRequest { public long readUpToTs { get; set; } }

        [HttpPost("{id:guid}/read")]
        public async Task<IActionResult> Read(Guid id, [FromBody] ReadRequest req)
        {
            var ts = DateTimeOffset.FromUnixTimeMilliseconds(req.readUpToTs).UtcDateTime;
            await _chatService.MarkReadUpToAsync(id, ts);
            await _hub.Clients.Group("whatsapp").SendAsync("chat.read", new { chatId = id, readUpToTs = req.readUpToTs });
            return Ok(new { success = true });
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.Id == id);
            if (chat == null) return NotFound();
            _db.ChatLogs.Remove(chat);
            await _db.SaveChangesAsync();
            await _hub.Clients.Group("whatsapp").SendAsync("chat.deleted", new { chatId = id });
            return Ok(new { success = true });
        }
    }
}
