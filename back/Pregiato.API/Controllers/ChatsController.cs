using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Pregiato.API.Hubs;
using Pregiato.API.Services;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Data;
using Pregiato.Infrastructure.Adapters;
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
        private readonly IMediaStoragePort _minIOStorageAdapter;
        private readonly IHubContext<WhatsAppHub> _hub;
        private readonly RabbitBackgroundService _rabbit;
        private readonly ILogger<ChatsController> _logger;
        private readonly ConversationService _conversationService;

        public ChatsController(IMediaStoragePort minIOStorageAdapter, ChatLogService chatService, PregiatoDbContext db, IHubContext<WhatsAppHub> hub, RabbitBackgroundService rabbit, ILogger<ChatsController> logger, ConversationService conversationService)
        {
            _chatService = chatService;
            _db = db;
            _hub = hub;
            _rabbit = rabbit;
            _logger = logger;
            _conversationService = conversationService;
            _minIOStorageAdapter = minIOStorageAdapter;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? operatorEmail = null)
        {
            (IEnumerable<ChatLog> items, int total) result;
            
            // Se operatorEmail for fornecido, filtrar por operador
            if (!string.IsNullOrWhiteSpace(operatorEmail))
            {
                result = await _chatService.ListByOperatorAsync(operatorEmail, search, Math.Max(page, 1), Math.Clamp(pageSize, 1, 100));
                _logger.LogInformation("📋 Lista filtrada por operador: {Email}, Total: {Total}", operatorEmail, result.total);
            }
            else
            {
                result = await _chatService.ListAsync(search, Math.Max(page, 1), Math.Clamp(pageSize, 1, 100));
                _logger.LogInformation("📋 Lista completa de chats: Total: {Total}", result.total);
            }
            
            // Deduplicar por contato/título no retorno para evitar itens duplicados no front
            var seen = new HashSet<string>();
            var unique = new List<ChatLog>();
            foreach (var c in result.items)
            {
                var key = $"{c.ContactPhoneE164}|{c.Title}";
                if (seen.Add(key)) unique.Add(c);
            }
            return Ok(new { items = unique, total = result.total });
        }

        [HttpGet("{id}/messages")]
        public async Task<IActionResult> GetMessages(string id, [FromQuery] long? cursorTs = null, [FromQuery] int limit = 50)
        {
            _logger.LogInformation($"🔍 Buscando mensagens para ID: {id}");
            ChatLog? chat = null;
            
            // Tentar como GUID primeiro
            if (Guid.TryParse(id, out var guidId))
            {
                chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.Id == guidId);
                _logger.LogInformation($"📄 Busca por GUID ID do ChatLog: {(chat != null ? "Encontrado" : "Não encontrado")}");
                
                // Se não encontrar, tentar buscar pelo ChatId como GUID
                if (chat == null)
                {
                    chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.ChatId == guidId);
                    _logger.LogInformation($"📄 Busca por ChatId como GUID: {(chat != null ? "Encontrado" : "Não encontrado")}");
                }
            }
            
            // Se não for GUID ou não encontrar, tentar buscar pelo número do telefone
            if (chat == null)
            {
                chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.ContactPhoneE164 == id);
                _logger.LogInformation($"📄 Busca por ContactPhoneE164 ({id}): {(chat != null ? "Encontrado" : "Não encontrado")}");
            }
            
            // Se ainda não encontrar, tentar normalizar o número e buscar novamente
            if (chat == null && !string.IsNullOrEmpty(id))
            {
                var normalizedPhone = id.StartsWith("55") ? id : "55" + System.Text.RegularExpressions.Regex.Replace(id, @"\D", "");
                chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.ContactPhoneE164 == normalizedPhone);
                _logger.LogInformation($"📄 Busca por número normalizado ({normalizedPhone}): {(chat != null ? "Encontrado" : "Não encontrado")}");
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
                        // ✅ REMOVIDO: Log de debug de áudio que imprimia base64
                        
                      
                        _logger.LogInformation("🔍 DEBUG TIPO: Original={OriginalType}, Convertido={ConvertedType}", 
                            message.Type, message.Type?.ToLower() ?? "text");
                        
                        var chatMessage = new
                        {
                            id = message.Id,
                            conversationId = chat.Id.ToString(),
                            direction = message.Direction == "outbound" ? "Out" : "In", // ✅ CORREÇÃO: outbound = Out, inbound = In
                            type = !string.IsNullOrEmpty(message.Type) ? message.Type.ToLower() : "text",
                            
                            // DEBUG adicional para tipos
                            _debug_originalType = message.Type,
                            body = message.body ?? "", // ✅ CORREÇÃO: body pode ser texto ou URL do MinIO dependendo do type
                            mediaUrl = message.MediaUrl ?? "",
                            fileName = message.fileName ?? "",
                            clientMessageId = message.Id,
                            whatsAppMessageId = "",
                            status = "Delivered", // Default
                            internalNote = "",
                            createdAt = message.timestamp ?? message.Ts.ToString("O"),
                            updatedAt = "",
                            
                            // Campos de compatibilidade para o frontend
                            externalMessageId = message.Id,
                            text = message.body ?? "", // ✅ CORREÇÃO: text pode ser texto ou URL do MinIO dependendo do type
                            ts = message.timestamp ?? message.Ts.ToString("O"),
                            fromMe = message.Direction == "outbound", // ✅ CORREÇÃO: outbound = true, inbound = false
                            
                            // CORREÇÃO: Campos adicionais que o frontend espera
                            timestamp = !string.IsNullOrEmpty(message.timestamp) ? DateTime.Parse(message.timestamp) : message.Ts,
                            isFromMe = message.Direction == "outbound", // ✅ CORREÇÃO: outbound = true, inbound = false
                            
                            // ✅ ADICIONADO: Campo from para verificação de chat existente
                            from = message.Direction == "inbound" ? $"{message.from}@c.us" : "operator@frontend",
                            
                            // ✅ CORREÇÃO: Attachment baseado no type da mensagem
                            attachment = (message.Type == "image" || message.Type == "video" || message.Type == "document" || message.Type == "audio" || message.Type == "voice") ? new
                            {
                                dataUrl = !string.IsNullOrEmpty(message.MediaUrl) ? message.MediaUrl : message.body, // URL do MinIO ou base64 legado
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
            public ContactDto Contact { get; set; } = new();
            public List<MessageDto> Messages { get; set; } = new();
        }

        public class ContactDto {
            public string Name { get; set; } = string.Empty;
            public string PhoneE164 { get; set; } = string.Empty;
            public string? ProfilePic { get; set; }
        }

        public class MessageDto {
            public string Id { get; set; } = string.Empty;
            public string? Content { get; set; }
            public string body { get; set; } = string.Empty;
            public string? MediaUrl { get; set; }
            public string Direction { get; set; } = string.Empty;
            public string Ts { get; set; } = string.Empty;
            public string timestamp { get; set; } = string.Empty;
            public bool IsRead { get; set; }
            public string Status { get; set; } = string.Empty;
            public string Type { get; set; } = string.Empty;
            public string from { get; set; } = string.Empty;
            public string? mimeType { get; set; }
            public string? fileName { get; set; }
            public int? size { get; set; }
            public int? duration { get; set; }
            public string? thumbnail { get; set; }
            public double? latitude { get; set; }
            public double? longitude { get; set; }
            public string? locationAddress { get; set; }
            public string? contactName { get; set; }
            public string? contactPhone { get; set; }
            public string ActualContent { get; set; } = string.Empty;
            public string ActualTs { get; set; } = string.Empty;
        }

        [HttpPost("{id}/send")]
        public async Task<IActionResult> Send(string id, [FromBody] SendRequest req)
        {
            _logger.LogInformation($"🔍 [DEBUG] Send request recebido: ID={id}, Contact={req?.Contact?.PhoneE164}, Messages={req?.Messages?.Count}");
            
            if (req.Contact == null || req.Messages == null || !req.Messages.Any())
            {
                _logger.LogWarning($"❌ [DEBUG] Validação falhou: Contact={req?.Contact != null}, Messages={req?.Messages?.Count}");
                return BadRequest(new { error = "Contact e Messages são obrigatórios" });
            }

            var message = req.Messages.First();
            _logger.LogInformation($"🔍 [DEBUG] Message details: Id='{message.Id}', Type='{message.Type}', body='{message.body?.Substring(0, Math.Min(50, message.body?.Length ?? 0))}...'");
            
            if (string.IsNullOrWhiteSpace(message.Id))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.Id está vazio: '{message.Id}'");
                return BadRequest(new { error = "Message.Id é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'from' está presente
            if (string.IsNullOrWhiteSpace(message.from))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.from está vazio: '{message.from}'");
                return BadRequest(new { error = "Message.from é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'body' está presente
            if (string.IsNullOrWhiteSpace(message.body))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.body está vazio: '{message.body}'");
                return BadRequest(new { error = "Message.body é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'Type' está presente
            if (string.IsNullOrWhiteSpace(message.Type))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.Type está vazio: '{message.Type}'");
                return BadRequest(new { error = "Message.Type é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'Direction' está presente
            if (string.IsNullOrWhiteSpace(message.Direction))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.Direction está vazio: '{message.Direction}'");
                return BadRequest(new { error = "Message.Direction é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'Status' está presente
            if (string.IsNullOrWhiteSpace(message.Status))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.Status está vazio: '{message.Status}'");
                return BadRequest(new { error = "Message.Status é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'Ts' está presente
            if (string.IsNullOrWhiteSpace(message.Ts))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.Ts está vazio: '{message.Ts}'");
                return BadRequest(new { error = "Message.Ts é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'timestamp' está presente
            if (string.IsNullOrWhiteSpace(message.timestamp))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.timestamp está vazio: '{message.timestamp}'");
                return BadRequest(new { error = "Message.timestamp é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'ActualContent' está presente
            if (string.IsNullOrWhiteSpace(message.ActualContent))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.ActualContent está vazio: '{message.ActualContent}'");
                return BadRequest(new { error = "Message.ActualContent é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'ActualTs' está presente
            if (string.IsNullOrWhiteSpace(message.ActualTs))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.ActualTs está vazio: '{message.ActualTs}'");
                return BadRequest(new { error = "Message.ActualTs é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'contactName' está presente
            if (string.IsNullOrWhiteSpace(message.contactName))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.contactName está vazio: '{message.contactName}'");
                return BadRequest(new { error = "Message.contactName é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'contactPhone' está presente
            if (string.IsNullOrWhiteSpace(message.contactPhone))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.contactPhone está vazio: '{message.contactPhone}'");
                return BadRequest(new { error = "Message.contactPhone é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'IsRead' está presente
            if (!message.IsRead.HasValue)
            {
                _logger.LogWarning($"❌ [DEBUG] Message.IsRead está vazio: '{message.IsRead}'");
                return BadRequest(new { error = "Message.IsRead é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'size' está presente
            if (!message.size.HasValue)
            {
                _logger.LogWarning($"❌ [DEBUG] Message.size está vazio: '{message.size}'");
                return BadRequest(new { error = "Message.size é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'duration' está presente
            if (!message.duration.HasValue)
            {
                _logger.LogWarning($"❌ [DEBUG] Message.duration está vazio: '{message.duration}'");
                return BadRequest(new { error = "Message.duration é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'thumbnail' está presente
            if (string.IsNullOrWhiteSpace(message.thumbnail))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.thumbnail está vazio: '{message.thumbnail}'");
                return BadRequest(new { error = "Message.thumbnail é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'latitude' está presente
            if (!message.latitude.HasValue)
            {
                _logger.LogWarning($"❌ [DEBUG] Message.latitude está vazio: '{message.latitude}'");
                return BadRequest(new { error = "Message.latitude é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'longitude' está presente
            if (!message.longitude.HasValue)
            {
                _logger.LogWarning($"❌ [DEBUG] Message.longitude está vazio: '{message.longitude}'");
                return BadRequest(new { error = "Message.longitude é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'locationAddress' está presente
            if (string.IsNullOrWhiteSpace(message.locationAddress))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.locationAddress está vazio: '{message.locationAddress}'");
                return BadRequest(new { error = "Message.locationAddress é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'mimeType' está presente
            if (string.IsNullOrWhiteSpace(message.mimeType))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.mimeType está vazio: '{message.mimeType}'");
                return BadRequest(new { error = "Message.mimeType é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'fileName' está presente
            if (string.IsNullOrWhiteSpace(message.fileName))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.fileName está vazio: '{message.fileName}'");
                return BadRequest(new { error = "Message.fileName é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'MediaUrl' está presente
            if (string.IsNullOrWhiteSpace(message.MediaUrl))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.MediaUrl está vazio: '{message.MediaUrl}'");
                return BadRequest(new { error = "Message.MediaUrl é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'Content' está presente
            if (string.IsNullOrWhiteSpace(message.Content))
            {
                _logger.LogWarning($"❌ [DEBUG] Message.Content está vazio: '{message.Content}'");
                return BadRequest(new { error = "Message.Content é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'IsRead' está presente
            if (!message.IsRead.HasValue)
            {
                _logger.LogWarning($"❌ [DEBUG] Message.IsRead está vazio: '{message.IsRead}'");
                return BadRequest(new { error = "Message.IsRead é obrigatório" });
            }
            
            // ✅ NOVA VALIDAÇÃO: Verificar se o campo 'IsRead' está presente
            if (!message.IsRead.HasValue)
            {
                _logger.LogWarning($"❌ [DEBUG] Message.IsRead está vazio: '{message.IsRead}'");
                return BadRequest(new { error = "Message.IsRead é obrigatório" });
            }
            
            _logger.LogInformation($"🔍 [DEBUG] Validações básicas passaram. Continuando processamento...");

            ChatLog? chat = null;
            
            // ✅ NOVO FLUXO: Tentar encontrar chat por diferentes métodos
            _logger.LogInformation($"🔍 Buscando chat para ID: {id}");
            
            // 1. Tentar como GUID primeiro
            if (Guid.TryParse(id, out var guidId))
            {
                chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.ChatId == guidId);
                _logger.LogInformation($"📄 Busca por ChatId como GUID: {(chat != null ? "Encontrado" : "Não encontrado")}");
            }
            
            // 2. Se não encontrar, tentar buscar pelo número do telefone
            if (chat == null)
            {
                chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.ContactPhoneE164 == id);
                _logger.LogInformation($"📄 Busca por ContactPhoneE164: {(chat != null ? "Encontrado" : "Não encontrado")}");
            }
            
            // ✅ CORREÇÃO 1: Verificar tipo da mensagem ANTES de criar PayloadJson
            var messageType = message.Type;
            var isMediaMessage = IsMediaType(messageType) || 
                                (!string.IsNullOrEmpty(message.body) && message.body.StartsWith("data:"));
            
            // ✅ Capturar  Para mídia, o body deve conter APENAS o base64
            var messageBody = isMediaMessage ? message.body : message.body; // ✅ Base64 para mídia, texto para texto
            
       
            // ✅ OPÇÃO 1.1: Se chat não existe, criar TODA a estrutura (PRIMEIRA MENSAGEM)
            if (chat == null) 
            {
                _logger.LogInformation($"🆕 Chat não encontrado para ID: {id} - Criando nova estrutura");
                _logger.LogInformation($"🔍 [DEBUG] Dados do contato: PhoneE164={req.Contact.PhoneE164}, Name={req.Contact.Name}");
                
                // Usar dados do PayloadJson
                var normalizedPhone = NormalizePhoneE164Br(req.Contact.PhoneE164);
                var leadName = req.Contact.Name;
                
                _logger.LogInformation($"🔍 [DEBUG] Telefone normalizado: {normalizedPhone} (original: {req.Contact.PhoneE164})");
                
                // Criar Conversation
                var conversation = await _conversationService.GetOrCreateConversationAsync(
                    normalizedPhone, 
                    "frontend", // instanceId diferente do ZapBot
                    false, // isGroup
                    leadName
                );
                
                _logger.LogInformation($"🔍 [DEBUG] Conversa criada/encontrada: Id={conversation.Id}, Phone={conversation.PhoneNumber}");
                
                // Criar ChatLog com PayloadJson ESTRUTURAL
                chat = new ChatLog
                {
                    Id = Guid.NewGuid(),
                    ChatId = conversation.Id, // RELACIONAMENTO CRÍTICO
                    PhoneNumber = normalizedPhone, // ✅ CAMPO PhoneNumber preenchido
                    ContactPhoneE164 = normalizedPhone,
                    Title = leadName,
                    PayloadJson = JsonSerializer.Serialize(new ChatLogService.ChatPayload
                    {
                        Contact = new ChatLogService.ContactInfo
                        {
                            Name = $"Chat com {req.Contact.Name}",
                            PhoneE164 = normalizedPhone,
                            ProfilePic = null
                        },
                        Messages = new List<ChatLogService.MessageInfo>() // Lista vazia inicial
                    }),
                    UnreadCount = 0,
                    LastMessageAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                
                await _db.ChatLogs.AddAsync(chat);
                await _db.SaveChangesAsync();
                
                _logger.LogInformation($"✅ ChatLog criado: {chat.Id} para {normalizedPhone}");
                _logger.LogInformation($"🔍 [DEBUG] ChatLog salvo com sucesso no banco de dados");
            }
            _logger.LogInformation($"✅ Chat encontrado: {chat.Id}, ChatId: {chat.ChatId}");

            // ✅ CORREÇÃO: Processamento robusto de mídia para MinIO
            MediaResultDto? mediaUrl = null;
            var attachment = null as ChatLogService.ChatAttachment;
            
            if (isMediaMessage)
            {
                try
                {
                    _logger.LogInformation($"🎵 Processando mídia - Tipo: {messageType}, Body Length: {message.body?.Length ?? 0}");
                    _logger.LogInformation($"🔍 [DEBUG] Iniciando processamento de mídia para tipo: {messageType}");
                    
                    // ✅ CORREÇÃO: Extrair mimeType do dataUrl corretamente
                    var mimeType = message.mimeType;
                    if (string.IsNullOrEmpty(mimeType) && message.body.StartsWith("data:"))
                    {
                        var dataUrlParts = message.body.Split(',');
                        if (dataUrlParts.Length > 0)
                        {
                            var mimePart = dataUrlParts[0].Replace("data:", "").Split(';')[0]; // Remover parâmetros como codecs
                            mimeType = mimePart;
                            _logger.LogInformation($"🎵 MimeType extraído do dataUrl: {mimeType}");
                        }
                    }
                    
                    // ✅ CORREÇÃO: Definir mimeType padrão baseado no tipo da mensagem
                    if (string.IsNullOrEmpty(mimeType))
                    {
                        mimeType = messageType switch
                        {
                            "audio" or "voice" => "audio/mp3", // ✅ CORREÇÃO: Forçar MP3 para áudio
                            "image" => "image/jpeg",
                            "video" => "video/mp4",
                            _ => "application/octet-stream"
                        };
                        _logger.LogInformation($"🎵 MimeType padrão definido: {mimeType}");
                    }
                    
                    // ✅ CORREÇÃO: Gerar nome de arquivo apropriado
                    var fileName = message.fileName ?? Guid.NewGuid().ToString();
                    if (messageType == "audio" || messageType == "voice")
                    {
                        fileName = fileName.EndsWith(".mp3") ? fileName : $"{Path.GetFileNameWithoutExtension(fileName)}.mp3";
                    }
                    
                    
                    
                    // ✅ NOVO: Fazer upload para MinIO
                    var mediaResult = await _minIOStorageAdapter.StoreMediaAsync(message.body, mimeType, req.Contact.PhoneE164, req.Contact.Name.ToString());
                    mediaUrl = mediaResult;
                    
                    _logger.LogInformation("✅ Mídia enviada para MinIO com sucesso: {MediaUrl}", mediaUrl?.MediaUrl);
                    
                    // ✅ CORREÇÃO: Criar attachment com todos os campos preenchidos
                    attachment = new ChatLogService.ChatAttachment
                    {
                        DataUrl = mediaUrl?.MediaUrl, // ✅ URL da mídia no MinIO
                        MimeType = mimeType,
                        FileName = mediaUrl?.ObjectName,
                        MediaType = messageType
                    };
                    
                    _logger.LogInformation($"✅ Attachment criado: mimeType={mimeType}, fileName={fileName}, url={mediaUrl}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erro ao fazer upload da mídia para MinIO - Tipo: {MessageType}, MimeType: {MimeType}", 
                        messageType, message.mimeType);
                    
                    // ✅ FALLBACK: Continuar sem attachment mas logar o erro
                    mediaUrl = null;
                    attachment = null;
                }
            }

            // ✅ CORREÇÃO: Para TODOS os chats (novos e existentes), atualizar PayloadJson seguindo o mesmo padrão do RabbitBackgroundService
            if (chat != null)
            {
                _logger.LogInformation($"🔄 Atualizando PayloadJson do chat {chat.Id}");
                _logger.LogInformation($"🔍 [DEBUG] Iniciando atualização do PayloadJson para chat: {chat.Id}");
                
                // Deserializar o PayloadJson existente
                var chatLogService = HttpContext.RequestServices.GetRequiredService<ChatLogService>();
                var existingPayload = chatLogService.Deserialize(chat.PayloadJson);
                
                // Garantir que o ContactInfo esteja preenchido
                if (existingPayload.Contact == null)
                {
                    existingPayload.Contact = new ChatLogService.ContactInfo
                    {
                        Name = req.Contact.Name,
                        PhoneE164 = req.Contact.PhoneE164,
                        ProfilePic = req.Contact.ProfilePic
                    };
                }
                
                // ✅ CORREÇÃO: Criar MessageInfo com todos os campos preenchidos corretamente
                var messageInfo = new ChatLogService.MessageInfo
                {
                    Id = message.Id,
                    Content = null, // Campo Content deve ser null conforme padrão
                    body = isMediaMessage ? mediaUrl?.MediaUrl : messageBody, // ✅ Para mídia: URL do MinIO; para texto: conteúdo
                    Direction = "outbound",
                    Ts = DateTime.UtcNow,
                    timestamp = DateTime.UtcNow.ToString("O"), // Campo timestamp principal conforme padrão
                    Status = "pending", // Status inicial como pending para mensagens enviadas
                    Type = message.Type,
                    MediaUrl = isMediaMessage ? mediaUrl?.MediaUrl : null, // ✅ URL da mídia no MinIO
                    IsRead = false, // Campo IsRead conforme padrão
                    from = "operator@frontend", // Campo from conforme padrão
                    
                    // ✅ CORREÇÃO: Campos de mídia preenchidos corretamente
                    mimeType = attachment?.MimeType ?? message.mimeType,
                    fileName = attachment?.FileName ?? message.fileName,
                    size = isMediaMessage && mediaUrl != null ? message.body?.Length : null,
                    
                    // Campos adicionais conforme padrão (inicializados como null)
                    duration = null,
                    thumbnail = null,
                    latitude = null,
                    longitude = null,
                    locationAddress = null,
                    contactName = req.Contact.Name,
                    contactPhone = req.Contact.PhoneE164
                };
                
                _logger.LogInformation($"✅ MessageInfo criada - ID: {messageInfo.Id}, Type: {messageInfo.Type}, " +
                    $"Body: {(messageInfo.body?.Length > 50 ? messageInfo.body.Substring(0, 50) + "..." : messageInfo.body)}, " +
                    $"MediaUrl: {messageInfo.MediaUrl}, MimeType: {messageInfo.mimeType}, FileName: {messageInfo.fileName}");
                
                _logger.LogInformation($"🔍 [DEBUG] MessageInfo criada com sucesso para mensagem: {messageInfo.Id}");
                
                // Verificar se a mensagem já existe (evitar duplicatas)
                var existingMessage = existingPayload.Messages?.FirstOrDefault(m => m.Id == messageInfo.Id);
                if (existingMessage == null)
                {
                    // Adicionar mensagem ao payload existente
                    existingPayload.Messages.Add(messageInfo);
                    
                    _logger.LogInformation($"🔍 [DEBUG] Mensagem adicionada ao payload existente: {messageInfo.Id}");
                    
                    // Ordenar mensagens por timestamp para manter cronologia
                    existingPayload.Messages = existingPayload.Messages
                        .OrderBy(m => DateTime.TryParse(m.timestamp, out var dt) ? dt : DateTime.MinValue)
                        .ToList();
                    
                    // Atualizar o PayloadJson com configuração adequada para base64
                    var jsonOptions = new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = null, // Manter nomes originais das propriedades
                        WriteIndented = false, // JSON compacto
                        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping // Evitar escape excessivo
                    };
                    
                    var newPayloadJson = JsonSerializer.Serialize(existingPayload, jsonOptions);
                    
                    _logger.LogInformation("💾 Atualizando PayloadJson (antes: {OldSize} chars, depois: {NewSize} chars)", 
                        chat.PayloadJson?.Length ?? 0, newPayloadJson.Length);
                    
                    _logger.LogInformation($"🔍 [DEBUG] PayloadJson serializado com sucesso: {newPayloadJson.Length} caracteres");
                    
                    chat.PayloadJson = newPayloadJson;
                    chat.LastMessageAt = DateTime.UtcNow;
                    chat.LastMessagePreview = messageBody?.Length > 200 ? messageBody.Substring(0, 200) : messageBody;
                    
                    await _db.SaveChangesAsync();
                    
                    _logger.LogInformation("✅ ChatLog atualizado com SUCESSO: {ChatLogId} - {MessageCount} mensagens no PayloadJson", 
                        chat.Id, existingPayload.Messages.Count);
                }
                else
                {
                    _logger.LogWarning("⚠️ Mensagem DUPLICADA detectada, ignorando: {MessageId}", messageInfo.Id);
                }
            }
            else
            {
                _logger.LogError("❌ Chat não foi criado nem encontrado. Isso não deveria acontecer.");
                return BadRequest(new { error = "Falha ao criar ou encontrar o chat." });
            }

            await _hub.Clients.Group("whatsapp").SendAsync("message.outbound", new { chatId = chat.Id, message = new { id = message.Id, body = messageBody, type = message.Type } });

            // Publicar para envio via Rabbit
            var payload = _chatService.Deserialize(chat.PayloadJson);
            var to = payload.Contact?.PhoneE164;
            if (string.IsNullOrWhiteSpace(to)) to = chat.ContactPhoneE164;
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
            
            // ✅ NOVA LÓGICA: Tratamento diferenciado para áudio vs outras mídias
            var isAudio = IsAudio(message.Type);
            
            _logger.LogInformation($"🎵 [AUDIO DEBUG] Tipo: {message.Type}, IsAudio: {isAudio}, HasAttachment: {attachment != null}");
            
            // ✅ NOVO: Para mídia, usar URL do MinIO; para texto, usar messageBody
            string? body = isMediaMessage 
                ? mediaUrl?.MediaUrl  // URL da mídia no MinIO
                : (string.IsNullOrWhiteSpace(messageBody) ? null : messageBody);
            
            _logger.LogInformation($"🎵 [AUDIO DEBUG] Body final: {body?.Substring(0, Math.Min(50, body?.Length ?? 0))}...");
            
            // Montagem final do comando
            object? attachmentObj = null;
            
            if (isMediaMessage && attachment != null)
            {
                // ✅ NOVO: Para todas as mídias, attachment contém metadados + URL
                attachmentObj = new
                {
                    mediaUrl = mediaUrl?.MediaUrl, // URL da mídia no MinIO
                    mimeType = attachment.MimeType,
                    fileName = attachment.FileName,
                    mediaType = attachment.MediaType
                };
            }
            
            // ✅ CORREÇÃO: Obter o número conectado do WhatsApp (priorizar do frontend, fallback para RabbitMQ)
            var connectedNumber = message.from; // Número conectado enviado pelo frontend
            
            // Formatar o número conectado no formato esperado pelo ZapBot
            var fromNumber = $"{connectedNumber}@c.us";
            
            var cmd = new
            {
                command = "send_message",
                phone = toNormalized, // ✅ DESTINATÁRIO: Número para onde enviar a mensagem
                to = toNormalized, // Manter para compatibilidade
                from = fromNumber, // ✅ CORREÇÃO: Usar número conectado do WhatsApp
                body = body, // ÁUDIO: data URL aqui | OUTROS: legenda aqui
                type = message.Type,
                clientMessageId = message.Id,
                chatId = chat.ChatId,
                attachment = attachmentObj
            };
            
            _logger.LogInformation($"📤 Enviando mensagem: from={fromNumber} to={toNormalized}");
            
            await _rabbit.PublishAsync("whatsapp.outgoing", cmd);
            
            return Ok(new { success = true, messageId = message.Id });
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
        
        /// <summary>
        /// Verifica se o tipo da mensagem é um tipo de mídia
        /// Usa a mesma lógica do RabbitBackgroundService.GetMessageType
        /// </summary>
        private static bool IsMediaType(string? messageType)
        {
            if (string.IsNullOrEmpty(messageType))
                return false;
                
            return messageType.ToLower() switch
            {
                // Tipos de mídia (conforme RabbitBackgroundService)
                "image" => true,
                "video" => true,
                "audio" => true,
                "voice" => true,
                "document" => true,
                "sticker" => true,
                // Tipos não-mídia
                "text" => false,
                "location" => false,
                "contact" => false,
                "system" => false,
                _ => false
            };
        }

        /// <summary>
        /// Verifica se o tipo da mensagem é áudio ou voice
        /// </summary>
        private static bool IsAudio(string? mediaType) =>
            string.Equals(mediaType, "audio", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(mediaType, "voice", StringComparison.OrdinalIgnoreCase);

        /// <summary>
        /// Constrói um data URL completo a partir do MIME type e base64
        /// </summary>
        private static string BuildDataUrl(string mime, string base64) =>
            $"data:{mime};base64,{base64}";
        
        private static string GetExtensionFromMimeType(string mimeType)
        {
            return mimeType switch
            {
                "audio/webm" => "webm",
                "audio/mpeg" => "mp3",
                "audio/ogg" => "ogg",
                "audio/aac" => "aac",
                "audio/mp4" => "m4a",
                "audio/amr" => "amr",
                "audio/wav" => "wav",
                "image/jpeg" => "jpg",
                "image/png" => "png",
                "image/gif" => "gif",
                "video/mp4" => "mp4",
                "video/webm" => "webm",
                _ => "bin"
            };
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