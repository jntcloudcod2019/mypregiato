using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;

namespace Pregiato.API.Services
{
    public class ImportService : IImportService
    {
        private readonly PregiatoDbContext _db;
        private readonly ILeadService _leadService;
        private readonly ILogger<ImportService> _logger;

        public ImportService(
            PregiatoDbContext db,
            ILeadService leadService,
            ILogger<ImportService> logger)
        {
            _db = db;
            _leadService = leadService;
            _logger = logger;
        }

        public async Task<object> ProcessImportAsync(string entity, List<string> headers, List<List<object?>> rows, Dictionary<string, string>? columnMapping = null)
        {
            // Normalizar o nome da entidade para minúsculas para facilitar comparações
            entity = entity.Trim().ToLowerInvariant();
            
            // Verificar se a entidade é suportada
            if (!GetSupportedEntities().Contains(entity))
                throw new ArgumentException($"Entidade '{entity}' não é suportada para importação");
                
            // Processar a importação de acordo com o tipo de entidade
            switch (entity)
            {
                case "lead":
                    return await ProcessLeadsAsync(headers, rows, columnMapping);
                case "talent":
                    return await ProcessTalentsAsync(headers, rows, columnMapping);
                case "generic":
                    return await ProcessGenericAsync(headers, rows, columnMapping);
                default:
                    throw new ArgumentException($"Entidade '{entity}' não implementada para importação");
            }
        }
        
        public List<string> GetSupportedEntities()
        {
            return new List<string> { "lead", "talent", "generic" };
        }
        
        public Dictionary<string, object> GetEntityFields(string entityType)
        {
            entityType = entityType.Trim().ToLowerInvariant();
            
            switch (entityType)
            {
                case "lead":
                    return new Dictionary<string, object>
                    {
                        { "name", new { type = "string", required = true, description = "Nome do lead" } },
                        { "email", new { type = "string", required = true, description = "Email do lead" } },
                        { "phone", new { type = "string", required = false, description = "Telefone do lead" } },
                        { "company", new { type = "string", required = false, description = "Empresa do lead" } },
                        { "source", new { type = "string", required = false, description = "Origem do lead" } },
                        { "status", new { type = "string", required = false, description = "Status do lead" } }
                    };
                case "talent":
                    return new Dictionary<string, object>
                    {
                        { "name", new { type = "string", required = true, description = "Nome do talento" } },
                        { "email", new { type = "string", required = true, description = "Email do talento" } },
                        { "phone", new { type = "string", required = false, description = "Telefone do talento" } },
                        { "skills", new { type = "string", required = false, description = "Habilidades do talento" } },
                        { "experience", new { type = "string", required = false, description = "Experiência do talento" } },
                        { "status", new { type = "string", required = false, description = "Status do talento" } }
                    };
                case "generic":
                    return new Dictionary<string, object>
                    {
                        { "id", new { type = "string", required = false, description = "Identificador único" } },
                        { "name", new { type = "string", required = false, description = "Nome" } },
                        { "description", new { type = "string", required = false, description = "Descrição" } },
                        { "value", new { type = "string", required = false, description = "Valor" } },
                        { "date", new { type = "string", required = false, description = "Data" } }
                    };
                default:
                    return new Dictionary<string, object>();
            }
        }

