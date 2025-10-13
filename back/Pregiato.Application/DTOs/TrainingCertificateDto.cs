using System.ComponentModel.DataAnnotations;

namespace Pregiato.Application.DTOs
{
    public class TrainingCertificateDto
    {
        public Guid Id { get; set; }
        public Guid EnrollmentId { get; set; }
        public Guid CourseId { get; set; }
        public string UserId { get; set; } = string.Empty;
        
        [MaxLength(100)]
        public string CertificateNumber { get; set; } = string.Empty;
        
        [MaxLength(200)]
        public string UserFullName { get; set; } = string.Empty;
        
        [MaxLength(200)]
        public string CourseName { get; set; } = string.Empty;
        
        public DateTime CompletionDate { get; set; }
        public decimal TotalHours { get; set; }
        
        public string? PdfUrl { get; set; }
        public string? PdfObjectName { get; set; }
        public string? HtmlContent { get; set; }
        
        [MaxLength(50)]
        public string ValidationCode { get; set; } = string.Empty;
        
        public bool IsValid { get; set; } = true;
        public DateTime IssuedAt { get; set; }
        
        // Navegação
        public TrainingEnrollmentDto? Enrollment { get; set; }
    }

    public class CreateTrainingCertificateDto
    {
        [Required]
        public Guid EnrollmentId { get; set; }
        
        [Required]
        public Guid CourseId { get; set; }
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string UserFullName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string CourseName { get; set; } = string.Empty;
        
        public DateTime CompletionDate { get; set; }
        public decimal TotalHours { get; set; }
    }

    public class CertificateValidationDto
    {
        [Required]
        [MaxLength(50)]
        public string ValidationCode { get; set; } = string.Empty;
    }

    public class CertificateValidationResultDto
    {
        public bool IsValid { get; set; }
        public string? UserFullName { get; set; }
        public string? CourseName { get; set; }
        public DateTime? CompletionDate { get; set; }
        public decimal? TotalHours { get; set; }
        public DateTime? IssuedAt { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
