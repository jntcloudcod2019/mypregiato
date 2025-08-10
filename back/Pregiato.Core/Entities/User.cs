using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities;

public class User
{
    public Guid Id { get; set; }
    
    [Required]
    [StringLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(255)]
    public string PasswordHash { get; set; } = string.Empty;
    
    [StringLength(50)]
    public string? Role { get; set; } = "USER";
    
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Propriedades para integração com sistema WhatsApp
    public bool IsOperator { get; set; } = false;
    public string? OperatorStatus { get; set; }
    public string? Skills { get; set; }
    public int MaxConcurrentConversations { get; set; } = 5;
    public DateTime? LastActivityAt { get; set; }
    
    // Relacionamentos
    public virtual ICollection<Conversation> AssignedConversations { get; set; } = new List<Conversation>();
    public virtual ICollection<QueueEvent> QueueEvents { get; set; } = new List<QueueEvent>();
} 