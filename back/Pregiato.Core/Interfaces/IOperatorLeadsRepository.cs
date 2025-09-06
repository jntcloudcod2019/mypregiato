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
    }
}
