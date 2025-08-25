using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Pregiato.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Pregiato.Infrastructure.Data;

namespace Pregiato.API.Services
{
    public class AttendanceService
    {
        private readonly IMemoryCache _cache;
        private readonly PregiatoDbContext _context;

        public AttendanceService(IMemoryCache cache, PregiatoDbContext context)
        {
            _cache = cache;
            _context = context;
        }

        public async Task<AttendanceTicket> AssignAsync(Guid chatId, string operatorId, string operatorName, Guid chatLogId)
        {
            var ticket = await _context.AttendanceTickets
                .FirstOrDefaultAsync(t => t.ChatId == chatId && t.EndedAtUtc == null);

            if (ticket == null)
            {
                ticket = new AttendanceTicket
                {
                    Id = Guid.NewGuid(),
                    ChatId = chatId,
                    ChatLogId = chatLogId,
                    StartedAtUtc = DateTime.UtcNow,
                    OperatorId = operatorId,
                    OperatorName = operatorName,
                    CurrentStep = 0,
                    Status = AttendanceStatus.Novo
                };

                await _context.AttendanceTickets.AddAsync(ticket);
                await _context.SaveChangesAsync();
            }
            else
            {
                ticket.OperatorId = operatorId;
                ticket.OperatorName = operatorName;
                await _context.SaveChangesAsync();
            }

            return ticket;
        }

        public async Task UpdateStepAsync(Guid chatId, int step)
        {
            var ticket = await _context.AttendanceTickets
                .FirstOrDefaultAsync(t => t.ChatId == chatId && t.EndedAtUtc == null);

            if (ticket != null)
            {
                ticket.CurrentStep = step;
                await _context.SaveChangesAsync();
            }
        }

        public async Task CloseAsync(Guid chatId, string? reason = null)
        {
            var ticket = await _context.AttendanceTickets
                .FirstOrDefaultAsync(t => t.ChatId == chatId && t.EndedAtUtc == null);

            if (ticket != null)
            {
                ticket.EndedAtUtc = DateTime.UtcNow;
                ticket.Description = reason ?? "Atendimento encerrado";
                await _context.SaveChangesAsync();
            }
        }

        public async Task<AttendanceTicket> FinalizeAsync(Guid chatId, string description, bool verified)
        {
            var ticket = await _context.AttendanceTickets
                .FirstOrDefaultAsync(t => t.ChatId == chatId && t.EndedAtUtc == null);

            if (ticket != null)
            {
                ticket.EndedAtUtc = DateTime.UtcNow;
                ticket.Description = description;
                ticket.Verified = verified;
                await _context.SaveChangesAsync();
            }

            return ticket;
        }

        public async Task<(int inQueue, int inService, double avgServiceTime)> GetDashboardAsync()
        {
            // Implementação simplificada para obter estatísticas de atendimento
            var allTickets = await _context.AttendanceTickets.ToListAsync();
            
            int inQueue = 0; // Implemente lógica para contar chats na fila
            int inService = allTickets.Count(t => t.EndedAtUtc == null);
            
            // Calcula tempo médio de atendimento em segundos para tickets finalizados nas últimas 24h
            var completedRecently = allTickets
                .Where(t => t.EndedAtUtc != null && t.StartedAtUtc != null && 
                           t.EndedAtUtc > DateTime.UtcNow.AddHours(-24))
                .ToList();

            double avgTime = 0;
            if (completedRecently.Any())
            {
                avgTime = completedRecently
                    .Where(t => t.EndedAtUtc.HasValue && t.StartedAtUtc.HasValue)
                    .Average(t => ((DateTime)t.EndedAtUtc! - (DateTime)t.StartedAtUtc!).TotalSeconds);
            }

            return (inQueue, inService, avgTime);
        }
    }
}
