using Pregiato.Core.Entities;

namespace Pregiato.Application.DTOs
{
    public class ConversationDto
    {
        public Guid Id { get; set; }
        
        // Campos originais para compatibilidade
        public Guid? ContactId { get; set; } // OPCIONAL - para conversas WhatsApp sem Contact
        public string? OperatorId { get; set; }
        public string Channel { get; set; } = string.Empty;
        public ConversationStatus Status { get; set; }
        public ConversationPriority Priority { get; set; }
        public string? CloseReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? AssignedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Novos campos para WhatsApp
        public string? InstanceId { get; set; }
        public string? PeerE164 { get; set; }
        public bool IsGroup { get; set; }
        public string? Title { get; set; }
        public Guid? CurrentSessionId { get; set; }
        public DateTime? LastMessageAt { get; set; }
        
        // Propriedades de navegação
        public ContactDto? Contact { get; set; }
        public OperatorDto? Operator { get; set; }
        public List<MessageDto> Messages { get; set; } = new();
        public List<ChatSessionDto> Sessions { get; set; } = new();
        public int UnreadCount { get; set; }
        public MessageDto? LastMessage { get; set; }
    }

    public class CreateConversationDto
    {
        // Campos originais
        public Guid? ContactId { get; set; } // OPCIONAL - para conversas WhatsApp sem Contact
        public string Channel { get; set; } = "whatsapp";
        public ConversationPriority Priority { get; set; } = ConversationPriority.Normal;
        
        // Novos campos para WhatsApp
        public string? InstanceId { get; set; }
        public string? PeerE164 { get; set; }
        public bool IsGroup { get; set; } = false;
        public string? Title { get; set; }
    }

    public class UpdateConversationDto
    {
        // Campos originais
        public string? OperatorId { get; set; }
        public ConversationStatus? Status { get; set; }
        public ConversationPriority? Priority { get; set; }
        public string? CloseReason { get; set; }
        
        // Novos campos para WhatsApp
        public string? Title { get; set; }
        public Guid? CurrentSessionId { get; set; }
    }

    public class ChatSessionDto
    {
        public Guid Id { get; set; }
        public Guid ConversationId { get; set; }
        public DateTime OpenedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public string? OpenedBy { get; set; }
        public string? ClosedBy { get; set; }
    }

    public class ConversationListItemDto
    {
        public Guid ConversationId { get; set; }
        public string? InstanceId { get; set; }
        public string? PeerE164 { get; set; }
        public bool IsGroup { get; set; }
        public string? Title { get; set; }
        public DateTime? LastMessageAt { get; set; }
        public string? LastMessagePayloadJson { get; set; }
        public Guid? CurrentSessionId { get; set; }
    }

    public class QueueItemDto
    {
        public Guid ConversationId { get; set; }
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public DateTime QueuedAt { get; set; }
        public TimeSpan WaitTime { get; set; }
    }

    public class QueueMetricsDto
    {
        public int TotalQueued { get; set; }
        public int TotalAssigned { get; set; }
        public TimeSpan AverageWaitTime { get; set; }
        public List<QueueItemDto> QueueItems { get; set; } = new();
    }
} 