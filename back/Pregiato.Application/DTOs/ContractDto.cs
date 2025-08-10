namespace Pregiato.Application.DTOs;

public class ContractDto
{
    public Guid Id { get; set; }
    public string ContractType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? TalentName { get; set; }
    public string? TalentEmail { get; set; }
    public string? TalentDocument { get; set; }
    public string? TalentPhone { get; set; }
    public string? TalentAddress { get; set; }
    public string? ContractNumber { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal? Value { get; set; }
    public string? PaymentTerms { get; set; }
    public string? Services { get; set; }
    public string? Conditions { get; set; }
    public string? CompanyName { get; set; }
    public string? CompanyDocument { get; set; }
    public string? CompanyAddress { get; set; }
    public string? CompanyPhone { get; set; }
    public string? CompanyEmail { get; set; }
    public string? PdfPath { get; set; }
    public string? SignedPdfPath { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public Guid? TalentId { get; set; }
    public TalentDto? Talent { get; set; }
}

public class CreateContractDto
{
    public string ContractType { get; set; } = string.Empty;
    public string? TalentName { get; set; }
    public string? TalentEmail { get; set; }
    public string? TalentDocument { get; set; }
    public string? TalentPhone { get; set; }
    public string? TalentAddress { get; set; }
    public string? ContractNumber { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal? Value { get; set; }
    public string? PaymentTerms { get; set; }
    public string? Services { get; set; }
    public string? Conditions { get; set; }
    public string? CompanyName { get; set; }
    public string? CompanyDocument { get; set; }
    public string? CompanyAddress { get; set; }
    public string? CompanyPhone { get; set; }
    public string? CompanyEmail { get; set; }
    public Guid? TalentId { get; set; }
}

public class UpdateContractDto
{
    public string? ContractType { get; set; }
    public string? Status { get; set; }
    public string? TalentName { get; set; }
    public string? TalentEmail { get; set; }
    public string? TalentDocument { get; set; }
    public string? TalentPhone { get; set; }
    public string? TalentAddress { get; set; }
    public string? ContractNumber { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal? Value { get; set; }
    public string? PaymentTerms { get; set; }
    public string? Services { get; set; }
    public string? Conditions { get; set; }
    public string? CompanyName { get; set; }
    public string? CompanyDocument { get; set; }
    public string? CompanyAddress { get; set; }
    public string? CompanyPhone { get; set; }
    public string? CompanyEmail { get; set; }
    public string? PdfPath { get; set; }
    public string? SignedPdfPath { get; set; }
    public Guid? TalentId { get; set; }
}

public class ContractTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}

public class CreateContractTemplateDto
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
    public string? Description { get; set; }
} 