using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities;

public class TalentDNA
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid TalentId { get; set; }
    
    [StringLength(191)]
    public string? Height { get; set; }
    
    [StringLength(191)]
    public string? Weight { get; set; }
    
    [StringLength(191)]
    public string? HairColor { get; set; }
    
    [StringLength(191)]
    public string? HairType { get; set; }
    
    [StringLength(191)]
    public string? HairLength { get; set; }
    
    [StringLength(191)]
    public string? EyeColor { get; set; }
    
    [StringLength(191)]
    public string? SkinTone { get; set; }
    
    [StringLength(191)]
    public string? ChestSize { get; set; }
    
    [StringLength(191)]
    public string? WaistSize { get; set; }
    
    [StringLength(191)]
    public string? HipSize { get; set; }
    
    [StringLength(191)]
    public string? ShoeSize { get; set; }
    
    [StringLength(191)]
    public string? DressSize { get; set; }
    
    [StringLength(191)]
    public string? PantsSize { get; set; }
    
    [StringLength(191)]
    public string? ShirtSize { get; set; }
    
    [StringLength(191)]
    public string? JacketSize { get; set; }
    
    [StringLength(191)]
    public string? FaceShape { get; set; }
    
    [StringLength(191)]
    public string? EthnicFeatures { get; set; }
    
    [StringLength(191)]
    public string? BodyType { get; set; }
    
    [StringLength(191)]
    public string? SpecialFeatures { get; set; }
    
    [StringLength(191)]
    public string? Accent { get; set; }
    
    [StringLength(191)]
    public string? Languages { get; set; }
    
    [StringLength(191)]
    public string? IntellectualDisability { get; set; }
    
    [StringLength(191)]
    public string? PhysicalDisability { get; set; }
    
    [StringLength(191)]
    public string? Religion { get; set; }
    
    public bool TravelAvailability { get; set; } = false;
    
    [StringLength(191)]
    public string? VisualDisability { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    public virtual Talent Talent { get; set; } = null!;
}