        private async Task<object> ProcessLeadsAsync(List<string> headers, List<List<object?>> rows, Dictionary<string, string>? columnMapping)
        {
            var result = new
            {
                Created = 0,
                Skipped = 0,
                Errors = 0,
                ErrorMessages = new List<string>(),
                Items = new List<object>()
            };
            
            var created = 0;
            var skipped = 0;
            var errors = 0;
            var errorMessages = new List<string>();
            var items = new List<object>();
            
            // Mapear colunas
            var nameIndex = GetColumnIndex(headers, columnMapping, "name");
            var emailIndex = GetColumnIndex(headers, columnMapping, "email");
            var phoneIndex = GetColumnIndex(headers, columnMapping, "phone");
            var companyIndex = GetColumnIndex(headers, columnMapping, "company");
            var sourceIndex = GetColumnIndex(headers, columnMapping, "source");
            var statusIndex = GetColumnIndex(headers, columnMapping, "status");
            
            // Processar linhas
            for (int i = 0; i < rows.Count; i++)
            {
                try
                {
                    var row = rows[i];
                    if (row.Count < headers.Count) continue;
                    
                    var name = GetStringValue(row, nameIndex);
                    var email = GetStringValue(row, emailIndex);
                    
                    // Validar dados obrigatórios
                    if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email))
                    {
                        skipped++;
                        items.Add(new
                        {
                            Index = i,
                            Outcome = "skipped",
                            Name = name,
                            Email = email,
                            Error = "Nome ou email não informados"
                        });
                        continue;
                    }
                    
                    // Criar lead
                    var lead = new CreateLeadDto
                    {
                        Name = name,
                        Email = email,
                        Phone = GetStringValue(row, phoneIndex),
                        Company = GetStringValue(row, companyIndex),
                        Source = GetStringValue(row, sourceIndex) ?? "Importação",
                        Status = GetStringValue(row, statusIndex) ?? "Novo"
                    };
                    
                    await _leadService.CreateAsync(lead);
                    created++;
                    
                    items.Add(new
                    {
                        Index = i,
                        Outcome = "created",
                        Name = lead.Name,
                        Email = lead.Email,
                        Phone = lead.Phone,
                        Source = lead.Source,
                        Status = lead.Status
                    });
                }
                catch (Exception ex)
                {
                    errors++;
                    var errorMessage = $"Erro na linha {i+1}: {ex.Message}";
                    errorMessages.Add(errorMessage);
                    
                    items.Add(new
                    {
                        Index = i,
                        Outcome = "error",
                        Error = ex.Message
                    });
                    
                    _logger.LogError(ex, "Erro ao processar lead da linha {RowIndex}", i);
                }
            }
            
