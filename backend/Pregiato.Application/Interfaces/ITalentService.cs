using Pregiato.Application.DTOs;

namespace Pregiato.Application.Interfaces;

public interface ITalentService
{
    Task<IEnumerable<TalentDto>> GetAllAsync();
    Task<TalentDto?> GetByIdAsync(Guid id);
    Task<TalentDto> CreateAsync(CreateTalentDto dto);
    Task<TalentDto?> UpdateAsync(Guid id, UpdateTalentDto dto);
    Task<bool> DeleteAsync(Guid id);
} 