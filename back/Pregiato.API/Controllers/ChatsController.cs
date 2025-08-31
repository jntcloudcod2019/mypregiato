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
            _logger.LogInformation($"🔍 Buscando mensagens para ID: {id}");
            
            // Primeiro tentar buscar pelo ID do ChatLog
            var chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.Id == id);
            _logger.LogInformation($"📄 Busca por ID do ChatLog: {(chat != null ? "Encontrado" : "Não encontrado")}");
            
            // Se não encontrar, tentar buscar pelo ChatId
            if (chat == null)
            {
                chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.ChatId == id);
                _logger.LogInformation($"📄 Busca por ChatId: {(chat != null ? "Encontrado" : "Não encontrado")}");
            }
            
            // Se ainda não encontrar, tentar buscar pelo número do telefone
            if (chat == null)
            {
                var idString = id.ToString();
                chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.ContactPhoneE164 == idString);
                _logger.LogInformation($"📄 Busca por ContactPhoneE164: {(chat != null ? "Encontrado" : "Não encontrado")}");
            }
            
            if (chat == null) 
            {
                _logger.LogWarning($"❌ Chat não encontrado para ID: {id}");
                return NotFound();
            }
            
            _logger.LogInformation($"✅ Chat encontrado: {chat.Id}, ContactPhoneE164: {chat.ContactPhoneE164}");
            
            try
            {
                // CORREÇÃO: Usar ChatLogService para deserializar o PayloadJson
                var chatLogService = HttpContext.RequestServices.GetRequiredService<ChatLogService>();
                var payload = chatLogService.Deserialize(chat.PayloadJson);
                
                if (payload?.Messages?.Any() == true)
                {
                    _logger.LogInformation($"📊 Mensagens encontradas no PayloadJson: {payload.Messages.Count}");
                    
                    // Converter para o formato que o frontend espera
                    var convertedMessages = new List<object>();
                    
                    foreach (var message in payload.Messages)
                    {
                        var chatMessage = new
                        {
                            id = message.Id,
                            conversationId = chat.Id.ToString(),
                            direction = message.Direction == "inbound" ? "In" : "Out",
                            type = message.Type?.ToLower() ?? "text", // Usar Type real do PayloadJson
                            body = message.body ?? message.Content ?? message.ActualContent ?? "",
                            mediaUrl = message.MediaUrl ?? "",
                            fileName = "",
                            clientMessageId = message.Id,
                            whatsAppMessageId = "",
                            status = "Delivered", // Default
                            internalNote = "",
                            createdAt = message.timestamp ?? message.Ts.ToString("O"),
                            updatedAt = "",
                            
                            // Campos de compatibilidade para o frontend
                            externalMessageId = message.Id,
                            text = message.body ?? message.Content ?? message.ActualContent ?? "",
                            ts = message.timestamp ?? message.Ts.ToString("O"),
                            fromMe = message.Direction == "outbound",
                            
                            // CORREÇÃO: Campos adicionais que o frontend espera
                            timestamp = !string.IsNullOrEmpty(message.timestamp) ? DateTime.Parse(message.timestamp) : message.Ts,
                            isFromMe = message.Direction == "outbound",
                            
                            attachment = (!string.IsNullOrEmpty(message.MediaUrl) || !string.IsNullOrEmpty(message.body)) ? new
                            {
                                // Para áudio/voice, usar body (que contém base64), senão MediaUrl
                                dataUrl = (message.Type == "audio" || message.Type == "voice") && !string.IsNullOrEmpty(message.body) 
                                    ? message.body 
                                    : message.MediaUrl,
                                mimeType = message.mimeType ?? "application/octet-stream",
                                fileName = message.fileName ?? ""
                            } : null
                        };
                        
                        convertedMessages.Add(chatMessage);
                    }
                    
                    _logger.LogInformation($"✅ Retornando {convertedMessages.Count} mensagens convertidas");
                    
                    return Ok(new { 
                        messages = convertedMessages,
                        nextCursor = (long?)null 
                    });
                }
                
                _logger.LogWarning($"⚠️ PayloadJson não contém mensagens válidas");
                return Ok(new { messages = new List<object>(), nextCursor = (long?)null });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Erro ao processar PayloadJson: {chat.PayloadJson}");
                return Ok(new { messages = new List<object>(), nextCursor = (long?)null });
            }
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

            // CORREÇÃO: Buscar por ChatId em vez de Id
            _logger.LogInformation($"🔍 Buscando chat com ChatId: {id}");
            var chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.ChatId == id);
            if (chat == null) 
            {
                _logger.LogWarning($"❌ Chat não encontrado com ChatId: {id}");
                return NotFound();
            }
            _logger.LogInformation($"✅ Chat encontrado: {chat.Id}, ChatId: {chat.ChatId}");

            var (updatedChat, msg) = await _chatService.AddOutboundPendingAsync(chat.Id, req.text, req.clientMessageId, DateTime.UtcNow, 
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
