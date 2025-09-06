using Microsoft.AspNetCore.Mvc;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/operator-leads")]
    public class OperatorLeadsController : ControllerBase
    {
        private readonly IOperatorLeadsService _operatorLeadsService;

        public OperatorLeadsController(IOperatorLeadsService operatorLeadsService)
        {
            _operatorLeadsService = operatorLeadsService;
        }

        [HttpPost("allocate")]
        public async Task<IActionResult> AllocateLeads([FromBody] BulkOperatorLeadsDto bulkDto)
        {
            try
            {
                if (bulkDto == null)
                {
                    return BadRequest("Payload não pode ser nulo");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _operatorLeadsService.AllocateLeadsAsync(bulkDto);
                
                if (result)
                {
                    return Ok(new { 
                        success = true, 
                        message = "Leads alocados com sucesso",
                        totalOperators = bulkDto.Operators?.Count ?? 0,
                        totalLeads = bulkDto.Operators?.Sum(op => op.Leads?.Count ?? 0) ?? 0
                    });
                }
                
                return BadRequest("Falha ao alocar leads");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erro interno do servidor", details = ex.Message });
            }
        }

        [HttpPost("allocate-single")]
        public async Task<IActionResult> AllocateSingleLead([FromBody] OperatorLeadsDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest("Payload não pode ser nulo");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _operatorLeadsService.AllocateSingleLeadAsync(dto);
                
                if (result)
                {
                    return Ok(new { success = true, message = "Lead alocado com sucesso" });
                }
                
                return BadRequest("Falha ao alocar lead");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erro interno do servidor", details = ex.Message });
            }
        }

        [HttpGet("by-operator/{operatorId}")]
        public async Task<IActionResult> GetLeadsByOperator(string operatorId)
        {
            try
            {
                var leads = await _operatorLeadsService.GetLeadsByOperatorAsync(operatorId);
                return Ok(new { success = true, data = leads });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erro interno do servidor", details = ex.Message });
            }
        }

        [HttpGet("by-email/{emailOperator}")]
        public async Task<IActionResult> GetLeadsByEmailOperator(string emailOperator)
        {
            try
            {
                if (string.IsNullOrEmpty(emailOperator))
                {
                    return BadRequest("Email do operador não pode estar vazio");
                }

                var leads = await _operatorLeadsService.GetLeadsByEmailOperatorAsync(emailOperator);
                var count = await _operatorLeadsService.GetLeadsCountByEmailOperatorAsync(emailOperator);
                
                return Ok(new { 
                    success = true, 
                    data = leads,
                    count = count,
                    message = $"Encontrados {count} leads para o operador {emailOperator}"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erro interno do servidor", details = ex.Message });
            }
        }

        [HttpGet("count-by-operator/{operatorId}")]
        public async Task<IActionResult> GetLeadsCountByOperator(string operatorId)
        {
            try
            {
                var count = await _operatorLeadsService.GetLeadsCountByOperatorAsync(operatorId);
                return Ok(new { success = true, count = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erro interno do servidor", details = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLead(Guid id)
        {
            try
            {
                var result = await _operatorLeadsService.DeleteLeadAsync(id);
                
                if (result)
                {
                    return Ok(new { success = true, message = "Lead removido com sucesso" });
                }
                
                return NotFound("Lead não encontrado");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erro interno do servidor", details = ex.Message });
            }
        }

        [HttpPut("update-tracking")]
        public async Task<IActionResult> UpdateLeadTracking([FromBody] UpdateLeadTrackingDto updateDto)
        {
            try
            {
                Console.WriteLine($"[LOG] UpdateLeadTracking - Iniciando requisição");
                Console.WriteLine($"[LOG] Payload recebido: {System.Text.Json.JsonSerializer.Serialize(updateDto)}");

                if (updateDto == null)
                {
                    Console.WriteLine($"[LOG] Erro: Payload é nulo");
                    return BadRequest("Payload não pode ser nulo");
                }

                if (!ModelState.IsValid)
                {
                    Console.WriteLine($"[LOG] Erro: ModelState inválido - {string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))}");
                    return BadRequest(ModelState);
                }

                Console.WriteLine($"[LOG] Chamando service UpdateLeadTrackingAsync");
                var result = await _operatorLeadsService.UpdateLeadTrackingAsync(updateDto);
                Console.WriteLine($"[LOG] Service retornou com sucesso");
                
                return Ok(new { 
                    success = true, 
                    message = "Lead atualizado com sucesso",
                    data = result
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Erro interno do servidor", details = ex.Message });
            }
        }
    }
}
