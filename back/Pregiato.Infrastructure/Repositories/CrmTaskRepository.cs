using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Data;

namespace Pregiato.Infrastructure.Repositories
{
    public class CrmTaskRepository : ICrmTaskRepository
    {
        private readonly PregiatoDbContext _context;

        public CrmTaskRepository(PregiatoDbContext context)
        {
            _context = context;
        }

        public async Task<CrmTask?> GetByIdAsync(Guid id)
        {
            return await _context.Tasks
                .Include(t => t.Lead)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<IEnumerable<CrmTask>> GetAllAsync()
        {
            return await _context.Tasks
                .Include(t => t.Lead)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<CrmTask>> GetFilteredAsync(string? searchTerm, string? status, string? assignedTo, string? priority, string? category, Guid? leadId, DateTime? startDate, DateTime? endDate, bool? isOverdue, int page, int pageSize)
        {
            var query = _context.Tasks
                .Include(t => t.Lead)
                .AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(t => t.Title.Contains(searchTerm) || 
                                       t.Description.Contains(searchTerm));
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(t => t.Status == status);
            }

            if (!string.IsNullOrEmpty(assignedTo))
            {
                query = query.Where(t => t.AssignedTo == assignedTo);
            }

            if (!string.IsNullOrEmpty(priority))
            {
                query = query.Where(t => t.Priority == priority);
            }

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(t => t.Category == category);
            }

            if (leadId.HasValue)
            {
                query = query.Where(t => t.LeadId == leadId.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(t => t.CreatedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(t => t.CreatedAt <= endDate.Value);
            }

            if (isOverdue.HasValue && isOverdue.Value)
            {
                var today = DateTime.UtcNow.Date;
                query = query.Where(t => t.DueDate.HasValue && t.DueDate.Value.Date < today && t.Status != "Concluída");
            }

            return await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<CrmTask> CreateAsync(CrmTask task)
        {
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
            return task;
        }

        public async Task<CrmTask> UpdateAsync(CrmTask task)
        {
            task.UpdatedAt = DateTime.UtcNow;
            _context.Tasks.Update(task);
            await _context.SaveChangesAsync();
            return task;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return false;

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(Guid id)
        {
            return await _context.Tasks.AnyAsync(t => t.Id == id);
        }

        public async Task<int> GetTotalCountAsync()
        {
            return await _context.Tasks.CountAsync();
        }

        public async Task<IEnumerable<CrmTask>> GetByStatusAsync(string status)
        {
            return await _context.Tasks
                .Where(t => t.Status == status)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<CrmTask>> GetByAssignedToAsync(string assignedTo)
        {
            return await _context.Tasks
                .Where(t => t.AssignedTo == assignedTo)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<CrmTask>> GetByPriorityAsync(string priority)
        {
            return await _context.Tasks
                .Where(t => t.Priority == priority)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<CrmTask>> GetByLeadIdAsync(Guid leadId)
        {
            return await _context.Tasks
                .Where(t => t.LeadId == leadId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<CrmTask>> GetOverdueTasksAsync()
        {
            var today = DateTime.UtcNow.Date;
            return await _context.Tasks
                .Where(t => t.DueDate.HasValue && t.DueDate.Value.Date < today && t.Status != "Concluída")
                .OrderBy(t => t.DueDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<CrmTask>> GetTodayTasksAsync()
        {
            var today = DateTime.UtcNow.Date;
            return await _context.Tasks
                .Where(t => t.DueDate.HasValue && t.DueDate.Value.Date == today)
                .OrderBy(t => t.DueDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<CrmTask>> GetUpcomingTasksAsync(int days)
        {
            var today = DateTime.UtcNow.Date;
            var endDate = today.AddDays(days);
            return await _context.Tasks
                .Where(t => t.DueDate.HasValue && t.DueDate.Value.Date >= today && t.DueDate.Value.Date <= endDate)
                .OrderBy(t => t.DueDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<CrmTask>> GetRecurringTasksAsync()
        {
            return await _context.Tasks
                .Where(t => t.IsRecurring)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }
    }
} 