using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pregiato.API.Hubs;
using Pregiato.Application.DTOs.Meta;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;
using System.Text.Json;

namespace Pregiato.Application.Services
{
    /// <summary>
    /// Processador de webhooks da Meta Cloud API
    /// Converte webhooks da Meta para o formato interno do sistema
    /// Reutiliza toda a lógica existente de ProcessIncomingMessage()
    /// </summary>
    public class MetaWebhookProcessor : IMetaWebhookProcessor
    {
        private readonly ILogger<MetaWebhookProcessor> _logger;
        private readonly PregiatoDbContext _db;
        private readonly IHubContext<WhatsAppHub> _hubContext;
        private readonly IMetaAPIClient _metaClient;

        public MetaWebhookProcessor(
            ILogger<MetaWebhookProcessor> logger,
            PregiatoDbContext db,
            IHubContext<WhatsAppHub> hubContext,
            IMetaAPIClient metaClient)
        {
            _logger = logger;
            _db = db;
            _hubContext = hubContext;
            _metaClient = metaClient;
        }

        // ============================================================================
        // PROCESSAMENTO PRINCIPAL DO WEBHOOK
        // ============================================================================

        public async Task ProcessWebhookAsync(MetaWebhookPayload payload)
        {
            try
            {
                _logger.LogInformation("🔄 [META WEBHOOK] Iniciando processamento - Entries: {Count}",
                    payload.Entry?.Count ?? 0);

                if (payload.Entry == null || !payload.Entry.Any())
                {
                    _logger.LogWarning("⚠️ [META WEBHOOK] Payload sem entries");
                    return;
                }

                foreach (var entry in payload.Entry)
                {
                    if (entry.Changes == null || !entry.Changes.Any())
                    {
                        continue;
                    }

                    foreach (var change in entry.Changes)
                    {
                        var value = change.Value;

                        // Processar mensagens recebidas
                        if (value.Messages != null && value.Messages.Any())
                        {
                            _logger.LogInformation("📥 [META WEBHOOK] Processando {Count} mensagens",
                                value.Messages.Count);

                            foreach (var message in value.Messages)
                            {
                                await ProcessInboundMessageAsync(message, value.Metadata);
                            }
                        }

                        // Processar atualizações de status
                        if (value.Statuses != null && value.Statuses.Any())
                        {
                            _logger.LogInformation("📊 [META WEBHOOK] Processando {Count} status updates",
                                value.Statuses.Count);

                            foreach (var status in value.Statuses)
                            {
                                await ProcessMessageStatusAsync(status);
                            }
                        }
                    }
                }

                _logger.LogInformation("✅ [META WEBHOOK] Processamento concluído");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [META WEBHOOK] Erro no processamento do webhook");
                throw;
            }
        }

        // ============================================================================
        // PROCESSAMENTO DE MENSAGENS INBOUND
        // ============================================================================

        public async Task ProcessInboundMessageAsync(
            MetaWebhookMessage message,
            MetaWebhookMetadata metadata)
        {
            try
            {
                _logger.LogInformation("📨 [META] Processando mensagem inbound - From: {From}, Type: {Type}, ID: {Id}",
                    message.From, message.Type, message.Id);

                // ✅ CONVERTER MENSAGEM META PARA FORMATO INTERNO (WhatsAppMessage)
                // Este é o mesmo formato que o RabbitBackgroundService espera
                var whatsappMessage = await ConvertMetaToWhatsAppMessageAsync(message, metadata);

                if (whatsappMessage == null)
                {
                    _logger.LogWarning("⚠️ [META] Falha ao converter mensagem Meta");
                    return;
                }

                // ✅ BUSCAR CHATLOG PARA OBTER CHATID REAL
                var normalizedPhone = NormalizePhoneNumber(message.From);
                
                var chatLog = await _db.ChatLogs
                    .Where(c => c.ContactPhoneE164 == normalizedPhone)
                    .FirstOrDefaultAsync();

                string realChatId = chatLog?.ChatId.ToString() ?? $"chat_{normalizedPhone}";

                _logger.LogInformation("📋 [META] ChatId mapeado - Phone: {Phone} → ChatId: {ChatId}",
                    normalizedPhone, realChatId);

                // ✅ NOTIFICAR FRONTEND VIA SIGNALR (MESMO FORMATO ATUAL)
                await _hubContext.Clients.Group("whatsapp").SendAsync("message.inbound", new
                {
                    chatId = realChatId,
                    fromNormalized = whatsappMessage.fromNormalized,
                    message = new
                    {
                        id = whatsappMessage.externalMessageId,
                        externalMessageId = whatsappMessage.externalMessageId,
                        from = whatsappMessage.from,
                        fromMe = false,
                        body = whatsappMessage.body,
                        type = whatsappMessage.type,
                        timestamp = whatsappMessage.timestamp,
                        attachment = whatsappMessage.attachment
                    }
                });

                _logger.LogInformation("📤 [META] Evento message.inbound emitido via SignalR");

                // ✅ REUTILIZAR LÓGICA EXISTENTE: Salvar no banco
                // TODO: Chamar função ProcessIncomingMessage do RabbitBackgroundService
                // (Requer refatoração para extrair essa lógica para um serviço compartilhado)

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [META] Erro ao processar mensagem inbound");
                throw;
            }
        }

