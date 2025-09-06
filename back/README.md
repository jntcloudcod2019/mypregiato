# 🚀 Processo de Alocação de Leads - Endpoint `[HttpPost("allocate")]`

Este documento descreve todo o fluxo de salvamento de alocação de leads, desde o endpoint até o repository.

## 📋 Estrutura do Processo

```
Frontend → API Controller → Service → Repository → Database
```

---

## 1. 🎯 **ENDPOINT - Controller**

**Arquivo:** `Pregiato.API/Controllers/OperatorLeadsController.cs`

```csharp
[HttpPost("allocate")]
public async Task<IActionResult> AllocateLeads([FromBody] BulkOperatorLeadsDto bulkDto)
{
    try
    {
        if (bulkDto == null)
        {
            return BadRequest("Payload não pode ser nulo");
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _operatorLeadsService.AllocateLeadsAsync(bulkDto);
        
        if (result)
        {
            return Ok(new { 
                success = true, 
                message = "Leads alocados com sucesso",
                totalOperators = bulkDto.Operators?.Count ?? 0,
                totalLeads = bulkDto.Operators?.Sum(op => op.Leads?.Count ?? 0) ?? 0
            });
        }
        
        return BadRequest("Falha ao alocar leads");
    }
    catch (ArgumentException ex)
    {
        return BadRequest(new { success = false, message = ex.Message });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { success = false, message = "Erro interno do servidor", details = ex.Message });
    }
}
```

---

## 2. 📊 **DTOs - Estrutura de Dados**

**Arquivo:** `Pregiato.Application/DTOs/OperatorLeadsDto.cs`

```csharp
public class LeadDto
{
    [Required]
    public string NameLead { get; set; } = string.Empty;
    
    [Required]
    public string PhoneLead { get; set; } = string.Empty;
}

public class OperatorWithLeadsDto
{
    [Required]
    public string OperatorId { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    public string EmailOperator { get; set; } = string.Empty;
    
    [Required]
    public List<LeadDto> Leads { get; set; } = new List<LeadDto>();
}

public class BulkOperatorLeadsDto
{
    [Required]
    public List<OperatorWithLeadsDto> Operators { get; set; } = new List<OperatorWithLeadsDto>();
}
```

---

## 3. 🔧 **SERVICE - Lógica de Negócio**

**Arquivo:** `Pregiato.Application/Services/OperatorLeadsService.cs`

```csharp
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
                    OperatorId = operatorData.OperatorId,
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
        Console.WriteLine($"Erro ao alocar leads em lote: {ex.Message}");
        throw;
    }
}
```

---

## 4. 🏗️ **ENTIDADE - Modelo de Dados**

**Arquivo:** `Pregiato.Core/Entities/OperatorLeads.cs`

```csharp
public class OperatorLeads
{
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string OperatorId { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string EmailOperator { get; set; }
    
    [Required]
    [MaxLength(500)]
    public string NameLead { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string PhoneLead { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
}
```

---

## 5. 🔌 **INTERFACE DO REPOSITORY**

**Arquivo:** `Pregiato.Core/Interfaces/IOperatorLeadsRepository.cs`

```csharp
public interface IOperatorLeadsRepository
{
    Task<OperatorLeads> AddAsync(OperatorLeads operatorLeads);
    Task<IEnumerable<OperatorLeads>> AddRangeAsync(IEnumerable<OperatorLeads> operatorLeads);
 
}
```

---

## 6. 🗄️ **REPOSITORY - Acesso a Dados**

**Arquivo:** `Pregiato.Infrastructure/Repositories/OperatorLeadsRepository.cs`

```csharp
public class OperatorLeadsRepository : IOperatorLeadsRepository
{
    private readonly PregiatoDbContext _context;

    public OperatorLeadsRepository(PregiatoDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<OperatorLeads>> AddRangeAsync(IEnumerable<OperatorLeads> operatorLeads)
    {
        await _context.OperatorLeads.AddRangeAsync(operatorLeads);
        await _context.SaveChangesAsync();
        return operatorLeads;
    }

    public async Task<OperatorLeads> AddAsync(OperatorLeads operatorLeads)
    {
        await _context.OperatorLeads.AddAsync(operatorLeads);
        await _context.SaveChangesAsync();
        return operatorLeads;
    }

    // ... outros métodos implementados
}
```

---

## 7. 🗃️ **DBCONTEXT - Configuração do Entity Framework**

**Arquivo:** `Pregiato.Infrastructure/Data/PregiatoDbContext.cs`

```csharp
public class PregiatoDbContext : DbContext
{
    // ... outras configurações

    public DbSet<OperatorLeads> OperatorLeads { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<OperatorLeads>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OperatorId).IsRequired().HasMaxLength(255);
            entity.Property(e => e.EmailOperator).IsRequired().HasMaxLength(255);
            entity.Property(e => e.NameLead).IsRequired().HasMaxLength(500);
            entity.Property(e => e.PhoneLead).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });
    }
}
```

---

## 8. ⚙️ **REGISTRO DE SERVIÇOS - Program.cs**

**Arquivo:** `Pregiato.API/Program.cs`

```csharp
// Services
builder.Services.AddScoped<IOperatorLeadsService, Pregiato.Application.Services.OperatorLeadsService>();

// Repositories
builder.Services.AddScoped<IOperatorLeadsRepository, OperatorLeadsRepository>();
```

---

## 9. 📊 **EXEMPLO DE PAYLOAD ENVIADO**

```json
{
  "operators": [
    {
      "operatorId": "user_66666666666666666666666",
      "emailOperator": "fernando.melo@email.com",
      "leads": [
        {
          "nameLead": "Jaisa Mendes",
          "phoneLead": "p:+5547996583974"
        },
        {
          "nameLead": "Érika Torres Promotora",
          "phoneLead": "p:+5547988048565"
        }
      ]
    }
  ]
}
```

---

## 10. 🔄 **FLUXO COMPLETO DE EXECUÇÃO**

1. **Frontend** envia POST para `/api/operator-leads/allocate`
2. **Controller** recebe o payload e valida o ModelState
3. **Service** processa a lógica de negócio e mapeia DTOs para entidades
4. **Repository** salva as entidades no banco de dados
5. **Database** persiste os dados na tabela `OperatorLeads`
6. **Response** retorna sucesso com estatísticas

---

## 11. 🚨 **VALIDAÇÕES IMPLEMENTADAS**

- ✅ Payload não pode ser nulo
- ✅ ModelState deve ser válido
- ✅ Lista de operadores não pode estar vazia
- ✅ Campos obrigatórios: OperatorId, EmailOperator, NameLead, PhoneLead
- ✅ Validação de email no campo EmailOperator
- ✅ Tratamento de exceções com mensagens específicas

---

## 12. 📝 **NOTAS IMPORTANTES**

- **Arquitetura Hexagonal**: DTOs no Application, Entidades no Core
- **Dependency Injection**: Todos os serviços registrados no Program.cs
- **Validação**: Usa Data Annotations para validação automática
- **Tratamento de Erros**: Captura exceções específicas e retorna respostas padronizadas
- **Transações**: Entity Framework gerencia transações automaticamente
