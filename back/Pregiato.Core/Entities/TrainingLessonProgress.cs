using System;

namespace Pregiato.Core.Entities;

/// <summary>
/// Rastreia o progresso de uma aula específica
/// </summary>
[Table("TrainingLessonProgress")]
public class TrainingLessonProgress
{
    public Guid Id { get; set; }
    public Guid EnrollmentId { get; set; }
    public Guid LessonId { get; set; }
    
    // Progresso
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int WatchedSeconds { get; set; }
    public int LastPositionSeconds { get; set; }
    
    // Tracking
    public DateTime? StartedAt { get; set; }
    public DateTime? LastWatchedAt { get; set; }
    public int WatchCount { get; set; }
    
    // Relacionamentos
    public virtual TrainingEnrollment Enrollment { get; set; } = null!;
    public virtual TrainingLesson Lesson { get; set; } = null!;
}

