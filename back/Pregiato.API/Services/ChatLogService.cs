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

        /// <summary>
        /// Lista chats filtrados por operador com base nos leads alocados
        /// </summary>
        public async Task<(IEnumerable<ChatLog> items, int total)> ListByOperatorAsync(string operatorEmail, string? search, int page, int pageSize)
        {
            return await _chatLogRepository.GetByOperatorAsync(operatorEmail, search, page, pageSize);
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
            public string? body { get; set; } // Campo real do JSON - para áudio contém base64
            public string? MediaUrl { get; set; }
            public string Direction { get; set; } = "inbound";
            public DateTime Ts { get; set; } = DateTime.UtcNow;
            public string? timestamp { get; set; } // Campo real do JSON
            public bool IsRead { get; set; }
            public string? Status { get; set; }
            public string? Type { get; set; }
            public string? from { get; set; } // Campo real do JSON
            
            // === CAMPOS DE MÍDIA (conforme exemplo JSON) ===
            public string? mimeType { get; set; }        // "audio/mpeg", "image/jpeg", etc
            public string? fileName { get; set; }        // "audio-message.mp3", "image.jpg"
            public long? size { get; set; }              // Tamanho do arquivo em bytes
            public int? duration { get; set; }           // Duração em segundos (para áudio/vídeo)
            public string? thumbnail { get; set; }       // Base64 da thumbnail (para vídeo/imagem)
            
            // === CAMPOS DE LOCALIZAÇÃO ===
            public double? latitude { get; set; }        // Coordenada de latitude
            public double? longitude { get; set; }       // Coordenada de longitude
            public string? locationAddress { get; set; }  // Endereço da localização
            
            // === CAMPOS DE CONTATO ===
            public string? contactName { get; set; }     // Nome do contato compartilhado
            public string? contactPhone { get; set; }    // Telefone do contato compartilhado
            
            // Propriedades calculadas para compatibilidade
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
            if (string.IsNullOrWhiteSpace(json) || json == "{}")
            {
                _logger.LogInformation("PayloadJson vazio - criando estrutura inicial");
                return new ChatPayload();
            }
            
            try
            {
                // Tentar deserializar no formato novo primeiro
                var newFormat = JsonSerializer.Deserialize<ChatPayload>(json);
                if (newFormat?.Contact != null || newFormat?.Messages?.Any() == true)
                {
                    _logger.LogInformation("PayloadJson no formato NOVO detectado: {MessageCount} mensagens", 
                        newFormat.Messages?.Count ?? 0);
                    return newFormat;
                }
                
                // Se não funcionou, tentar formato antigo { "messages": [...] }
                _logger.LogWarning("PayloadJson no formato ANTIGO detectado - convertendo para novo formato");
                
                var legacyFormat = JsonSerializer.Deserialize<LegacyPayload>(json);
                if (legacyFormat?.messages?.Any() == true)
                {
                    var convertedPayload = new ChatPayload
                    {
                        Contact = new ContactInfo
                        {
                            Name = "Cliente Migrado",
                            PhoneE164 = "N/A", // Será preenchido pelo processo principal
                            ProfilePic = null
                        },
                        Messages = legacyFormat.messages.Select(ConvertLegacyMessage).ToList()
                    };
                    
                    _logger.LogInformation("Convertidas {Count} mensagens do formato antigo para novo", 
                        convertedPayload.Messages.Count);
                    
                    return convertedPayload;
                }
                
                _logger.LogWarning("PayloadJson não reconhecido - criando estrutura nova");
                return new ChatPayload();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao deserializar payload de chat: {Json}", 
                    json?.Length > 200 ? json.Substring(0, 200) + "..." : json);
                return new ChatPayload();
            }
        }
        
        // Classe para suportar formato antigo
        public class LegacyPayload
        {
            public List<LegacyMessage>? messages { get; set; }
        }
        
        public class LegacyMessage
        {
            public string? id { get; set; }
            public string? type { get; set; }
            public string? body { get; set; }
            public string? text { get; set; }
            public string? mediaUrl { get; set; }
            public string? direction { get; set; }
            public string? ts { get; set; }
            public string? timestamp { get; set; }
            public string? status { get; set; }
            public bool fromMe { get; set; }
            public LegacyAttachment? attachment { get; set; }
        }
        
        public class LegacyAttachment
        {
            public string? dataUrl { get; set; }
            public string? mimeType { get; set; }
            public string? fileName { get; set; }
        }
        
        private MessageInfo ConvertLegacyMessage(LegacyMessage legacy)
        {
            return new MessageInfo
            {
                Id = legacy.id ?? Guid.NewGuid().ToString(),
                Content = null, // ✅ CORREÇÃO: Campo Content deve ser null
                body = legacy.body ?? legacy.text ?? "", // ✅ CORREÇÃO: Apenas body recebe conteúdo
                MediaUrl = legacy.mediaUrl,
                Direction = legacy.fromMe ? "outbound" : "inbound", 
                Ts = DateTime.TryParse(legacy.ts ?? legacy.timestamp, out var dt) ? dt : DateTime.UtcNow,
                timestamp = legacy.timestamp ?? legacy.ts ?? DateTime.UtcNow.ToString("O"),
                IsRead = false,
                Status = legacy.status ?? "delivered",
                Type = legacy.type,
                from = "legacy@converted",
                
                // Campos de mídia do attachment
                mimeType = legacy.attachment?.mimeType,
                fileName = legacy.attachment?.fileName
            };
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
                Content = null, // ✅ CORREÇÃO: Campo Content deve ser null conforme padrão
                body = text, // ✅ Campo body principal conforme padrão
                Direction = "outbound",
                Ts = timestamp, // ✅ Manter Ts para compatibilidade
                timestamp = timestamp.ToString("O"), // ✅ Campo timestamp principal conforme padrão
                Status = "pending", // ✅ Status inicial como pending para mensagens enviadas
                Type = attachment != null ? attachment.MediaType : "text",
                MediaUrl = null, // ✅ CORREÇÃO: Campo MediaUrl deve ser null, apenas body recebe conteúdo
                IsRead = false, // ✅ Campo IsRead conforme padrão
                from = "operator@frontend", // ✅ Campo from conforme padrão
                
                // ✅ CAMPOS DE MÍDIA CONFORME PADRÃO
                mimeType = attachment?.MimeType,
                fileName = attachment?.FileName,
                size = attachment?.DataUrl != null ? (long)(attachment.DataUrl.Length * 0.75) : null, // ✅ Tamanho aproximado do base64
                
                // ✅ CAMPOS ADICIONAIS CONFORME PADRÃO (inicializados como null)
                duration = null,
                thumbnail = null,
                latitude = null,
                longitude = null,
                locationAddress = null,
                contactName = null,
                contactPhone = null
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