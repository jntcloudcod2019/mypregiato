using System.ComponentModel.DataAnnotations;

namespace Pregiato.Application.DTOs
{
    public class TrainingVideoUploadDto
    {
        [Required]
        public Guid CourseId { get; set; }
        
        [Required]
        public Guid LessonId { get; set; }
        
        [Required]
        public string FileName { get; set; } = string.Empty;
        
        [Required]
        public string MimeType { get; set; } = string.Empty;
        
        [Required]
        public long FileSize { get; set; }
        
        public string? ChunkId { get; set; }
        public int? ChunkIndex { get; set; }
        public int? TotalChunks { get; set; }
        
        // Campos adicionais para gerar o path correto
        public string? CourseTitle { get; set; }
        public string? LessonTitle { get; set; }
    }

    public class VideoUploadResultDto
    {
        public bool Success { get; set; }
        public string? ObjectName { get; set; }
        public string? VideoUrl { get; set; }
        public string? PresignedUrl { get; set; }
        public string? ErrorMessage { get; set; }
        public long? FileSize { get; set; }
        public string? MimeType { get; set; }
    }

    public class VideoPresignedUrlDto
    {
        [Required]
        public string ObjectName { get; set; } = string.Empty;
        
        [Required]
        public string PresignedUrl { get; set; } = string.Empty;
        
        public DateTime ExpiresAt { get; set; }
        public string? VideoUrl { get; set; }
    }

    public class VideoMetadataDto
    {
        public string ObjectName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string MimeType { get; set; } = string.Empty;
        public int? DurationSeconds { get; set; }
        public string? ThumbnailUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
