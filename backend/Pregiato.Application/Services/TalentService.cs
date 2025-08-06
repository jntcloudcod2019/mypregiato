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

    public async Task<PaginatedResponseDto<TalentDto>> GetAllPaginatedAsync(int page = 1, int pageSize = 20, string? searchTerm = null, string? sortBy = null, bool sortDescending = false)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        
        try
        {
            // Validar parâmetros
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100); // Máximo 100 registros por página
            
            // Construir query base
            var query = _context.Talents.AsQueryable();
            
            // Aplicar filtro de busca se fornecido
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(t => 
                    t.FullName.ToLower().Contains(searchTerm) ||
                    t.Email.ToLower().Contains(searchTerm) ||
                    t.Phone.ToLower().Contains(searchTerm) ||
                    t.City.ToLower().Contains(searchTerm) ||
                    t.State.ToLower().Contains(searchTerm)
                );
            }
            
            // Aplicar ordenação
            query = sortBy?.ToLower() switch
            {
                "name" => sortDescending ? query.OrderByDescending(t => t.FullName) : query.OrderBy(t => t.FullName),
                "email" => sortDescending ? query.OrderByDescending(t => t.Email) : query.OrderBy(t => t.Email),
                "city" => sortDescending ? query.OrderByDescending(t => t.City) : query.OrderBy(t => t.City),
                "age" => sortDescending ? query.OrderByDescending(t => t.Age) : query.OrderBy(t => t.Age),
                "created" => sortDescending ? query.OrderByDescending(t => t.CreatedAt) : query.OrderBy(t => t.CreatedAt),
                _ => query.OrderByDescending(t => t.CreatedAt) // Ordenação padrão
            };
            
            // Contar total de registros
            var total = await query.CountAsync();
            
            // Calcular informações de paginação
            var totalPages = (int)Math.Ceiling((double)total / pageSize);
            var skip = (page - 1) * pageSize;
            
            // Aplicar paginação
            var talents = await query
                .Skip(skip)
                .Take(pageSize)
                .ToListAsync();
            
            // Mapear para DTOs
            var talentDtos = _mapper.Map<List<TalentDto>>(talents);
            
            stopwatch.Stop();
            
            return new PaginatedResponseDto<TalentDto>
            {
                Data = talentDtos,
                Total = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages,
                HasNextPage = page < totalPages,
                HasPreviousPage = page > 1,
                NextPageUrl = page < totalPages ? $"?page={page + 1}&pageSize={pageSize}" : null,
                PreviousPageUrl = page > 1 ? $"?page={page - 1}&pageSize={pageSize}" : null,
                ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                RecordsReturned = talentDtos.Count
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar talentos paginados");
            stopwatch.Stop();
            
            return new PaginatedResponseDto<TalentDto>
            {
                Data = new List<TalentDto>(),
                Total = 0,
                Page = page,
                PageSize = pageSize,
                TotalPages = 0,
                HasNextPage = false,
                HasPreviousPage = false,
                ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                RecordsReturned = 0
            };
        }
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