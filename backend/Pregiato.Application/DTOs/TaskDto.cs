namespace Pregiato.Application.DTOs
{
    public class TaskDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid? LeadId { get; set; }
        public string? AssignedTo { get; set; }
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string? Notes { get; set; }
        public string? EstimatedDuration { get; set; }
        public string? ActualDuration { get; set; }
        public bool IsRecurring { get; set; }
        public string? RecurrencePattern { get; set; }
        public int? RecurrenceInterval { get; set; }
        
        // Lead info
        public string? LeadName { get; set; }
    }

    public class CreateTaskDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid? LeadId { get; set; }
        public string? AssignedTo { get; set; }
        public string Priority { get; set; } = "Média";
        public string Status { get; set; } = "Pendente";
        public string Category { get; set; } = "Geral";
        public DateTime? DueDate { get; set; }
        public string? Notes { get; set; }
        public string? EstimatedDuration { get; set; }
        public bool IsRecurring { get; set; } = false;
        public string? RecurrencePattern { get; set; }
        public int? RecurrenceInterval { get; set; }
    }

    public class UpdateTaskDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid? LeadId { get; set; }
        public string? AssignedTo { get; set; }
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string? Notes { get; set; }
        public string? EstimatedDuration { get; set; }
        public string? ActualDuration { get; set; }
        public bool IsRecurring { get; set; }
        public string? RecurrencePattern { get; set; }
        public int? RecurrenceInterval { get; set; }
    }

    public class TaskFilterDto
    {
        public string? SearchTerm { get; set; }
        public string? Status { get; set; }
        public string? AssignedTo { get; set; }
        public string? Priority { get; set; }
        public string? Category { get; set; }
        public Guid? LeadId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? IsOverdue { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
} 