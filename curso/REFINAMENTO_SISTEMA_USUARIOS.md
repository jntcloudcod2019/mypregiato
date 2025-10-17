# 🔧 REFINAMENTO TÉCNICO - Sistema de Usuários

## 📋 OBJETIVO
Implementar sistema completo de gerenciamento de usuários com:
1. Remover dados mockados
2. Adicionar campos LastName e Role no formulário de convite
3. Criar usuário no Clerk via API Backend
4. Criar usuário no banco de dados com ClerkId retornado

---

## 🗺️ MAPEAMENTO DE ENTIDADES

### **Entidade: User** (MySQL)
```csharp
public class User
{
    public string Id { get; set; }           // UUID gerado pelo sistema
    public string ClerkId { get; set; }      // ID retornado pela API do Clerk
    public string Email { get; set; }        // Email único
    public string FirstName { get; set; }    // Nome
    public string LastName { get; set; }     // Sobrenome
    public string? ImageUrl { get; set; }    // URL da foto (opcional)
    public string Role { get; set; }         // ADMIN | MODEL | PRODUCER | OPERATOR
    public DateTime CreatedAt { get; set; }  // Data de criação
    public DateTime UpdatedAt { get; set; }  // Data de atualização
}
```

### **DTOs Existentes**
```csharp
// Leitura
public class UserDto { ... } // ✅ Completo

// Criação
public class CreateUserDto
{
    public string ClerkId { get; set; }    // ⚠️ Será gerado pela API
    public string Email { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string? ImageUrl { get; set; }
    public string Role { get; set; }
}

// Atualização
public class UpdateUserDto { ... } // ✅ OK
```

---

## 🎯 FLUXO COMPLETO DE CRIAÇÃO DE USUÁRIO (CLERK INVITATIONS)

### **Diagrama de Sequência**
```
Frontend          Backend           Clerk API          Email          Usuário
   │                 │                  │                │               │
   │  POST /api/     │                  │                │               │
   │  users/send-    │                  │                │               │
   │  invitation     │                  │                │               │
   ├────────────────>│                  │                │               │
   │                 │                  │                │               │
   │                 │  1. Validar     │                │               │
   │                 │                  │                │               │
   │                 │  POST /v1/       │                │               │
   │                 │  invitations     │                │               │
   │                 │  {email, role,   │                │               │
   │                 │   redirect_url}  │                │               │
   │                 ├─────────────────>│                │               │
   │                 │                  │                │               │
   │                 │                  │  📧 Envia      │               │
   │                 │                  │  email com     │               │
   │                 │                  │  link          │               │
   │                 │                  ├───────────────>│               │
   │                 │                  │                │               │
   │                 │  ✅ {invitationId│                │  📩 Recebe    │
   │                 │     status}      │                │  email        │
   │                 │<─────────────────┤                ├──────────────>│
   │                 │                  │                │               │
   │                 │  2. Salvar       │                │               │
   │                 │  convite         │                │               │
   │                 │  pendente        │                │               │
   │                 │  no MySQL        │                │               │
   │                 │                  │                │               │
   │  ✅ Convite     │                  │                │               │
   │  enviado!       │                  │                │               │
   │<────────────────┤                  │                │               │
   │                 │                  │                │               │
   │                 │                  │                │  🔗 Clica no  │
   │                 │                  │  Aceita        │  link         │
   │                 │                  │  convite +     │<──────────────┤
   │                 │                  │  define senha  │               │
   │                 │                  │<───────────────┤               │
   │                 │                  │                │               │
   │                 │  Webhook:        │                │               │
   │                 │  user.created    │                │               │
   │                 │<─────────────────┤                │               │
   │                 │                  │                │               │
   │                 │  3. Atualizar    │                │               │
   │                 │  ClerkId no      │                │               │
   │                 │  MySQL           │                │               │
   │                 │                  │                │               │
```

### **Regras de Negócio**

1. **Sistema de Convites (Clerk Invitations)**
   - ✅ Clerk envia email automaticamente
   - ✅ Usuário define sua própria senha ao aceitar
   - ✅ Link de ativação expira em 7 dias
   - ✅ Mais seguro que senha padrão

