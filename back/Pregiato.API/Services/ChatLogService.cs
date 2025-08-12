using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;

namespace Pregiato.API.Services
{
    public class ChatLogService
    {
        private readonly PregiatoDbContext _db;
        private readonly ILogger<ChatLogService> _logger;

        public ChatLogService(PregiatoDbContext db, ILogger<ChatLogService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public static string NormalizePhoneE164Br(string phone)
        {
            var digits = new string((phone ?? "").Where(char.IsDigit).ToArray());
            if (digits.StartsWith("55")) return digits;
            if (digits.Length == 11 || digits.Length == 10) return "55" + digits;
            return digits;
        }

        public async Task<ChatLog?> GetByPhoneAsync(string phoneE164)
        {
            var normalized = NormalizePhoneE164Br(phoneE164);
            return await _db.ChatLogs.AsNoTracking().FirstOrDefaultAsync(c => c.ContactPhoneE164 == normalized);
        }

        public async Task<(ChatLog chat, ChatMessage msg, bool created)> UpsertInboundAsync(string phoneRaw, string text, DateTime tsUtc, string externalMessageId)
        {
            var phone = NormalizePhoneE164Br(phoneRaw);

            var chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.ContactPhoneE164 == phone);
            var created = false;
            if (chat == null)
            {
                created = true;
                chat = new ChatLog
                {
                    Id = Guid.NewGuid(),
                    ContactPhoneE164 = phone,
                    Title = phone,
                    PayloadJson = JsonSerializer.Serialize(new ChatPayload
                    {
                        ChatId = Guid.NewGuid().ToString("N"),
                        Contact = new ContactPayload { PhoneE164 = phone },
                        Messages = new List<ChatMessage>()
                    }),
                    UnreadCount = 0,
                    LastMessageAt = null,
                    LastMessagePreview = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.ChatLogs.Add(chat);
            }

            var payload = Deserialize(chat.PayloadJson);
            if (payload.Messages.Any(m => m.ExternalMessageId == externalMessageId))
            {
                _logger.LogInformation("🔁 Mensagem inbound duplicada ignorada: {ExternalId}", externalMessageId);
                return (chat, payload.Messages.First(m => m.ExternalMessageId == externalMessageId)!, created);
            }

            var msg = new ChatMessage
            {
                Id = Guid.NewGuid().ToString("N"),
                Direction = "in",
                Text = text ?? string.Empty,
                Status = "delivered",
                Ts = tsUtc,
                ExternalMessageId = externalMessageId
            };
            payload.Messages.Add(msg);
            payload.Messages = payload.Messages.OrderBy(m => m.Ts).ToList();

            chat.PayloadJson = JsonSerializer.Serialize(payload);
            chat.UnreadCount += 1;
            chat.LastMessageAt = msg.Ts;
            chat.LastMessagePreview = TruncatePreview(text);
            chat.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return (chat, msg, created);
        }

        public async Task<(ChatLog chat, ChatMessage msg)> AddOutboundPendingAsync(Guid chatId, string text, string clientMessageId, DateTime tsUtc)
        {
            var chat = await _db.ChatLogs.FirstAsync(c => c.Id == chatId);
            var payload = Deserialize(chat.PayloadJson);

            var msg = new ChatMessage
            {
                Id = clientMessageId,
                Direction = "out",
                Text = text,
                Status = "pending",
                Ts = tsUtc
            };
            if (payload.Messages.Any(m => m.Id == msg.Id))
            {
                _logger.LogInformation("🔁 Mensagem outbound duplicada (clientMessageId) ignorada: {ClientId}", clientMessageId);
                return (chat, payload.Messages.First(m => m.Id == msg.Id));
            }

            payload.Messages.Add(msg);
            payload.Messages = payload.Messages.OrderBy(m => m.Ts).ToList();
            chat.PayloadJson = JsonSerializer.Serialize(payload);
            chat.LastMessageAt = msg.Ts;
            chat.LastMessagePreview = TruncatePreview(text);
            chat.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return (chat, msg);
        }

        public async Task UpdateStatusAsync(Guid chatId, string messageIdOrExternalId, string status)
        {
            var chat = await _db.ChatLogs.FirstAsync(c => c.Id == chatId);
            var payload = Deserialize(chat.PayloadJson);
            var msg = payload.Messages.FirstOrDefault(m => m.Id == messageIdOrExternalId || m.ExternalMessageId == messageIdOrExternalId);
            if (msg == null) return;
            msg.Status = status;
            chat.PayloadJson = JsonSerializer.Serialize(payload);
            chat.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        public async Task MarkReadUpToAsync(Guid chatId, DateTime readUpTo)
        {
            var chat = await _db.ChatLogs.FirstAsync(c => c.Id == chatId);
            var payload = Deserialize(chat.PayloadJson);
            foreach (var m in payload.Messages.Where(m => m.Ts <= readUpTo))
            {
                if (m.Direction == "in") m.Status = "read";
            }
            chat.PayloadJson = JsonSerializer.Serialize(payload);
            chat.UnreadCount = payload.Messages.Count(m => m.Direction == "in" && m.Status != "read");
            chat.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        public async Task<(IEnumerable<ChatLog> items, int total)> ListAsync(string? search, int page, int pageSize)
        {
            var q = _db.ChatLogs.AsQueryable();
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim();
                q = q.Where(c => c.Title.Contains(s) || c.ContactPhoneE164.Contains(s));
            }
            var total = await q.CountAsync();
            var items = await q.OrderByDescending(c => c.LastMessageAt ?? c.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            return (items, total);
        }

        public ChatPayload Deserialize(string json)
        {
            try
            {
                var payload = JsonSerializer.Deserialize<ChatPayload>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return payload ?? new ChatPayload { Messages = new List<ChatMessage>() };
            }
            catch
            {
                _logger.LogWarning("⚠️ PayloadJson inválido. Recriando estrutura.");
                return new ChatPayload { Messages = new List<ChatMessage>() };
            }
        }

        private static string TruncatePreview(string? text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            return text.Length <= 200 ? text : text.Substring(0, 200);
        }
    }

    public class ChatPayload
    {
        public string ChatId { get; set; } = string.Empty;
        public ContactPayload Contact { get; set; } = new ContactPayload();
        public List<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }

    public class ContactPayload
    {
        public string PhoneE164 { get; set; } = string.Empty;
        public string? Name { get; set; }
    }

    public class ChatMessage
    {
        public string Id { get; set; } = string.Empty;
        public string? ExternalMessageId { get; set; }
        public string Direction { get; set; } = "in";
        public string Text { get; set; } = string.Empty;
        public string Status { get; set; } = "delivered";
        public DateTime Ts { get; set; }
    }
}
