using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Pregiato.Infrastructure.Repositories
{
    /// <summary>
    /// Implementação do repositório de logs de chat
    /// </summary>
    public class ChatLogRepository : IChatLogRepository
    {
        private readonly RuntimePregiatoDbContextFactory _contextFactory;
        private readonly ILogger<ChatLogRepository> _logger;

        /// <summary>
        /// Construtor
        /// </summary>
        /// <param name="contextFactory">Factory para criação de instâncias do DbContext</param>
        /// <param name="logger">Logger</param>
        public ChatLogRepository(RuntimePregiatoDbContextFactory contextFactory, ILogger<ChatLogRepository> logger)
        {
            _contextFactory = contextFactory;
            _logger = logger;
        }

        /// <summary>
        /// Busca chat por número de telefone (prevenção de duplicação)
        /// </summary>
        public async Task<ChatLog?> GetByPhoneNumberAsync(string phoneE164)
        {
            using var context = _contextFactory.CreateDbContext();
            
            return await context.Set<ChatLog>()
                .Where(c => c.ContactPhoneE164 == phoneE164)
                .OrderByDescending(c => c.LastMessageAt ?? c.Timestamp)
                .FirstOrDefaultAsync();
        }

        /// <inheritdoc/>
        public async Task<(IEnumerable<ChatLog> Items, int Total)> GetAllAsync(string? search = null, int page = 1, int pageSize = 20)
        {
            using var context = _contextFactory.CreateDbContext();
            var query = context.Set<ChatLog>().AsQueryable();
            
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(c => 
                    (c.PhoneNumber != null && c.PhoneNumber.Contains(search)) ||
                    (c.Title != null && c.Title.ToLower().Contains(search)) ||
                    (c.Content != null && c.Content.ToLower().Contains(search)));
            }
            
            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(c => c.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            
            return (items, total);
        }

        /// <inheritdoc/>
        public async Task<ChatLog?> GetByIdAsync(Guid id)
        {
            using var context = _contextFactory.CreateDbContext();
            return await context.Set<ChatLog>().FindAsync(id);
        }

        /// <inheritdoc/>
        public async Task<ChatLog?> GetByChatIdAsync(Guid chatId)
        {
            using var context = _contextFactory.CreateDbContext();
            return await context.Set<ChatLog>().FirstOrDefaultAsync(c => c.ChatId == chatId);
        }



        /// <inheritdoc/>
        public async Task<ChatLog> AddAsync(ChatLog chatLog)
        {
            using var context = _contextFactory.CreateDbContext();
            
            chatLog.CreatedAt = DateTime.UtcNow;
            chatLog.UpdatedAt = DateTime.UtcNow;
            
            await context.Set<ChatLog>().AddAsync(chatLog);
            await context.SaveChangesAsync();
            
            return chatLog;
        }

        /// <inheritdoc/>
        public async Task<ChatLog> UpdateAsync(ChatLog chatLog)
        {
            using var context = _contextFactory.CreateDbContext();
            
            chatLog.UpdatedAt = DateTime.UtcNow;
            
            context.Set<ChatLog>().Update(chatLog);
            await context.SaveChangesAsync();
            
            return chatLog;
        }

        /// <inheritdoc/>
        public async Task<bool> DeleteAsync(Guid id)
        {
            using var context = _contextFactory.CreateDbContext();
            
            var entity = await context.Set<ChatLog>().FindAsync(id);
            if (entity == null)
                return false;
            
            context.Set<ChatLog>().Remove(entity);
            var result = await context.SaveChangesAsync();
            
            return result > 0;
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<ChatLog>> GetMessageHistoryAsync(Guid chatId, DateTime? cursorTs = null, int limit = 50)
        {
            using var context = _contextFactory.CreateDbContext();
            
            // CORREÇÃO: Buscar o ChatLog pelo ChatId e retornar as mensagens do PayloadJson
            var chatLog = await context.Set<ChatLog>().FirstOrDefaultAsync(c => c.ChatId == chatId);
            if (chatLog == null)
                return new List<ChatLog>();
            
            // Deserializar o PayloadJson para obter as mensagens
            var payload = DeserializePayload(chatLog.PayloadJson);
            var messages = payload.Messages;
            
            // Aplicar filtros se necessário
            if (cursorTs.HasValue)
            {
                messages = messages.Where(m => m.Ts < cursorTs.Value).ToList();
            }
            
            // Ordenar por timestamp e limitar
            messages = messages
                .OrderByDescending(m => m.Ts)
                .Take(Math.Clamp(limit, 1, 200))
                .ToList();
            
            // Converter MessageInfo para ChatLog para manter compatibilidade
            var chatLogs = messages.Select(msg => new ChatLog
            {
                Id = Guid.NewGuid(), // ID temporário
                ChatId = chatId,
                MessageId = msg.Id,
                Direction = msg.Direction,
                Content = msg.Text ?? "",
                ContentType = msg.Type ?? "text",
                Timestamp = msg.Ts,
                PayloadJson = JsonSerializer.Serialize(msg)
            }).ToList();
            
            return chatLogs;
        }

        /// <inheritdoc/>
        public async Task<(ChatLog Chat, object Message)> AddMessageAsync(Guid chatId, object message)
        {
            using var context = _contextFactory.CreateDbContext();
            
            var chat = await context.Set<ChatLog>().FirstOrDefaultAsync(c => c.Id == chatId);
            if (chat == null)
                throw new KeyNotFoundException($"Chat com ID {chatId} não encontrado");
            
            // Deserializar o payload para adicionar a mensagem
            var payload = DeserializePayload(chat.PayloadJson);
            
            // Adicionar a mensagem ao payload
            var messageObj = message as dynamic;
            payload.Messages.Add(messageObj);
            
            // Atualizar o chat
            chat.PayloadJson = JsonSerializer.Serialize(payload);
            chat.LastMessageUtc = DateTime.UtcNow;
            chat.UpdatedAt = DateTime.UtcNow;
            
            // Se a mensagem for de entrada, incrementar contador de não lidas
            if (messageObj.Direction == "inbound")
            {
                chat.UnreadCount++;
            }
            
            // Atualizar preview da última mensagem
            if (messageObj.Text != null)
            {
                chat.LastMessagePreview = messageObj.Text.ToString();
                if (chat.LastMessagePreview.Length > 200)
                {
                    chat.LastMessagePreview = chat.LastMessagePreview.Substring(0, 197) + "...";
                }
            }
            
            await context.SaveChangesAsync();
            
            return (chat, message);
        }

        /// <inheritdoc/>
        public async Task<bool> MarkReadUpToAsync(Guid chatId, DateTime timestamp)
        {
            using var context = _contextFactory.CreateDbContext();
            
            var chat = await context.Set<ChatLog>().FirstOrDefaultAsync(c => c.Id == chatId);
            if (chat == null)
                return false;
            
            // Deserializar o payload
            var payload = DeserializePayload(chat.PayloadJson);
            
            // Marcar mensagens como lidas
            bool changed = false;
            foreach (var msg in payload.Messages.Where(m => 
                m.Direction == "inbound" && 
                m.Ts <= timestamp && 
                !m.IsRead))
            {
                msg.IsRead = true;
                changed = true;
            }
            
            if (changed)
            {
                chat.PayloadJson = JsonSerializer.Serialize(payload);
                chat.UnreadCount = payload.Messages.Count(m => m.Direction == "inbound" && !m.IsRead);
                chat.UpdatedAt = DateTime.UtcNow;
                
                await context.SaveChangesAsync();
            }
            
            return changed;
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<ChatLog>> GetRecentChatsAsync(int limit = 10)
        {
            using var context = _contextFactory.CreateDbContext();
            
            // Agrupar os logs por ChatId e obter o mais recente de cada chat
            var recentChats = await context.Set<ChatLog>()
                .GroupBy(c => c.ChatId)
                .Select(g => g.OrderByDescending(c => c.Timestamp).First())
                .OrderByDescending(c => c.Timestamp)
                .Take(limit)
                .ToListAsync();
            
            return recentChats;
        }

        #region Helpers

        /// <summary>
        /// Classe para representar o payload de um chat
        /// </summary>
        private class ChatPayload
        {
            public ContactInfo? Contact { get; set; }
            public List<MessageInfo> Messages { get; set; } = new List<MessageInfo>();
        }
        
        private class ContactInfo
        {
            public string? Name { get; set; }
            public string? PhoneE164 { get; set; }
            public string? ProfilePic { get; set; }
        }
        
        private class MessageInfo
        {
            public string Id { get; set; } = string.Empty;
            public string? Text { get; set; }
            public string? MediaUrl { get; set; }
            public string Direction { get; set; } = "inbound";
            public DateTime Ts { get; set; } = DateTime.UtcNow;
            public bool IsRead { get; set; }
            public string? Status { get; set; }
            public string? Type { get; set; }
        }
        
        /// <summary>
        /// Deserializa o payload JSON de um chat
        /// </summary>
        /// <param name="json">JSON do payload</param>
        /// <returns>Objeto ChatPayload</returns>
        private ChatPayload DeserializePayload(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new ChatPayload();
            
            try
            {
                return JsonSerializer.Deserialize<ChatPayload>(json) ?? new ChatPayload();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao deserializar payload de chat");
                return new ChatPayload();
            }
        }

        #endregion
    }
}
