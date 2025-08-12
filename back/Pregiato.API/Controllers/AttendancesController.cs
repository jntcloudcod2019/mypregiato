using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Pregiato.API.Hubs;
using Pregiato.API.Services;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendancesController : ControllerBase
    {
        private readonly AttendanceService _attendance;
        private readonly IHubContext<WhatsAppHub> _hub;

        public AttendancesController(AttendanceService attendance, IHubContext<WhatsAppHub> hub)
        {
            _attendance = attendance;
            _hub = hub;
        }

        [HttpPost("{chatId}/assign")]
        public async Task<IActionResult> Assign(Guid chatId, [FromBody] AssignRequest req)
        {
            var t = await _attendance.AssignAsync(chatId, req.OperatorId, req.OperatorName);
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