2. **Roles Disponíveis**
   - `ADMIN`: Acesso total ao sistema
   - `MODEL`: Talentos/Modelos
   - `PRODUCER`: Produtores
   - `OPERATOR`: Operadores de CRM

3. **Validações**
   - Email único (Clerk + MySQL)
   - FirstName obrigatório
   - LastName obrigatório
   - Role obrigatório

---

## 🔧 IMPLEMENTAÇÃO

### **1. Backend - Adicionar Método ao ClerkAuthService**

**Arquivo:** `back/Pregiato.API/Services/ClerkAuthService.cs`

```csharp
public interface IClerkAuthService
{
    // ... métodos existentes ...
    
    /// <summary>
    /// Envia convite via Clerk (Clerk envia email automaticamente)
    /// </summary>
    Task<ClerkInvitationResult> SendInvitationAsync(SendClerkInvitationRequest request);
}

public class SendClerkInvitationRequest
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string RedirectUrl { get; set; } = string.Empty;
}

public class ClerkInvitationResult
{
    public bool Success { get; set; }
    public string? InvitationId { get; set; }
    public string? Status { get; set; }
    public string? ErrorMessage { get; set; }
}

// Implementação
public async Task<ClerkInvitationResult> SendInvitationAsync(SendClerkInvitationRequest request)
{
    try
    {
        var clerkSecretKey = _configuration["Clerk:SecretKey"];
        if (string.IsNullOrEmpty(clerkSecretKey))
        {
            return new ClerkInvitationResult 
            { 
                Success = false, 
                ErrorMessage = "Clerk Secret Key não configurada" 
            };
        }

        // Configurar HttpClient com autenticação
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {clerkSecretKey}");

        // 📧 Clerk Invitations API Payload
        var payload = new
        {
            email_address = request.Email,
            public_metadata = new 
            { 
                role = request.Role,
                firstName = request.FirstName,
                lastName = request.LastName
            },
            redirect_url = request.RedirectUrl, // URL após aceitar convite
            notify = true // ✅ Clerk envia email automaticamente!
        };

        var jsonContent = JsonSerializer.Serialize(payload);
        var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

        // ✅ Clerk Invitations API (não Users)
        var response = await _httpClient.PostAsync("https://api.clerk.com/v1/invitations", content);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogError($"Erro ao enviar convite pelo Clerk: {errorContent}");
            
            return new ClerkInvitationResult 
            { 
                Success = false, 
                ErrorMessage = $"Clerk API error: {errorContent}" 
            };
        }

        var responseContent = await response.Content.ReadAsStringAsync();
        var invitation = JsonSerializer.Deserialize<JsonElement>(responseContent);
        
        var invitationId = invitation.GetProperty("id").GetString();
        var status = invitation.GetProperty("status").GetString();

        _logger.LogInformation($"Convite enviado com sucesso: {invitationId}");

        return new ClerkInvitationResult
        {
            Success = true,
            InvitationId = invitationId,
            Status = status
        };
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Exceção ao enviar convite pelo Clerk");
        return new ClerkInvitationResult 
        { 
            Success = false, 
            ErrorMessage = ex.Message 
        };
    }
}
```

---

### **2. Backend - Atualizar UsersController**

**Arquivo:** `back/Pregiato.API/Controllers/UsersController.cs`

**Adicionar novo endpoint:**

