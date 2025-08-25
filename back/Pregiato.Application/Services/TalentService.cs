using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Application.Validators;
using FluentValidation;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using AutoMapper;

namespace Pregiato.Application.Services;

public class TalentService : ITalentService
{
    private readonly ITalentRepository _talentRepository;
    private readonly ILogger<TalentService> _logger;
    private readonly IMapper _mapper;
    private readonly IValidator<CreateTalentDto> _createValidator;
    private readonly IValidator<UpdateTalentDto> _updateValidator;

    public TalentService(
        ITalentRepository talentRepository,
        ILogger<TalentService> logger,
        IMapper mapper,
        IValidator<CreateTalentDto> createValidator,
        IValidator<UpdateTalentDto> updateValidator)
    {
        _talentRepository = talentRepository;
        _logger = logger;
        _mapper = mapper;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<PaginatedResponseDto<TalentDto>> GetAllPaginatedAsync(
        int page, 
        int pageSize, 
        string? search = null, 
        string? sortBy = null, 
        bool sortDescending = false)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            _logger.LogInformation("Buscando talentos paginados: página {Page}, tamanho {PageSize}, busca: {Search}", page, pageSize, search ?? "nenhuma");
            
            var talents = await _talentRepository.GetAllAsync();
            
            // Aplicar filtro de busca
            if (!string.IsNullOrEmpty(search))
            {
                search = search.Trim().ToLower();
                talents = talents.Where(t => 
                    t.FullName.ToLower().Contains(search) ||
                    (t.Email != null && t.Email.ToLower().Contains(search)) ||
                    (t.Document != null && t.Document.ToLower().Contains(search)) ||
                    (t.Phone != null && t.Phone.ToLower().Contains(search)) ||
                    (t.City != null && t.City.ToLower().Contains(search))
                );
            }
            
            // Aplicar ordenação
            if (!string.IsNullOrEmpty(sortBy))
            {
                talents = sortBy.ToLower() switch
                {
                    "fullname" => sortDescending ? talents.OrderByDescending(t => t.FullName) : talents.OrderBy(t => t.FullName),
                    "age" => sortDescending ? talents.OrderByDescending(t => t.Age) : talents.OrderBy(t => t.Age),
                    "createdat" => sortDescending ? talents.OrderByDescending(t => t.CreatedAt) : talents.OrderBy(t => t.CreatedAt),
                    "status" => sortDescending ? talents.OrderByDescending(t => t.Status) : talents.OrderBy(t => t.Status),
                    "email" => sortDescending ? talents.OrderByDescending(t => t.Email) : talents.OrderBy(t => t.Email),
                    "city" => sortDescending ? talents.OrderByDescending(t => t.City) : talents.OrderBy(t => t.City),
                    _ => talents.OrderByDescending(t => t.CreatedAt)
                };
            }
            else
            {
                talents = talents.OrderByDescending(t => t.CreatedAt);
            }
            
            var total = talents.Count();
            var totalPages = (int)Math.Ceiling((double)total / pageSize);
            var skip = (page - 1) * pageSize;
            
            var pagedTalents = talents.Skip(skip).Take(pageSize);
            
            stopwatch.Stop();
            
            var result = new PaginatedResponseDto<TalentDto>
            {
                Data = _mapper.Map<List<TalentDto>>(pagedTalents),
                Total = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages,
                HasNextPage = page < totalPages,
                HasPreviousPage = page > 1,
                ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                RecordsReturned = pagedTalents.Count()
            };
            
            _logger.LogInformation("Retornando {Count} talentos de {Total} total", result.RecordsReturned, result.Total);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar talentos paginados");
            throw;
        }
    }

    public async Task<TalentDto?> GetByIdAsync(Guid id)
    {
        try
        {
            _logger.LogInformation("Buscando talento por ID: {Id}", id);
            
            var talent = await _talentRepository.GetByIdAsync(id);
            
            if (talent == null)
            {
                _logger.LogWarning("Talento não encontrado com ID: {Id}", id);
                return null;
            }
            
            var dto = _mapper.Map<TalentDto>(talent);
            _logger.LogInformation("Talento encontrado: {Name} ({Id})", talent.FullName, talent.Id);
            
            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar talento {Id}", id);
            throw;
        }
    }

    public async Task<TalentDto> CreateAsync(CreateTalentDto dto)
    {
        try
        {
            _logger.LogInformation("Criando novo talento: {Name}", dto.FullName);
            
            // Validar DTO usando FluentValidation
            var validationResult = await _createValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                var errors = string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage));
                _logger.LogWarning("Validação falhou para talento {Name}: {Errors}", dto.FullName, errors);
                throw new ValidationException(validationResult.Errors);
            }
            
            // Verificar se já existe talento com mesmo email ou documento
            if (!string.IsNullOrEmpty(dto.Email) || !string.IsNullOrEmpty(dto.Document))
            {
                var exists = await CheckExistsAsync(dto.Email, dto.Document);
                if (exists)
                {
                    _logger.LogWarning("Tentativa de criar talento duplicado: Email={Email}, Document={Document}", dto.Email, dto.Document);
                    throw new ArgumentException("Já existe um talento com este email ou documento.");
                }
            }
            
            // Usar AutoMapper para criar o objeto Talent
        var talent = _mapper.Map<Talent>(dto);
        talent.Id = Guid.NewGuid();
            talent.InviteSent = false;
            talent.Status = true;
            talent.DnaStatus = "UNDEFINED";
        talent.CreatedAt = DateTime.UtcNow;
        talent.UpdatedAt = DateTime.UtcNow;

            var createdTalent = await _talentRepository.CreateAsync(talent);
            var result = _mapper.Map<TalentDto>(createdTalent);
            
            _logger.LogInformation("Talento criado com sucesso: {Name} ({Id})", createdTalent.FullName, createdTalent.Id);
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar talento: {Name}", dto.FullName);
            throw;
        }
    }

    public async Task<TalentDto?> UpdateAsync(Guid id, UpdateTalentDto dto)
    {
        try
        {
            _logger.LogInformation("Atualizando talento: {Id}", id);
            
            // Validar DTO usando FluentValidation
            var validationResult = await _updateValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                var errors = string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage));
                _logger.LogWarning("Validação falhou para atualização do talento {Id}: {Errors}", id, errors);
                throw new ValidationException(validationResult.Errors);
            }
            
            var existingTalent = await _talentRepository.GetByIdAsync(id);
            if (existingTalent == null)
            {
                _logger.LogWarning("Talento não encontrado para atualização: {Id}", id);
            return null;
            }
            
            // Usar AutoMapper para atualizar apenas os campos fornecidos
            _mapper.Map(dto, existingTalent);
            existingTalent.UpdatedAt = DateTime.UtcNow;
            
            var updatedTalent = await _talentRepository.UpdateAsync(existingTalent);
            if (updatedTalent == null)
            {
                _logger.LogError("Falha ao atualizar talento: {Id}", id);
                return null;
            }
            
            var result = _mapper.Map<TalentDto>(updatedTalent);
            _logger.LogInformation("Talento atualizado com sucesso: {Name} ({Id})", updatedTalent.FullName, updatedTalent.Id);
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar talento {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        try
        {
            _logger.LogInformation("Deletando talento: {Id}", id);
            
            var success = await _talentRepository.DeleteAsync(id);
            
            if (success)
            {
                _logger.LogInformation("Talento deletado com sucesso: {Id}", id);
            }
            else
            {
                _logger.LogWarning("Talento não encontrado para deleção: {Id}", id);
            }
            
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao deletar talento {Id}", id);
            throw;
        }
    }

    public async Task<bool> CheckExistsAsync(string? email = null, string? document = null)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(email) && string.IsNullOrWhiteSpace(document))
            {
                _logger.LogWarning("CheckExistsAsync chamado sem email ou documento");
                return false;
            }
            
            _logger.LogInformation("Verificando existência de talento: Email={Email}, Document={Document}", email, document);
            
            var talents = await _talentRepository.GetAllAsync();
            
            if (!string.IsNullOrWhiteSpace(email))
            {
                var emailExists = talents.Any(t => t.Email != null && t.Email.Equals(email.Trim(), StringComparison.OrdinalIgnoreCase));
                if (emailExists)
                {
                    _logger.LogInformation("Email já existe: {Email}", email);
                    return true;
                }
            }
            
            if (!string.IsNullOrWhiteSpace(document))
            {
                var documentExists = talents.Any(t => t.Document != null && t.Document.Equals(document.Trim(), StringComparison.OrdinalIgnoreCase));
                if (documentExists)
                {
                    _logger.LogInformation("Documento já existe: {Document}", document);
                    return true;
                }
            }
            
            _logger.LogInformation("Talent não encontrado com os critérios fornecidos");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao verificar existência de talento");
            throw;
        }
    }
}
