using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Interfaces;
using Pregiato.Core.Entities;

namespace Pregiato.Application.Services
{
    public class OperatorLeadsService : IOperatorLeadsService
    {
        private readonly IOperatorLeadsRepository _repository;
        private readonly IResilienceService _resilienceService;

        public OperatorLeadsService(
            IOperatorLeadsRepository repository,
            IResilienceService resilienceService)
        {
            _repository = repository;
            _resilienceService = resilienceService;
        }

        public async Task<bool> AllocateLeadsAsync(BulkOperatorLeadsDto bulkDto)
        {
            var allLeads = new List<OperatorLeads>();
            
            try
            {
                if (bulkDto.Operators == null || !bulkDto.Operators.Any())
                {
                    throw new ArgumentException("Lista de operadores não pode estar vazia");
                }
                
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
                            OperatorId = operatorData.OperatorId,
                            EmailOperator = operatorData.EmailOperator,
                            NameLead = lead.NameLead,
                            PhoneLead = lead.PhoneLead,
                            // === NOVOS CAMPOS ADICIONADOS ===
                            Responsible = lead.Responsible,
                            Age = lead.Age,
                            PublicADS = lead.PublicADS,
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
                Console.WriteLine($"Erro ao alocar leads em lote: {ex.Message}");
                
                // Aplicar resiliência apenas para erros específicos de infraestrutura
                if (IsInfrastructureError(ex))
                {
                    try
                    {
                        Console.WriteLine("🔄 Aplicando resiliência para erro de infraestrutura...");
                        
                        // Tentar novamente com resiliência
                        await _resilienceService.ExecuteWithResilienceAsync(async () =>
                        {
                            await _repository.AddRangeAsync(allLeads);
                        }, "AllocateLeadsAsync-Retry");
                        
                        Console.WriteLine("✅ Operação recuperada com sucesso via resiliência");
                        return true;
                    }
                    catch (Exception resilienceEx)
                    {
                        Console.WriteLine($"❌ Falha na recuperação via resiliência: {resilienceEx.Message}");
                        throw resilienceEx;
                    }
                }
                
                throw;
            }
        }

        /// <summary>
        /// Verifica se o erro é relacionado à infraestrutura (banco, RabbitMQ, etc.)
        /// </summary>
        private static bool IsInfrastructureError(Exception ex)
        {
            return ex is Microsoft.EntityFrameworkCore.DbUpdateException ||
                   ex is System.Net.Sockets.SocketException ||
                   ex is System.TimeoutException ||
                   ex is System.InvalidOperationException ||
                   (ex.Message?.Contains("Field") == true && ex.Message?.Contains("doesn't have a default value") == true) ||
                   (ex.Message?.Contains("Connection") == true && ex.Message?.Contains("database") == true) ||
                   (ex.Message?.Contains("RabbitMQ") == true) ||
                   (ex.Message?.Contains("AMQP") == true) ||
                   (ex.InnerException != null && IsInfrastructureError(ex.InnerException));
        }

