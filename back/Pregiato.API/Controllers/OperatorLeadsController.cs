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
                // ✅ DEBUG: Log do payload recebido
                Console.WriteLine($"🔍 DEBUG Controller: Payload recebido - Operators count: {bulkDto?.Operators?.Count ?? 0}");
                
                if (bulkDto?.Operators != null)
                {
                    foreach (var op in bulkDto.Operators)
                    {
                        Console.WriteLine($"🔍 DEBUG Controller: Operator - OperatorId='{op.OperatorId}', EmailOperator='{op.EmailOperator}', LeadsCount={op.Leads?.Count ?? 0}");
                    }
                }
                
                if (bulkDto == null)
                {
                    return BadRequest("Payload não pode ser nulo");
                }

                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                    Console.WriteLine($"❌ DEBUG Controller: ModelState inválido: {string.Join(", ", errors)}");
                    
                    // ✅ DEBUG: Log detalhado de cada erro
                    foreach (var error in errors)
                    {
                        Console.WriteLine($"❌ DEBUG Controller: Erro de validação: {error}");
                    }
                    
                    return BadRequest(new { 
                        success = false, 
                        message = "Dados inválidos", 
                        errors = errors 
                    });
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
        
        // ============================================================================
        // SCHEDULING FEATURE - API ENDPOINTS
        // ============================================================================
        
        /// <summary>
        /// Gets Kanban board data for scheduling page
        /// Returns leads grouped by status: new, scheduled, pending (descending order)
        /// </summary>
        /// <param name="emailOperator">Operator email for data filtering</param>
        [HttpGet("kanban/{emailOperator}")]
        public async Task<IActionResult> GetKanbanData(string emailOperator)
        {
            try
            {
                if (string.IsNullOrEmpty(emailOperator))
                {
                    return BadRequest(new { success = false, message = "Email do operador é obrigatório" });
                }
                
                Console.WriteLine($"[SCHEDULING] GET kanban/{emailOperator} - Fetching Kanban data");
                
                var kanbanData = await _operatorLeadsService.GetKanbanDataAsync(emailOperator);
                
                Console.WriteLine($"[SCHEDULING] Kanban data retrieved successfully - {kanbanData.TotalLeads} leads");
                
                return Ok(new
                {
                    success = true,
                    data = kanbanData,
                    message = $"Kanban data retrieved for {emailOperator}"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SCHEDULING] Error in GetKanbanData: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Erro ao obter dados do Kanban", details = ex.Message });
            }
        }
        
        /// <summary>
        /// Gets dashboard metrics for scheduling page
        /// Returns scheduled and pending counts by period (day, week, month)
        /// </summary>
        /// <param name="emailOperator">Operator email for metrics calculation</param>
        [HttpGet("dashboard/{emailOperator}")]
        public async Task<IActionResult> GetDashboard(string emailOperator)
        {
            try
            {
                if (string.IsNullOrEmpty(emailOperator))
                {
                    return BadRequest(new { success = false, message = "Email do operador é obrigatório" });
                }
                
                Console.WriteLine($"[SCHEDULING] GET dashboard/{emailOperator} - Fetching dashboard metrics");
                
                var dashboard = await _operatorLeadsService.GetDashboardMetricsAsync(emailOperator);
                
                Console.WriteLine($"[SCHEDULING] Dashboard metrics retrieved - Scheduled today: {dashboard.ScheduledToday}, Pending today: {dashboard.PendingToday}");
                
                return Ok(new
                {
                    success = true,
                    data = dashboard,
                    message = $"Dashboard metrics retrieved for {emailOperator}"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SCHEDULING] Error in GetDashboard: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Erro ao obter métricas do dashboard", details = ex.Message });
            }
        }
        
        /// <summary>
        /// Gets paginated Kanban board data for scheduling page
        /// Supports independent pagination for each column
        /// </summary>
        /// <param name="emailOperator">Operator email for data filtering</param>
        /// <param name="newPage">Page number for 'new' column (default: 1)</param>
        /// <param name="newPageSize">Page size for 'new' column (default: 20)</param>
        /// <param name="scheduledPage">Page number for 'scheduled' column (default: 1)</param>
        /// <param name="scheduledPageSize">Page size for 'scheduled' column (default: 20)</param>
        /// <param name="pendingPage">Page number for 'pending' column (default: 1)</param>
        /// <param name="pendingPageSize">Page size for 'pending' column (default: 20)</param>
        [HttpGet("kanban/paginated/{emailOperator}")]
        public async Task<IActionResult> GetPaginatedKanbanData(
            string emailOperator,
            [FromQuery] int newPage = 1,
            [FromQuery] int newPageSize = 20,
            [FromQuery] int scheduledPage = 1,
            [FromQuery] int scheduledPageSize = 20,
            [FromQuery] int pendingPage = 1,
            [FromQuery] int pendingPageSize = 20)
        {
            try
            {
                if (string.IsNullOrEmpty(emailOperator))
                {
                    return BadRequest(new { success = false, message = "Email do operador é obrigatório" });
                }
                
                Console.WriteLine($"[SCHEDULING] GET kanban/paginated/{emailOperator} - Fetching paginated Kanban");
                
                // Build pagination dictionary for each column
                var columnPagination = new Dictionary<string, PaginationRequest>
                {
                    ["new"] = new PaginationRequest { Page = newPage, PageSize = newPageSize },
                    ["scheduled"] = new PaginationRequest { Page = scheduledPage, PageSize = scheduledPageSize },
                    ["pending"] = new PaginationRequest { Page = pendingPage, PageSize = pendingPageSize }
                };
                
                var paginatedKanban = await _operatorLeadsService.GetPaginatedKanbanDataAsync(emailOperator, columnPagination);
                
                Console.WriteLine($"[SCHEDULING] Paginated Kanban data retrieved successfully - {paginatedKanban.TotalLeads} total leads");
                
                return Ok(new
                {
                    success = true,
                    data = paginatedKanban,
                    message = $"Paginated Kanban data retrieved for {emailOperator}"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SCHEDULING] Error in GetPaginatedKanbanData: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Erro ao obter dados paginados do Kanban", details = ex.Message });
            }
        }
    }
}
