using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pregiato.Core.Entities
{
    public class Campaign
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string? Description { get; set; }
        
        [StringLength(50)]
        public string Type { get; set; } = "Digital"; // Digital, Print, Event, Social Media
        
        [StringLength(50)]
        public string Platform { get; set; } = "Meta"; // Meta, Google, LinkedIn, TikTok, etc.
        
        [StringLength(50)]
        public string Status { get; set; } = "Draft"; // Draft, Active, Paused, Completed, Cancelled
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        public DateTime? StartDate { get; set; }
        
        public DateTime? EndDate { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? Budget { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? Spent { get; set; }
        
        [StringLength(100)]
        public string? AssignedTo { get; set; }
        
        [StringLength(500)]
        public string? TargetAudience { get; set; }
        
        [StringLength(500)]
        public string? Goals { get; set; }
        
        [StringLength(500)]
        public string? KPIs { get; set; }
        
        public int? Impressions { get; set; }
        
        public int? Clicks { get; set; }
        
        public int? Conversions { get; set; }
        
        public decimal? CTR { get; set; } // Click Through Rate
        
        public decimal? CPC { get; set; } // Cost Per Click
        
        public decimal? CPM { get; set; } // Cost Per Mille
        
        public decimal? CPA { get; set; } // Cost Per Acquisition
        
        [StringLength(100)]
        public string? MetaCampaignId { get; set; }
        
        [StringLength(100)]
        public string? MetaAdSetId { get; set; }
        
        [StringLength(100)]
        public string? MetaAdId { get; set; }
        
        [StringLength(500)]
        public string? MetaCreativeUrl { get; set; }
        
        [StringLength(1000)]
        public string? MetaCreativeText { get; set; }
        
        // Relacionamentos
        public virtual ICollection<Lead> GeneratedLeads { get; set; } = new List<Lead>();
    }
} 