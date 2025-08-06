namespace Pregiato.Application.DTOs
{
    public class LeadDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Company { get; set; }
        public string? Position { get; set; }
        public string? Industry { get; set; }
        public string? Description { get; set; }
        public string Source { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal? EstimatedValue { get; set; }
        public string? AssignedTo { get; set; }
        public string? Tags { get; set; }
        public string? Priority { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? LastContactDate { get; set; }
        public DateTime? NextFollowUpDate { get; set; }
        public bool IsActive { get; set; }
        public string? MetaLeadId { get; set; }
        public string? MetaAdId { get; set; }
        public string? MetaCampaignId { get; set; }
        public string? MetaFormId { get; set; }
        
        // Relacionamentos
        public List<LeadInteractionDto>? Interactions { get; set; }
        public List<TaskDto>? Tasks { get; set; }
        public int InteractionCount { get; set; }
        public int TaskCount { get; set; }
    }

    public class CreateLeadDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Company { get; set; }
        public string? Position { get; set; }
        public string? Industry { get; set; }
        public string? Description { get; set; }
        public string Source { get; set; } = "Manual";
        public string Status { get; set; } = "Novo";
        public decimal? EstimatedValue { get; set; }
        public string? AssignedTo { get; set; }
        public string? Tags { get; set; }
        public string? Priority { get; set; } = "Média";
        public DateTime? NextFollowUpDate { get; set; }
        public string? MetaLeadId { get; set; }
        public string? MetaAdId { get; set; }
        public string? MetaCampaignId { get; set; }
        public string? MetaFormId { get; set; }
    }

    public class UpdateLeadDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Company { get; set; }
        public string? Position { get; set; }
        public string? Industry { get; set; }
        public string? Description { get; set; }
        public string Source { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal? EstimatedValue { get; set; }
        public string? AssignedTo { get; set; }
        public string? Tags { get; set; }
        public string? Priority { get; set; }
        public DateTime? LastContactDate { get; set; }
        public DateTime? NextFollowUpDate { get; set; }
        public bool IsActive { get; set; }
    }

    public class LeadFilterDto
    {
        public string? SearchTerm { get; set; }
        public string? Status { get; set; }
        public string? AssignedTo { get; set; }
        public string? Source { get; set; }
        public string? Priority { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? IsActive { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
} 