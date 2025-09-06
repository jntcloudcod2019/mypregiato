using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Interfaces;
using Pregiato.Core.Entities;

namespace Pregiato.Application.Services
{
    public class OperatorLeadsService : IOperatorLeadsService
    {
        private readonly IOperatorLeadsRepository _repository;

        public OperatorLeadsService(IOperatorLeadsRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> AllocateLeadsAsync(BulkOperatorLeadsDto bulkDto)
        {
            try
            {
                if (bulkDto.Operators == null || !bulkDto.Operators.Any())
                {
                    throw new ArgumentException("Lista de operadores não pode estar vazia");
                }

                var allLeads = new List<OperatorLeads>();
                
                foreach (var operatorData in bulkDto.Operators)
                {
                    if (operatorData.Leads == null || !operatorData.Leads.Any())
                    {
                        continue; // Pula operadores sem leads
                    }
                    
                    foreach (var lead in operatorData.Leads)
                    {
                        var operatorLead = new OperatorLeads
                        {
                            Id = Guid.NewGuid(),
                            EmailOperator = operatorData.EmailOperator,
                            NameLead = lead.NameLead,
                            PhoneLead = lead.PhoneLead,
                            CreatedAt = DateTime.UtcNow
                        };
                        allLeads.Add(operatorLead);
                    }
                }

                if (allLeads.Any())
                {
                    await _repository.AddRangeAsync(allLeads);
                }
                
                return true;
            }
            catch (Exception ex)
            {
                // Log do erro (implementar com Serilog ou similar)
                Console.WriteLine($"Erro ao alocar leads em lote: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> AllocateSingleLeadAsync(OperatorLeadsDto dto)
        {
            try
            {
                var operatorLeads = new OperatorLeads
                {
                    Id = Guid.NewGuid(),
                    EmailOperator = dto.EmailOperator,
                    NameLead = dto.NameLead,
                    PhoneLead = dto.PhoneLead,
                    CreatedAt = DateTime.UtcNow
                };

                await _repository.AddAsync(operatorLeads);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao alocar lead individual: {ex.Message}");
                throw;
            }
        }

        public async Task<IEnumerable<OperatorLeadsDto>> GetLeadsByOperatorAsync(string operatorId)
        {
            try
            {
                var operatorLeads = await _repository.GetByEmailOperatorAsync(operatorId);
                
                return operatorLeads.Select(ol => new OperatorLeadsDto
                {
                    EmailOperator = ol.EmailOperator,
                    NameLead = ol.NameLead,
                    PhoneLead = ol.PhoneLead
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao buscar leads do operador: {ex.Message}");
                throw;
            }
        }

        public async Task<int> GetLeadsCountByOperatorAsync(string operatorId)
        {
            try
            {
                return await _repository.GetLeadsCountByOperatorAsync(operatorId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao contar leads do operador: {ex.Message}");
                throw;
            }
        }

        public async Task<IEnumerable<OperatorLeadDto>> GetLeadsByEmailOperatorAsync(string emailOperator)
        {
            try
            {
                var operatorLeads = await _repository.GetByEmailOperatorAsync(emailOperator);
                
                return operatorLeads.Select(ol => new OperatorLeadDto
                {
                    NameLead = ol.NameLead,
                    PhoneLead = ol.PhoneLead
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao buscar leads por email do operador: {ex.Message}");
                throw;
            }
        }

        public async Task<int> GetLeadsCountByEmailOperatorAsync(string emailOperator)
        {
            try
            {
                return await _repository.GetLeadsCountByEmailOperatorAsync(emailOperator);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao contar leads por email do operador: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteLeadAsync(Guid id)
        {
            try
            {
                return await _repository.DeleteAsync(id);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao deletar lead: {ex.Message}");
                throw;
            }
        }

        public async Task<OperatorLeadWithTrackingDto> UpdateLeadTrackingAsync(UpdateLeadTrackingDto updateDto)
        {
            try
            {
                Console.WriteLine($"[LOG] Service UpdateLeadTrackingAsync - Iniciando");
                Console.WriteLine($"[LOG] EmailOperator: {updateDto.EmailOperator}");
                Console.WriteLine($"[LOG] PhoneLead: {updateDto.PhoneLead}");
                Console.WriteLine($"[LOG] StatusContact: {updateDto.StatusContact}");
                Console.WriteLine($"[LOG] DateContact: {updateDto.DateContact}");
                Console.WriteLine($"[LOG] StatusSeletiva: {updateDto.StatusSeletiva}");
                Console.WriteLine($"[LOG] SeletivaInfo: {System.Text.Json.JsonSerializer.Serialize(updateDto.SeletivaInfo)}");

                // Converter strings para tipos corretos
                DateTime? dateContact = null;
                if (!string.IsNullOrEmpty(updateDto.DateContact) && DateTime.TryParse(updateDto.DateContact, out var parsedDateContact))
                {
                    dateContact = parsedDateContact;
                }

                SeletivaInfo? seletivaInfo = null;
                if (updateDto.SeletivaInfo != null)
                {
                    seletivaInfo = new SeletivaInfo
                    {
                        LocalSeletiva = updateDto.SeletivaInfo.LocalSeletiva,
                        NomeLead = updateDto.SeletivaInfo.NomeLead,
                        CodOperator = updateDto.SeletivaInfo.CodOperator
                    };

                    // Converter data da seletiva
                    if (!string.IsNullOrEmpty(updateDto.SeletivaInfo.DateSeletiva) && DateTime.TryParse(updateDto.SeletivaInfo.DateSeletiva, out var parsedDateSeletiva))
                    {
                        seletivaInfo.DateSeletiva = parsedDateSeletiva;
                    }

                    // Converter horário
                    if (!string.IsNullOrEmpty(updateDto.SeletivaInfo.HorarioAgendadoLead) && TimeSpan.TryParse(updateDto.SeletivaInfo.HorarioAgendadoLead, out var parsedHorario))
                    {
                        seletivaInfo.HorarioAgendadoLead = parsedHorario;
                    }
                }

                Console.WriteLine($"[LOG] Chamando repository UpdateTrackingAsync");
                var updatedLead = await _repository.UpdateTrackingAsync(
                    updateDto.EmailOperator,
                    updateDto.PhoneLead,
                    updateDto.StatusContact,
                    dateContact,
                    updateDto.StatusSeletiva,
                    seletivaInfo
                );
                Console.WriteLine($"[LOG] Repository retornou com sucesso");

                var result = new OperatorLeadWithTrackingDto
                {
                    EmailOperator = updatedLead.EmailOperator,
                    NameLead = updatedLead.NameLead,
                    PhoneLead = updatedLead.PhoneLead,                  
                    StatusContact = updatedLead.StatusContact,
                    DateContact = updatedLead.DateContact,
                    StatusSeletiva = updatedLead.StatusSeletiva,
                    SeletivaInfo = updatedLead.SeletivaInfo
                };
                Console.WriteLine($"[LOG] DTO criado com sucesso");
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao atualizar rastreamento do lead: {ex.Message}");
                throw;
            }
        }
    }
}
