using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities
{
    public class Contact
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [StringLength(20)]
        public string Phone { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? Email { get; set; }
        
        [StringLength(50)]
        public string? OriginCRM { get; set; }
        
        [StringLength(500)]
        public string? Tags { get; set; }
        
        [StringLength(100)]
        public string? BusinessName { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
                public DateTime? UpdatedAt { get; set; }
        
        // Relacionamentos
        public virtual ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();
    }
} 