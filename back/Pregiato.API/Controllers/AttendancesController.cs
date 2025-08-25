using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Pregiato.API.Hubs;
using Pregiato.API.Services;
using Pregiato.Infrastructure.Data;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendancesController : ControllerBase
    {
        private readonly AttendanceService _attendance;
        private readonly IHubContext<WhatsAppHub> _hub;
        private readonly PregiatoDbContext _context;
        private readonly ILogger<AttendancesController> _logger;

        public AttendancesController(AttendanceService attendance, IHubContext<WhatsAppHub> hub, PregiatoDbContext context, ILogger<AttendancesController> logger)
        {
            _attendance = attendance;
            _hub = hub;
            _context = context;
            _logger = logger;
        }

        [HttpPost("{chatId}/assign")]
        public async Task<IActionResult> Assign(Guid chatId, [FromBody] AssignRequest req)
        {
            // Buscar o ChatLog correspondente ao chatId
            var chatLog = await _context.ChatLogs.FirstOrDefaultAsync(c => c.ChatId == chatId);
            if (chatLog == null)
            {
                return BadRequest(new { error = "Chat não encontrado" });
            }
            
            var t = await _attendance.AssignAsync(chatId, req.OperatorId, req.OperatorName, chatLog.Id);
            await EmitDashboardAsync();
            await _hub.Clients.Group("whatsapp").SendAsync("attendance.assigned", new { chatId, req.OperatorId, req.OperatorName, startedAt = t.StartedAtUtc });
            return Ok(new { success = true });
        }

        [HttpPost("{chatId}/step")]
        public async Task<IActionResult> Step(Guid chatId, [FromBody] StepRequest req)
        {
            await _attendance.UpdateStepAsync(chatId, req.Step);
            await _hub.Clients.Group("whatsapp").SendAsync("attendance.step", new { chatId, step = req.Step });
            return Ok(new { success = true });
        }

        [HttpPost("{chatId}/close")]
        public async Task<IActionResult> Close(Guid chatId, [FromBody] CloseRequest req)
        {
            try
            {
                // Buscar o ChatLog correspondente ao chatId
                var chatLog = await _context.ChatLogs.FirstOrDefaultAsync(c => c.ChatId == chatId);
                if (chatLog == null)
                {
                    return BadRequest(new { error = "Chat não encontrado" });
                }

                // Encerrar o atendimento
                await _attendance.CloseAsync(chatId, req.Reason);
                
                // Salvar definitivamente as mensagens no banco
                // O PayloadJson já contém todas as mensagens acumuladas
                chatLog.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                
                await EmitDashboardAsync();
                await _hub.Clients.Group("whatsapp").SendAsync("attendance.closed", new { 
                    chatId, 
                    reason = req.Reason, 
                    closedAt = DateTime.UtcNow 
                });
                
                return Ok(new { success = true, message = "Atendimento encerrado e mensagens salvas" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao encerrar atendimento para chat {ChatId}", chatId);
                return StatusCode(500, new { error = "Erro interno ao encerrar atendimento" });
            }
        }

        public class CloseRequest
        {
            public string? Reason { get; set; }
        }

        [HttpPost("{chatId}/finalize")]
        public async Task<IActionResult> Finalize(Guid chatId, [FromBody] FinalizeRequest req)
        {
            var t = await _attendance.FinalizeAsync(chatId, req.Description, req.Verified);
            await EmitDashboardAsync();
            await _hub.Clients.Group("whatsapp").SendAsync("attendance.finalized", new { chatId, description = req.Description, verified = req.Verified, endedAt = t.EndedAtUtc });
            return Ok(new { success = true });
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            var (inQueue, inService, avg) = await _attendance.GetDashboardAsync();
            return Ok(new { inQueue, inService, avgServiceTimeSec = avg });
        }

        private async Task EmitDashboardAsync()
        {
            var (inQueue, inService, avg) = await _attendance.GetDashboardAsync();
            await _hub.Clients.Group("whatsapp").SendAsync("dashboard.update", new { inQueue, inService, avgServiceTimeSec = avg });
        }
    }

    public record AssignRequest(string? OperatorId, string? OperatorName);
    public record StepRequest(int Step);
    public record FinalizeRequest(string? Description, bool Verified);
}


