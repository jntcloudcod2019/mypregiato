using Pregiato.Core.Entities;

namespace Pregiato.Application.DTOs
{
    public class MessageDto
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public MessageDirection Direction { get; set; }
        public MessageType Type { get; set; }
        public string Body { get; set; } = string.Empty;
        public string? MediaUrl { get; set; }
        public string? FileName { get; set; }
        public string? ClientMessageId { get; set; }
        public string? WhatsAppMessageId { get; set; }
        public MessageStatus Status { get; set; }
        public string? InternalNote { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

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

    public class WhatsAppMessageDto
    {
        public string Id { get; set; } = string.Empty;
        public string From { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Type { get; set; } = "text";
        public string? MediaUrl { get; set; }
        public DateTime Timestamp { get; set; }
    }

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