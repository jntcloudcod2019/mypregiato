using System;

namespace Pregiato.Core.Entities;

/// <summary>
/// Avaliação de um curso por um usuário
/// </summary>
public class TrainingRating
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string UserId { get; set; } = string.Empty;
    
    // Avaliação
    public string RatingType { get; set; } = string.Empty; // "like" ou "dislike"
    public int? Stars { get; set; } // 1-5 (futuro)
    public string? Comment { get; set; }
    
    // Auditoria
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Relacionamentos
    public virtual TrainingCourse Course { get; set; } = null!;
}

