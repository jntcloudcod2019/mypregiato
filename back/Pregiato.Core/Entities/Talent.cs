using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities;

public class Talent
{
    public Guid Id { get; set; }
    
    [Required]
    [StringLength(255)]
    public string FullName { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [Range(0, 150)]
    public int Age { get; set; }
    
    [StringLength(20)]
    public string? Document { get; set; }
    
    [StringLength(20)]
    public string? Phone { get; set; }
    
    [StringLength(500)]
    public string? Address { get; set; }
    
    [StringLength(100)]
    public string? City { get; set; }
    
    [StringLength(50)]
    public string? State { get; set; }
    
    [StringLength(10)]
    public string? ZipCode { get; set; }
    
    [StringLength(255)]
    public string? Instagram { get; set; }
    
    [StringLength(255)]
    public string? TikTok { get; set; }
    
    [StringLength(255)]
    public string? YouTube { get; set; }
    
    [StringLength(500)]
    public string? OtherSocialMedia { get; set; }
    
    [StringLength(10)]
    public string? Height { get; set; }
    
    [StringLength(10)]
    public string? Weight { get; set; }
    
    [StringLength(10)]
    public string? Bust { get; set; }
    
    [StringLength(10)]
    public string? Waist { get; set; }
    
    [StringLength(10)]
    public string? Hip { get; set; }
    
    [StringLength(5)]
    public string? ShoeSize { get; set; }
    
    [StringLength(50)]
    public string? HairColor { get; set; }
    
    [StringLength(50)]
    public string? EyeColor { get; set; }
    
    [StringLength(50)]
    public string? SkinTone { get; set; }
    
    [StringLength(100)]
    public string? Ethnicity { get; set; }
    
    [StringLength(100)]
    public string? Nationality { get; set; }
    
    [StringLength(500)]
    public string? Languages { get; set; }
    
    [StringLength(1000)]
    public string? Skills { get; set; }
    
    [StringLength(1000)]
    public string? Experience { get; set; }
    
    [StringLength(500)]
    public string? Availability { get; set; }
    
    [StringLength(500)]
    public string? TravelAvailability { get; set; }
    
    [StringLength(100)]
    public string? Rate { get; set; }
    
    [StringLength(2000)]
    public string? Notes { get; set; }
    
    public bool Status { get; set; } = true;
    
    public bool InviteSent { get; set; } = false;
    
    [StringLength(50)]
    public string? DnaStatus { get; set; } = "UNDEFINED";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
} 