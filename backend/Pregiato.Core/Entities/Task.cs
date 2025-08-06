using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities
{
    public class CrmTask
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [StringLength(2000)]
        public string? Description { get; set; }
        
        public Guid? LeadId { get; set; }
        
        [StringLength(100)]
        public string? AssignedTo { get; set; }
        
        [StringLength(50)]
        public string Priority { get; set; } = "Média"; // Baixa, Média, Alta, Urgente
        
        [StringLength(50)]
        public string Status { get; set; } = "Pendente"; // Pendente, Em Andamento, Concluída, Cancelada
        
        [StringLength(50)]
        public string Category { get; set; } = "Geral"; // Follow-up, Proposta, Reunião, Documentação, etc.
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        public DateTime? DueDate { get; set; }
        
        public DateTime? CompletedDate { get; set; }
        
        [StringLength(500)]
        public string? Notes { get; set; }
        
        [StringLength(100)]
        public string? EstimatedDuration { get; set; }
        
        [StringLength(100)]
        public string? ActualDuration { get; set; }
        
        public bool IsRecurring { get; set; } = false;
        
        [StringLength(50)]
        public string? RecurrencePattern { get; set; } // Daily, Weekly, Monthly
        
        public int? RecurrenceInterval { get; set; }
        
        // Relacionamentos
        public virtual Lead? Lead { get; set; }
    }
} 