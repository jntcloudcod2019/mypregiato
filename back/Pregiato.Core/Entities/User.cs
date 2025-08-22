using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities;

public class User
{
    public string Id { get; set; } = string.Empty;
    
    [Required]
    [StringLength(191)]
    public string ClerkId { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    [StringLength(191)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(191)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(191)]
    public string LastName { get; set; } = string.Empty;
    
    [StringLength(191)]
    public string? ImageUrl { get; set; }
    
    [Required]
    [StringLength(20)]
    public string Role { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
} 