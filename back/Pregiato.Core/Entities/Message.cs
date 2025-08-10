using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities
{
    public enum MessageDirection
    {
        In,
        Out
    }

    public enum MessageType
    {
        Text,
        Image,
        Audio,
        Document,
        Video
    }

    public enum MessageStatus
    {
        Sending,
        Sent,
        Delivered,
        Read,
        Failed
    }

    public class Message
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid ConversationId { get; set; }
        
        [Required]
        public MessageDirection Direction { get; set; }
        
        [Required]
        public MessageType Type { get; set; } = MessageType.Text;
        
        [Required]
        [StringLength(4000)]
        public string Body { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? MediaUrl { get; set; }
        
        [StringLength(100)]
        public string? FileName { get; set; }
        
        [StringLength(50)]
        public string? ClientMessageId { get; set; }
        
        [StringLength(50)]
        public string? WhatsAppMessageId { get; set; }
        
        [Required]
        public MessageStatus Status { get; set; } = MessageStatus.Sending;
        
        [StringLength(500)]
        public string? InternalNote { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        // Relacionamentos
        public virtual Conversation Conversation { get; set; } = null!;
    }
} 