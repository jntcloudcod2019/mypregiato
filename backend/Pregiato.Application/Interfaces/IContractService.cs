using Pregiato.Application.DTOs;

namespace Pregiato.Application.Interfaces;

public interface IContractService
{
    Task<IEnumerable<ContractDto>> GetAllContractsAsync();
    Task<ContractDto?> GetContractByIdAsync(Guid id);
    Task<ContractDto> CreateContractAsync(CreateContractDto dto);
    Task<ContractDto> UpdateContractAsync(Guid id, UpdateContractDto dto);
    Task<bool> DeleteContractAsync(Guid id);
    Task<byte[]> GenerateContractPdfAsync(Guid contractId, string contractType);
    Task<IEnumerable<ContractTemplateDto>> GetContractTemplatesAsync();
    Task<ContractTemplateDto> CreateContractTemplateAsync(CreateContractTemplateDto dto);
} 