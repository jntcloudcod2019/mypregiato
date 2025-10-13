using System.ComponentModel.DataAnnotations;

namespace Pregiato.Application.DTOs
{
    public class TrainingLessonProgressDto
    {
        public Guid Id { get; set; }
        public Guid EnrollmentId { get; set; }
        public Guid LessonId { get; set; }
        
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int WatchedSeconds { get; set; }
        public int LastPositionSeconds { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? LastWatchedAt { get; set; }
        public int WatchCount { get; set; }
        
        // Navegação
        public TrainingEnrollmentDto? Enrollment { get; set; }
        public TrainingLessonDto? Lesson { get; set; }
    }

    public class UpdateLessonProgressDto
    {
        [Required]
        public Guid LessonId { get; set; }
        
        public int WatchedSeconds { get; set; }
        public int LastPositionSeconds { get; set; }
        public bool IsCompleted { get; set; }
    }

    public class LessonProgressSummaryDto
    {
        public Guid LessonId { get; set; }
        public string LessonTitle { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int WatchedSeconds { get; set; }
        public int TotalDurationSeconds { get; set; }
        public decimal WatchPercentage { get; set; }
        public DateTime? LastWatchedAt { get; set; }
        public int WatchCount { get; set; }
    }
}
