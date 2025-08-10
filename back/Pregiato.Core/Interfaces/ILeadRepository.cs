using Pregiato.Core.Entities;

namespace Pregiato.Core.Interfaces
{
    public interface ILeadRepository
    {
        Task<Lead?> GetByIdAsync(Guid id);
        Task<IEnumerable<Lead>> GetAllAsync();
        Task<IEnumerable<Lead>> GetFilteredAsync(string? searchTerm, string? status, string? assignedTo, string? source, string? priority, DateTime? startDate, DateTime? endDate, bool? isActive, int page, int pageSize);
        Task<Lead> CreateAsync(Lead lead);
        Task<Lead> UpdateAsync(Lead lead);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> ExistsAsync(Guid id);
        Task<int> GetTotalCountAsync();
        Task<IEnumerable<Lead>> GetByStatusAsync(string status);
        Task<IEnumerable<Lead>> GetByAssignedToAsync(string assignedTo);
        Task<IEnumerable<Lead>> GetBySourceAsync(string source);
        Task<IEnumerable<Lead>> GetOverdueFollowUpsAsync();
        Task<IEnumerable<Lead>> GetRecentLeadsAsync(int count);
        Task<Lead?> GetByMetaLeadIdAsync(string metaLeadId);
    }
} 