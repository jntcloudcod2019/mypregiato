using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Pregiato.Application.DTOs;
using Pregiato.Core.Entities;

namespace Pregiato.Application.Interfaces
{
    public interface IWhatsAppService
    {
        Task<ContactDto> CreateContactAsync(CreateContactDto dto);
        Task<ContactDto> GetContactByIdAsync(Guid id);
        Task<ContactDto> GetOrCreateContactAsync(string phone);
        Task<ConversationDto> CreateConversationAsync(CreateConversationDto dto);
        Task<ConversationDto> GetOrCreateConversationAsync(Guid contactId);
        Task<MessageDto> CreateMessageAsync(CreateMessageDto dto);
        Task<ConversationDto?> AssignConversationAsync(Guid conversationId, Guid operatorId);
        Task<ConversationDto?> CloseConversationAsync(Guid conversationId, string? reason = null);
        Task<QueueMetricsDto> GetQueueMetricsAsync();
        Task<List<ConversationDto>> GetQueueConversationsAsync();
        Task<ConversationDto?> GetConversationByIdAsync(Guid id);
        Task<List<ConversationDto>> GetAllConversationsAsync();
        Task<List<ConversationDto>> GetConversationsByStatusAsync(ConversationStatus status);
        System.Threading.Tasks.Task ProcessIncomingMessageAsync(WhatsAppMessageDto message);
    }
} 