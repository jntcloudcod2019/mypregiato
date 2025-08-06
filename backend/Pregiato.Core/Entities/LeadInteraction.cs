using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities
{
    public class LeadInteraction
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid LeadId { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty; // Email, Phone, Meeting, WhatsApp, Instagram, LinkedIn
        
        [Required]
        [StringLength(200)]
        public string Subject { get; set; } = string.Empty;
        
        [StringLength(2000)]
        public string? Description { get; set; }
        
        [StringLength(100)]
        public string? Outcome { get; set; } // Positive, Negative, Neutral, Follow-up Required
        
        [StringLength(100)]
        public string? PerformedBy { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ScheduledDate { get; set; }
        
        public DateTime? CompletedDate { get; set; }
        
        [StringLength(50)]
        public string Status { get; set; } = "Completed"; // Scheduled, Completed, Cancelled
        
        [StringLength(500)]
        public string? Notes { get; set; }
        
        [StringLength(100)]
        public string? Duration { get; set; } // Para reuniões e chamadas
        
        [StringLength(100)]
        public string? Location { get; set; } // Para reuniões presenciais
        
        // Relacionamentos
        public virtual Lead Lead { get; set; } = null!;
    }
} 