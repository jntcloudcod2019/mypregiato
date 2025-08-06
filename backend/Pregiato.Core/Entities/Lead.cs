using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pregiato.Core.Entities
{
    public class Lead
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
        [StringLength(20)]
        public string Phone { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? Company { get; set; }
        
        [StringLength(100)]
        public string? Position { get; set; }
        
        [StringLength(50)]
        public string? Industry { get; set; }
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [StringLength(50)]
        public string Source { get; set; } = "Manual"; // Manual, Website, Meta Ads, Instagram, LinkedIn, etc.
        
        [StringLength(50)]
        public string Status { get; set; } = "Novo"; // Novo, Em Contato, Proposta Enviada, Fechado Ganho, Perdido
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? EstimatedValue { get; set; }
        
        [StringLength(100)]
        public string? AssignedTo { get; set; }
        
        [StringLength(500)]
        public string? Tags { get; set; }
        
        [StringLength(50)]
        public string? Priority { get; set; } = "Média"; // Baixa, Média, Alta
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        public DateTime? LastContactDate { get; set; }
        
        public DateTime? NextFollowUpDate { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Relacionamentos
        public virtual ICollection<LeadInteraction> Interactions { get; set; } = new List<LeadInteraction>();
        public virtual ICollection<CrmTask> Tasks { get; set; } = new List<CrmTask>();
        public virtual ICollection<Contract> Contracts { get; set; } = new List<Contract>();
        
        // Meta Integration
        [StringLength(100)]
        public string? MetaLeadId { get; set; }
        
        [StringLength(100)]
        public string? MetaAdId { get; set; }
        
        [StringLength(100)]
        public string? MetaCampaignId { get; set; }
        
        [StringLength(100)]
        public string? MetaFormId { get; set; }
    }
} 