using System.ComponentModel.DataAnnotations;

namespace Pregiato.Application.DTOs
{
    public class TrainingLessonDto
    {
        public Guid Id { get; set; }
        public Guid CourseId { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        public int OrderIndex { get; set; }
        public string? VideoUrl { get; set; }
        public string? VideoObjectName { get; set; }
        public long? VideoSize { get; set; }
        public int? VideoDurationSeconds { get; set; }
        public string? VideoMimeType { get; set; }
        public string? AttachmentsJson { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // Navegação
        public TrainingCourseDto? Course { get; set; }
        public List<TrainingLessonProgressDto>? ProgressRecords { get; set; }
    }

    public class CreateTrainingLessonDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        public int OrderIndex { get; set; }
        public string? VideoUrl { get; set; }
        public string? VideoObjectName { get; set; }
        public long? VideoSize { get; set; }
        public int? VideoDurationSeconds { get; set; }
        public string? VideoMimeType { get; set; }
        public string? AttachmentsJson { get; set; }
        public bool IsActive { get; set; } = true;
        
        // Campos para upload de vídeo
        public string? VideoBase64Data { get; set; }
        public string? VideoFileName { get; set; }
        public long? VideoFileSize { get; set; }
        public int DurationSeconds { get; set; }
    }

    public class UpdateTrainingLessonDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        public int OrderIndex { get; set; }
        public string? VideoUrl { get; set; }
        public string? VideoObjectName { get; set; }
        public long? VideoSize { get; set; }
        public int? VideoDurationSeconds { get; set; }
        public string? VideoMimeType { get; set; }
        public string? AttachmentsJson { get; set; }
        public bool IsActive { get; set; }
    }
}
