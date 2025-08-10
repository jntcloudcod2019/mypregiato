using AutoMapper;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;

namespace Pregiato.Application.Services
{
    public class LeadService : ILeadService
    {
        private readonly ILeadRepository _leadRepository;
        private readonly IMapper _mapper;

        public LeadService(ILeadRepository leadRepository, IMapper mapper)
        {
            _leadRepository = leadRepository;
            _mapper = mapper;
        }

        public async Task<LeadDto> GetByIdAsync(Guid id)
        {
            var lead = await _leadRepository.GetByIdAsync(id);
            if (lead == null) throw new ArgumentException("Lead não encontrado");

            var leadDto = _mapper.Map<LeadDto>(lead);
            leadDto.InteractionCount = lead.Interactions?.Count ?? 0;
            leadDto.TaskCount = lead.Tasks?.Count ?? 0;
            return leadDto;
        }

        public async Task<IEnumerable<LeadDto>> GetAllAsync()
        {
            var leads = await _leadRepository.GetAllAsync();
            return _mapper.Map<IEnumerable<LeadDto>>(leads);
        }

        public async Task<IEnumerable<LeadDto>> GetFilteredAsync(LeadFilterDto filter)
        {
            var leads = await _leadRepository.GetFilteredAsync(
                filter.SearchTerm, filter.Status, filter.AssignedTo, filter.Source, 
                filter.Priority, filter.StartDate, filter.EndDate, filter.IsActive, 
                filter.Page, filter.PageSize);
            
            return _mapper.Map<IEnumerable<LeadDto>>(leads);
        }

        public async Task<LeadDto> CreateAsync(CreateLeadDto createDto)
        {
            var lead = _mapper.Map<Lead>(createDto);
            lead.CreatedAt = DateTime.UtcNow;
            
            var createdLead = await _leadRepository.CreateAsync(lead);
            return _mapper.Map<LeadDto>(createdLead);
        }

        public async Task<LeadDto> UpdateAsync(Guid id, UpdateLeadDto updateDto)
        {
            var lead = await _leadRepository.GetByIdAsync(id);
            if (lead == null) throw new ArgumentException("Lead não encontrado");

            _mapper.Map(updateDto, lead);
            lead.UpdatedAt = DateTime.UtcNow;
            
            var updatedLead = await _leadRepository.UpdateAsync(lead);
            return _mapper.Map<LeadDto>(updatedLead);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            return await _leadRepository.DeleteAsync(id);
        }

        public async Task<bool> UpdateStatusAsync(Guid id, string status)
        {
            var lead = await _leadRepository.GetByIdAsync(id);
            if (lead == null) return false;

            lead.Status = status;
            lead.UpdatedAt = DateTime.UtcNow;
            
            await _leadRepository.UpdateAsync(lead);
            return true;
        }

        public async Task<bool> AssignToAsync(Guid id, string assignedTo)
        {
            var lead = await _leadRepository.GetByIdAsync(id);
            if (lead == null) return false;

            lead.AssignedTo = assignedTo;
            lead.UpdatedAt = DateTime.UtcNow;
            
            await _leadRepository.UpdateAsync(lead);
            return true;
        }

        public async Task<LeadDto> AddInteractionAsync(Guid leadId, CreateLeadInteractionDto interactionDto)
        {
            var lead = await _leadRepository.GetByIdAsync(leadId);
            if (lead == null) throw new ArgumentException("Lead não encontrado");

            var interaction = _mapper.Map<LeadInteraction>(interactionDto);
            interaction.LeadId = leadId;
            interaction.CreatedAt = DateTime.UtcNow;
            
            // Inicializar a coleção se for null
            lead.Interactions ??= new List<LeadInteraction>();
            lead.Interactions.Add(interaction);
            lead.LastContactDate = DateTime.UtcNow;
            lead.UpdatedAt = DateTime.UtcNow;
            
            await _leadRepository.UpdateAsync(lead);
            return _mapper.Map<LeadDto>(lead);
        }

        public async Task<IEnumerable<LeadInteractionDto>> GetInteractionsAsync(Guid leadId)
        {
            var lead = await _leadRepository.GetByIdAsync(leadId);
            if (lead == null) throw new ArgumentException("Lead não encontrado");

            var interactions = lead.Interactions.OrderByDescending(i => i.CreatedAt);
            return _mapper.Map<IEnumerable<LeadInteractionDto>>(interactions);
        }

