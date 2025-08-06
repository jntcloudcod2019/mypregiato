using Microsoft.AspNetCore.Mvc;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Application.Validators;
using FluentValidation;
using System.ComponentModel.DataAnnotations;

namespace Pregiato.API.Controllers;

[ApiController]
[Route("api/talents")]
public class TalentsController : ControllerBase
{
    private readonly ITalentService _talentService;
    private readonly ILogger<TalentsController> _logger;

    public TalentsController(ITalentService talentService, ILogger<TalentsController> logger)
    {
        _talentService = talentService;
        _logger = logger;
    }

    /// <summary>
    /// Obtém todos os talentos com paginação
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResponseDto<TalentDto>>> GetTalents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false)
    {
        try
        {
            var result = await _talentService.GetAllPaginatedAsync(page, pageSize, search, sortBy, sortDescending);
            
            // Adicionar headers de performance
            Response.Headers.Add("X-Total-Count", result.Total.ToString());
            Response.Headers.Add("X-Page-Count", result.TotalPages.ToString());
            Response.Headers.Add("X-Execution-Time", $"{result.ExecutionTimeMs}ms");
            Response.Headers.Add("X-Records-Returned", result.RecordsReturned.ToString());
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar talentos");
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Obtém um talento por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TalentDto>> GetTalent(Guid id)
    {
        try
        {
            var talent = await _talentService.GetByIdAsync(id);
            if (talent == null)
                return NotFound(new { error = "Talento não encontrado" });

            return Ok(talent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar talento {Id}", id);
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Cria um novo talento
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TalentDto>> CreateTalent(CreateTalentDto dto)
    {
        try
        {
            var talent = await _talentService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetTalent), new { id = talent.Id }, talent);
        }
        catch (FluentValidation.ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar talento");
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Atualiza um talento
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<TalentDto>> UpdateTalent(Guid id, UpdateTalentDto dto)
    {
        try
        {
            var talent = await _talentService.UpdateAsync(id, dto);
            if (talent == null)
                return NotFound(new { error = "Talento não encontrado" });

            return Ok(talent);
        }
        catch (FluentValidation.ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar talento {Id}", id);
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Remove um talento
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTalent(Guid id)
    {
        try
        {
            var success = await _talentService.DeleteAsync(id);
            if (!success)
                return NotFound(new { error = "Talento não encontrado" });

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao deletar talento {Id}", id);
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }
} 