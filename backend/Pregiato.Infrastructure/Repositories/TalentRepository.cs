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
        return await _context.Talents
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<Talent?> GetByIdAsync(Guid id)
    {
        return await _context.Talents.FindAsync(id);
    }

    public async Task<Talent> CreateAsync(Talent talent)
    {
        _context.Talents.Add(talent);
        await _context.SaveChangesAsync();
        return talent;
    }

    public async Task<Talent?> UpdateAsync(Talent talent)
    {
        var existingTalent = await _context.Talents.FindAsync(talent.Id);
        if (existingTalent == null)
            return null;

        _context.Entry(existingTalent).CurrentValues.SetValues(talent);
        await _context.SaveChangesAsync();
        return existingTalent;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var talent = await _context.Talents.FindAsync(id);
        if (talent == null)
            return false;

        _context.Talents.Remove(talent);
        await _context.SaveChangesAsync();
        return true;
    }
} 