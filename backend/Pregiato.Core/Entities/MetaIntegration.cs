using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities
{
    public class MetaIntegration
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Platform { get; set; } = string.Empty; // Facebook, Instagram, WhatsApp Business
        
        [Required]
        [StringLength(200)]
        public string AccessToken { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? PageId { get; set; }
        
        [StringLength(100)]
        public string? BusinessId { get; set; }
        
        [StringLength(100)]
        public string? AppId { get; set; }
        
        [StringLength(100)]
        public string? AppSecret { get; set; }
        
        [StringLength(100)]
        public string? WebhookVerifyToken { get; set; }
        
        [StringLength(500)]
        public string? WebhookUrl { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        public DateTime? LastSyncDate { get; set; }
        
        [StringLength(500)]
        public string? LastError { get; set; }
        
        [StringLength(50)]
        public string Status { get; set; } = "Connected"; // Connected, Disconnected, Error
        
        [StringLength(1000)]
        public string? Permissions { get; set; } // JSON com permissões concedidas
        
        [StringLength(500)]
        public string? RefreshToken { get; set; }
        
        public DateTime? TokenExpiresAt { get; set; }
    }
} 