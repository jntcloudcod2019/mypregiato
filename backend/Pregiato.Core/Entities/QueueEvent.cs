using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities
{
    public enum QueueEventType
    {
        Queued,
        Assigned,
        Transferred,
        Closed,
        Reopened
    }

    public class QueueEvent
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid ConversationId { get; set; }
        
        public Guid? OperatorId { get; set; }
        
        [Required]
        public QueueEventType EventType { get; set; }
        
        [StringLength(500)]
        public string? Reason { get; set; }
        
        [StringLength(100)]
        public string? TransferredTo { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Relacionamentos
        public virtual Conversation Conversation { get; set; } = null!;
        public virtual Operator? Operator { get; set; }
    }
} 