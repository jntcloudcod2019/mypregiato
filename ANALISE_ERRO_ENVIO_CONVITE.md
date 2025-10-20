# 🔴 ANÁLISE COMPLETA - ERRO NO ENVIO DE CONVITE

**Data:** 20 de Outubro de 2025  
**Erro:** `POST /apiundefined/send-invitation - 404 (Not Found)`  
**URL Incorreta:** `https://pregiato-api-production.up.railway.app/apiundefined/send-invitation`

---

## 🚨 PROBLEMA IDENTIFICADO

A URL está sendo construída como `/apiundefined/send-invitation` ao invés de `/api/users/send-invitation`.

**Sintoma:** O texto `undefined` está sendo inserido entre `/api` e `/users`.

---

## 📂 ARQUIVOS ENVOLVIDOS NO FLUXO

### 1️⃣ FRONTEND - `front/src/services/user-management-service.ts`

**Linha 30:** Definição da URL base
```typescript
private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pregiato-api-production.up.railway.app';
```

**Linha 41:** Construção da URL para envio de convite
```typescript
const url = `${this.API_BASE_URL}/api/users/send-invitation`;
```

**✅ Este arquivo está CORRETO!**

---

### 2️⃣ FRONTEND - `front/src/pages/usuarios/index.tsx`

**Linha 14:** Importação do serviço
```typescript
import { userManagementService, CreateUserRequest, UserResponse } from '../../services/user-management-service'
```

**Linhas 46-63:** Mutation para envio de convite
```typescript
const sendInvitationMutation = useMutation({
  mutationFn: userManagementService.sendInvitation,
  onSuccess: (response) => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
    toast.success(
      `✅ ${response.message}\n\n📧 Um email foi enviado para ${response.email} com instruções de ativação.`,
      { duration: 5000 }
    )
    
    setIsInviteDialogOpen(false)
    resetForm()
  },
  onError: (error: Error) => {
    const errorMessage = error.message || 'Erro ao enviar convite'
    toast.error(`Erro: ${errorMessage}`)
  }
})
```

**Linhas 118-125:** Handler para envio
```typescript
const handleSendInvite = async () => {
  if (!inviteData.email || !inviteData.firstName || !inviteData.lastName) {
    toast.error("Preencha todos os campos obrigatórios")
    return
  }

  await sendInvitationMutation.mutateAsync(inviteData)
}
```

**✅ Este arquivo está CORRETO!**

---

### 3️⃣ BACKEND - `back/Pregiato.API/Controllers/UsersController.cs`

**Linha 424-425:** Endpoint definido
```csharp
[HttpPost("send-invitation")]
public async Task<ActionResult> SendUserInvitation([FromBody] SendUserInvitationDto invitationDto)
```

**Rota Completa Esperada:** `/api/users/send-invitation`

**✅ Este arquivo está CORRETO!**

---

### 4️⃣ BACKEND - `back/Pregiato.API/Services/ClerkAuthService.cs`

**Linhas 171-265:** Método `SendInvitationAsync`
```csharp
public async Task<ClerkInvitationResult> SendInvitationAsync(SendClerkInvitationRequest request)
{
    // ... código de autenticação e validação ...
    
    // ✅ ID da Organização Pregiato
    const string ORGANIZATION_ID = "org_30i5ExFclW4l6UNqp8F9ZzOfQ4D";
    
    // Payload para Clerk Organization Invitations API
    var payload = new
    {
        email_address = request.Email,
        role = $"org:{request.Role.ToLower()}",
        public_metadata = new 
        { 
            firstName = request.FirstName,
            lastName = request.LastName,
            originalRole = request.Role
        },
        redirect_url = request.RedirectUrl,
        notify = true,
        ignore_existing = false
    };
    
    // URL da API do Clerk
    var apiUrl = $"https://api.clerk.com/v1/organizations/{ORGANIZATION_ID}/invitations";
    var response = await _httpClient.PostAsync(apiUrl, content);
}
```

**✅ Este arquivo está CORRETO!**

---

## 🔍 ANÁLISE DO ERRO

