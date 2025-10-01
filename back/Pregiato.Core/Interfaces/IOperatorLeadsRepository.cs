using Pregiato.Core.Entities;

namespace Pregiato.Core.Interfaces
{
    public interface IOperatorLeadsRepository
    {
        Task<OperatorLeads> AddAsync(OperatorLeads operatorLeads);
        Task<IEnumerable<OperatorLeads>> AddRangeAsync(IEnumerable<OperatorLeads> operatorLeads);
        Task<OperatorLeads> GetByIdAsync(Guid id);
        Task<IEnumerable<OperatorLeads>> GetByOperatorIdAsync(string operatorId);
        Task<IEnumerable<OperatorLeads>> GetByEmailOperatorAsync(string emailOperator);
        Task<IEnumerable<OperatorLeads>> GetAllAsync();
        Task<OperatorLeads> UpdateAsync(OperatorLeads operatorLeads);
        Task<bool> DeleteAsync(Guid id);
        Task<int> GetLeadsCountByOperatorAsync(string operatorId);
        Task<int> GetLeadsCountByEmailOperatorAsync(string emailOperator);
        Task<OperatorLeads> UpdateTrackingAsync(string emailOperator, string phoneLead, bool statusContact, DateTime? dateContact, bool statusSeletiva, SeletivaInfo? seletivaInfo);
        
        // ✅ NEW METHODS FOR SCHEDULING FEATURE
        /// <summary>
        /// Gets all leads for an operator grouped by Kanban status (descending order by CreatedAt)
        /// </summary>
        Task<Dictionary<string, List<OperatorLeads>>> GetKanbanDataAsync(string emailOperator);
        
        /// <summary>
        /// Gets dashboard metrics for an operator (scheduled and pending counts)
        /// </summary>
        Task<(int scheduledToday, int scheduledWeek, int scheduledMonth, int pendingToday, int pendingWeek, int pendingMonth, int totalNew, int totalScheduled, int totalPending)> GetDashboardMetricsAsync(string emailOperator);
        
        /// <summary>
        /// Gets paginated leads for a specific Kanban column
        /// </summary>
        Task<(List<OperatorLeads> items, int totalCount)> GetPaginatedKanbanColumnAsync(string emailOperator, string columnStatus, int page, int pageSize);
    }
}
