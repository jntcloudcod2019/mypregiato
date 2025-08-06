namespace Pregiato.Application.DTOs
{
    public class LeadInteractionDto
    {
        public Guid Id { get; set; }
        public Guid LeadId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Outcome { get; set; }
        public string? PerformedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string? Duration { get; set; }
        public string? Location { get; set; }
        
        // Lead info
        public string? LeadName { get; set; }
    }

    public class CreateLeadInteractionDto
    {
        public Guid LeadId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Outcome { get; set; }
        public string? PerformedBy { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public string Status { get; set; } = "Completed";
        public string? Notes { get; set; }
        public string? Duration { get; set; }
        public string? Location { get; set; }
    }

    public class UpdateLeadInteractionDto
    {
        public string Type { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Outcome { get; set; }
        public string? PerformedBy { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string? Duration { get; set; }
        public string? Location { get; set; }
    }
} 