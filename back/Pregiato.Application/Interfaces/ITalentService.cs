using Pregiato.Application.DTOs;

namespace Pregiato.Application.Interfaces;

public interface ITalentService
{
    Task<PaginatedResponseDto<TalentDto>> GetAllPaginatedAsync(int page, int pageSize, string? search = null, string? sortBy = null, bool sortDescending = false);
    Task<TalentDto?> GetByIdAsync(Guid id);
    Task<TalentDto> CreateAsync(CreateTalentDto dto);
    Task<TalentDto?> UpdateAsync(Guid id, UpdateTalentDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> CheckExistsAsync(string? email = null, string? document = null);
} 