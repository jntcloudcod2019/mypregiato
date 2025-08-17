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
                ContentType = message.ContentType ?? "text",
                Timestamp = message.Timestamp
            };

            await _chatLogRepository.AddAsync(chatLog);
        }

        public async Task<IEnumerable<ChatLog>> GetChatHistoryAsync(Guid chatId)
        {
            return await _chatLogRepository.GetMessageHistoryAsync(chatId);
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
            public string? MediaUrl { get; set; }
            public string Direction { get; set; } = "inbound";
            public DateTime Ts { get; set; } = DateTime.UtcNow;
            public bool IsRead { get; set; }
            public string? Status { get; set; }
            public string? Type { get; set; }
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
            chat.LastMessagePreview = text;
            chat.LastMessageAt = timestamp;
            
            await _chatLogRepository.UpdateAsync(chat);
            
            return (chat, message);
        }
        
        public async Task MarkReadUpToAsync(Guid chatId, DateTime timestamp)
        {
            await _chatLogRepository.MarkReadUpToAsync(chatId, timestamp);
        }
    }
}