using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Pregiato.Core.Entities;

namespace Pregiato.Application.DTOs
{
    public class OperatorLeadDto
    {
        [Required]
        [JsonPropertyName("nameLead")]
        public string NameLead { get; set; } = string.Empty;
        
        [Required]
        [JsonPropertyName("phoneLead")]
        public string PhoneLead { get; set; } = string.Empty;
        
    }

    public class OperatorWithLeadsDto
    {
        [Required]
        public string OperatorId { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string EmailOperator { get; set; } = string.Empty;
        
        [Required]
        public List<OperatorLeadDto> Leads { get; set; } = new List<OperatorLeadDto>();
    }

    public class BulkOperatorLeadsDto
    {
        [Required]
        public List<OperatorWithLeadsDto> Operators { get; set; } = new List<OperatorWithLeadsDto>();
    }

    // DTOs antigos mantidos para compatibilidade se necessário
    public class OperatorLeadsDto
    {
        [Required]
        public string OperatorId { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string EmailOperator { get; set; } = string.Empty;
        
        [Required]
        public string NameLead { get; set; } = string.Empty;
        
        [Required]
        public string PhoneLead { get; set; } = string.Empty;

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
