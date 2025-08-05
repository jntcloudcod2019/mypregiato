# Migração do Backend para .NET Core

## 📋 Visão Geral da Migração

### **Estrutura Proposta**

```
mypregiato/
├── frontend/                    # React + Vite (mantido)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/                     # Novo backend .NET
│   ├── Pregiato.API/           # Web API
│   ├── Pregiato.Core/          # Entidades e interfaces
│   ├── Pregiato.Infrastructure/ # Data Access (Entity Framework)
│   └── Pregiato.Application/   # Services e DTOs
└── shared/                      # Tipos compartilhados
    └── types/
```

### **Tecnologias .NET Recomendadas**

- **.NET 8** (LTS)
- **Entity Framework Core** (ORM)
- **SQL Server** ou **PostgreSQL** (banco de dados)
- **AutoMapper** (mapeamento de objetos)
- **FluentValidation** (validações)
- **Swagger/OpenAPI** (documentação)
- **JWT Authentication** (autenticação)
- **Serilog** (logging)

## 🚀 Passos da Migração

### **Fase 1: Setup do Projeto .NET**

1. **Criar estrutura de pastas**
2. **Configurar projetos .NET**
3. **Migrar schema do banco**
4. **Implementar entidades**

### **Fase 2: Implementar APIs**

1. **Controllers REST**
2. **Services de negócio**
3. **Repository Pattern**
4. **Validações**

### **Fase 3: Integração Frontend**

1. **Atualizar URLs da API**
2. **Ajustar tipos TypeScript**
3. **Testar integração**

## 📊 Vantagens da Migração

### **✅ Benefícios do .NET**

- **Performance superior** (compilado nativo)
- **Type safety** (C# é fortemente tipado)
- **Ecosystem maduro** (NuGet, Visual Studio)
- **Deploy mais simples** (Docker, Azure)
- **Melhor debugging** e profiling
- **Suporte empresarial** da Microsoft

### **🔧 Ferramentas Disponíveis**

- **Visual Studio** ou **Rider** (IDEs)
- **Entity Framework** (ORM)
- **LINQ** (queries type-safe)
- **Dependency Injection** nativo
- **Middleware** para cross-cutting concerns

## 🎯 Próximos Passos

1. **Confirmar interesse** na migração
2. **Definir stack** (SQL Server vs PostgreSQL)
3. **Criar estrutura** do projeto .NET
4. **Migrar entidades** do Prisma para EF Core
5. **Implementar APIs** equivalentes
6. **Atualizar frontend** para nova API

## 📝 Exemplo de Implementação

### **Entidade Talent (C#)**

```csharp
public class Talent
{
    public Guid Id { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public int Age { get; set; }
    public string? Document { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Instagram { get; set; }
    public string? TikTok { get; set; }
    public string? YouTube { get; set; }
    public string? OtherSocialMedia { get; set; }
    public string? Height { get; set; }
    public string? Weight { get; set; }
    public string? Bust { get; set; }
    public string? Waist { get; set; }
    public string? Hip { get; set; }
    public string? ShoeSize { get; set; }
    public string? HairColor { get; set; }
    public string? EyeColor { get; set; }
    public string? SkinTone { get; set; }
    public string? Ethnicity { get; set; }
    public string? Nationality { get; set; }
    public string? Languages { get; set; }
    public string? Skills { get; set; }
    public string? Experience { get; set; }
    public string? Availability { get; set; }
    public string? TravelAvailability { get; set; }
    public string? Rate { get; set; }
    public string? Notes { get; set; }
    public bool Status { get; set; }
    public bool InviteSent { get; set; }
    public string? DnaStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### **Controller API**

```csharp
[ApiController]
[Route("api/[controller]")]
public class TalentsController : ControllerBase
{
    private readonly ITalentService _talentService;
    
    public TalentsController(ITalentService talentService)
    {
        _talentService = talentService;
    }
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TalentDto>>> GetTalents()
    {
        var talents = await _talentService.GetAllAsync();
        return Ok(talents);
    }
    
    [HttpPost]
    public async Task<ActionResult<TalentDto>> CreateTalent(CreateTalentDto dto)
    {
        var talent = await _talentService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetTalent), new { id = talent.Id }, talent);
    }
}
```

## 🔄 Migração Gradual

É possível fazer a migração de forma gradual:

1. **Manter Node.js** rodando em paralelo
2. **Migrar APIs** uma por vez
3. **Testar** cada endpoint
4. **Trocar** URLs no frontend gradualmente
5. **Descomissionar** Node.js quando tudo estiver funcionando

## 💡 Recomendação

**Sim, vale muito a pena migrar para .NET!** 

As vantagens incluem:
- Melhor performance
- Mais robustez para ambiente empresarial
- Facilidade de manutenção
- Melhor suporte e documentação
- Ferramentas mais maduras 