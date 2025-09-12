using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities
{
    public class OperatorLeads
    {
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string OperatorId { get; set; } = string.Empty; 
        
        [Required]
        [MaxLength(255)]
        public string EmailOperator { get; set; } = string.Empty; 
        
        [Required]
        [MaxLength(500)]
        public string NameLead { get; set; } = string.Empty; 
        
        [Required]
        [MaxLength(50)]
        public string PhoneLead { get; set; } = string.Empty; 
        
        /// <summary>
        /// Responsável pelo lead (nome da pessoa responsável)
        /// </summary>
        [MaxLength(255)]
        public string? Responsible { get; set; }
        
        /// <summary>
        /// Idade do lead
        /// </summary>
        public int? Age { get; set; }
        
        /// <summary>
        /// Indica se o lead veio de publicidade/anúncios (string)
        /// </summary>
        [MaxLength(255)]
        public string? PublicADS { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        /// <summary>
        /// Indica se o contato foi realizado com o lead
        /// </summary>
        public bool StatusContact { get; set; } = false;
        
        /// <summary>
        /// Data e hora em que o contato foi realizado
        /// </summary>
        public DateTime? DateContact { get; set; }
        
        /// <summary>
        /// Indica se a seletiva foi agendada
        /// </summary>
        public bool StatusSeletiva { get; set; } = false;
        
        /// <summary>
        /// Informações da seletiva em formato JSON
        /// </summary>
        public SeletivaInfo? SeletivaInfo { get; set; }
    }
}
