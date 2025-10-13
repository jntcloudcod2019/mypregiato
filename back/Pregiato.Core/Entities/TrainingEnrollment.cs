using System;
using System.Collections.Generic;

namespace Pregiato.Core.Entities;

/// <summary>
/// Representa a matrícula de um usuário em um curso
/// </summary>
public class TrainingEnrollment
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string UserId { get; set; } = string.Empty; // Clerk User ID
    
    // Timestamps
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? LastAccessedAt { get; set; }
    
    // Progresso
    public decimal ProgressPercentage { get; set; }
    public int CompletedLessons { get; set; }
    public int TotalTimeWatchedMinutes { get; set; }
    
    // Certificado
    public bool CertificateIssued { get; set; }
    public DateTime? CertificateIssuedAt { get; set; }
    public string? CertificateUrl { get; set; }
    public string? CertificateObjectName { get; set; }
    
    // Relacionamentos
    public virtual TrainingCourse Course { get; set; } = null!;
    public virtual ICollection<TrainingLessonProgress> LessonProgress { get; set; } = new List<TrainingLessonProgress>();
    public virtual ICollection<TrainingCertificate> Certificates { get; set; } = new List<TrainingCertificate>();
}

