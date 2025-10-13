using System;

namespace Pregiato.Core.Entities;

/// <summary>
/// Certificado de conclusão de curso
/// </summary>
public class TrainingCertificate
{
    public Guid Id { get; set; }
    public Guid EnrollmentId { get; set; }
    public Guid CourseId { get; set; }
    public string UserId { get; set; } = string.Empty;
    
    // Dados do certificado
    public string CertificateNumber { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public DateTime CompletionDate { get; set; }
    public decimal TotalHours { get; set; }
    
    // Arquivo no MinIO
    public string? PdfUrl { get; set; }
    public string? PdfObjectName { get; set; }
    public string? HtmlContent { get; set; }
    
    // Validação
    public string ValidationCode { get; set; } = string.Empty;
    public bool IsValid { get; set; } = true;
    
    // Auditoria
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    
    // Relacionamentos
    public virtual TrainingEnrollment Enrollment { get; set; } = null!;
}

