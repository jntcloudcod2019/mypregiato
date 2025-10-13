using System;
using System.Collections.Generic;

namespace Pregiato.Core.Entities;

/// <summary>
/// Representa um curso de treinamento
/// </summary>
public class TrainingCourse
{
    public Guid Id { get; set; }
    
    // Informações básicas
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? ThumbnailObjectName { get; set; }
    public string? Category { get; set; }
    public string? Difficulty { get; set; } // Iniciante, Intermediário, Avançado
    public bool IsActive { get; set; } = true;
    
    // Metadados calculados
    public int TotalLessons { get; set; }
    public int TotalDurationMinutes { get; set; }
    
    // Avaliações
    public int TotalLikes { get; set; }
    public int TotalDislikes { get; set; }
    public decimal AverageRating { get; set; }
    
    // Auditoria
    public string CreatedBy { get; set; } = string.Empty; // Clerk User ID
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
    
    // Relacionamentos
    public virtual ICollection<TrainingLesson> Lessons { get; set; } = new List<TrainingLesson>();
    public virtual ICollection<TrainingEnrollment> Enrollments { get; set; } = new List<TrainingEnrollment>();
    public virtual ICollection<TrainingRating> Ratings { get; set; } = new List<TrainingRating>();
}