```csharp
/// <summary>
/// Envia convite para novo usuário via Clerk
/// Clerk envia o email automaticamente com link de ativação
/// </summary>
[HttpPost("send-invitation")]
public async Task<ActionResult> SendUserInvitation([FromBody] SendUserInvitationDto invitationDto)
{
    try
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // 1️⃣ VALIDAR - Verificar se email já existe
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == invitationDto.Email.ToLower());

        if (existingUser != null)
        {
            return BadRequest("Já existe um usuário com este email");
        }

        // 2️⃣ ENVIAR CONVITE VIA CLERK
        var redirectUrl = "https://my-pregiato-production.up.railway.app/"; 
        
        var clerkRequest = new SendClerkInvitationRequest
        {
            Email = invitationDto.Email,
            FirstName = invitationDto.FirstName,
            LastName = invitationDto.LastName,
            Role = invitationDto.Role,
            RedirectUrl = redirectUrl
        };

        var result = await _clerkAuthService.SendInvitationAsync(clerkRequest);

        if (!result.Success)
        {
            return StatusCode(500, $"Erro ao enviar convite: {result.ErrorMessage}");
        }

        // 3️⃣ CRIAR REGISTRO PENDENTE NO BANCO
        // ClerkId ficará vazio até usuário aceitar convite
        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            ClerkId = "", // ⚠️ Vazio - será preenchido via webhook quando aceitar
            Email = invitationDto.Email,
            FirstName = invitationDto.FirstName,
            LastName = invitationDto.LastName,
            Role = invitationDto.Role.ToUpper(),
            ImageUrl = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            $"Convite enviado para {invitationDto.Email} " +
            $"(Role: {invitationDto.Role}, InvitationId: {result.InvitationId})"
        );

        return Ok(new 
        { 
            message = $"Convite enviado para {invitationDto.FirstName} {invitationDto.LastName}",
            invitationId = result.InvitationId,
            status = result.Status,
            email = invitationDto.Email,
            note = "O usuário receberá um email do Clerk com link de ativação"
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Erro ao enviar convite");
        return StatusCode(500, $"Erro interno: {ex.Message}");
    }
}
```

---

### **3. Backend - Adicionar DTO**

**Arquivo:** `back/Pregiato.Application/DTOs/UserDto.cs`

```csharp
/// <summary>
/// DTO para envio de convite via Clerk Invitations
/// </summary>
public class SendUserInvitationDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(191)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(191)]
    public string LastName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(20)]
    public string Role { get; set; } = string.Empty; // ADMIN | MODEL | PRODUCER | OPERATOR
}
```

---

### **4. Frontend - Criar Serviço de Usuários**

**Arquivo:** `front/src/services/user-management-service.ts`

```typescript
import { apiClient } from './api-client';

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MODEL' | 'PRODUCER' | 'OPERATOR';
  imageUrl?: string;
}

export interface UserResponse {
  user: {
    id: string;
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
  temporaryPassword?: string; // Retorna apenas para MODEL
}

export class UserManagementService {
  private readonly baseUrl = '/api/users';

  /**
   * Enviar convite via Clerk (Clerk envia email automaticamente)
   */
  async sendInvitation(data: CreateUserRequest): Promise<{
    message: string;
    invitationId: string;
    status: string;
    email: string;
    note: string;
  }> {
    return await apiClient.post(`${this.baseUrl}/send-invitation`, data);
  }

  /**
   * Listar todos os usuários
   */
  async getAllUsers(role?: string): Promise<UserResponse['user'][]> {
    const params = role ? `?role=${role}` : '';
    return await apiClient.get<UserResponse['user'][]>(`${this.baseUrl}${params}`);
  }

  /**
   * Buscar usuário por email
   */
  async getUserByEmail(email: string): Promise<UserResponse['user']> {
    return await apiClient.get<UserResponse['user']>(`${this.baseUrl}/by-email/${encodeURIComponent(email)}`);
  }

  /**
   * Atualizar usuário
   */
  async updateUser(id: string, data: Partial<CreateUserRequest>): Promise<UserResponse['user']> {
    return await apiClient.put<UserResponse['user']>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Deletar usuário
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Listar operadores
   */
  async getOperators(): Promise<UserResponse['user'][]> {
    return await apiClient.get<UserResponse['user'][]>(`${this.baseUrl}/operators`);
  }

  /**
   * Listar produtores
   */
  async getProducers(): Promise<UserResponse['user'][]> {
    return await apiClient.get<UserResponse['user'][]>(`${this.baseUrl}/producers`);
  }
}

export const userManagementService = new UserManagementService();
```

---

### **5. Frontend - Atualizar Página de Usuários**