### Erro no Log do Frontend:
```
📤 [USER-SERVICE] Enviando convite para: https://pregiato-api-production.up.railway.app/apiundefined/send-invitation
```

### Erro no Log do Backend:
```
[01:06:44 INF] Request starting POST /apiundefined/send-invitation
[01:06:44 INF] Request finished POST /apiundefined/send-invitation - 404 in 0.1906ms
```

---

## 🧩 POSSÍVEIS CAUSAS

### **Causa 1: Build Desatualizado no Frontend**

O frontend em produção pode estar usando uma **versão antiga** do `user-management-service.ts` que ainda tinha:
```typescript
const url = `${API_URL}${this.baseUrl}/send-invitation`;
```

Onde `API_URL` está `undefined`, resultando em:
```
undefined + "/users" + "/send-invitation" = "undefined/users/send-invitation"
```

Que se torna `/apiundefined/send-invitation` após algum processamento.

**✅ SOLUÇÃO:** Re-buildar e re-deployar o frontend.

---

### **Causa 2: Cache do Browser/CDN**

O browser ou CDN pode estar servindo uma versão em cache do JavaScript.

**✅ SOLUÇÃO:** 
1. Limpar cache do browser (Ctrl+Shift+Delete ou Cmd+Shift+Delete)
2. Fazer hard refresh (Ctrl+F5 ou Cmd+Shift+R)
3. Invalidar cache do CDN (se houver)

---

### **Causa 3: Variável de Ambiente `VITE_API_BASE_URL` Não Configurada**

Se a variável `VITE_API_BASE_URL` não estiver configurada corretamente no Railway (frontend), o código usa o fallback:
```typescript
private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pregiato-api-production.up.railway.app';
```

**Verificar no Railway:**
- Service do Frontend → Variables
- Deve ter: `VITE_API_BASE_URL=https://pregiato-api-production.up.railway.app`

---

## ✅ SOLUÇÃO COMPLETA

### **1️⃣ Verificar Código do Frontend em Produção**

Execute no terminal para ver o código compilado:
```bash
cd front
npm run build
# ou
yarn build
```

Inspecione o arquivo gerado em `dist/assets/index-*.js` e procure por:
```javascript
sendInvitation
```

Verifique se a URL está sendo construída corretamente.

---

### **2️⃣ Re-Deploy do Frontend**

```bash
cd front
npm run build
# Deploy no Railway
```

Ou commit e push para trigger o deploy automático:
```bash
git add front/src/services/user-management-service.ts
git commit -m "fix: corrigir URL do serviço de envio de convite"
git push origin main
```

---

### **3️⃣ Configurar Variáveis de Ambiente no Railway**

**Frontend Service:**
```
VITE_API_BASE_URL=https://pregiato-api-production.up.railway.app
```

**Backend Service:**
```
Clerk__SecretKey=sk_test_SRNMuIeWmQEV8HHc47FGK7iidGL4DiLKx93ygNisSh
Clerk__OrganizationId=org_30i5ExFclW4l6UNqp8F9ZzOfQ4D
Clerk__Environment=Test
```

---

### **4️⃣ Limpar Cache**

**No Browser:**
1. Abrir DevTools (F12)
2. Clicar com botão direito no botão de reload
3. Selecionar "Empty Cache and Hard Reload"

**No Railway:**
1. Frontend Service → Settings
2. "Clear Build Cache"
3. Re-deploy

---

## 🧪 TESTE MANUAL

### **Teste 1: Verificar URL Construída**

Adicione um `console.log` temporário no `user-management-service.ts`:
```typescript
async sendInvitation(data: CreateUserRequest): Promise<InvitationResponse> {
  try {
    const url = `${this.API_BASE_URL}/api/users/send-invitation`;
    console.log('🔧 [DEBUG] API_BASE_URL:', this.API_BASE_URL);
    console.log('🔧 [DEBUG] URL completa:', url);
    // ...
  }
}
```

**Resultado Esperado:**
```
🔧 [DEBUG] API_BASE_URL: https://pregiato-api-production.up.railway.app
🔧 [DEBUG] URL completa: https://pregiato-api-production.up.railway.app/api/users/send-invitation
```

