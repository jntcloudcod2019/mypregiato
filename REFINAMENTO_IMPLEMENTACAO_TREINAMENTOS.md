# 🎯 REFINAMENTO DE IMPLEMENTAÇÃO - MÓDULO DE TREINAMENTOS
## Sistema Pregiato - Modelo Moderno Integrado com API

---

## 📋 **ÍNDICE**

1. [Fase 1: Entidades e Migrations](#fase-1)
2. [Fase 2: DTOs e Validators](#fase-2)
3. [Fase 3: Repositories](#fase-3)
4. [Fase 4: Services](#fase-4)
5. [Fase 5: Controllers](#fase-5)
6. [Fase 6: Frontend Integration](#fase-6)
7. [Fase 7: Testes](#fase-7)

---

<a name="fase-1"></a>
## 🏗️ **FASE 1: ENTIDADES E MIGRATIONS**

### **1.1 - Criar Entidades no Core**

#### **Arquivo: `back/Pregiato.Core/Entities/TrainingCourse.cs`**

```csharp
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
```

#### **Arquivo: `back/Pregiato.Core/Entities/TrainingLesson.cs`**

```csharp
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
```

#### **Arquivo: `back/Pregiato.Core/Entities/TrainingEnrollment.cs`**

```csharp
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
}
```

#### **Arquivo: `back/Pregiato.Core/Entities/TrainingLessonProgress.cs`**

```csharp
using System;

namespace Pregiato.Core.Entities;

/// <summary>
/// Rastreia o progresso de uma aula específica
/// </summary>
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
```

#### **Arquivo: `back/Pregiato.Core/Entities/TrainingRating.cs`**

```csharp
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
```

#### **Arquivo: `back/Pregiato.Core/Entities/TrainingCertificate.cs`**

```csharp
using System;

namespace Pregiato.Core.Entities;

/// <summary>
/// Certificado de conclusão de curso
/// </summary>
public class TrainingCertificate
{
    public Guid Id { get; set; }
    public Guid EnrollmentId { get; set; }
    public Guid CourseId { get; set; }
    public string UserId { get; set; } = string.Empty;
    
    // Dados do certificado
    public string CertificateNumber { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public DateTime CompletionDate { get; set; }
    public decimal TotalHours { get; set; }
    
    // Arquivo no MinIO
    public string? PdfUrl { get; set; }
    public string? PdfObjectName { get; set; }
    public string? HtmlContent { get; set; }
    
    // Validação
    public string ValidationCode { get; set; } = string.Empty;
    public bool IsValid { get; set; } = true;
    
    // Auditoria
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    
    // Relacionamentos
    public virtual TrainingEnrollment Enrollment { get; set; } = null!;
}
```

### **1.2 - Atualizar DbContext**

#### **Arquivo: `back/Pregiato.Infrastructure/Data/PregiatoDbContext.cs`**

```csharp
// Adicionar DbSets
public DbSet<TrainingCourse> TrainingCourses { get; set; }
public DbSet<TrainingLesson> TrainingLessons { get; set; }
public DbSet<TrainingEnrollment> TrainingEnrollments { get; set; }
public DbSet<TrainingLessonProgress> TrainingLessonProgress { get; set; }
public DbSet<TrainingRating> TrainingRatings { get; set; }
public DbSet<TrainingCertificate> TrainingCertificates { get; set; }

// Adicionar no OnModelCreating
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    
    // ... código existente ...
    
    // === CONFIGURAÇÃO DO MÓDULO DE TREINAMENTOS ===
    
    // TrainingCourse
    modelBuilder.Entity<TrainingCourse>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).ValueGeneratedOnAdd();
        
        entity.Property(e => e.Title)
            .IsRequired()
            .HasMaxLength(200);
        
        entity.Property(e => e.Description)
            .IsRequired()
            .HasColumnType("LONGTEXT");
        
        entity.Property(e => e.ThumbnailUrl)
            .HasMaxLength(500);
        
        entity.Property(e => e.ThumbnailObjectName)
            .HasMaxLength(500);
        
        entity.Property(e => e.Category)
            .HasMaxLength(100);
        
        entity.Property(e => e.Difficulty)
            .HasMaxLength(50);
        
        entity.Property(e => e.CreatedBy)
            .IsRequired()
            .HasMaxLength(100);
        
        entity.Property(e => e.CreatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        
        entity.Property(e => e.UpdatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        
        entity.Property(e => e.DeletedAt)
            .HasColumnType("datetime");
        
        entity.Property(e => e.AverageRating)
            .HasColumnType("decimal(3,2)");
        
        entity.HasIndex(e => e.CreatedBy);
        entity.HasIndex(e => e.Category);
        entity.HasIndex(e => e.IsActive);
    });
    
    // TrainingLesson
    modelBuilder.Entity<TrainingLesson>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).ValueGeneratedOnAdd();
        
        entity.Property(e => e.Title)
            .IsRequired()
            .HasMaxLength(200);
        
        entity.Property(e => e.Description)
            .HasColumnType("LONGTEXT");
        
        entity.Property(e => e.VideoUrl)
            .IsRequired()
            .HasMaxLength(500);
        
        entity.Property(e => e.VideoObjectName)
            .IsRequired()
            .HasMaxLength(500);
        
        entity.Property(e => e.VideoMimeType)
            .HasMaxLength(100);
        
        entity.Property(e => e.AttachmentsJson)
            .HasColumnType("LONGTEXT");
        
        entity.Property(e => e.CreatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        
        entity.Property(e => e.UpdatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        
        entity.HasOne(e => e.Course)
            .WithMany(c => c.Lessons)
            .HasForeignKey(e => e.CourseId)
            .OnDelete(DeleteBehavior.Cascade);
        
        entity.HasIndex(e => e.CourseId);
        entity.HasIndex(e => e.OrderIndex);
    });
    
    // TrainingEnrollment
    modelBuilder.Entity<TrainingEnrollment>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).ValueGeneratedOnAdd();
        
        entity.Property(e => e.UserId)
            .IsRequired()
            .HasMaxLength(100);
        
        entity.Property(e => e.ProgressPercentage)
            .HasColumnType("decimal(5,2)");
        
        entity.Property(e => e.CertificateUrl)
            .HasMaxLength(500);
        
        entity.Property(e => e.CertificateObjectName)
            .HasMaxLength(500);
        
        entity.Property(e => e.EnrolledAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        
        entity.Property(e => e.StartedAt)
            .HasColumnType("datetime");
        
        entity.Property(e => e.CompletedAt)
            .HasColumnType("datetime");
        
        entity.Property(e => e.LastAccessedAt)
            .HasColumnType("datetime");
        
        entity.Property(e => e.CertificateIssuedAt)
            .HasColumnType("datetime");
        
        entity.HasOne(e => e.Course)
            .WithMany(c => c.Enrollments)
            .HasForeignKey(e => e.CourseId)
            .OnDelete(DeleteBehavior.Cascade);
        
        entity.HasIndex(e => e.UserId);
        entity.HasIndex(e => e.CourseId);
        entity.HasIndex(e => new { e.UserId, e.CourseId }).IsUnique();
    });
    
    // TrainingLessonProgress
    modelBuilder.Entity<TrainingLessonProgress>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).ValueGeneratedOnAdd();
        
        entity.Property(e => e.CompletedAt)
            .HasColumnType("datetime");
        
        entity.Property(e => e.StartedAt)
            .HasColumnType("datetime");
        
        entity.Property(e => e.LastWatchedAt)
            .HasColumnType("datetime");
        
        entity.HasOne(e => e.Enrollment)
            .WithMany(en => en.LessonProgress)
            .HasForeignKey(e => e.EnrollmentId)
            .OnDelete(DeleteBehavior.Cascade);
        
        entity.HasOne(e => e.Lesson)
            .WithMany(l => l.ProgressRecords)
            .HasForeignKey(e => e.LessonId)
            .OnDelete(DeleteBehavior.Cascade);
        
        entity.HasIndex(e => e.EnrollmentId);
        entity.HasIndex(e => new { e.EnrollmentId, e.LessonId }).IsUnique();
    });
    
    // TrainingRating
    modelBuilder.Entity<TrainingRating>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).ValueGeneratedOnAdd();
        
        entity.Property(e => e.UserId)
            .IsRequired()
            .HasMaxLength(100);
        
        entity.Property(e => e.RatingType)
            .IsRequired()
            .HasMaxLength(20);
        
        entity.Property(e => e.Comment)
            .HasColumnType("LONGTEXT");
        
        entity.Property(e => e.CreatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        
        entity.Property(e => e.UpdatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        
        entity.HasOne(e => e.Course)
            .WithMany(c => c.Ratings)
            .HasForeignKey(e => e.CourseId)
            .OnDelete(DeleteBehavior.Cascade);
        
        entity.HasIndex(e => e.CourseId);
        entity.HasIndex(e => e.UserId);
        entity.HasIndex(e => new { e.UserId, e.CourseId }).IsUnique();
    });
    
    // TrainingCertificate
    modelBuilder.Entity<TrainingCertificate>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).ValueGeneratedOnAdd();
        
        entity.Property(e => e.UserId)
            .IsRequired()
            .HasMaxLength(100);
        
        entity.Property(e => e.CertificateNumber)
            .IsRequired()
            .HasMaxLength(50);
        
        entity.Property(e => e.UserFullName)
            .IsRequired()
            .HasMaxLength(200);
        
        entity.Property(e => e.CourseName)
            .IsRequired()
            .HasMaxLength(200);
        
        entity.Property(e => e.TotalHours)
            .HasColumnType("decimal(5,2)");
        
        entity.Property(e => e.PdfUrl)
            .HasMaxLength(500);
        
        entity.Property(e => e.PdfObjectName)
            .HasMaxLength(500);
        
        entity.Property(e => e.HtmlContent)
            .HasColumnType("LONGTEXT");
        
        entity.Property(e => e.ValidationCode)
            .IsRequired()
            .HasMaxLength(100);
        
        entity.Property(e => e.CompletionDate)
            .HasColumnType("datetime");
        
        entity.Property(e => e.IssuedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        
        entity.HasOne(e => e.Enrollment)
            .WithMany()
            .HasForeignKey(e => e.EnrollmentId);
        
        entity.HasIndex(e => e.CertificateNumber).IsUnique();
        entity.HasIndex(e => e.ValidationCode).IsUnique();
        entity.HasIndex(e => e.UserId);
    });
}
```

### **1.3 - Criar Migration**

```bash
# No terminal, dentro da pasta back/
cd /Users/worldgames/Documents/PREGIATO/My_pregiato\ /mypregiato/back

# Criar migration
dotnet ef migrations add AddTrainingModule \
  --project Pregiato.Infrastructure \
  --startup-project Pregiato.API \
  --output-dir Migrations

# Aplicar migration em desenvolvimento
dotnet ef database update \
  --project Pregiato.Infrastructure \
  --startup-project Pregiato.API
```

---

<a name="fase-2"></a>
## 📝 **FASE 2: DTOs E VALIDATORS**

### **2.1 - DTOs de Curso**

#### **Arquivo: `back/Pregiato.Application/DTOs/Training/CourseDto.cs`**

```csharp
namespace Pregiato.Application.DTOs.Training;

public class CourseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? Category { get; set; }
    public string? Difficulty { get; set; }
    public bool IsActive { get; set; }
    public int TotalLessons { get; set; }
    public int TotalDurationMinutes { get; set; }
    public int TotalLikes { get; set; }
    public int TotalDislikes { get; set; }
    public decimal AverageRating { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Dados do enrollment (se o usuário estiver matriculado)
    public EnrollmentStatusDto? UserEnrollment { get; set; }
}

public class EnrollmentStatusDto
{
    public Guid EnrollmentId { get; set; }
    public decimal ProgressPercentage { get; set; }
    public int CompletedLessons { get; set; }
    public DateTime? LastAccessedAt { get; set; }
    public bool CertificateIssued { get; set; }
}
```

#### **Arquivo: `back/Pregiato.Application/DTOs/Training/CreateCourseDto.cs`**

```csharp
namespace Pregiato.Application.DTOs.Training;

public class CreateCourseDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? Difficulty { get; set; }
    public IFormFile? ThumbnailFile { get; set; }
}

public class UpdateCourseDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? Difficulty { get; set; }
    public bool? IsActive { get; set; }
    public IFormFile? ThumbnailFile { get; set; }
}
```

### **2.2 - DTOs de Aula**

#### **Arquivo: `back/Pregiato.Application/DTOs/Training/LessonDto.cs`**

```csharp
namespace Pregiato.Application.DTOs.Training;

public class LessonDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OrderIndex { get; set; }
    public string VideoUrl { get; set; } = string.Empty;
    public long VideoSize { get; set; }
    public int? VideoDurationSeconds { get; set; }
    public string VideoMimeType { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Progresso do usuário (se estiver matriculado)
    public LessonProgressDto? UserProgress { get; set; }
}

public class LessonProgressDto
{
    public bool IsCompleted { get; set; }
    public int WatchedSeconds { get; set; }
    public int LastPositionSeconds { get; set; }
    public DateTime? LastWatchedAt { get; set; }
}
```

#### **Arquivo: `back/Pregiato.Application/DTOs/Training/CreateLessonDto.cs`**

```csharp
namespace Pregiato.Application.DTOs.Training;

public class CreateLessonDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OrderIndex { get; set; }
    public IFormFile VideoFile { get; set; } = null!;
}

public class UpdateLessonDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int? OrderIndex { get; set; }
    public bool? IsActive { get; set; }
    public IFormFile? VideoFile { get; set; }
}
```

### **2.3 - DTOs de Progresso**

#### **Arquivo: `back/Pregiato.Application/DTOs/Training/ProgressDto.cs`**

```csharp
namespace Pregiato.Application.DTOs.Training;

public class UpdateProgressDto
{
    public int WatchedSeconds { get; set; }
    public int LastPositionSeconds { get; set; }
}

public class CompleteProgressDto
{
    public Guid EnrollmentId { get; set; }
    public Guid LessonId { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
}
```

### **2.4 - DTOs de Certificado**

#### **Arquivo: `back/Pregiato.Application/DTOs/Training/CertificateDto.cs`**

```csharp
namespace Pregiato.Application.DTOs.Training;

public class CertificateDto
{
    public Guid Id { get; set; }
    public string CertificateNumber { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public DateTime CompletionDate { get; set; }
    public decimal TotalHours { get; set; }
    public string? PdfUrl { get; set; }
    public string ValidationCode { get; set; } = string.Empty;
    public bool IsValid { get; set; }
    public DateTime IssuedAt { get; set; }
}
```

### **2.5 - Validators**

#### **Arquivo: `back/Pregiato.Application/Validators/CreateCourseDtoValidator.cs`**

```csharp
using FluentValidation;
using Pregiato.Application.DTOs.Training;

namespace Pregiato.Application.Validators;

public class CreateCourseDtoValidator : AbstractValidator<CreateCourseDto>
{
    public CreateCourseDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Título é obrigatório")
            .MaximumLength(200).WithMessage("Título deve ter no máximo 200 caracteres");
        
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Descrição é obrigatória")
            .MinimumLength(10).WithMessage("Descrição deve ter no mínimo 10 caracteres");
        
        RuleFor(x => x.Difficulty)
            .Must(d => d == null || new[] { "Iniciante", "Intermediário", "Avançado" }.Contains(d))
            .WithMessage("Dificuldade deve ser: Iniciante, Intermediário ou Avançado");
        
        RuleFor(x => x.ThumbnailFile)
            .Must(f => f == null || f.Length <= 5 * 1024 * 1024)
            .WithMessage("Thumbnail deve ter no máximo 5MB")
            .Must(f => f == null || new[] { "image/jpeg", "image/png", "image/jpg", "image/webp" }.Contains(f.ContentType))
            .WithMessage("Thumbnail deve ser uma imagem (JPG, PNG, WEBP)");
    }
}
```

#### **Arquivo: `back/Pregiato.Application/Validators/CreateLessonDtoValidator.cs`**

```csharp
using FluentValidation;
using Pregiato.Application.DTOs.Training;

namespace Pregiato.Application.Validators;

public class CreateLessonDtoValidator : AbstractValidator<CreateLessonDto>
{
    public CreateLessonDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Título da aula é obrigatório")
            .MaximumLength(200).WithMessage("Título deve ter no máximo 200 caracteres");
        
        RuleFor(x => x.OrderIndex)
            .GreaterThan(0).WithMessage("Ordem da aula deve ser maior que zero");
        
        RuleFor(x => x.VideoFile)
            .NotNull().WithMessage("Vídeo é obrigatório")
            .Must(f => f.Length <= 500 * 1024 * 1024)
            .WithMessage("Vídeo deve ter no máximo 500MB")
            .Must(f => new[] { "video/mp4", "video/avi", "video/mov", "video/quicktime" }.Contains(f.ContentType))
            .WithMessage("Formato de vídeo inválido. Use MP4, AVI ou MOV");
    }
}
```

---

<a name="fase-3"></a>
## 🗄️ **FASE 3: REPOSITORIES**

### **3.1 - Interfaces**

#### **Arquivo: `back/Pregiato.Core/Interfaces/ITrainingCourseRepository.cs`**

```csharp
using Pregiato.Core.Entities;

namespace Pregiato.Core.Interfaces;

public interface ITrainingCourseRepository
{
    Task<TrainingCourse?> GetByIdAsync(Guid id, bool includeDeleted = false);
    Task<TrainingCourse?> GetWithLessonsAsync(Guid id);
    Task<(List<TrainingCourse> Items, int Total)> GetPaginatedAsync(
        int page, 
        int pageSize, 
        string? search = null, 
        string? category = null,
        string? difficulty = null,
        bool onlyActive = true
    );
    Task<List<TrainingCourse>> GetByCreatorAsync(string creatorId);
    Task<TrainingCourse> CreateAsync(TrainingCourse course);
    Task<TrainingCourse> UpdateAsync(TrainingCourse course);
    Task<bool> DeleteAsync(Guid id); // Soft delete
    Task<bool> ExistsAsync(Guid id);
}
```

#### **Arquivo: `back/Pregiato.Core/Interfaces/ITrainingEnrollmentRepository.cs`**

```csharp
using Pregiato.Core.Entities;

namespace Pregiato.Core.Interfaces;

public interface ITrainingEnrollmentRepository
{
    Task<TrainingEnrollment?> GetByIdAsync(Guid id);
    Task<TrainingEnrollment?> GetByUserAndCourseAsync(string userId, Guid courseId);
    Task<List<TrainingEnrollment>> GetByUserAsync(string userId);
    Task<TrainingEnrollment> CreateAsync(TrainingEnrollment enrollment);
    Task<TrainingEnrollment> UpdateAsync(TrainingEnrollment enrollment);
    Task<bool> IsUserEnrolledAsync(string userId, Guid courseId);
}
```

### **3.2 - Implementação dos Repositories**

#### **Arquivo: `back/Pregiato.Infrastructure/Repositories/TrainingCourseRepository.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Data;

namespace Pregiato.Infrastructure.Repositories;

public class TrainingCourseRepository : ITrainingCourseRepository
{
    private readonly PregiatoDbContext _context;

    public TrainingCourseRepository(PregiatoDbContext context)
    {
        _context = context;
    }

    public async Task<TrainingCourse?> GetByIdAsync(Guid id, bool includeDeleted = false)
    {
        var query = _context.TrainingCourses.AsQueryable();
        
        if (!includeDeleted)
            query = query.Where(c => c.DeletedAt == null);
        
        return await query.FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<TrainingCourse?> GetWithLessonsAsync(Guid id)
    {
        return await _context.TrainingCourses
            .Include(c => c.Lessons.Where(l => l.IsActive).OrderBy(l => l.OrderIndex))
            .Include(c => c.Ratings)
            .FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null);
    }

    public async Task<(List<TrainingCourse> Items, int Total)> GetPaginatedAsync(
        int page, 
        int pageSize, 
        string? search = null, 
        string? category = null,
        string? difficulty = null,
        bool onlyActive = true)
    {
        var query = _context.TrainingCourses.AsQueryable();
        
        if (onlyActive)
            query = query.Where(c => c.IsActive && c.DeletedAt == null);
        
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(c => 
                c.Title.Contains(search) || 
                c.Description.Contains(search));
        }
        
        if (!string.IsNullOrEmpty(category))
            query = query.Where(c => c.Category == category);
        
        if (!string.IsNullOrEmpty(difficulty))
            query = query.Where(c => c.Difficulty == difficulty);
        
        var total = await query.CountAsync();
        
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        
        return (items, total);
    }

    public async Task<List<TrainingCourse>> GetByCreatorAsync(string creatorId)
    {
        return await _context.TrainingCourses
            .Where(c => c.CreatedBy == creatorId && c.DeletedAt == null)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<TrainingCourse> CreateAsync(TrainingCourse course)
    {
        _context.TrainingCourses.Add(course);
        await _context.SaveChangesAsync();
        return course;
    }

    public async Task<TrainingCourse> UpdateAsync(TrainingCourse course)
    {
        course.UpdatedAt = DateTime.UtcNow;
        _context.TrainingCourses.Update(course);
        await _context.SaveChangesAsync();
        return course;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var course = await GetByIdAsync(id);
        if (course == null) return false;
        
        course.DeletedAt = DateTime.UtcNow;
        await UpdateAsync(course);
        return true;
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _context.TrainingCourses
            .AnyAsync(c => c.Id == id && c.DeletedAt == null);
    }
}
```

#### **Arquivo: `back/Pregiato.Infrastructure/Repositories/TrainingEnrollmentRepository.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Data;

namespace Pregiato.Infrastructure.Repositories;

public class TrainingEnrollmentRepository : ITrainingEnrollmentRepository
{
    private readonly PregiatoDbContext _context;

    public TrainingEnrollmentRepository(PregiatoDbContext context)
    {
        _context = context;
    }

    public async Task<TrainingEnrollment?> GetByIdAsync(Guid id)
    {
        return await _context.TrainingEnrollments
            .Include(e => e.Course)
            .Include(e => e.LessonProgress)
                .ThenInclude(p => p.Lesson)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<TrainingEnrollment?> GetByUserAndCourseAsync(string userId, Guid courseId)
    {
        return await _context.TrainingEnrollments
            .Include(e => e.Course)
            .Include(e => e.LessonProgress)
                .ThenInclude(p => p.Lesson)
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);
    }

    public async Task<List<TrainingEnrollment>> GetByUserAsync(string userId)
    {
        return await _context.TrainingEnrollments
            .Include(e => e.Course)
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.LastAccessedAt ?? e.EnrolledAt)
            .ToListAsync();
    }

    public async Task<TrainingEnrollment> CreateAsync(TrainingEnrollment enrollment)
    {
        _context.TrainingEnrollments.Add(enrollment);
        await _context.SaveChangesAsync();
        return enrollment;
    }

    public async Task<TrainingEnrollment> UpdateAsync(TrainingEnrollment enrollment)
    {
        _context.TrainingEnrollments.Update(enrollment);
        await _context.SaveChangesAsync();
        return enrollment;
    }

    public async Task<bool> IsUserEnrolledAsync(string userId, Guid courseId)
    {
        return await _context.TrainingEnrollments
            .AnyAsync(e => e.UserId == userId && e.CourseId == courseId);
    }
}
```

---

## ⏭️ **CONTINUAÇÃO NO PRÓXIMO DOCUMENTO...**

Este arquivo ficou muito extenso. Vou criar um segundo documento com:
- Fase 4: Services
- Fase 5: Controllers  
- Fase 6: Frontend Integration
- Fase 7: Testes

Continue lendo em: `REFINAMENTO_IMPLEMENTACAO_TREINAMENTOS_PARTE2.md`