**Arquivo:** `front/src/pages/usuarios/index.tsx`

**Mudanças principais:**

```typescript
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementService } from '@/services/user-management-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Usuarios() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  // ✅ Formulário completo
  const [inviteData, setInviteData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "MODEL" as 'ADMIN' | 'MODEL' | 'PRODUCER' | 'OPERATOR'
  });

  // ✅ Query para buscar usuários (substituindo mockTalents)
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userManagementService.getAllUsers()
  });

  // ✅ Mutation para enviar convite
  const sendInvitationMutation = useMutation({
    mutationFn: userManagementService.sendInvitation,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      toast.success(
        `✅ ${response.message}\n\n` +
        `📧 Um email foi enviado para ${response.email} com instruções de ativação.\n` +
        `🔗 Após aceitar, será redirecionado para: https://my-pregiato-production.up.railway.app/`
      );
      
      setIsInviteDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data || 'Erro ao enviar convite');
    }
  });

  const handleSendInvite = async () => {
    if (!inviteData.email || !inviteData.firstName || !inviteData.lastName) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    await sendInvitationMutation.mutateAsync(inviteData);
  };

  const resetForm = () => {
    setInviteData({
      email: "",
      firstName: "",
      lastName: "",
      role: "MODEL"
    });
  };

  // Filtrar usuários
  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const talentUsers = filteredUsers.filter(u => u.role === 'MODEL');
  const employeeUsers = filteredUsers.filter(u => ['ADMIN', 'OPERATOR', 'PRODUCER'].includes(u.role));

  return (
    <div className="p-6 space-y-6">
      {/* ... Header ... */}
      
      {/* ✅ DIALOG ATUALIZADO */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Criar Usuário
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              O usuário será criado automaticamente no Clerk e no sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Nome */}
            <div className="grid gap-2">
              <Label htmlFor="firstName">Nome *</Label>
              <Input
                id="firstName"
                name="firstName"
                value={inviteData.firstName}
                onChange={(e) => setInviteData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="João"
                autoComplete="given-name"
              />
            </div>

            {/* ✅ NOVO: Sobrenome */}
            <div className="grid gap-2">
              <Label htmlFor="lastName">Sobrenome *</Label>
              <Input
                id="lastName"
                name="lastName"
                value={inviteData.lastName}
                onChange={(e) => setInviteData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Silva"
                autoComplete="family-name"
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
                autoComplete="email"
              />
            </div>

            {/* ✅ NOVO: Role (Tipo de Usuário) */}
            <div className="grid gap-2">
              <Label htmlFor="role">Tipo de Usuário *</Label>
              <Select 
                value={inviteData.role} 
                onValueChange={(value) => setInviteData(prev => ({ 
                  ...prev, 
                  role: value as 'ADMIN' | 'MODEL' | 'PRODUCER' | 'OPERATOR' 
                }))}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MODEL">Modelo (Talento)</SelectItem>
                  <SelectItem value="OPERATOR">Operador (CRM)</SelectItem>
                  <SelectItem value="PRODUCER">Produtor</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
              
              {/* ✅ INFO: Convite Clerk */}
              <p className="text-xs text-muted-foreground">
                ℹ️ Um email será enviado via Clerk para que o usuário defina sua própria senha
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSendInvite}
              disabled={sendInvitationMutation.isPending || !inviteData.email || !inviteData.firstName || !inviteData.lastName}
            >
              {sendInvitationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando convite...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Convite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ TABELAS ATUALIZADAS (usar users ao invés de mockData) */}
      <TabsContent value="talents">
        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {talentUsers.map((user) => (
              <div key={user.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b">
                <div className="col-span-3 font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <div className="col-span-3 text-muted-foreground">{user.email}</div>
                <div className="col-span-2">
                  <Badge className="bg-green-500">Ativo</Badge>
                </div>
                <div className="col-span-2">
                  <Badge>{user.role}</Badge>
                </div>
                <div className="col-span-2">
                  {/* Ações */}
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </div>
  );
}
```

---

## 📊 RESUMO DAS ALTERAÇÕES

### **Backend**

| Arquivo | Alteração | Status |
|---------|-----------|--------|
| `ClerkAuthService.cs` | ✅ Adicionar `CreateClerkUserAsync()` | Novo método |
| `UsersController.cs` | ✅ Adicionar endpoint `POST /api/users/create-with-clerk` | Novo endpoint |
| `UserDto.cs` | ✅ Adicionar `CreateUserWithClerkDto` | Novo DTO |

### **Frontend**

| Arquivo | Alteração | Status |
|---------|-----------|--------|
| `user-management-service.ts` | ✅ Criar serviço completo | Novo arquivo |
| `usuarios/index.tsx` | ✅ Remover mocks, adicionar campos, integrar API | Refatoração |

---

## 🔐 SEGURANÇA

### **Senhas**
- **MODEL**: `009900` (padrão fixo)
- **OUTROS**: Gerada aleatoriamente (12 caracteres)
- **⚠️ IMPORTANTE**: Usuário deve trocar a senha no primeiro login

### **Validações**
- ✅ Email único (Clerk + MySQL)
- ✅ Campos obrigatórios validados
- ✅ Role deve ser uma das 4 opções válidas
- ✅ ClerkId obrigatório antes de salvar no banco

---

## 🧪 TESTES

### **Cenário 1: Criar MODEL**
```
1. Admin clica em "Criar Usuário"
2. Preenche:
   - Nome: "Maria"
   - Sobrenome: "Silva"
   - Email: "maria@example.com"
   - Tipo: "Modelo (Talento)"
3. Sistema mostra: "Senha padrão será: 009900"
4. Clica em "Criar Usuário"
5. Backend:
   - Cria no Clerk com senha "009900"
   - Obtém ClerkId: "user_abc123"
   - Cria no MySQL com ClerkId
6. Frontend exibe: "Usuário criado! Senha temporária: 009900"
```

### **Cenário 2: Criar OPERATOR**
```
1. Preenche formulário com Role = "Operador (CRM)"
2. Backend:
   - Gera senha aleatória: "Xk9#mP2qL5vN"
   - Cria no Clerk
   - Cria no MySQL
3. Frontend exibe: "Usuário criado com sucesso"
   (não mostra senha - será enviada por email)
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **Backend**
- [ ] Adicionar método `CreateClerkUserAsync` ao `ClerkAuthService`
- [ ] Adicionar classes `CreateClerkUserRequest` e `ClerkUserCreationResult`
- [ ] Criar endpoint `POST /api/users/create-with-clerk`
- [ ] Adicionar `CreateUserWithClerkDto`
- [ ] Implementar lógica de senha (MODEL = 009900, outros = random)
- [ ] Testar integração com Clerk API
- [ ] Adicionar logs de auditoria

### **Frontend**
- [ ] Criar `user-management-service.ts`
- [ ] Remover `mockTalents` e `mockEmployees`
- [ ] Adicionar campo `lastName` no formulário
- [ ] Adicionar campo `role` (Select com 4 opções)
- [ ] Integrar com `useQuery` para buscar usuários
- [ ] Integrar com `useMutation` para criar usuários
- [ ] Exibir senha temporária para MODEL
- [ ] Adicionar loading states
- [ ] Tratamento de erros

---

## 🚀 PRÓXIMOS PASSOS

1. **Implementar Backend** (ClerkAuthService + Controller)
2. **Implementar Frontend** (Service + Página)
4. **Deploy e validação em produção**
5. **Adicionar envio de email com senha** (opcional para não-MODEL)

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **Clerk API Endpoint**: `https://api.clerk.com/v1/users`
2. **Autenticação**: Bearer Token (Clerk Secret Key)
3. **Documentação Clerk**: https://clerk.com/docs/reference/backend-api/tag/Users#operation/CreateUser
4. **Rate Limits**: Clerk tem limites de requisições (verificar plano)
5. **Erro Handling**: Clerk pode retornar erros específicos (email já existe, senha fraca, etc.)

---

**📝 Quer que eu implemente essas alterações agora?** 🚀

