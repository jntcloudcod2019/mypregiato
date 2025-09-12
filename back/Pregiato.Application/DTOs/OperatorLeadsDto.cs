using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Pregiato.Core.Entities;

namespace Pregiato.Application.DTOs
{
    public class OperatorLeadDto
    {
        [Required(ErrorMessage = "NameLead é obrigatório")]
        [JsonPropertyName("nameLead")]
        public string NameLead { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "PhoneLead é obrigatório")]
        [JsonPropertyName("phoneLead")]
        public string PhoneLead { get; set; } = string.Empty;
        
        // === NOVOS CAMPOS ADICIONADOS ===
        
        /// <summary>
        /// Responsável pelo lead (nome da pessoa responsável)
        /// </summary>
        [JsonPropertyName("responsible")]
        public string? Responsible { get; set; }
        
        /// <summary>
        /// Idade do lead
        /// </summary>
        [JsonPropertyName("age")]
        public int? Age { get; set; }
        
        /// <summary>
        /// Indica se o lead veio de publicidade/anúncios (string)
        /// </summary>
        [JsonPropertyName("publicADS")]
        public string? PublicADS { get; set; }
    }

    public class OperatorWithLeadsDto
    {
        [Required(ErrorMessage = "OperatorId é obrigatório")]
        public string OperatorId { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "EmailOperator é obrigatório")]
        [EmailAddress(ErrorMessage = "EmailOperator deve ser um email válido")]
        public string EmailOperator { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Leads é obrigatório")]
        public List<OperatorLeadDto> Leads { get; set; } = new List<OperatorLeadDto>();
    }

    public class BulkOperatorLeadsDto
    {
        [Required(ErrorMessage = "Operators é obrigatório")]
        public List<OperatorWithLeadsDto> Operators { get; set; } = new List<OperatorWithLeadsDto>();
    }

    // DTOs antigos mantidos para compatibilidade se necessário
    public class OperatorLeadsDto
    {
        [Required(ErrorMessage = "OperatorId é obrigatório")]
        public string OperatorId { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "EmailOperator é obrigatório")]
        [EmailAddress(ErrorMessage = "EmailOperator deve ser um email válido")]
        public string EmailOperator { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "NameLead é obrigatório")]
        public string NameLead { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "PhoneLead é obrigatório")]
        public string PhoneLead { get; set; } = string.Empty;
        
        // === NOVOS CAMPOS ADICIONADOS ===
        public string? Responsible { get; set; }
        public int? Age { get; set; }
        public string? PublicADS { get; set; }
    }

    
    /// <summary>
    /// DTO unificado para atualizar todos os campos de rastreamento do lead
    /// </summary>
    public class UpdateLeadTrackingDto
    {
        [Required]
        public string EmailOperator { get; set; } = string.Empty;
        
        [Required]
        public string PhoneLead { get; set; } = string.Empty;
        
        /// <summary>
        /// Status do contato realizado
        /// </summary>
        public bool StatusContact { get; set; }
        
        /// <summary>
        /// Data e hora do contato (opcional, será preenchida automaticamente se StatusContact = true)
        /// </summary>
        public string? DateContact { get; set; }
        
        /// <summary>
        /// Status da seletiva agendada
        /// </summary>
        public bool StatusSeletiva { get; set; }
        
        /// <summary>
        /// Informações da seletiva (obrigatório se StatusSeletiva = true)
        /// </summary>
        public SeletivaInfoDto? SeletivaInfo { get; set; }
    }

    /// <summary>
    /// DTO para informações da seletiva (aceita strings do frontend)
    /// </summary>
    public class SeletivaInfoDto
    {
        /// <summary>
        /// Data da seletiva (string no formato YYYY-MM-DD)
        /// </summary>
        public string? DateSeletiva { get; set; }
        
        /// <summary>
        /// Local da seletiva - CEP, rua com número, bairro, cidade, estado
        /// </summary>
        public string? LocalSeletiva { get; set; }
        
        /// <summary>
        /// Horário agendado para o lead (string no formato HH:mm)
        /// </summary>
        public string? HorarioAgendadoLead { get; set; }
        
        /// <summary>
        /// Nome do lead
        /// </summary>
        public string? NomeLead { get; set; }
        
        /// <summary>
        /// Código do operador que agendou
        /// </summary>
        public string? CodOperator { get; set; }
    }
    
    /// <summary>
    /// DTO completo para retornar informações do lead com rastreamento
    /// </summary>
    public class OperatorLeadWithTrackingDto
    {
        public string EmailOperator { get; set; } = string.Empty;
        public string NameLead { get; set; } = string.Empty;
        public string PhoneLead { get; set; } = string.Empty;   
        public bool StatusContact { get; set; }
        public DateTime? DateContact { get; set; }
        public bool StatusSeletiva { get; set; }
        public SeletivaInfo? SeletivaInfo { get; set; }
    }
}
