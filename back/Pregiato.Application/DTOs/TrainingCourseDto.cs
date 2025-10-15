using System.ComponentModel.DataAnnotations;

namespace Pregiato.Application.DTOs
{
    public class TrainingCourseDto
    {
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        public string? ThumbnailUrl { get; set; }
        public string? ThumbnailObjectName { get; set; }
        
        [MaxLength(100)]
        public string? Category { get; set; }
        
        [MaxLength(50)]
        public string? Difficulty { get; set; }
        
        public bool IsActive { get; set; } = true;
        public int TotalLessons { get; set; }
        public int TotalDurationMinutes { get; set; }
        public int TotalLikes { get; set; }
        public int TotalDislikes { get; set; }
        public decimal AverageRating { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string CreatedBy { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        
        // Navegação
        public List<TrainingLessonDto>? Lessons { get; set; }
        public List<TrainingEnrollmentDto>? Enrollments { get; set; }
        public List<TrainingRatingDto>? Ratings { get; set; }
    }

    public class CreateTrainingCourseDto
    {
        [Required(ErrorMessage = "O título do curso é obrigatório")]
        [MaxLength(200, ErrorMessage = "O título deve ter no máximo 200 caracteres")]
        public string Title { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "A descrição do curso é obrigatória")]
        [MinLength(5, ErrorMessage = "A descrição deve ter pelo menos 5 caracteres")]
        public string Description { get; set; } = string.Empty;
        
        [MaxLength(100, ErrorMessage = "A categoria deve ter no máximo 100 caracteres")]
        public string? Category { get; set; }
        
        [MaxLength(50, ErrorMessage = "A dificuldade deve ter no máximo 50 caracteres")]
        public string? Difficulty { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        [Required(ErrorMessage = "O ID do criador é obrigatório")]
        [MaxLength(100, ErrorMessage = "O ID do criador deve ter no máximo 100 caracteres")]
        public string CreatedBy { get; set; } = string.Empty;
        
        public List<CreateTrainingLessonDto>? Lessons { get; set; }
        
        // ✅ ADICIONADO: Campo para URL do vídeo após upload
        public string? VideoUrl { get; set; }
        public string? VideoObjectName { get; set; }
    }

    public class UpdateTrainingCourseDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        [MaxLength(100)]
        public string? Category { get; set; }
        
        [MaxLength(50)]
        public string? Difficulty { get; set; }
        
        public bool IsActive { get; set; }
    }
}
