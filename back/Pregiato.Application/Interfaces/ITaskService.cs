using Pregiato.Application.DTOs;

namespace Pregiato.Application.Interfaces
{
    public interface ITaskService
    {
        Task<TaskDto> GetByIdAsync(Guid id);
        Task<IEnumerable<TaskDto>> GetAllAsync();
        Task<IEnumerable<TaskDto>> GetFilteredAsync(TaskFilterDto filter);
        Task<TaskDto> CreateAsync(CreateTaskDto createDto);
        Task<TaskDto> UpdateAsync(Guid id, UpdateTaskDto updateDto);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> MarkAsCompletedAsync(Guid id);
        Task<bool> MarkAsInProgressAsync(Guid id);
        Task<bool> AssignToAsync(Guid id, string assignedTo);
        Task<bool> UpdatePriorityAsync(Guid id, string priority);
        
        // Dashboard methods
        Task<object> GetTaskStatsAsync();
        Task<IEnumerable<TaskDto>> GetOverdueTasksAsync();
        Task<IEnumerable<TaskDto>> GetTodayTasksAsync();
        Task<IEnumerable<TaskDto>> GetUpcomingTasksAsync(int days = 7);
        
        // Recurring tasks
        Task<bool> CreateRecurringTaskAsync(CreateTaskDto createDto);
        Task<bool> UpdateRecurringTaskAsync(Guid id, UpdateTaskDto updateDto);
    }
} 