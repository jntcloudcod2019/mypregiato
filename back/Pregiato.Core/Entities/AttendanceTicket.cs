using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pregiato.Core.Entities
{
    public enum AttendanceStatus
    {
        Novo = 1,
        EmAtendimento = 2,
        Finalizado = 3
    }

    public class AttendanceTicket
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid ChatLogId { get; set; }
        
        // ID do chat relacionado (usado nos serviços)
        public Guid ChatId { get; set; }

        [Required]
        public AttendanceStatus Status { get; set; } = AttendanceStatus.Novo;

        [Range(1, 4)]
        public int Step { get; set; } = 1;
        
        // Passo atual do atendimento (para controle de fluxo)
        public int CurrentStep { get; set; } = 0;

        // ID do operador responsável pelo atendimento
        [StringLength(100)]
        public string? OperatorId { get; set; }
        
        // Nome do operador responsável
        [StringLength(150)]
        public string? OperatorName { get; set; }

        [StringLength(100)]
        public string? AssignedUserId { get; set; }

        [StringLength(150)]
        public string? AssignedUserName { get; set; }

        [Column(TypeName = "LONGTEXT")]
        public string? Description { get; set; }

        public bool Verified { get; set; } = false;

        public DateTime? StartedAtUtc { get; set; }
        public DateTime? EndedAtUtc { get; set; }

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

        [Timestamp]
        public byte[] RowVersion { get; set; } = Array.Empty<byte>();

        [ForeignKey(nameof(ChatLogId))]
        public ChatLog? ChatLog { get; set; }
    }
}


