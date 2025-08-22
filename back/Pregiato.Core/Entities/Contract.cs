using System.ComponentModel.DataAnnotations;
using Pregiato.Core.Enums;

namespace Pregiato.Core.Entities;

public  class Contract
{
    [Key]
    public Guid ContractId { get; set; }

    [Required]
    public string? City { get; set; }

    [Required]
    public string? Uf { get; set; }

    [Required]
    public string? Day { get; set; }
    
    [Required]
    public string? Month { get; set; }

    [Required]
    public string? Year { get; set; }

    [Required]
    public string? DurationContract { get; set; }

    [Required]
    public string? ContractType { get; set; }

    public string? CodProducers { get; set; }
    
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    [Required]
    public decimal Amount { get; set; }
    
    [Required]
    public string? PaymentMethod { get; set; }
    
    [Required]
    public StatusPayment PaymentStatus { get; set; } 
    
    [Required]
    public string ContractFilePath { get; set; } = string.Empty;
    
    [Required]
    public byte[]? Content { get; set; }
       
    [Required]
    public StatusContratc StatusContratc { get; set; } = StatusContratc.Active; 
    
    [Required]
    public Guid? TalentId{ get; set; }

    [Required]
    public string? TalentName { get; set; }

    public Guid? LeadId { get; set; }

    // Relacionamentos
    public virtual Lead? Lead { get; set; }
}

