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
    
    // ============================================================================
    // SCHEDULING FEATURE DTOs (Kanban Board)
    // ============================================================================
    
    /// <summary>
    /// DTO for a single lead card in the Kanban board
    /// </summary>
    public class OperatorLeadKanbanDto
    {
        public Guid Id { get; set; }
        public string NameLead { get; set; } = string.Empty;
        public string PhoneLead { get; set; } = string.Empty;
        public string? Responsible { get; set; }
        public int? Age { get; set; }
        public string? PublicADS { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool StatusContact { get; set; }
        public DateTime? DateContact { get; set; }
        public bool StatusSeletiva { get; set; }
        public SeletivaInfo? SeletivaInfo { get; set; }
        
        /// <summary>
        /// Label for contact status: "Lead Scheduled" or "Lead Pending"
        /// </summary>
        public string StatusContactLabel { get; set; } = string.Empty;
        
        /// <summary>
        /// Kanban column status: "new", "scheduled", "pending"
        /// </summary>
        public string KanbanStatus { get; set; } = string.Empty;
    }
    
    /// <summary>
    /// DTO for a single Kanban column
    /// </summary>
    public class KanbanColumnDto
    {
        /// <summary>
        /// Column status: "new", "scheduled", "pending"
        /// </summary>
        public string Status { get; set; } = string.Empty;
        
        /// <summary>
        /// Display label for the column
        /// </summary>
        public string Label { get; set; } = string.Empty;
        
        /// <summary>
        /// Number of leads in this column
        /// </summary>
        public int Count { get; set; }
        
        /// <summary>
        /// List of leads in this column (descending order by CreatedAt)
        /// </summary>
        public List<OperatorLeadKanbanDto> Leads { get; set; } = new List<OperatorLeadKanbanDto>();
    }
    
    /// <summary>
    /// DTO containing all Kanban data
    /// </summary>
    public class KanbanDataDto
    {
        public List<KanbanColumnDto> Columns { get; set; } = new List<KanbanColumnDto>();
        public int TotalLeads { get; set; }
    }
    
    /// <summary>
    /// DTO for operator dashboard metrics
    /// </summary>
    public class OperatorDashboardDto
    {
        // Scheduled metrics
        public int ScheduledToday { get; set; }
        public int ScheduledWeek { get; set; }
        public int ScheduledMonth { get; set; }
        
        // Pending metrics
        public int PendingToday { get; set; }
        public int PendingWeek { get; set; }
        public int PendingMonth { get; set; }
        
        // Overall totals
        public int TotalLeads { get; set; }
        public int TotalNew { get; set; }
        public int TotalScheduled { get; set; }
        public int TotalPending { get; set; }
    }
}
