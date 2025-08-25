using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities
{
    public class ChatSession
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid ConversationId { get; set; }
        
        public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ClosedAt { get; set; }
        
        [StringLength(128)]
        public string? OpenedBy { get; set; }
        
        [StringLength(128)]
        public string? ClosedBy { get; set; }
        
        // Relacionamentos
        public virtual Conversation Conversation { get; set; } = null!;
        public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}
