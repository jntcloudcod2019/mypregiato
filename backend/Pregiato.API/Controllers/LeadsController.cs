using Microsoft.AspNetCore.Mvc;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeadsController : ControllerBase
    {
        private readonly ILeadService _leadService;

        public LeadsController(ILeadService leadService)
        {
            _leadService = leadService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LeadDto>>> GetAll([FromQuery] LeadFilterDto filter)
        {
            try
            {
                var leads = await _leadService.GetFilteredAsync(filter);
                return Ok(leads);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar leads", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LeadDto>> GetById(Guid id)
        {
            try
            {
                var lead = await _leadService.GetByIdAsync(id);
                return Ok(lead);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar lead", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<LeadDto>> Create([FromBody] CreateLeadDto createDto)
        {
            try
            {
                var lead = await _leadService.CreateAsync(createDto);
                return CreatedAtAction(nameof(GetById), new { id = lead.Id }, lead);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao criar lead", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<LeadDto>> Update(Guid id, [FromBody] UpdateLeadDto updateDto)
        {
            try
            {
                var lead = await _leadService.UpdateAsync(id, updateDto);
                return Ok(lead);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao atualizar lead", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            try
            {
                var result = await _leadService.DeleteAsync(id);
                if (!result)
                    return NotFound(new { message = "Lead não encontrado" });

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao deletar lead", error = ex.Message });
            }
        }

        [HttpPatch("{id}/status")]
        public async Task<ActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusDto updateStatusDto)
        {
            try
            {
                var result = await _leadService.UpdateStatusAsync(id, updateStatusDto.Status);
                if (!result)
                    return NotFound(new { message = "Lead não encontrado" });

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao atualizar status", error = ex.Message });
            }
        }

        [HttpPatch("{id}/assign")]
        public async Task<ActionResult> AssignTo(Guid id, [FromBody] AssignToDto assignToDto)
        {
            try
            {
                var result = await _leadService.AssignToAsync(id, assignToDto.AssignedTo);
                if (!result)
                    return NotFound(new { message = "Lead não encontrado" });

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao atribuir lead", error = ex.Message });
            }
        }

        [HttpGet("{id}/interactions")]
        public async Task<ActionResult<IEnumerable<LeadInteractionDto>>> GetInteractions(Guid id)
        {
            try
            {
                var interactions = await _leadService.GetInteractionsAsync(id);
                return Ok(interactions);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar interações", error = ex.Message });
            }
        }

        [HttpPost("{id}/interactions")]
        public async Task<ActionResult<LeadDto>> AddInteraction(Guid id, [FromBody] CreateLeadInteractionDto interactionDto)
        {
            try
            {
                var lead = await _leadService.AddInteractionAsync(id, interactionDto);
                return Ok(lead);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao adicionar interação", error = ex.Message });
            }
        }

        [HttpGet("{id}/tasks")]
        public async Task<ActionResult<IEnumerable<TaskDto>>> GetTasks(Guid id)
        {
            try
            {
                var tasks = await _leadService.GetTasksAsync(id);
                return Ok(tasks);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar tarefas", error = ex.Message });
            }
        }

        [HttpPost("{id}/tasks")]
        public async Task<ActionResult<LeadDto>> AddTask(Guid id, [FromBody] CreateTaskDto taskDto)
        {
            try
            {
                var lead = await _leadService.AddTaskAsync(id, taskDto);
                return Ok(lead);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao adicionar tarefa", error = ex.Message });
            }
        }

        [HttpGet("dashboard/stats")]
        public async Task<ActionResult<object>> GetDashboardStats()
        {
            try
            {
                var stats = await _leadService.GetDashboardStatsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar estatísticas", error = ex.Message });
            }
        }

        [HttpGet("dashboard/funnel")]
        public async Task<ActionResult<object>> GetFunnelData()
        {
            try
            {
                var funnelData = await _leadService.GetFunnelDataAsync();
                return Ok(funnelData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar dados do funil", error = ex.Message });
            }
        }

        [HttpGet("dashboard/recent-interactions")]
        public async Task<ActionResult<IEnumerable<LeadDto>>> GetRecentInteractions([FromQuery] int count = 10)
        {
            try
            {
                var leads = await _leadService.GetRecentInteractionsAsync(count);
                return Ok(leads);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar interações recentes", error = ex.Message });
            }
        }

        [HttpGet("meta")]
        public async Task<ActionResult<IEnumerable<LeadDto>>> GetLeadsFromMeta()
        {
            try
            {
                var leads = await _leadService.GetLeadsFromMetaAsync();
                return Ok(leads);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar leads do Meta", error = ex.Message });
            }
        }

        [HttpPost("meta/sync/{id}")]
        public async Task<ActionResult> SyncWithMeta(Guid id)
        {
            try
            {
                var result = await _leadService.SyncWithMetaAsync(id);
                if (!result)
                    return NotFound(new { message = "Lead não encontrado" });

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao sincronizar com Meta", error = ex.Message });
            }
        }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }

    public class AssignToDto
    {
        public string AssignedTo { get; set; } = string.Empty;
    }
} 