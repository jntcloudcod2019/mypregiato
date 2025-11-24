# 🔗 INTEGRAÇÃO COM BACKEND

## 📋 Depois da migração para Clerk

Após criar os usuários no Clerk, você precisará **sincronizar com o banco de dados local**.

## 🎯 Estratégia Recomendada

### **Opção 1: Via Webhook (Automático)**

Configure um webhook no Clerk para criar usuários automaticamente no banco quando aceitarem o convite.

**Arquivo**: `back/Pregiato.API/Controllers/WebhooksController.cs`

```csharp
[HttpPost("clerk")]
public async Task<IActionResult> HandleClerkWebhook()
{
    // Já existe implementação para user.created
    // Adicione lógica para criar na tabela Users se não existir
}
```

### **Opção 2: Script de sincronização (Manual)**

Crie um endpoint no backend para buscar usuários do Clerk e criar no banco:

```csharp
[HttpPost("sync-clerk-users")]
public async Task<ActionResult> SyncClerkUsers()
{
    try
    {
        var clerkUsers = await _clerkAuthService.GetAllOrganizationMembersAsync();
        
        foreach (var clerkUser in clerkUsers)
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.ClerkId == clerkUser.Id);
            
            if (existingUser == null)
            {
                var user = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    ClerkId = clerkUser.Id,
                    Email = clerkUser.EmailAddress,
                    FirstName = clerkUser.FirstName,
                    LastName = clerkUser.LastName,
                    Role = clerkUser.PublicMetadata["systemRole"]?.ToString() ?? "MODEL",
                    ImageUrl = clerkUser.ImageUrl,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                _context.Users.Add(user);
            }
        }
        
        await _context.SaveChangesAsync();
        return Ok(new { message = "Usuários sincronizados" });
    }
    catch (Exception ex)
    {
        return StatusCode(500, ex.Message);
    }
}
```

### **Opção 3: Script Node.js para sincronização**

Crie um script que:
1. Lê `migration-success.json`
2. Para cada usuário, chama a API do backend: `POST /api/Users`

```typescript
// sync-to-backend.ts
import axios from 'axios';
import * as fs from 'fs';

const API_URL = 'http://localhost:5656/api/Users';

interface MigrationResult {
  clerkId: string;
  user: {
    first_name: string;
    last_name: string;
    email_address: string[];
  };
}

async function syncToBackend() {
  const results: MigrationResult[] = JSON.parse(
    fs.readFileSync('migration-success.json', 'utf-8')
  );
  
  for (const result of results) {
    try {
      await axios.post(API_URL, {
        clerkId: result.clerkId,
        email: result.user.email_address[0],
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        role: 'MODEL'
      });
      
      console.log(`✅ ${result.user.first_name} ${result.user.last_name}`);
    } catch (error: any) {
      console.error(`❌ Erro: ${error.message}`);
    }
  }
}

syncToBackend();
```

## 🔐 External ID para Foreign Keys

O script já define `external_id` no Clerk, que pode ser usado para manter compatibilidade com IDs antigos.

### Como acessar no backend:

```csharp
// No ClerkAuthService
public async Task<string> GetExternalIdAsync(string clerkUserId)
{
    var user = await GetUserAsync(clerkUserId);
    return user.ExternalId; // user_primeiro_123
}
```

### Session Claims customizado:

No dashboard do Clerk, vá em **Sessions → Edit** e adicione:

```json
{
  "userId": "{{user.externalId || user.id}}"
}
```

Isso retorna o `external_id` se existir, senão retorna o `clerk_id`.

## 📊 Verificar usuários criados

### Via Clerk Dashboard:
https://dashboard.clerk.com/apps/[your-app-id]/instances/[instance-id]/users

### Via API do Clerk:

```bash
curl -X GET 'https://api.clerk.com/v1/organizations/org_35XUIz5zcKDS57ibItdzgNiIh99/memberships' \
  -H 'Authorization: Bearer sk_live_yhu3BQHiGHGqlljcLBhoMEUguD3he5V51IOqetmx17'
```

### Via Backend (criar endpoint):

```csharp
[HttpGet("clerk-stats")]
public async Task<ActionResult> GetClerkStats()
{
    var totalClerk = await _clerkAuthService.GetOrganizationMemberCountAsync();
    var totalDb = await _context.Users.CountAsync(u => u.Role == "MODEL");
    
    return Ok(new {
        clerkTotal = totalClerk,
        dbTotal = totalDb,
        missing = totalClerk - totalDb
    });
}
```

## 🚀 Comandos úteis

### Processar e migrar tudo de uma vez:
```bash
npm run process && npm start
```

### Verificar progresso durante migração:
```bash
# Em outro terminal
watch -n 5 "wc -l migration-success.json"
```

### Backup antes de migrar:
```bash
cp nomes_unicos.json nomes_unicos.backup.json
```

## 📞 Suporte

- [Clerk API Reference](https://clerk.com/docs/reference/backend-api)
- [Organizations API](https://clerk.com/docs/organizations/overview)
- [User Metadata](https://clerk.com/docs/users/metadata)

