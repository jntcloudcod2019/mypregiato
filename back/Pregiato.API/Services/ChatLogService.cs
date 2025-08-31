using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Pregiato.API.Services
{
    public class ChatLogService
    {
        private readonly IChatLogRepository _chatLogRepository;
        private readonly IMemoryCache _cache;
        private readonly ILogger<ChatLogService> _logger;

        public ChatLogService(IChatLogRepository chatLogRepository, IMemoryCache cache, ILogger<ChatLogService> logger)
        {
            _chatLogRepository = chatLogRepository;
            _cache = cache;
            _logger = logger;
        }

        public async Task<(IEnumerable<ChatLog> items, int total)> ListAsync(string? search, int page, int pageSize)
        {
            return await _chatLogRepository.GetAllAsync(search, page, pageSize);
        }

        public class MessageDTO
        {
            public Guid Id { get; set; }
            public Guid ConversationId { get; set; }
            public string? FromNumber { get; set; }
            public string? Content { get; set; }
            public string? ContentType { get; set; }
            public bool IsInbound { get; set; }
            public DateTime Timestamp { get; set; }
        }
        
        public async Task LogMessageAsync(MessageDTO message)
        {
            var chatLog = new ChatLog
            {
                Id = Guid.NewGuid(),
                ChatId = message.ConversationId,
                PhoneNumber = message.FromNumber,
                MessageId = message.Id.ToString(),
                Direction = message.IsInbound ? "inbound" : "outbound",
                Content = message.Content,
                ContentType = GetShortContentType(message.ContentType ?? "text"),
                Timestamp = message.Timestamp
            };

            await _chatLogRepository.AddAsync(chatLog);
        }

        /// <summary>
        /// Converte tipos de conteúdo longos para versões curtas que cabem no banco
        /// </summary>
        private static string GetShortContentType(string contentType)
        {
            if (string.IsNullOrEmpty(contentType))
                return "text";
                
            // Mapear tipos longos para versões curtas
            return contentType.ToLower() switch
            {
                "application/octet-stream" => "file",
                "image/jpeg" => "image",
                "image/png" => "image", 
                "image/gif" => "image",
                "image/webp" => "image",
                "video/mp4" => "video",
                "video/avi" => "video",
                "video/mov" => "video",
                "audio/mpeg" => "audio",
                "audio/wav" => "audio",
                "audio/ogg" => "audio",
                "audio/webm" => "audio",
                "application/pdf" => "doc",
                "application/msword" => "doc",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => "doc",
                "text/plain" => "text",
                "text/html" => "text",
                _ => contentType.Length > 20 ? contentType.Substring(0, 20) : contentType
            };
        }

        public async Task<IEnumerable<ChatLog>> GetChatHistoryAsync(Guid chatId)
        {
            return await _chatLogRepository.GetMessageHistoryAsync(chatId);
        }

        /// <summary>
        /// Busca chat existente para um número, prevenindo duplicação
        /// </summary>
        public async Task<ChatLog?> FindExistingChatByPhoneAsync(string phoneE164)
        {
            try
            {
                var cacheKey = $"chat_by_phone_{phoneE164}";
                
                if (_cache.TryGetValue(cacheKey, out ChatLog? cachedChat))
                {
                    return cachedChat;
                }
                
                var chat = await _chatLogRepository.GetByPhoneNumberAsync(phoneE164);
                
                if (chat != null)
                {
                    _cache.Set(cacheKey, chat, TimeSpan.FromMinutes(10));
                }
                
                return chat;
                
            } catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao buscar chat existente para {Phone}", phoneE164);
                return null;
            }
        }
        
        /// <summary>
        /// Remove chat duplicado do cache quando consolidado
        /// </summary>
        public void RemoveChatFromCache(string phoneE164)
        {
            var cacheKey = $"chat_by_phone_{phoneE164}";
            _cache.Remove(cacheKey);
        }

        public async Task<IEnumerable<object>> GetRecentChatsAsync(int limit = 10)
        {
            var recentChats = await _chatLogRepository.GetRecentChatsAsync(limit);
            
            // Converter para o formato esperado pelo cliente
            return recentChats.Select(chat => new
            {
                ChatId = chat.ChatId,
                PhoneNumber = chat.PhoneNumber,
                LastMessage = chat.Content,
                LastTimestamp = chat.Timestamp
            });
        }
        
        // Classe para representar o payload de um chat
        public class ChatPayload
        {
            public ContactInfo? Contact { get; set; }
            public List<MessageInfo> Messages { get; set; } = new List<MessageInfo>();
        }
        
        public class ContactInfo
        {
            public string? Name { get; set; }
            public string? PhoneE164 { get; set; }
            public string? ProfilePic { get; set; }
        }
        
        public class MessageInfo
        {
            public string Id { get; set; } = string.Empty;
            public string? Content { get; set; }
            public string? body { get; set; } // Campo real do JSON
            public string? MediaUrl { get; set; }
            public string Direction { get; set; } = "inbound";
            public DateTime Ts { get; set; } = DateTime.UtcNow;
            public string? timestamp { get; set; } // Campo real do JSON
            public bool IsRead { get; set; }
            public string? Status { get; set; }
            public string? Type { get; set; }
            public string? from { get; set; } // Campo real do JSON
            
            // Propriedade calculada para compatibilidade
            public string? ActualContent => Content ?? body;
            public DateTime ActualTs => !string.IsNullOrEmpty(timestamp) ? DateTime.Parse(timestamp) : Ts;
        }
        
        public class ChatAttachment
        {
            public string DataUrl { get; set; } = string.Empty;
            public string MimeType { get; set; } = string.Empty;
            public string? FileName { get; set; }
            public string? MediaType { get; set; }
        }
        
        // Métodos adicionais
        
        public ChatPayload Deserialize(string? json)
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
        
        public async Task<(ChatLog chat, MessageInfo message)> AddOutboundPendingAsync(Guid chatId, string text, string clientMessageId, DateTime timestamp, ChatAttachment? attachment = null)
        {
            var chat = await _chatLogRepository.GetByIdAsync(chatId);
            if (chat == null)
                throw new KeyNotFoundException($"Chat com ID {chatId} não encontrado");
            
            var payload = Deserialize(chat.PayloadJson);
            
            var message = new MessageInfo
            {
                Id = clientMessageId,
                Content = text,
                Direction = "outbound",
                Ts = timestamp,
                Status = "pending",
                Type = attachment != null ? "media" : "text",
                MediaUrl = attachment?.DataUrl
            };
            
            payload.Messages.Add(message);
            
            chat.PayloadJson = JsonSerializer.Serialize(payload);
            chat.LastMessageUtc = timestamp;
            chat.LastMessagePreview = text?.Length > 200 ? text.Substring(0, 200) : text;
            chat.LastMessageAt = timestamp;
            
            await _chatLogRepository.UpdateAsync(chat);
            // Save in-memory snapshot for quick fallback
            try {
                _cache.Set($"chatpayload_{chatId}", payload, TimeSpan.FromMinutes(10));
            } catch { }
            
            return (chat, message);
        }
        
        public async Task MarkReadUpToAsync(Guid chatId, DateTime timestamp)
        {
            await _chatLogRepository.MarkReadUpToAsync(chatId, timestamp);
        }
    }
}