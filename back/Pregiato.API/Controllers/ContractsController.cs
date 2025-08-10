using Microsoft.AspNetCore.Mvc;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Application.Validators;
using FluentValidation;

namespace Pregiato.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContractsController : ControllerBase
{
    private readonly IContractService _contractService;
    private readonly ILogger<ContractsController> _logger;

    public ContractsController(IContractService contractService, ILogger<ContractsController> logger)
    {
        _contractService = contractService;
        _logger = logger;
    }

    /// <summary>
    /// Obtém todos os contratos
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ContractDto>>> GetContracts()
    {
        try
        {
            var contracts = await _contractService.GetAllContractsAsync();
            return Ok(contracts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar contratos");
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Obtém um contrato por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ContractDto>> GetContract(Guid id)
    {
        try
        {
            var contract = await _contractService.GetContractByIdAsync(id);
            if (contract == null)
                return NotFound(new { error = "Contrato não encontrado" });

            return Ok(contract);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar contrato {Id}", id);
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Cria um novo contrato
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ContractDto>> CreateContract(CreateContractDto dto)
    {
        try
        {
            var contract = await _contractService.CreateContractAsync(dto);
            return CreatedAtAction(nameof(GetContract), new { id = contract.Id }, contract);
        }
        catch (FluentValidation.ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar contrato");
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Atualiza um contrato
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ContractDto>> UpdateContract(Guid id, UpdateContractDto dto)
    {
        try
        {
            var contract = await _contractService.UpdateContractAsync(id, dto);
            return Ok(contract);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (FluentValidation.ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar contrato {Id}", id);
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Remove um contrato
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteContract(Guid id)
    {
        try
        {
            var success = await _contractService.DeleteContractAsync(id);
            if (!success)
                return NotFound(new { error = "Contrato não encontrado" });

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao deletar contrato {Id}", id);
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Gera PDF do contrato
    /// </summary>
    [HttpPost("{id}/generate-pdf")]
    public async Task<IActionResult> GenerateContractPdf(Guid id, [FromQuery] string contractType)
    {
        try
        {
            var pdfBytes = await _contractService.GenerateContractPdfAsync(id, contractType);
            
            var fileName = $"contract_{id}_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
            
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao gerar PDF do contrato {Id}", id);
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Obtém templates de contrato
    /// </summary>
    [HttpGet("templates")]
    public async Task<ActionResult<IEnumerable<ContractTemplateDto>>> GetContractTemplates()
    {
        try
        {
            var templates = await _contractService.GetContractTemplatesAsync();
            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar templates de contrato");
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Cria um novo template de contrato
    /// </summary>
    [HttpPost("templates")]
    public async Task<ActionResult<ContractTemplateDto>> CreateContractTemplate(CreateContractTemplateDto dto)
    {
        try
        {
            var template = await _contractService.CreateContractTemplateAsync(dto);
            return CreatedAtAction(nameof(GetContractTemplates), template);
        }
        catch (FluentValidation.ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar template de contrato");
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }
} 