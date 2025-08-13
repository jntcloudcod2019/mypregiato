using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pregiato.Core.Entities
{
    public class ModuleRecord
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [StringLength(80)]
        public string ModuleSlug { get; set; } = string.Empty; // ex.: "financeiro", "crm"

        [StringLength(180)]
        public string? Title { get; set; }

        [StringLength(60)]
        public string? Status { get; set; }

        [StringLength(180)]
        public string? Tags { get; set; } // csv

        [Column(TypeName = "LONGTEXT")]
        public string PayloadJson { get; set; } = "{}"; // dados específicos do módulo

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

        [Timestamp]
        public byte[] RowVersion { get; set; } = null!;
    }
}


