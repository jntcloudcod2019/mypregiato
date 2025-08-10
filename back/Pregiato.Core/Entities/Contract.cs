using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities;

public class Contract
{
    public Guid Id { get; set; }
    
    [Required]
    [StringLength(50)]
    public string ContractType { get; set; } = string.Empty;
    
    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "DRAFT";
    
    // Dados do talento
    public string? TalentName { get; set; }
    public string? TalentEmail { get; set; }
    public string? TalentDocument { get; set; }
    public string? TalentPhone { get; set; }
    public string? TalentAddress { get; set; }
    
    // Dados do contrato
    public string? ContractNumber { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal? Value { get; set; }
    public string? PaymentTerms { get; set; }
    public string? Services { get; set; }
    public string? Conditions { get; set; }
    
    // Dados da empresa
    public string? CompanyName { get; set; }
    public string? CompanyDocument { get; set; }
    public string? CompanyAddress { get; set; }
    public string? CompanyPhone { get; set; }
    public string? CompanyEmail { get; set; }
    
    // Arquivos
    public string? PdfPath { get; set; }
    public string? SignedPdfPath { get; set; }
    
    // Metadados
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    
    // Relacionamentos
    public Guid? TalentId { get; set; }
    public Talent? Talent { get; set; }
} 