        public async Task<bool> AllocateSingleLeadAsync(OperatorLeadsDto dto)
        {
            var operatorLeads = new OperatorLeads
            {
                Id = Guid.NewGuid(),
                OperatorId = dto.OperatorId,
                EmailOperator = dto.EmailOperator,
                NameLead = dto.NameLead,
                PhoneLead = dto.PhoneLead,
                CreatedAt = DateTime.UtcNow
            };
            
            try
            {
                await _repository.AddAsync(operatorLeads);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao alocar lead individual: {ex.Message}");
                
                // Aplicar resiliência apenas para erros específicos de infraestrutura
                if (IsInfrastructureError(ex))
                {
                    try
                    {
                        Console.WriteLine("🔄 Aplicando resiliência para erro de infraestrutura...");
                        
                        // Tentar novamente com resiliência
                        await _resilienceService.ExecuteWithResilienceAsync(async () =>
                        {
                            await _repository.AddAsync(operatorLeads);
                        }, "AllocateSingleLeadAsync-Retry");
                        
                        Console.WriteLine("✅ Operação recuperada com sucesso via resiliência");
                        return true;
                    }
                    catch (Exception resilienceEx)
                    {
                        Console.WriteLine($"❌ Falha na recuperação via resiliência: {resilienceEx.Message}");
                        throw resilienceEx;
                    }
                }
                
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
                    PhoneLead = ol.PhoneLead,
                    Responsible = ol.Responsible,
                    Age = ol.Age,
                    PublicADS = ol.PublicADS
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
        
        // ============================================================================
        // SCHEDULING FEATURE - SERVICE METHODS
        // ============================================================================
        
        /// <summary>
        /// Gets Kanban board data for an operator
        /// Business logic: Categorizes leads and prepares data for frontend
        /// </summary>
        public async Task<KanbanDataDto> GetKanbanDataAsync(string emailOperator)
        {
            try
            {
                Console.WriteLine($"[SCHEDULING] GetKanbanDataAsync - EmailOperator: {emailOperator}");
                
                // Get grouped data from repository
                var groupedLeads = await _repository.GetKanbanDataAsync(emailOperator);
                
                // Transform to DTOs with business logic
                var columns = new List<KanbanColumnDto>();
                
                // Define column order and labels
                var columnDefinitions = new[]
                {
                    new { Status = "new", Label = "Novo" },
                    new { Status = "scheduled", Label = "Agendado" },
                    new { Status = "pending", Label = "Pendente" }
                };
                
                int totalLeads = 0;
                
                foreach (var columnDef in columnDefinitions)
                {
                    var leadsInColumn = groupedLeads.ContainsKey(columnDef.Status) 
                        ? groupedLeads[columnDef.Status] 
                        : new List<OperatorLeads>();
                    
                    var leadDtos = leadsInColumn.Select(lead => new OperatorLeadKanbanDto
                    {
                        Id = lead.Id,
                        NameLead = lead.NameLead,
                        PhoneLead = lead.PhoneLead,
                        Responsible = lead.Responsible,
                        Age = lead.Age,
                        PublicADS = lead.PublicADS,
                        CreatedAt = lead.CreatedAt,
                        StatusContact = lead.StatusContact,
                        DateContact = lead.DateContact,
                        StatusSeletiva = lead.StatusSeletiva,
                        SeletivaInfo = lead.SeletivaInfo,
                        StatusContactLabel = lead.StatusContact ? "Lead Scheduled" : "Lead Pending",
                        KanbanStatus = columnDef.Status
                    }).ToList();
                    
                    columns.Add(new KanbanColumnDto
                    {
                        Status = columnDef.Status,
                        Label = columnDef.Label,
                        Count = leadDtos.Count,
                        Leads = leadDtos  // Already in descending order from repository
                    });
                    
                    totalLeads += leadDtos.Count;
                }
                
                Console.WriteLine($"[SCHEDULING] Kanban data prepared - Total: {totalLeads}, New: {columns[0].Count}, Scheduled: {columns[1].Count}, Pending: {columns[2].Count}");
                
                return new KanbanDataDto
                {
                    Columns = columns,
                    TotalLeads = totalLeads
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SCHEDULING] Error getting Kanban data: {ex.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Gets dashboard metrics for an operator
        /// </summary>
        public async Task<OperatorDashboardDto> GetDashboardMetricsAsync(string emailOperator)
        {
            try
            {
                Console.WriteLine($"[SCHEDULING] GetDashboardMetricsAsync - EmailOperator: {emailOperator}");
                
                var metrics = await _repository.GetDashboardMetricsAsync(emailOperator);
                
                var dashboard = new OperatorDashboardDto
                {
                    ScheduledToday = metrics.scheduledToday,
                    ScheduledWeek = metrics.scheduledWeek,
                    ScheduledMonth = metrics.scheduledMonth,
                    PendingToday = metrics.pendingToday,
                    PendingWeek = metrics.pendingWeek,
                    PendingMonth = metrics.pendingMonth,
                    TotalLeads = metrics.totalNew + metrics.totalScheduled + metrics.totalPending,
                    TotalNew = metrics.totalNew,
                    TotalScheduled = metrics.totalScheduled,
                    TotalPending = metrics.totalPending
                };
                
                Console.WriteLine($"[SCHEDULING] Dashboard metrics prepared - Total leads: {dashboard.TotalLeads}");
                
                return dashboard;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SCHEDULING] Error getting dashboard metrics: {ex.Message}");
                throw;
            }
        }
    }
}
