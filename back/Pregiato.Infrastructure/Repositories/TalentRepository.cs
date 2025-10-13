using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;
using Pregiato.Core.Interfaces;

namespace Pregiato.Infrastructure.Repositories;

public class TalentRepository : ITalentRepository
{
    private readonly PregiatoDbContext _context;

    public TalentRepository(PregiatoDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Talent>> GetAllAsync()
    {
        return await _context.Talent
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<Talent?> GetByIdAsync(Guid id)
    {
        return await _context.Talent.FindAsync(id);
    }

    public async Task<Talent> CreateAsync(Talent talent)
    {
        _context.Talent.Add(talent);
        await _context.SaveChangesAsync();
        
        // Criar automaticamente o TalentDNA associado com apenas o TalentId
        var talentDna = new TalentDNA
        {
            Id = Guid.NewGuid(),
            TalentId = talent.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
            // Todos os outros campos ficam null/blank para serem preenchidos posteriormente
        };
        
        _context.TalentDNA.Add(talentDna);
        await _context.SaveChangesAsync();
        
        return talent;
    }

    public async Task<Talent?> UpdateAsync(Talent talent)
    {
        var existingTalent = await _context.Talent.FindAsync(talent.Id);
        if (existingTalent == null)
            return null;

        _context.Entry(existingTalent).CurrentValues.SetValues(talent);
        await _context.SaveChangesAsync();
        return existingTalent;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var talent = await _context.Talent.FindAsync(id);
        if (talent == null)
            return false;

        _context.Talent.Remove(talent);
        await _context.SaveChangesAsync();
        return true;
    }
} 