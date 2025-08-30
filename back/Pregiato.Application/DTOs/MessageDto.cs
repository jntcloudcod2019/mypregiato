using Pregiato.Core.Entities;

namespace Pregiato.Application.DTOs
{
    /// <summary>
    /// DTO unificado para todos os tipos de mensagens
    /// Suporta texto, mídia, localização, contatos, etc.
    /// </summary>
    public class MessageDto
    {
        // === CAMPOS OBRIGATÓRIOS ===
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public MessageDirection Direction { get; set; }
        public MessageType Type { get; set; }
        public DateTime CreatedAt { get; set; }
        public MessageStatus Status { get; set; }
        public bool FromMe { get; set; }
        public bool IsGroup { get; set; }

        // === IDENTIFICAÇÃO DO REMETENTE ===
        public string? SenderId { get; set; }
        public string? FromNormalized { get; set; }
        public string? FromOriginal { get; set; }

        // === CONTEÚDO (NULLABLE) ===
        public string? Text { get; set; }  // Renomeado de Body

        // === MÍDIA (NULLABLE) ===
        public string? MediaUrl { get; set; }
        public string? FileName { get; set; }
        public string? MimeType { get; set; }
        public long? Size { get; set; }
        public int? Duration { get; set; }
        public string? Thumbnail { get; set; }

        // === LOCALIZAÇÃO (NULLABLE) ===
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? LocationAddress { get; set; }

        // === CONTATO (NULLABLE) ===
        public string? ContactName { get; set; }
        public string? ContactPhone { get; set; }

        // === METADADOS ===
        public object? Metadata { get; set; }  // JSON deserializado
        public string? ChatId { get; set; }

        // === IDENTIFICADORES EXTERNOS ===
        public string? ExternalMessageId { get; set; }
        public string? ClientMessageId { get; set; }
        public string? WhatsAppMessageId { get; set; }

        // === SISTEMA ===
        public Guid? SessionId { get; set; }
        public string? InternalNote { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // === CAMPOS COMPUTADOS ===
        public bool HasMedia => !string.IsNullOrEmpty(MediaUrl);
        public bool HasLocation => Latitude.HasValue && Longitude.HasValue;
        public bool HasContact => !string.IsNullOrEmpty(ContactName);
        public string TypeDescription => Type.ToString();
        public string Preview => Type switch
        {
            MessageType.Text => Text?.Substring(0, Math.Min(Text.Length, 100)) ?? "",
            MessageType.Image => "📷 Imagem",
            MessageType.Video => "🎬 Vídeo",
            MessageType.Audio => "🎵 Áudio",
            MessageType.Voice => "🎤 Nota de Voz",
            MessageType.Document => $"📄 {FileName ?? "Documento"}",
            MessageType.Sticker => "😀 Figurinha",
            MessageType.Location => $"📍 {LocationAddress ?? "Localização"}",
            MessageType.Contact => $"👤 {ContactName ?? "Contato"}",
            MessageType.System => "⚙️ Sistema",
            _ => "❓ Desconhecido"
        };

        // === COMPATIBILIDADE (DEPRECATED) ===
        [Obsolete("Use Text instead")]
        public string Body 
        { 
            get => Text ?? string.Empty; 
            set => Text = value; 
        }
    }

    /// <summary>
    /// DTO para criação de mensagens de texto
    /// </summary>
    public class CreateTextMessageDto
    {
        public Guid ConversationId { get; set; }
        public string Text { get; set; } = string.Empty;
        public string? ChatId { get; set; }
        public string? FromNormalized { get; set; }
        public bool FromMe { get; set; } = false;
        public bool IsGroup { get; set; } = false;
    }

