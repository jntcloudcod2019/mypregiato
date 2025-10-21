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
        public int? VideoDurationMinutes { get; set; } // Campo para entrada em minutos
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
        [Required(ErrorMessage = "O título da aula é obrigatório")]
        [MaxLength(200, ErrorMessage = "O título deve ter no máximo 200 caracteres")]
        public string Title { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "A descrição da aula é obrigatória")]
        [MinLength(5, ErrorMessage = "A descrição deve ter pelo menos 5 caracteres")]
        public string Description { get; set; } = string.Empty;
        
        [Range(1, int.MaxValue, ErrorMessage = "O índice da aula deve ser maior que 0")]
        public int OrderIndex { get; set; }
        public string? VideoUrl { get; set; }
        public string? VideoObjectName { get; set; }
        public long? VideoSize { get; set; }
        public int? VideoDurationSeconds { get; set; }
        public int? VideoDurationMinutes { get; set; } // Campo para entrada em minutos
        public string? VideoMimeType { get; set; }
        public string? AttachmentsJson { get; set; }
        public bool IsActive { get; set; } = true;
        
        // ⚠️ IMPORTANTE: Os vídeos devem ser enviados ANTES via /api/TrainingVideos/upload
        // Este DTO recebe apenas as URLs retornadas pelo upload
        // Campos Base64 foram removidos para evitar request body too large (limite 30MB)
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
        public int? VideoDurationMinutes { get; set; } // Campo para entrada em minutos
        public string? VideoMimeType { get; set; }
        public string? AttachmentsJson { get; set; }
        public bool IsActive { get; set; }
    }
}
