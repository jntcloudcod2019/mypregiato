using System.ComponentModel.DataAnnotations;

namespace Pregiato.Application.DTOs
{
    public class TrainingVideoUploadDto
    {
        // ⚠️ OPCIONAIS: CourseId e LessonId não existem no momento do upload
        // O vídeo é enviado ANTES de criar o curso/aula
        public Guid? CourseId { get; set; }
        public Guid? LessonId { get; set; }
        
        [Required(ErrorMessage = "Nome do arquivo é obrigatório")]
        public string FileName { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Tipo MIME é obrigatório")]
        public string MimeType { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Tamanho do arquivo é obrigatório")]
        [Range(1, long.MaxValue, ErrorMessage = "Tamanho do arquivo deve ser maior que 0")]
        public long FileSize { get; set; }
        
        [Required(ErrorMessage = "Dados Base64 são obrigatórios")]
        public string Base64Data { get; set; } = string.Empty;
        
        // Chunking (opcional)
        public string? ChunkId { get; set; }
        public int? ChunkIndex { get; set; }
        public int? TotalChunks { get; set; }
        
        // ✅ OBRIGATÓRIOS: Usados para gerar o path no MinIO
        // Formato: Course/{courseTitle}/{lessonTitle}.ext
        [Required(ErrorMessage = "Título do curso é obrigatório")]
        public string CourseTitle { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Título da aula é obrigatório")]
        public string LessonTitle { get; set; } = string.Empty;
        
        // ✅ ADICIONADO: Metadados do vídeo
        public int? DurationSeconds { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
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
