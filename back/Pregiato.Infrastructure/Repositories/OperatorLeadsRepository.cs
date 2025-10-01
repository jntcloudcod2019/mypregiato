using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;

namespace Pregiato.Infrastructure.Repositories
{
    public class OperatorLeadsRepository : IOperatorLeadsRepository
    {
        private readonly PregiatoDbContext _context;

        public OperatorLeadsRepository(PregiatoDbContext context)
        {
            _context = context;
        }

        public async Task<OperatorLeads> AddAsync(OperatorLeads operatorLeads)
        {
            operatorLeads.CreatedAt = DateTime.UtcNow;
            _context.OperatorLeads.Add(operatorLeads);
            await _context.SaveChangesAsync();
            return operatorLeads;
        }

        public async Task<IEnumerable<OperatorLeads>> AddRangeAsync(IEnumerable<OperatorLeads> operatorLeads)
        {
            var leadsList = operatorLeads.ToList();
            
            // ✅ DEBUG: Log de cada lead antes de inserir
            Console.WriteLine($"🔍 DEBUG Repository: Inserindo {leadsList.Count} leads");
            foreach (var lead in leadsList)
            {
                Console.WriteLine($"🔍 DEBUG Repository: Lead - OperatorId='{lead.OperatorId}', EmailOperator='{lead.EmailOperator}', NameLead='{lead.NameLead}', PhoneLead='{lead.PhoneLead}'");
                lead.CreatedAt = DateTime.UtcNow;
            }
            
            try
            {
                _context.OperatorLeads.AddRange(leadsList);
                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ DEBUG Repository: {leadsList.Count} leads inseridos com sucesso");
                return leadsList;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ DEBUG Repository: Erro ao inserir leads: {ex.Message}");
                Console.WriteLine($"❌ DEBUG Repository: Inner Exception: {ex.InnerException?.Message}");
                throw;
            }
        }

        public async Task<OperatorLeads> GetByIdAsync(Guid id)
        {
            return await _context.OperatorLeads.FindAsync(id);
        }

