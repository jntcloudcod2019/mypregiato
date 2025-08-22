using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Pregiato.Application.DTOs;
using Pregiato.Core.Entities;

namespace Pregiato.Application.Interfaces
{
    public interface IWhatsAppService
    {
        Task<ContactDto?> GetOrCreateContactAsync(string phone);
        Task<ConversationDto> GetOrCreateConversationAsync(Guid contactId);
        Task<MessageDto> CreateMessageAsync(CreateMessageDto dto);
        Task<ConversationDto?> AssignConversationAsync(Guid conversationId, string operatorId);
        Task<ConversationDto?> CloseConversationAsync(Guid conversationId, string? reason = null);
        Task<QueueMetricsDto> GetQueueMetricsAsync();
        Task<List<ConversationDto>> GetQueueConversationsAsync();
        Task<ConversationDto?> GetConversationByIdAsync(Guid conversationId);
        System.Threading.Tasks.Task ProcessIncomingMessageAsync(WhatsAppMessageDto message);
    }
} 