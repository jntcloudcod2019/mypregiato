using Pregiato.Application.DTOs;

namespace Pregiato.Application.Interfaces
{
    public interface IOperatorLeadsService
    {
        Task<bool> AllocateLeadsAsync(BulkOperatorLeadsDto bulkDto);
        Task<bool> AllocateSingleLeadAsync(OperatorLeadsDto dto);
        Task<IEnumerable<OperatorLeadsDto>> GetLeadsByOperatorAsync(string operatorId);
        Task<IEnumerable<OperatorLeadDto>> GetLeadsByEmailOperatorAsync(string emailOperator);
        Task<int> GetLeadsCountByOperatorAsync(string operatorId);
        Task<int> GetLeadsCountByEmailOperatorAsync(string emailOperator);
        Task<bool> DeleteLeadAsync(Guid id);
        
        // Método unificado para atualizar rastreamento
        Task<OperatorLeadWithTrackingDto> UpdateLeadTrackingAsync(UpdateLeadTrackingDto updateDto);
        
        // ✅ NEW METHODS FOR SCHEDULING FEATURE
        /// <summary>
        /// Gets Kanban board data for an operator (leads grouped by status)
        /// </summary>
        Task<KanbanDataDto> GetKanbanDataAsync(string emailOperator);
        
        /// <summary>
        /// Gets dashboard metrics for an operator
        /// </summary>
        Task<OperatorDashboardDto> GetDashboardMetricsAsync(string emailOperator);
        
        /// <summary>
        /// Gets paginated Kanban data for an operator
        /// </summary>
        Task<PaginatedKanbanDataDto> GetPaginatedKanbanDataAsync(string emailOperator, Dictionary<string, PaginationRequest> columnPagination);
    }
}