        public async Task<IEnumerable<OperatorLeads>> GetByOperatorIdAsync(string operatorId)
        {
            return await _context.OperatorLeads
                .Where(ol => ol.EmailOperator == operatorId)
                .OrderByDescending(ol => ol.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<OperatorLeads>> GetAllAsync()
        {
            return await _context.OperatorLeads
                .OrderByDescending(ol => ol.CreatedAt)
                .ToListAsync();
        }

        public async Task<OperatorLeads> UpdateAsync(OperatorLeads operatorLeads)
        {
            operatorLeads.UpdatedAt = DateTime.UtcNow;
            _context.OperatorLeads.Update(operatorLeads);
            await _context.SaveChangesAsync();
            return operatorLeads;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var operatorLeads = await _context.OperatorLeads.FindAsync(id);
            if (operatorLeads == null)
                return false;

            _context.OperatorLeads.Remove(operatorLeads);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetLeadsCountByOperatorAsync(string operatorId)
        {
            return await _context.OperatorLeads
                .CountAsync(ol => ol.EmailOperator == operatorId);
        }

        public async Task<IEnumerable<OperatorLeads>> GetByEmailOperatorAsync(string emailOperator)
        {
            return await _context.OperatorLeads
                .Where(ol => ol.EmailOperator == emailOperator && ol.StatusContact == false) 
                .OrderByDescending(ol => ol.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> GetLeadsCountByEmailOperatorAsync(string emailOperator)
        {
            return await _context.OperatorLeads
                .CountAsync(ol => ol.EmailOperator == emailOperator);
        }

        // Método unificado para atualizar rastreamento
        public async Task<OperatorLeads> UpdateTrackingAsync(string emailOperator, string phoneLead, bool statusContact, DateTime? dateContact, bool statusSeletiva, SeletivaInfo? seletivaInfo)
        {
            var operatorLead = await _context.OperatorLeads
                .FirstOrDefaultAsync(ol => ol.EmailOperator == emailOperator && ol.PhoneLead == phoneLead);
            
            if (operatorLead == null)
                throw new ArgumentException($"Lead com email {emailOperator} e telefone {phoneLead} não encontrado.");

            // Atualizar campos de rastreamento
            operatorLead.StatusContact = statusContact;
            operatorLead.StatusSeletiva = statusSeletiva;
            operatorLead.SeletivaInfo = seletivaInfo;
            operatorLead.UpdatedAt = DateTime.UtcNow;

            // Se StatusContact = true e DateContact não foi fornecido, usar data atual
            if (statusContact && dateContact == null)
            {
                operatorLead.DateContact = DateTime.UtcNow;
            }
            else
            {
                operatorLead.DateContact = dateContact;
            }

            _context.OperatorLeads.Update(operatorLead);
            await _context.SaveChangesAsync();
            return operatorLead;
        }
        
        // ============================================================================
        // SCHEDULING FEATURE - REPOSITORY METHODS
        // ============================================================================
        
        /// <summary>
        /// Gets all leads for an operator grouped by Kanban status
        /// Returns leads in descending order by CreatedAt (newest first)
        /// </summary>
        public async Task<Dictionary<string, List<OperatorLeads>>> GetKanbanDataAsync(string emailOperator)
        {
            var allLeads = await _context.OperatorLeads
                .Where(ol => ol.EmailOperator == emailOperator)
                .OrderByDescending(ol => ol.CreatedAt)  // ✅ Descending order
                .ToListAsync();
            
            var grouped = new Dictionary<string, List<OperatorLeads>>
            {
                ["new"] = new List<OperatorLeads>(),
                ["scheduled"] = new List<OperatorLeads>(),
                ["pending"] = new List<OperatorLeads>()
            };
            
            var now = DateTime.UtcNow;
            
            foreach (var lead in allLeads)
            {
                // Determine Kanban status based on business rules
                var status = DetermineKanbanStatus(lead, now);
                grouped[status].Add(lead);
            }
            
            return grouped;
        }
        
        /// <summary>
        /// Gets dashboard metrics for an operator
        /// </summary>
        public async Task<(int scheduledToday, int scheduledWeek, int scheduledMonth, int pendingToday, int pendingWeek, int pendingMonth, int totalNew, int totalScheduled, int totalPending)> GetDashboardMetricsAsync(string emailOperator)
        {
            var allLeads = await _context.OperatorLeads
                .Where(ol => ol.EmailOperator == emailOperator)
                .ToListAsync();
            
            var now = DateTime.UtcNow;
            var today = now.Date;
            var weekStart = today.AddDays(-(int)today.DayOfWeek);
            var monthStart = new DateTime(today.Year, today.Month, 1);
            
            // Initialize counters
            int scheduledToday = 0, scheduledWeek = 0, scheduledMonth = 0;
            int pendingToday = 0, pendingWeek = 0, pendingMonth = 0;
            int totalNew = 0, totalScheduled = 0, totalPending = 0;
            
            foreach (var lead in allLeads)
            {
                var kanbanStatus = DetermineKanbanStatus(lead, now);
                
                // Count totals by Kanban status
                switch (kanbanStatus)
                {
                    case "new":
                        totalNew++;
                        break;
                    case "scheduled":
                        totalScheduled++;
                        
                        // Count scheduled by period (using DateContact or CreatedAt)
                        var scheduleDate = lead.DateContact ?? lead.CreatedAt;
                        if (scheduleDate.Date == today)
                            scheduledToday++;
                        if (scheduleDate.Date >= weekStart)
                            scheduledWeek++;
                        if (scheduleDate.Date >= monthStart)
                            scheduledMonth++;
                        break;
                    case "pending":
                        totalPending++;
                        
                        // Count pending by period (using CreatedAt)
                        if (lead.CreatedAt.Date == today)
                            pendingToday++;
                        if (lead.CreatedAt.Date >= weekStart)
                            pendingWeek++;
                        if (lead.CreatedAt.Date >= monthStart)
                            pendingMonth++;
                        break;
                }
            }
            
            return (scheduledToday, scheduledWeek, scheduledMonth, pendingToday, pendingWeek, pendingMonth, totalNew, totalScheduled, totalPending);
        }
        
        /// <summary>
        /// Determines the Kanban status for a lead based on business rules
        /// </summary>
        private string DetermineKanbanStatus(OperatorLeads lead, DateTime now)
        {
            // Rule 1: If StatusSeletiva = 1 → "scheduled"
            if (lead.StatusSeletiva)
                return "scheduled";
            
            // Rule 2: If StatusContact = 0 AND > 24h from creation → "pending"
            if (!lead.StatusContact)
            {
                var hoursSinceCreation = (now - lead.CreatedAt).TotalHours;
                if (hoursSinceCreation > 24)
                    return "pending";
            }
            
            // Rule 3: All other cases → "new"
            return "new";
        }
        
        /// <summary>
        /// Gets paginated leads for a specific Kanban column
        /// Returns leads in descending order by CreatedAt with pagination
        /// </summary>
        public async Task<(List<OperatorLeads> items, int totalCount)> GetPaginatedKanbanColumnAsync(
            string emailOperator, 
            string columnStatus, 
            int page, 
            int pageSize)
        {
            var allLeads = await _context.OperatorLeads
                .Where(ol => ol.EmailOperator == emailOperator)
                .OrderByDescending(ol => ol.CreatedAt)
                .ToListAsync();
            
            var now = DateTime.UtcNow;
            
            // Filter by Kanban status
            var filteredLeads = allLeads
                .Where(lead => DetermineKanbanStatus(lead, now) == columnStatus)
                .ToList();
            
            var totalCount = filteredLeads.Count;
            
            // Apply pagination
            var skip = (page - 1) * pageSize;
            var paginatedLeads = filteredLeads
                .Skip(skip)
                .Take(pageSize)
                .ToList();
            
            return (paginatedLeads, totalCount);
        }
    }
}