---

### **Teste 2: cURL Direto na API**

```bash
curl -X POST https://pregiato-api-production.up.railway.app/api/users/send-invitation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {CLERK_TOKEN}" \
  -d '{
    "email": "teste@exemplo.com",
    "firstName": "Teste",
    "lastName": "Usuario",
    "role": "MODEL"
  }'
```

**Resultado Esperado:** 200 OK ou erro específico do Clerk (não 404).

---

## 📊 FLUXO CORRETO ESPERADO

```
┌─────────────────────────────────────────────────────────────┐
│ 1️⃣ FRONTEND (Browser)                                       │
│    Usuário preenche formulário em /usuarios                 │
│    Clica em "Enviar Convite"                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2️⃣ FRONTEND (user-management-service.ts)                    │
│    userManagementService.sendInvitation(data)                │
│    URL: https://pregiato-api-production.up.railway.app      │
│         /api/users/send-invitation                           │
│    Method: POST                                              │
│    Headers: Authorization: Bearer {CLERK_TOKEN}              │
│    Body: { email, firstName, lastName, role }                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3️⃣ BACKEND (UsersController.cs)                             │
│    [HttpPost("send-invitation")]                             │
│    SendUserInvitation(invitationDto)                         │
│    - Valida ModelState                                       │
│    - Verifica se email já existe                             │
│    - Chama ClerkAuthService.SendInvitationAsync()            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4️⃣ BACKEND (ClerkAuthService.cs)                            │
│    SendInvitationAsync(request)                              │
│    URL: https://api.clerk.com/v1/organizations/              │
│         org_30i5ExFclW4l6UNqp8F9ZzOfQ4D/invitations          │
│    Method: POST                                              │
│    Headers: Authorization: Bearer {CLERK_SECRET_KEY}         │
│    Body: { email_address, role, public_metadata, ... }       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5️⃣ CLERK API                                                 │
│    Cria convite na organização                               │
│    Envia email para o usuário                                │
│    Retorna: { id, status, email, ... }                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6️⃣ BACKEND (UsersController.cs)                             │
│    Salva usuário no banco com status "Pending"               │
│    Retorna sucesso para frontend                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7️⃣ FRONTEND (usuarios/index.tsx)                            │
│    Exibe toast de sucesso                                    │
│    Atualiza lista de usuários                                │
│    Fecha modal de convite                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 RESUMO DA CORREÇÃO

### **Problema:**
URL sendo construída como `/apiundefined/send-invitation` ao invés de `/api/users/send-invitation`.

### **Causa Raiz:**
Frontend em produção está usando versão antiga do código com `API_URL` indefinido.

### **Solução:**
1. ✅ **Código já está correto** em `user-management-service.ts` (linha 41)
2. ❌ **Precisa re-buildar e re-deployar** o frontend
3. ⚠️ **Verificar variáveis de ambiente** no Railway
4. 🧹 **Limpar cache** do browser e CDN

### **Comando para Re-Deploy:**
```bash
cd front
npm run build
git add .
git commit -m "fix: corrigir URL do serviço de envio de convite"
git push origin main
```

---

## 📝 CHECKLIST DE VERIFICAÇÃO

- [ ] Código do `user-management-service.ts` está correto (linha 41)
- [ ] Frontend foi re-buildado após as alterações
- [ ] Deploy do frontend foi feito no Railway
- [ ] Variável `VITE_API_BASE_URL` está configurada no Railway
- [ ] Cache do browser foi limpo
- [ ] Cache do CDN foi invalidado (se aplicável)
- [ ] Teste manual com cURL funcionou
- [ ] Console.log no browser mostra URL correta
- [ ] Backend está recebendo requests em `/api/users/send-invitation`

---

## 🚀 PRÓXIMOS PASSOS

1. Re-buildar frontend localmente
2. Verificar se a URL está correta no build
3. Deploy no Railway
4. Testar envio de convite
5. Verificar logs do Clerk se houver erro na integração

**Após a correção, o fluxo deve funcionar normalmente!** ✅

