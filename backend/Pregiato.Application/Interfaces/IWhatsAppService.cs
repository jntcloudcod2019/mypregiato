using Pregiato.Application.DTOs;

namespace Pregiato.Application.Interfaces
{
    public interface IWhatsAppService
    {
        Task<ContactDto> CreateContactAsync(CreateContactDto dto);
        Task<ConversationDto> CreateConversationAsync(CreateConversationDto dto);
        Task<MessageDto> CreateMessageAsync(CreateMessageDto dto);
        Task<ConversationDto?> AssignConversationToOperatorAsync(Guid conversationId, Guid operatorId);
        Task<QueueMetricsDto> GetQueueMetricsAsync();
        Task<ConversationDto?> GetConversationByIdAsync(Guid id);
    }
} 