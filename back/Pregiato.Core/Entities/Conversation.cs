using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities
{
    public enum ConversationStatus
    {
        Queued,
        Assigned,
        Closed
    }

    public enum ConversationPriority
    {
        Normal,
        High,
        Urgent
    }

    public class Conversation
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid ContactId { get; set; }
        
        public string? OperatorId { get; set; } // Será o ID do User que é um Operator
        
        [Required]
        [StringLength(20)]
        public string Channel { get; set; } = "whatsapp";
        
        [Required]
        public ConversationStatus Status { get; set; } = ConversationStatus.Queued;
        
        public ConversationPriority Priority { get; set; } = ConversationPriority.Normal;
        
        [StringLength(500)]
        public string? CloseReason { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? AssignedAt { get; set; }
        
        public DateTime? ClosedAt { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
        
        // Concurrency token para evitar duplo aceite
        public byte[] RowVersion { get; set; } = new byte[8];
        
        // Relacionamentos
        public virtual Contact Contact { get; set; } = null!;
        public virtual User? Operator { get; set; } // User com role "OPERATOR"
        public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
        public virtual ICollection<QueueEvent> QueueEvents { get; set; } = new List<QueueEvent>();
    }
} 