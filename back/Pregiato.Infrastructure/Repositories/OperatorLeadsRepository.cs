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
    }
}
