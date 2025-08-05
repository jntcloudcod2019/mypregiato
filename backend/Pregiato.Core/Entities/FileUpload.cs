using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities;

public class FileUpload
{
    public Guid Id { get; set; }
    
    [Required]
    [StringLength(255)]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(500)]
    public string FilePath { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string ContentType { get; set; } = string.Empty;
    
    [Required]
    public long FileSize { get; set; }
    
    public string? OriginalFileName { get; set; }
    public string? Description { get; set; }
    public string? Tags { get; set; }
    
    // Relacionamentos
    public Guid? TalentId { get; set; }
    public Talent? Talent { get; set; }
    
    public Guid? ContractId { get; set; }
    public Contract? Contract { get; set; }
    
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string? UploadedBy { get; set; }
} 