        // ============================================================================
        // PROCESSAMENTO DE STATUS UPDATES
        // ============================================================================

        public async Task ProcessMessageStatusAsync(MetaWebhookStatus status)
        {
            try
            {
                _logger.LogInformation("📊 [META] Processando status update - Message ID: {Id}, Status: {Status}",
                    status.Id, status.Status);

                // Mapear status da Meta para status interno
                var internalStatus = MapMetaStatusToInternal(status.Status);

                _logger.LogDebug("🔄 [META] Status mapeado: {MetaStatus} → {InternalStatus}",
                    status.Status, internalStatus);

                // ✅ ATUALIZAR STATUS NO BANCO
                var message = await _db.Messages
                    .Where(m => m.WhatsAppMessageId == status.Id)
                    .FirstOrDefaultAsync();

                if (message != null)
                {
                    message.Status = internalStatus;
                    message.UpdatedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync();

                    _logger.LogInformation("✅ [META] Status atualizado no banco - Message ID: {Id}",
                        message.Id);

                    // ✅ NOTIFICAR FRONTEND VIA SIGNALR
                    var chatLog = await _db.ChatLogs
                        .Where(c => c.ChatId == message.ConversationId)
                        .FirstOrDefaultAsync();

                    if (chatLog != null)
                    {
                        await _hubContext.Clients.Group("whatsapp").SendAsync("message.status", new
                        {
                            chatId = chatLog.ChatId.ToString(),
                            messageId = message.ClientMessageId ?? message.ExternalMessageId,
                            whatsappMessageId = status.Id,
                            status = internalStatus
                        });

                        _logger.LogInformation("📤 [META] Evento message.status emitido via SignalR");
                    }
                }
                else
                {
                    _logger.LogWarning("⚠️ [META] Mensagem não encontrada no banco - WhatsApp ID: {Id}",
                        status.Id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [META] Erro ao processar status update");
                throw;
            }
        }

        // ============================================================================
        // CONVERSÃO DE MENSAGEM META PARA FORMATO INTERNO
        // ============================================================================

        private async Task<WhatsAppMessage?> ConvertMetaToWhatsAppMessageAsync(
            MetaWebhookMessage message,
            MetaWebhookMetadata metadata)
        {
            try
            {
                var whatsappMessage = new WhatsAppMessage
                {
                    externalMessageId = message.Id,
                    from = message.From,
                    fromNormalized = NormalizePhoneNumber(message.From),
                    to = metadata.DisplayPhoneNumber,
                    type = MapMetaTypeToInternal(message.Type),
                    timestamp = ConvertUnixTimestampToIso(message.Timestamp),
                    fromMe = false,
                    isGroup = false,
                    chatId = $"chat_{NormalizePhoneNumber(message.From)}",
                    body = ExtractMessageBody(message),
                    attachment = null
                };

                // ✅ PROCESSAR MÍDIA SE EXISTIR
                if (message.Type != "text")
                {
                    var mediaData = await ProcessInboundMediaAsync(message);
                    
                    if (mediaData != null)
                    {
                        whatsappMessage.attachment = new WhatsAppAttachment
                        {
                            dataUrl = mediaData.DataUrl,
                            mimeType = mediaData.MimeType,
                            fileName = mediaData.FileName,
                            mediaType = message.Type,
                            fileSize = mediaData.FileSize
                        };

                        // ✅ CRÍTICO: Para áudio, base64 vai para o body também
                        if (message.Type == "audio" || message.Type == "voice")
                        {
                            whatsappMessage.body = mediaData.DataUrl;
                            _logger.LogInformation("🎵 [META] Áudio processado - Base64 adicionado ao body");
                        }
                    }
                }

                _logger.LogInformation("✅ [META] Mensagem convertida com sucesso - ID: {Id}, Type: {Type}",
                    whatsappMessage.externalMessageId, whatsappMessage.type);

                return whatsappMessage;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [META] Erro ao converter mensagem");
                return null;
            }
        }

        // ============================================================================
        // PROCESSAMENTO DE MÍDIA INBOUND
        // ============================================================================

        private async Task<MetaDownloadMediaResult?> ProcessInboundMediaAsync(MetaWebhookMessage message)
        {
            try
            {
                string? mediaId = null;

                // Extrair media ID baseado no tipo
                mediaId = message.Type switch
                {
                    "image" => message.Image?.Id,
                    "audio" => message.Audio?.Id,
                    "voice" => message.Voice?.Id ?? message.Audio?.Id,
                    "video" => message.Video?.Id,
                    "document" => message.Document?.Id,
                    "sticker" => message.Sticker?.Id,
                    _ => null
                };

                if (string.IsNullOrEmpty(mediaId))
                {
                    _logger.LogWarning("⚠️ [META] Mensagem de mídia sem ID - Type: {Type}", message.Type);
                    return null;
                }

                _logger.LogInformation("📥 [META] Baixando mídia - Media ID: {MediaId}, Type: {Type}",
                    mediaId, message.Type);

                // Baixar mídia via Meta API
                var mediaData = await _metaClient.DownloadMediaAsync(mediaId);

                _logger.LogInformation("✅ [META] Mídia baixada - Size: {Size} bytes, MimeType: {MimeType}",
                    mediaData.FileSize, mediaData.MimeType);

                return mediaData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [META] Erro ao processar mídia inbound");
                return null;
            }
        }

        // ============================================================================
        // MÉTODOS AUXILIARES
        // ============================================================================

        /// <summary>
        /// Extrai o corpo da mensagem baseado no tipo
        /// </summary>
        private string ExtractMessageBody(MetaWebhookMessage message)
        {
            return message.Type switch
            {
                "text" => message.Text?.Body ?? string.Empty,
                "image" => message.Image?.Caption ?? string.Empty,
                "video" => message.Video?.Caption ?? string.Empty,
                "audio" => string.Empty, // Áudio não tem texto
                "voice" => string.Empty, // Voice note não tem texto
                "document" => message.Document?.Caption ?? message.Document?.Filename ?? string.Empty,
                "location" => JsonSerializer.Serialize(new
                {
                    latitude = message.Location?.Latitude,
                    longitude = message.Location?.Longitude,
                    name = message.Location?.Name,
                    address = message.Location?.Address
                }),
                "contacts" => message.Contacts != null && message.Contacts.Any()
                    ? message.Contacts[0].Name?.FormattedName ?? string.Empty
                    : string.Empty,
                _ => string.Empty
            };
        }

        /// <summary>
        /// Mapeia tipo da Meta para tipo interno
        /// </summary>
        private string MapMetaTypeToInternal(string metaType)
        {
            return metaType.ToLower() switch
            {
                "text" => "text",
                "image" => "image",
                "audio" => "audio",
                "voice" => "voice", // Meta pode enviar "voice" para notas de voz
                "video" => "video",
                "document" => "document",
                "sticker" => "sticker",
                "location" => "location",
                "contacts" => "contact", // Plural da Meta → singular interno
                _ => "text" // Fallback para texto
            };
        }

        /// <summary>
        /// Mapeia status da Meta para status interno
        /// </summary>
        private string MapMetaStatusToInternal(string metaStatus)
        {
            return metaStatus.ToLower() switch
            {
                "sent" => "sent",
                "delivered" => "delivered",
                "read" => "read",
                "failed" => "failed",
                _ => "sent" // Fallback
            };
        }

        /// <summary>
        /// Normaliza número de telefone (remove caracteres especiais)
        /// </summary>
        private string NormalizePhoneNumber(string phoneNumber)
        {
            // Remover todos os caracteres não numéricos
            var digits = new string(phoneNumber.Where(char.IsDigit).ToArray());

            // Para números brasileiros, garantir código do país
            if (digits.Length == 10 || digits.Length == 11)
            {
                return $"55{digits}"; // Adicionar código do Brasil
            }

            return digits;
        }

        /// <summary>
        /// Converte timestamp Unix (string) para ISO 8601
        /// </summary>
        private string ConvertUnixTimestampToIso(string unixTimestamp)
        {
            try
            {
                if (long.TryParse(unixTimestamp, out var unixSeconds))
                {
                    var dateTime = DateTimeOffset.FromUnixTimeSeconds(unixSeconds).UtcDateTime;
                    return dateTime.ToString("O"); // ISO 8601
                }

                _logger.LogWarning("⚠️ [META] Timestamp inválido: {Timestamp}", unixTimestamp);
                return DateTime.UtcNow.ToString("O");
            }
            catch
            {
                return DateTime.UtcNow.ToString("O");
            }
        }
    }

    // ============================================================================
    // MODELOS INTERNOS (compatibilidade com RabbitBackgroundService)
    // ============================================================================

    /// <summary>
    /// Modelo de mensagem WhatsApp (formato interno do sistema)
    /// IMPORTANTE: Este é o formato que ProcessIncomingMessage() espera
    /// </summary>
    public class WhatsAppMessage
    {
        public string externalMessageId { get; set; } = string.Empty;
        public string from { get; set; } = string.Empty;
        public string fromNormalized { get; set; } = string.Empty;
        public string to { get; set; } = string.Empty;
        public string type { get; set; } = string.Empty;
        public string timestamp { get; set; } = string.Empty;
        public bool fromMe { get; set; }
        public bool isGroup { get; set; }
        public string chatId { get; set; } = string.Empty;
        public string body { get; set; } = string.Empty;
        public WhatsAppAttachment? attachment { get; set; }
    }

    /// <summary>
    /// Modelo de attachment WhatsApp (formato interno)
    /// </summary>
    public class WhatsAppAttachment
    {
        public string? dataUrl { get; set; }
        public string? mediaUrl { get; set; }
        public string mimeType { get; set; } = string.Empty;
        public string fileName { get; set; } = string.Empty;
        public string mediaType { get; set; } = string.Empty;
        public long? fileSize { get; set; }
        public int? duration { get; set; }
        public int? width { get; set; }
        public int? height { get; set; }
        public string? thumbnail { get; set; }
    }
}

