using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace Pregiato.Application.Services;

public class TalentService : ITalentService
{
    private readonly PregiatoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<TalentService> _logger;

    public TalentService(
        PregiatoDbContext context,
        IMapper mapper,
        ILogger<TalentService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<IEnumerable<TalentDto>> GetAllAsync()
    {
        var talents = await _context.Talents
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<TalentDto>>(talents);
    }

    public async Task<TalentDto?> GetByIdAsync(Guid id)
    {
        var talent = await _context.Talents.FindAsync(id);
        return _mapper.Map<TalentDto>(talent);
    }

    public async Task<TalentDto> CreateAsync(CreateTalentDto dto)
    {
        var talent = _mapper.Map<Talent>(dto);
        talent.Id = Guid.NewGuid();
        talent.CreatedAt = DateTime.UtcNow;
        talent.UpdatedAt = DateTime.UtcNow;

        _context.Talents.Add(talent);
        await _context.SaveChangesAsync();

        return _mapper.Map<TalentDto>(talent);
    }

    public async Task<TalentDto?> UpdateAsync(Guid id, UpdateTalentDto dto)
    {
        var talent = await _context.Talents.FindAsync(id);
        if (talent == null)
            return null;

        _mapper.Map(dto, talent);
        talent.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return _mapper.Map<TalentDto>(talent);
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