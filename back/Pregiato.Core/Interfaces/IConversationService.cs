
using Pregiato.Core.Entities;

namespace Pregiato.Core.Interfaces
{
    public interface IConversationService
    {
        Task<Conversation> GetOrCreateConversationAsync(string phoneE164, string instanceId, bool isGroup = false, string? title = null);
        Task<Conversation> UpdateLastMessageAsync(Guid conversationId, DateTime lastMessageAt);
    }
}