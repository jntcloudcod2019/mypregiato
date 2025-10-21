using System.ComponentModel.DataAnnotations;

namespace Pregiato.Application.DTOs
{
    public class TrainingEnrollmentDto
    {
        public Guid Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public Guid CourseId { get; set; }
        
        public DateTime EnrolledAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? LastAccessedAt { get; set; }
        
        public decimal ProgressPercentage { get; set; }
        public int CompletedLessons { get; set; }
        public int TotalTimeWatchedMinutes { get; set; }
        
        public bool CertificateIssued { get; set; }
        public DateTime? CertificateIssuedAt { get; set; }
        public string? CertificateUrl { get; set; }
        public string? CertificateObjectName { get; set; }
        
        // Navegação
        public TrainingCourseDto? Course { get; set; }
        public List<TrainingLessonProgressDto>? LessonProgress { get; set; }
        public List<TrainingCertificateDto>? Certificates { get; set; }
    }

    public class CreateTrainingEnrollmentDto
    {
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public Guid CourseId { get; set; }
    }

    public class UpdateTrainingProgressDto
    {
        [Required]
        public Guid CurrentLessonId { get; set; }
        
        public int TimeWatchedMinutes { get; set; }
    }

    public class UpdateLessonProgressDto
    {
        [Required]
        public Guid LessonId { get; set; }
        
        public int WatchedSeconds { get; set; }
        
        public int LastPositionSeconds { get; set; }
        
        public bool IsCompleted { get; set; }
    }

    public class TrainingProgressSummaryDto
    {
        public Guid CourseId { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public decimal ProgressPercentage { get; set; }
        public int CompletedLessons { get; set; }
        public int TotalLessons { get; set; }
        public int TotalTimeWatchedMinutes { get; set; }
        public DateTime? LastWatchedAt { get; set; }
        public bool IsCompleted { get; set; }
        public bool CertificateIssued { get; set; }
    }
}
