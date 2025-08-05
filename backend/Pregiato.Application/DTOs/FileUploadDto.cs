namespace Pregiato.Application.DTOs;

public class FileUploadDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? OriginalFileName { get; set; }
    public string? Description { get; set; }
    public string? Tags { get; set; }
    public Guid? TalentId { get; set; }
    public Guid? ContractId { get; set; }
    public DateTime UploadedAt { get; set; }
    public string? UploadedBy { get; set; }
}

public class CreateFileUploadDto
{
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? OriginalFileName { get; set; }
    public string? Description { get; set; }
    public string? Tags { get; set; }
    public Guid? TalentId { get; set; }
    public Guid? ContractId { get; set; }
    public string? UploadedBy { get; set; }
} 