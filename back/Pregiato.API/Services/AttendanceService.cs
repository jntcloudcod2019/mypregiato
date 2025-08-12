using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;

namespace Pregiato.API.Services
{
    public class AttendanceService
    {
        private readonly PregiatoDbContext _db;
        private readonly ILogger<AttendanceService> _logger;

        public AttendanceService(PregiatoDbContext db, ILogger<AttendanceService> logger)
        {
            _db = db;
            _logger = logger;
        }

        private async Task<AttendanceTicket?> GetOpenTicketAsync(Guid chatId)
        {
            return await _db.AttendanceTickets
                .Where(t => t.ChatLogId == chatId && t.Status != AttendanceStatus.Finalizado)
                .OrderByDescending(t => t.CreatedAtUtc)
                .FirstOrDefaultAsync();
        }

        public async Task<AttendanceTicket> EnsureOpenTicketAsync(Guid chatId)
        {
            var open = await GetOpenTicketAsync(chatId);
            if (open != null) return open;
            var t = new AttendanceTicket { Id = Guid.NewGuid(), ChatLogId = chatId, Status = AttendanceStatus.Novo, Step = 1 };
            _db.AttendanceTickets.Add(t);
            await _db.SaveChangesAsync();
            return t;
        }

        public async Task<AttendanceTicket> AssignAsync(Guid chatId, string? operatorId, string? operatorName)
        {
            var t = await EnsureOpenTicketAsync(chatId);
            t.Status = AttendanceStatus.EmAtendimento;
            t.Step = 1;
            t.AssignedUserId = operatorId;
            t.AssignedUserName = operatorName;
            t.StartedAtUtc = t.StartedAtUtc ?? DateTime.UtcNow;
            t.UpdatedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return t;
        }

        public async Task<AttendanceTicket> UpdateStepAsync(Guid chatId, int step)
        {
            var t = await EnsureOpenTicketAsync(chatId);
            t.Step = Math.Clamp(step, 1, 4);
            if (t.Status == AttendanceStatus.Novo) t.Status = AttendanceStatus.EmAtendimento;
            t.UpdatedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return t;
        }

        public async Task<AttendanceTicket> FinalizeAsync(Guid chatId, string? description, bool verified)
        {
            var t = await EnsureOpenTicketAsync(chatId);
            t.Status = AttendanceStatus.Finalizado;
            t.Step = 4;
            t.Description = description;
            t.Verified = verified;
            t.EndedAtUtc = DateTime.UtcNow;
            t.UpdatedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return t;
        }

        public async Task<(int inQueue, int inService, double avgServiceSec)> GetDashboardAsync()
        {
            var inQueue = await _db.AttendanceTickets.CountAsync(t => t.Status == AttendanceStatus.Novo);
            var inService = await _db.AttendanceTickets.CountAsync(t => t.Status == AttendanceStatus.EmAtendimento);
            var active = await _db.AttendanceTickets.Where(t => t.Status == AttendanceStatus.EmAtendimento && t.StartedAtUtc != null).ToListAsync();
            double avg = 0;
            if (active.Count > 0)
            {
                var now = DateTime.UtcNow;
                avg = active.Average(t => (now - t.StartedAtUtc!.Value).TotalSeconds);
            }
            return (inQueue, inService, avg);
        }
    }
}


