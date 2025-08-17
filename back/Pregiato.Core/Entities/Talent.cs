using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities;

public class Talent
{
    public Guid Id { get; set; }
    
    [StringLength(50)]
    public string? ProducerId { get; set; }
    
    [Required]
    [StringLength(255)]
    public string FullName { get; set; } = string.Empty;
    
    [EmailAddress]
    [StringLength(255)]
    public string? Email { get; set; }
    
    [StringLength(20)]
    public string? Phone { get; set; }
    
    [StringLength(10)]
    public string? Postalcode { get; set; }
    
    [StringLength(255)]
    public string? Street { get; set; }
    
    [StringLength(100)]
    public string? Neighborhood { get; set; }
    
    [StringLength(100)]
    public string? City { get; set; }
    
    [StringLength(20)]
    public string? NumberAddress { get; set; }
    
    [StringLength(255)]
    public string? Complement { get; set; }
    
    [StringLength(2)]
    public string? Uf { get; set; }
    
    [StringLength(20)]
    public string? Document { get; set; }
    
    public DateTime? BirthDate { get; set; }
    
    [Required]
    [Range(0, 150)]
    public int Age { get; set; }
    
    [StringLength(20)]
    public string? Gender { get; set; }
    
    public bool InviteSent { get; set; } = false;
    
    public bool Status { get; set; } = true;
    
    [StringLength(20)]
    public string DnaStatus { get; set; } = "UNDEFINED";
    
    public DateTime? InviteSentAt { get; set; }
    
    [StringLength(255)]
    public string? InviteToken { get; set; }
    
    [StringLength(255)]
    public string? ClerkInviteId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    public virtual TalentDNA? Dna { get; set; }
} 