            return new
            {
                Created = created,
                Skipped = skipped,
                Errors = errors,
                ErrorMessages = errorMessages,
                Items = items
            };
        }
        
        private async Task<object> ProcessTalentsAsync(List<string> headers, List<List<object?>> rows, Dictionary<string, string>? columnMapping)
        {
            var created = 0;
            var skipped = 0;
            var errors = 0;
            var errorMessages = new List<string>();
            var items = new List<object>();
            
            // Mapear colunas
            var nameIndex = GetColumnIndex(headers, columnMapping, "name");
            var emailIndex = GetColumnIndex(headers, columnMapping, "email");
            var phoneIndex = GetColumnIndex(headers, columnMapping, "phone");
            var skillsIndex = GetColumnIndex(headers, columnMapping, "skills");
            var experienceIndex = GetColumnIndex(headers, columnMapping, "experience");
            var statusIndex = GetColumnIndex(headers, columnMapping, "status");
            
            // Processar linhas
            for (int i = 0; i < rows.Count; i++)
            {
                try
                {
                    var row = rows[i];
                    if (row.Count < headers.Count) continue;
                    
                    var name = GetStringValue(row, nameIndex);
                    var email = GetStringValue(row, emailIndex);
                    
                    // Validar dados obrigatórios
                    if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email))
                    {
                        skipped++;
                        items.Add(new
                        {
                            Index = i,
                            Outcome = "skipped",
                            Name = name,
                            Email = email,
                            Error = "Nome ou email não informados"
                        });
                        continue;
                    }
                    
                    // Criar talento (simulado, pois não temos um serviço de talentos)
                    var talent = new
                    {
                        Name = name,
                        Email = email,
                        Phone = GetStringValue(row, phoneIndex),
                        Skills = GetStringValue(row, skillsIndex),
                        Experience = GetStringValue(row, experienceIndex),
                        Status = GetStringValue(row, statusIndex) ?? "Novo",
                        CreatedAt = DateTime.UtcNow
                    };
                    
                    // Simulando criação de talento
                    // await _talentService.CreateAsync(talent);
                    created++;
                    
                    items.Add(new
                    {
                        Index = i,
                        Outcome = "created",
                        Name = talent.Name,
                        Email = talent.Email,
                        Phone = talent.Phone,
                        Skills = talent.Skills,
                        Experience = talent.Experience,
                        Status = talent.Status
                    });
                }
                catch (Exception ex)
                {
                    errors++;
                    var errorMessage = $"Erro na linha {i+1}: {ex.Message}";
                    errorMessages.Add(errorMessage);
                    
                    items.Add(new
                    {
                        Index = i,
                        Outcome = "error",
                        Error = ex.Message
                    });
                    
                    _logger.LogError(ex, "Erro ao processar talento da linha {RowIndex}", i);
                }
            }
            
            return new
            {
                Created = created,
                Skipped = skipped,
                Errors = errors,
                ErrorMessages = errorMessages,
                Items = items
            };
        }
        
        private async Task<object> ProcessGenericAsync(List<string> headers, List<List<object?>> rows, Dictionary<string, string>? columnMapping)
        {
            var processed = 0;
            var skipped = 0;
            var errors = 0;
            var errorMessages = new List<string>();
            var items = new List<object>();
            
            // Processar linhas
            for (int i = 0; i < rows.Count; i++)
            {
                try
                {
                    var row = rows[i];
                    if (row.Count < headers.Count) continue;
                    
                    var item = new Dictionary<string, object?>();
                    
                    // Mapear todas as colunas
                    for (int j = 0; j < headers.Count; j++)
                    {
                        var header = headers[j];
                        var value = j < row.Count ? row[j] : null;
                        
                        // Se houver mapeamento de coluna, usar o nome mapeado
                        if (columnMapping != null && columnMapping.TryGetValue(header, out var mappedName))
                        {
                            item[mappedName] = value;
                        }
                        else
                        {
                            item[header] = value;
                        }
                    }
                    
                    processed++;
                    items.Add(new
                    {
                        Index = i,
                        Outcome = "processed",
                        Data = item
                    });
                }
                catch (Exception ex)
                {
                    errors++;
                    var errorMessage = $"Erro na linha {i+1}: {ex.Message}";
                    errorMessages.Add(errorMessage);
                    
                    items.Add(new
                    {
                        Index = i,
                        Outcome = "error",
                        Error = ex.Message
                    });
                    
                    _logger.LogError(ex, "Erro ao processar item genérico da linha {RowIndex}", i);
                }
            }
            
            return new
            {
                Processed = processed,
                Skipped = skipped,
                Errors = errors,
                ErrorMessages = errorMessages,
                Items = items
            };
        }
        
        private int GetColumnIndex(List<string> headers, Dictionary<string, string>? columnMapping, string fieldName)
        {
            // Se houver mapeamento explícito, usar
            if (columnMapping != null && columnMapping.ContainsValue(fieldName))
            {
                var mappedHeader = columnMapping.FirstOrDefault(x => x.Value == fieldName).Key;
                var index = headers.IndexOf(mappedHeader);
                if (index >= 0) return index;
            }
            
            // Tentar encontrar por nome exato
            var exactMatch = headers.IndexOf(fieldName);
            if (exactMatch >= 0) return exactMatch;
            
            // Tentar encontrar por nome sem case sensitivity
            for (int i = 0; i < headers.Count; i++)
            {
                if (headers[i].Equals(fieldName, StringComparison.OrdinalIgnoreCase))
                    return i;
            }
            
            // Tentar encontrar por contém
            for (int i = 0; i < headers.Count; i++)
            {
                if (headers[i].Contains(fieldName, StringComparison.OrdinalIgnoreCase))
                    return i;
            }
            
            // Não encontrado
            return -1;
        }
        
        private string? GetStringValue(List<object?> row, int index)
        {
            if (index < 0 || index >= row.Count) return null;
            
            var value = row[index];
            if (value == null) return null;
            
            return value.ToString();
        }
    }
}
