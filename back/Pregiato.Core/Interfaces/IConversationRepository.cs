using Pregiato.Core.Entities;

namespace Pregiato.Core.Interfaces
{
    public interface IConversationRepository
    {
        Task<Conversation?> GetByPhoneAsync(string phoneE164);
        Task<Conversation> CreateAsync(Conversation conversation);
        Task<Conversation> UpdateAsync(Conversation conversation);
        Task<bool> ExistsAsync(string phoneE164);
    }
}