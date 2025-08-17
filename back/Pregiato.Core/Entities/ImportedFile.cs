using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities
{
    public class ImportedFile
    {
        [Key]
        public Guid Id { get; set; }

        [StringLength(200)]
        public string FileName { get; set; } = string.Empty;

        // Conteúdo genérico do arquivo (headers, rows, metadata)
        public string PayloadJson { get; set; } = string.Empty;

        public int? RowCount { get; set; }
        
        // Informações de processamento
        public DateTime? ProcessedAt { get; set; }
        public string? ProcessingResult { get; set; }
        
        [StringLength(100)]
        public string? EntityType { get; set; }

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}


