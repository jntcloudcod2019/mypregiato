using Pregiato.Application.DTOs;

namespace Pregiato.Application.Interfaces
{
    public interface ILeadService
    {
        Task<LeadDto> GetByIdAsync(Guid id);
        Task<IEnumerable<LeadDto>> GetAllAsync();
        Task<IEnumerable<LeadDto>> GetFilteredAsync(LeadFilterDto filter);
        Task<LeadDto> CreateAsync(CreateLeadDto createDto);
        Task<LeadDto> UpdateAsync(Guid id, UpdateLeadDto updateDto);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> UpdateStatusAsync(Guid id, string status);
        Task<bool> AssignToAsync(Guid id, string assignedTo);
        Task<LeadDto> AddInteractionAsync(Guid leadId, CreateLeadInteractionDto interactionDto);
        Task<IEnumerable<LeadInteractionDto>> GetInteractionsAsync(Guid leadId);
        Task<IEnumerable<TaskDto>> GetTasksAsync(Guid leadId);
        Task<LeadDto> AddTaskAsync(Guid leadId, CreateTaskDto taskDto);
        
        // Dashboard methods
        Task<object> GetDashboardStatsAsync();
        Task<object> GetFunnelDataAsync();
        Task<IEnumerable<LeadDto>> GetRecentInteractionsAsync(int count = 10);
        Task<IEnumerable<TaskDto>> GetTodayTasksAsync();
        
        // Meta Integration
        Task<LeadDto> CreateFromMetaAsync(CreateLeadDto createDto, string metaLeadId);
        Task<bool> SyncWithMetaAsync(Guid leadId);
        Task<IEnumerable<LeadDto>> GetLeadsFromMetaAsync();
    }
} 