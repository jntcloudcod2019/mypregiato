using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Pregiato.Core.Entities;

namespace Pregiato.Core.Interfaces
{
    public interface ITaskRepository
    {
        Task<CrmTask> GetByIdAsync(Guid id);
        Task<IEnumerable<CrmTask>> GetAllAsync();
        Task<IEnumerable<CrmTask>> GetByStatusAsync(string status);
        Task<CrmTask> CreateAsync(CrmTask task);
        Task<CrmTask> UpdateAsync(CrmTask task);
        Task DeleteAsync(Guid id);
        Task<IEnumerable<CrmTask>> GetByAssignedToAsync(string assignedTo);
        Task<IEnumerable<CrmTask>> GetByPriorityAsync(string priority);
        Task<IEnumerable<CrmTask>> GetByDueDateAsync(DateTime dueDate);
        Task<IEnumerable<CrmTask>> GetByCategoryAsync(string category);
    }
} 