// mypregiato/back/Pregiato.Infrastructure/Repositories/ConversationRepository.cs
using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;

namespace Pregiato.Infrastructure.Repositories
{
    public class ConversationRepository : IConversationRepository
    {
        private readonly PregiatoDbContext _context;

        public ConversationRepository(PregiatoDbContext context)
        {
            _context = context;
        }

        public async Task<Conversation?> GetByPhoneAsync(string phoneE164)
        {
            return await _context.Conversations
                .FirstOrDefaultAsync(c => c.PeerE164 == phoneE164);
        }

        public async Task<Conversation> CreateAsync(Conversation conversation)
        {
            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();
            return conversation;
        }

        public async Task<Conversation> UpdateAsync(Conversation conversation)
        {
            _context.Conversations.Update(conversation);
            await _context.SaveChangesAsync();
            return conversation;
        }

        public async Task<bool> ExistsAsync(string phoneE164)
        {
            return await _context.Conversations
                .AnyAsync(c => c.PeerE164 == phoneE164);
        }
    }
}