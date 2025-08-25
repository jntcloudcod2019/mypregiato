using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;
using System.Text.Json;

namespace Pregiato.API.Services
{
    public class ConversationService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ConversationService> _logger;

        public ConversationService(IServiceProvider serviceProvider, ILogger<ConversationService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        /// <summary>
        /// Obtém ou cria uma conversa para um número específico (WhatsApp)
        /// </summary>
        public async Task<Conversation> GetOrCreateWhatsAppConversationAsync(string instanceId, string peerE164, bool isGroup = false, string? title = null)
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<PregiatoDbContext>();

            // Buscar conversa existente por WhatsApp
            var conversation = await db.Conversations
                .FirstOrDefaultAsync(c => c.InstanceId == instanceId && c.PeerE164 == peerE164);

            if (conversation != null)
            {
                _logger.LogDebug("📞 Conversa WhatsApp encontrada para {PeerE164}: {ConversationId}", peerE164, conversation.Id);
                return conversation;
            }

            // Criar nova conversa WhatsApp
            conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                InstanceId = instanceId,
                PeerE164 = peerE164,
                IsGroup = isGroup,
                Title = title ?? $"Chat com {peerE164}",
                LastMessageAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                // Campos obrigatórios para compatibilidade
                ContactId = Guid.Empty, // Será atualizado quando necessário
                Channel = "whatsapp",
                Status = ConversationStatus.Queued,
                Priority = ConversationPriority.Normal
            };

            await db.Conversations.AddAsync(conversation);
            await db.SaveChangesAsync();

            _logger.LogInformation("📞 ✅ Nova conversa WhatsApp criada para {PeerE164}: {ConversationId}", peerE164, conversation.Id);
            return conversation;
        }

        /// <summary>
        /// Lista conversas com paginação (suporta tanto conversas originais quanto WhatsApp)
        /// </summary>
        public async Task<(IEnumerable<ConversationListItemDto> Items, int Total)> ListConversationsAsync(
            string? search, int page, int pageSize, CancellationToken ct = default)
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<PregiatoDbContext>();

            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = db.Conversations.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim();
                query = query.Where(c =>
                    (c.PeerE164 != null && c.PeerE164.Contains(s)) ||
                    (c.Title != null && c.Title.Contains(s)) ||
                    (c.Contact != null && c.Contact.Name != null && c.Contact.Name.Contains(s)));
            }

            var projected = query
                .Include(c => c.Contact)
                .Select(c => new
                {
                    c.Id,
                    c.InstanceId,
                    c.PeerE164,
                    c.IsGroup,
                    c.Title,
                    c.CurrentSessionId,
                    c.LastMessageAt,
                    c.CreatedAt,
                    ContactName = c.Contact != null ? c.Contact.Name : null,
                    LastMsg = db.Messages
                        .Where(m => m.ConversationId == c.Id)
                        .OrderByDescending(m => m.CreatedAt)
                        .Select(m => new { m.PayloadJson })
                        .FirstOrDefault()
                })
                .OrderByDescending(x => x.LastMessageAt ?? x.CreatedAt);

            var total = await projected.CountAsync(ct);
            var rows = await projected
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            var items = rows.Select(x => new ConversationListItemDto
            {
                ConversationId = x.Id,
                InstanceId = x.InstanceId,
                PeerE164 = x.PeerE164,
                IsGroup = x.IsGroup,
                Title = x.Title ?? x.ContactName,
                CurrentSessionId = x.CurrentSessionId,
                LastMessageAt = x.LastMessageAt,
                LastMessagePayloadJson = x.LastMsg?.PayloadJson
            }).ToList();

            return (items, total);
        }

        /// <summary>
        /// Adiciona uma mensagem a uma conversa
        /// </summary>
        public async Task<Message> AddMessageAsync(Guid conversationId, string externalMessageId, string body, string type, bool fromMe, string? payloadJson = null)
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<PregiatoDbContext>();

            // Verificar se a mensagem já existe para evitar duplicação
            var existingMessage = await db.Messages
                .FirstOrDefaultAsync(m => m.ConversationId == conversationId && m.ExternalMessageId == externalMessageId);

            if (existingMessage != null)
            {
                _logger.LogDebug("📨 Mensagem já existe: {ExternalMessageId}", externalMessageId);
                return existingMessage;
            }

            var message = new Message
            {
                Id = Guid.NewGuid(),
                ConversationId = conversationId,
                ExternalMessageId = externalMessageId,
                Direction = fromMe ? MessageDirection.Out : MessageDirection.In,
                Type = GetMessageType(type),
                Body = body,
                Status = MessageStatus.Sent,
                PayloadJson = payloadJson,
                CreatedAt = DateTime.UtcNow
            };

            await db.Messages.AddAsync(message);

            // Atualizar LastMessageAt da conversa
            var conversation = await db.Conversations.FindAsync(conversationId);
            if (conversation != null)
            {
                conversation.LastMessageAt = DateTime.UtcNow;
            }

            await db.SaveChangesAsync();

            _logger.LogDebug("📨 ✅ Nova mensagem adicionada: {ExternalMessageId}", externalMessageId);
            return message;
        }

        private static MessageType GetMessageType(string type)
        {
            return type.ToLower() switch
            {
                "image" => MessageType.Image,
                "video" => MessageType.Video,
                "audio" => MessageType.Audio,
                "document" => MessageType.Document,
                _ => MessageType.Text
            };
        }
    }

    public class ConversationListItemDto
    {
        public Guid ConversationId { get; set; }
        public string? InstanceId { get; set; }
        public string? PeerE164 { get; set; }
        public bool IsGroup { get; set; }
        public string? Title { get; set; }
        public DateTime? LastMessageAt { get; set; }
        public string? LastMessagePayloadJson { get; set; }
        public Guid? CurrentSessionId { get; set; }
    }
}