    /// <summary>
    /// DTO para criação de mensagens com mídia
    /// </summary>
    public class CreateMediaMessageDto
    {
        public Guid ConversationId { get; set; }
        public MessageType Type { get; set; }
        public string? Text { get; set; }  // Legenda
        public string MediaUrl { get; set; } = string.Empty;
        public string? FileName { get; set; }
        public string? MimeType { get; set; }
        public long? Size { get; set; }
        public int? Duration { get; set; }
        public string? Thumbnail { get; set; }
        public string? ChatId { get; set; }
        public string? FromNormalized { get; set; }
        public bool FromMe { get; set; } = false;
        public bool IsGroup { get; set; } = false;
    }

    /// <summary>
    /// DTO para criação de mensagens de localização
    /// </summary>
    public class CreateLocationMessageDto
    {
        public Guid ConversationId { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? LocationAddress { get; set; }
        public string? ChatId { get; set; }
        public string? FromNormalized { get; set; }
        public bool FromMe { get; set; } = false;
        public bool IsGroup { get; set; } = false;
    }

    /// <summary>
    /// DTO para criação de mensagens de contato
    /// </summary>
    public class CreateContactMessageDto
    {
        public Guid ConversationId { get; set; }
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string? ChatId { get; set; }
        public string? FromNormalized { get; set; }
        public bool FromMe { get; set; } = false;
        public bool IsGroup { get; set; } = false;
    }

    /// <summary>
    /// DTO legado para compatibilidade (use os novos CreateXxxMessageDto)
    /// </summary>
    [Obsolete("Use CreateTextMessageDto ou CreateMediaMessageDto")]
    public class CreateMessageDto
    {
        public Guid ConversationId { get; set; }
        public MessageDirection Direction { get; set; }
        public MessageType Type { get; set; } = MessageType.Text;
        public string Body { get; set; } = string.Empty;
        public string? MediaUrl { get; set; }
        public string? FileName { get; set; }
        public string? ClientMessageId { get; set; }
        public string? InternalNote { get; set; }
    }

    public class UpdateMessageDto
    {
        public MessageStatus? Status { get; set; }
        public string? WhatsAppMessageId { get; set; }
        public string? InternalNote { get; set; }
    }

    /// <summary>
    /// DTO para mensagens recebidas do WhatsApp via RabbitMQ
    /// </summary>
    public class WhatsAppIncomingMessageDto
    {
        public string ExternalMessageId { get; set; } = string.Empty;
        public string From { get; set; } = string.Empty;
        public string FromNormalized { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
        public string Type { get; set; } = "text";
        public string Timestamp { get; set; } = string.Empty;
        public string InstanceId { get; set; } = string.Empty;
        public bool FromMe { get; set; }
        public bool IsGroup { get; set; }
        public string? Body { get; set; }
        public string ChatId { get; set; } = string.Empty;
        public WhatsAppAttachmentDto? Attachment { get; set; }
        public WhatsAppLocationDto? Location { get; set; }
        public WhatsAppContactDto? Contact { get; set; }
        public bool Simulated { get; set; } = false;
    }

    public class WhatsAppAttachmentDto
    {
        public string? DataUrl { get; set; }
        public string? MediaUrl { get; set; }
        public string? MimeType { get; set; }
        public string? FileName { get; set; }
        public string? MediaType { get; set; }
        public long? FileSize { get; set; }
        public int? Duration { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
    }

    public class WhatsAppLocationDto
    {
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? Address { get; set; }
    }

    public class WhatsAppContactDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
    }

    /// <summary>
    /// DTO legado para compatibilidade
    /// </summary>
    [Obsolete("Use WhatsAppIncomingMessageDto")]
    public class WhatsAppMessageDto
    {
        public string Id { get; set; } = string.Empty;
        public string From { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Type { get; set; } = "text";
        public string? MediaUrl { get; set; }
        public DateTime Timestamp { get; set; }
    }

    /// <summary>
    /// DTO legado para compatibilidade
    /// </summary>
    [Obsolete("Use CreateTextMessageDto ou CreateMediaMessageDto")]
    public class SendMessageDto
    {
        public string To { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Type { get; set; } = "text";
        public string? MediaUrl { get; set; }
        public string? FileName { get; set; }
        public string? ClientMessageId { get; set; }
    }
} 