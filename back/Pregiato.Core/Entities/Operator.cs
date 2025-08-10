using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities
{
    public enum OperatorRole
    {
        Agent,
        Supervisor,
        Admin
    }

    public enum OperatorStatus
    {
        Offline,
        Online,
        Busy,
        Away
    }

    public class Operator
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public OperatorRole Role { get; set; } = OperatorRole.Agent;
        
        [Required]
        public OperatorStatus Status { get; set; } = OperatorStatus.Offline;
        
        [StringLength(500)]
        public string? Skills { get; set; }
        
        public int MaxConcurrentConversations { get; set; } = 5;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        public DateTime? LastActivityAt { get; set; }
        
        // Relacionamentos
        public virtual ICollection<Conversation> AssignedConversations { get; set; } = new List<Conversation>();
        public virtual ICollection<QueueEvent> QueueEvents { get; set; } = new List<QueueEvent>();
    }
} 