using Pregiato.Core.Entities;

namespace Pregiato.Application.DTOs
{
    public class ConversationDto
    {
        public Guid Id { get; set; }
        public Guid ContactId { get; set; }
        public Guid? OperatorId { get; set; }
        public string Channel { get; set; } = string.Empty;
        public ConversationStatus Status { get; set; }
        public ConversationPriority Priority { get; set; }
        public string? CloseReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? AssignedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Propriedades de navegação
        public ContactDto? Contact { get; set; }
        public OperatorDto? Operator { get; set; }
        public List<MessageDto> Messages { get; set; } = new();
        public int UnreadCount { get; set; }
        public MessageDto? LastMessage { get; set; }
    }

    public class CreateConversationDto
    {
        public Guid ContactId { get; set; }
        public string Channel { get; set; } = "whatsapp";
        public ConversationPriority Priority { get; set; } = ConversationPriority.Normal;
    }

    public class UpdateConversationDto
    {
        public Guid? OperatorId { get; set; }
        public ConversationStatus? Status { get; set; }
        public ConversationPriority? Priority { get; set; }
        public string? CloseReason { get; set; }
    }

    public class QueueItemDto
    {
        public Guid ConversationId { get; set; }
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public ConversationPriority Priority { get; set; }
        public DateTime QueuedAt { get; set; }
        public int WaitTimeMinutes { get; set; }
    }

    public class QueueMetricsDto
    {
        public int TotalInQueue { get; set; }
        public int AttendingCount { get; set; }
        public double AverageWaitTimeMinutes { get; set; }
        public List<QueueItemDto> QueueItems { get; set; } = new();
    }
} 