        public async Task<IEnumerable<TaskDto>> GetTasksAsync(Guid leadId)
        {
            var lead = await _leadRepository.GetByIdAsync(leadId);
            if (lead == null) throw new ArgumentException("Lead não encontrado");

            var tasks = lead.Tasks.OrderByDescending(t => t.CreatedAt);
            return _mapper.Map<IEnumerable<TaskDto>>(tasks);
        }

        public async Task<LeadDto> AddTaskAsync(Guid leadId, CreateTaskDto taskDto)
        {
            var lead = await _leadRepository.GetByIdAsync(leadId);
            if (lead == null) throw new ArgumentException("Lead não encontrado");

            var task = _mapper.Map<CrmTask>(taskDto);
            task.LeadId = leadId;
            task.CreatedAt = DateTime.UtcNow;
            
            // Inicializar a coleção se for null
            lead.Tasks ??= new List<CrmTask>();
            lead.Tasks.Add(task);
            lead.UpdatedAt = DateTime.UtcNow;
            
            await _leadRepository.UpdateAsync(lead);
            return _mapper.Map<LeadDto>(lead);
        }

        public async Task<object> GetDashboardStatsAsync()
        {
            var totalLeads = await _leadRepository.GetTotalCountAsync();
            var newLeads = (await _leadRepository.GetByStatusAsync("Novo")).Count();
            var inContactLeads = (await _leadRepository.GetByStatusAsync("Em Contato")).Count();
            var proposalLeads = (await _leadRepository.GetByStatusAsync("Proposta Enviada")).Count();
            var wonLeads = (await _leadRepository.GetByStatusAsync("Fechado Ganho")).Count();
            var overdueFollowUps = (await _leadRepository.GetOverdueFollowUpsAsync()).Count();

            return new
            {
                TotalLeads = totalLeads,
                NewLeads = newLeads,
                InContactLeads = inContactLeads,
                ProposalLeads = proposalLeads,
                WonLeads = wonLeads,
                OverdueFollowUps = overdueFollowUps,
                ConversionRate = totalLeads > 0 ? (double)wonLeads / totalLeads * 100 : 0
            };
        }

        public async Task<object> GetFunnelDataAsync()
        {
            var newLeads = (await _leadRepository.GetByStatusAsync("Novo")).Count();
            var inContactLeads = (await _leadRepository.GetByStatusAsync("Em Contato")).Count();
            var proposalLeads = (await _leadRepository.GetByStatusAsync("Proposta Enviada")).Count();
            var wonLeads = (await _leadRepository.GetByStatusAsync("Fechado Ganho")).Count();

            return new[]
            {
                new { Stage = "Novo Lead", Count = newLeads, Color = "bg-blue-500" },
                new { Stage = "Em Contato", Count = inContactLeads, Color = "bg-yellow-500" },
                new { Stage = "Proposta Enviada", Count = proposalLeads, Color = "bg-orange-500" },
                new { Stage = "Fechado Ganho", Count = wonLeads, Color = "bg-green-500" }
            };
        }

        public async Task<IEnumerable<LeadDto>> GetRecentInteractionsAsync(int count = 10)
        {
            var leads = await _leadRepository.GetRecentLeadsAsync(count);
            return _mapper.Map<IEnumerable<LeadDto>>(leads);
        }

        public async Task<IEnumerable<TaskDto>> GetTodayTasksAsync()
        {
            // Esta implementação seria melhor se tivéssemos um TaskService
            // Por enquanto, retornamos uma lista vazia
            return new List<TaskDto>();
        }

        public async Task<LeadDto> CreateFromMetaAsync(CreateLeadDto createDto, string metaLeadId)
        {
            var lead = _mapper.Map<Lead>(createDto);
            lead.MetaLeadId = metaLeadId;
            lead.Source = "Meta Ads";
            lead.CreatedAt = DateTime.UtcNow;
            
            var createdLead = await _leadRepository.CreateAsync(lead);
            return _mapper.Map<LeadDto>(createdLead);
        }

        public async Task<bool> SyncWithMetaAsync(Guid leadId)
        {
            var lead = await _leadRepository.GetByIdAsync(leadId);
            if (lead == null) return false;

            // Implementar sincronização com Meta
            lead.UpdatedAt = DateTime.UtcNow;
            await _leadRepository.UpdateAsync(lead);
            return true;
        }

        public async Task<IEnumerable<LeadDto>> GetLeadsFromMetaAsync()
        {
            var leads = await _leadRepository.GetBySourceAsync("Meta Ads");
            return _mapper.Map<IEnumerable<LeadDto>>(leads);
        }
    }
} 