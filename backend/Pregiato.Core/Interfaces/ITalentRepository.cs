using Pregiato.Core.Entities;

namespace Pregiato.Core.Interfaces;

public interface ITalentRepository
{
    Task<IEnumerable<Talent>> GetAllAsync();
    Task<Talent?> GetByIdAsync(Guid id);
    Task<Talent> CreateAsync(Talent talent);
    Task<Talent?> UpdateAsync(Talent talent);
    Task<bool> DeleteAsync(Guid id);
} 