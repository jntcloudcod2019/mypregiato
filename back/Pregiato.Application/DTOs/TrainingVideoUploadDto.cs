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

    /// <summary>
    /// DTO para iniciar um processo de upload em lote
    /// O frontend envia esta requisição para obter um BatchId
    /// </summary>
    public class BatchUploadInitDto
    {
        [Required(ErrorMessage = "Quantidade total de vídeos é obrigatória")]
        [Range(1, 50, ErrorMessage = "O lote deve conter entre 1 e 50 vídeos")]
        public int TotalVideos { get; set; }
        
        public Guid? CourseId { get; set; }
        public string? CourseName { get; set; }
    }

    /// <summary>
    /// Resposta ao iniciar um upload em lote
    /// </summary>
    public class BatchUploadResponseDto
    {
        public Guid BatchId { get; set; }
        public int TotalVideos { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO para upload de vídeo individual dentro de um lote
    /// </summary>
    public class BatchVideoUploadDto
    {
        [Required(ErrorMessage = "BatchId é obrigatório")]
        public Guid BatchId { get; set; }
        
        [Required(ErrorMessage = "Índice do vídeo é obrigatório")]
        [Range(0, int.MaxValue, ErrorMessage = "Índice deve ser maior ou igual a 0")]
        public int VideoIndex { get; set; }
        
        [Required(ErrorMessage = "Dados do vídeo são obrigatórios")]
        public TrainingVideoUploadDto VideoData { get; set; } = new();
    }

    /// <summary>
    /// Status de um upload em lote
    /// </summary>
    public class BatchUploadStatusDto
    {
        public Guid BatchId { get; set; }
        public int TotalVideos { get; set; }
        public int UploadedVideos { get; set; }
        public int FailedVideos { get; set; }
        public double ProgressPercentage { get; set; }
        public bool IsCompleted { get; set; }
        public List<VideoUploadResultDto> Results { get; set; } = new();
        public List<string> Errors { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
