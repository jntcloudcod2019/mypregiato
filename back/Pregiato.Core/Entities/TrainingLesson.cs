using System;
using System.Collections.Generic;

namespace Pregiato.Core.Entities;

/// <summary>
/// Representa uma aula dentro de um curso
/// </summary>
public class TrainingLesson
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    
    // Informações da aula
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OrderIndex { get; set; }
    
    // Vídeo no MinIO
    public string VideoUrl { get; set; } = string.Empty; // URL completa
    public string VideoObjectName { get; set; } = string.Empty; // Caminho no bucket
    public long VideoSize { get; set; } // Bytes
    public int? VideoDurationSeconds { get; set; }
    public string VideoMimeType { get; set; } = "video/mp4";
    
    // Materiais complementares (JSON serializado)
    public string? AttachmentsJson { get; set; }
    
    // Status
    public bool IsActive { get; set; } = true;
    
    // Auditoria
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Relacionamentos
    public virtual TrainingCourse Course { get; set; } = null!;
    public virtual ICollection<TrainingLessonProgress> ProgressRecords { get; set; } = new List<TrainingLessonProgress>();
}

