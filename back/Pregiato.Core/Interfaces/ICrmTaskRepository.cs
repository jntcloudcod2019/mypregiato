using Pregiato.Core.Entities;

namespace Pregiato.Core.Interfaces
{
    public interface ICrmTaskRepository
    {
        Task<CrmTask?> GetByIdAsync(Guid id);
        Task<IEnumerable<CrmTask>> GetAllAsync();
        Task<IEnumerable<CrmTask>> GetFilteredAsync(string? searchTerm, string? status, string? assignedTo, string? priority, string? category, Guid? leadId, DateTime? startDate, DateTime? endDate, bool? isOverdue, int page, int pageSize);
        Task<CrmTask> CreateAsync(CrmTask task);
        Task<CrmTask> UpdateAsync(CrmTask task);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> ExistsAsync(Guid id);
        Task<int> GetTotalCountAsync();
        Task<IEnumerable<CrmTask>> GetByStatusAsync(string status);
        Task<IEnumerable<CrmTask>> GetByAssignedToAsync(string assignedTo);
        Task<IEnumerable<CrmTask>> GetByPriorityAsync(string priority);
        Task<IEnumerable<CrmTask>> GetByLeadIdAsync(Guid leadId);
        Task<IEnumerable<CrmTask>> GetOverdueTasksAsync();
        Task<IEnumerable<CrmTask>> GetTodayTasksAsync();
        Task<IEnumerable<CrmTask>> GetUpcomingTasksAsync(int days);
        Task<IEnumerable<CrmTask>> GetRecurringTasksAsync();
    }
} 