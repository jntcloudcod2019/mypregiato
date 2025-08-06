using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Data;

namespace Pregiato.Infrastructure.Repositories
{
    public class LeadRepository : ILeadRepository
    {
        private readonly PregiatoDbContext _context;

        public LeadRepository(PregiatoDbContext context)
        {
            _context = context;
        }

        public async Task<Lead?> GetByIdAsync(Guid id)
        {
            return await _context.Leads
                .Include(l => l.Interactions)
                .Include(l => l.Tasks)
                .FirstOrDefaultAsync(l => l.Id == id);
        }

        public async Task<IEnumerable<Lead>> GetAllAsync()
        {
            return await _context.Leads
                .Include(l => l.Interactions)
                .Include(l => l.Tasks)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Lead>> GetFilteredAsync(string? searchTerm, string? status, string? assignedTo, string? source, string? priority, DateTime? startDate, DateTime? endDate, bool? isActive, int page, int pageSize)
        {
            var query = _context.Leads
                .Include(l => l.Interactions)
                .Include(l => l.Tasks)
                .AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(l => l.Name.Contains(searchTerm) || 
                                       l.Email.Contains(searchTerm) || 
                                       l.Company.Contains(searchTerm));
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(l => l.Status == status);
            }

            if (!string.IsNullOrEmpty(assignedTo))
            {
                query = query.Where(l => l.AssignedTo == assignedTo);
            }

            if (!string.IsNullOrEmpty(source))
            {
                query = query.Where(l => l.Source == source);
            }

            if (!string.IsNullOrEmpty(priority))
            {
                query = query.Where(l => l.Priority == priority);
            }

            if (startDate.HasValue)
            {
                query = query.Where(l => l.CreatedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(l => l.CreatedAt <= endDate.Value);
            }

            if (isActive.HasValue)
            {
                query = query.Where(l => l.IsActive == isActive.Value);
            }

            return await query
                .OrderByDescending(l => l.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<Lead> CreateAsync(Lead lead)
        {
            _context.Leads.Add(lead);
            await _context.SaveChangesAsync();
            return lead;
        }

        public async Task<Lead> UpdateAsync(Lead lead)
        {
            lead.UpdatedAt = DateTime.UtcNow;
            _context.Leads.Update(lead);
            await _context.SaveChangesAsync();
            return lead;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null) return false;

            _context.Leads.Remove(lead);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(Guid id)
        {
            return await _context.Leads.AnyAsync(l => l.Id == id);
        }

        public async Task<int> GetTotalCountAsync()
        {
            return await _context.Leads.CountAsync();
        }

        public async Task<IEnumerable<Lead>> GetByStatusAsync(string status)
        {
            return await _context.Leads
                .Where(l => l.Status == status)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Lead>> GetByAssignedToAsync(string assignedTo)
        {
            return await _context.Leads
                .Where(l => l.AssignedTo == assignedTo)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Lead>> GetBySourceAsync(string source)
        {
            return await _context.Leads
                .Where(l => l.Source == source)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Lead>> GetOverdueFollowUpsAsync()
        {
            var today = DateTime.UtcNow.Date;
            return await _context.Leads
                .Where(l => l.NextFollowUpDate.HasValue && l.NextFollowUpDate.Value.Date < today)
                .OrderBy(l => l.NextFollowUpDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Lead>> GetRecentLeadsAsync(int count)
        {
            return await _context.Leads
                .OrderByDescending(l => l.CreatedAt)
                .Take(count)
                .ToListAsync();
        }

        public async Task<Lead?> GetByMetaLeadIdAsync(string metaLeadId)
        {
            return await _context.Leads
                .FirstOrDefaultAsync(l => l.MetaLeadId == metaLeadId);
        }
    }
} 