using Pregiato.Core.Entities;

namespace Pregiato.Application.DTOs
{
    public class OperatorDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public OperatorRole Role { get; set; }
        public OperatorStatus Status { get; set; }
        public string? Skills { get; set; }
        public int MaxConcurrentConversations { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? LastActivityAt { get; set; }
        
        // Métricas
        public int ActiveConversationsCount { get; set; }
        public double AverageResponseTimeMinutes { get; set; }
        public int TotalMessagesSent { get; set; }
    }

    public class CreateOperatorDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public OperatorRole Role { get; set; } = OperatorRole.Agent;
        public string? Skills { get; set; }
        public int MaxConcurrentConversations { get; set; } = 5;
    }

    public class UpdateOperatorDto
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public OperatorRole? Role { get; set; }
        public OperatorStatus? Status { get; set; }
        public string? Skills { get; set; }
        public int? MaxConcurrentConversations { get; set; }
    }

    public class OperatorMetricsDto
    {
        public Guid OperatorId { get; set; }
        public string OperatorName { get; set; } = string.Empty;
        public int ActiveConversations { get; set; }
        public int QueuedConversations { get; set; }
        public double AverageResponseTimeMinutes { get; set; }
        public int MessagesSentToday { get; set; }
        public int ConversationsClosedToday { get; set; }
        public DateTime? LastActivity { get; set; }
    }
} 