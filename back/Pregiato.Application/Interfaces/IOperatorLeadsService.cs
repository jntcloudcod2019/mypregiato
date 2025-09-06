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
    }
}
