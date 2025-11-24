# 🔧 CORREÇÃO: Loop de Carregamento após Login

## ❌ PROBLEMA

Após o login, usuários **não-MODEL** ficavam em **loop infinito** na tela de carregamento e não eram redirecionados para o dashboard.

```
Login → Carregando... → Carregando... → Carregando... (loop infinito)
```

## 🔍 CAUSA RAIZ

A página `login.tsx` estava:

1. Buscando o usuário **diretamente** via `userManagementService.getUserByEmail()`
2. Isso causava **conflito** com o `AuthPermissionsContext` que também busca/cria o usuário
3. **Race condition**: Duas requisições simultâneas para buscar o mesmo usuário
4. Se a auto-criação ainda estivesse acontecendo, o login recebia **404**
5. Tratava o erro mas **não definia redirectTo** corretamente
6. Resultado: **loop infinito** na tela de carregamento

### **Código problemático:**

```typescript
// ❌ PROBLEMA: Busca duplicada do usuário
const dbUser = await userManagementService.getUserByEmail(email);

// Se der erro 404 (usuário sendo criado), cai no catch
// mas o redirectTo pode não ser definido corretamente
```

## ✅ SOLUÇÃO IMPLEMENTADA

### **Arquivo modificado:**
- `front/src/pages/login.tsx`

### **Mudanças:**

1. **Removida** a busca duplicada via `userManagementService`
2. **Usar diretamente** o contexto `useAuthPermissions`
3. O contexto **já faz** a auto-criação se necessário
4. **Aguardar** o contexto terminar antes de redirecionar

### **Novo código:**

```typescript
// ✅ SOLUÇÃO: Usar o contexto que já gerencia tudo
const { user: dbUser, isLoading: isLoadingUser, role } = useAuthPermissions();

useEffect(() => {
  // Aguardar Clerk + contexto terminarem
  if (!user || isLoadingUser) {
    return; // Ainda carregando
  }

  // Agora temos certeza que o usuário foi buscado/criado
  if (role === 'MODEL' && dbUser?.id) {
    setRedirectTo(`/talentos/perfil/${dbUser.id}`);
  } else {
    setRedirectTo(fromPath || returnTo || lastRoute || "/dashboard");
  }
}, [user, isLoadingUser, dbUser, role, ...]);
```

## 🎯 FLUXO CORRIGIDO

### **Antes (Problema):**
```
Login
  ↓
Clerk carrega
  ↓
Página busca usuário via service → 404 (em criação)
  ↓
AuthContext busca usuário → 404 → cria
  ↓
❌ Race condition / loop infinito
```

### **Depois (Solução):**
```
Login
  ↓
Clerk carrega
  ↓
AuthContext busca → 404 → cria automaticamente
  ↓
Página espera contexto terminar
  ↓
✅ Redireciona corretamente
```

## 📊 COMPORTAMENTO POR ROLE

### **Usuário MODEL:**
```
Login → AuthContext cria → role = "MODEL"
  ↓
✅ Redireciona para: /talentos/perfil/{userId}
```

### **Usuário ADMIN/OPERATOR/PRODUCER:**
```
Login → AuthContext cria → role = "ADMIN"
  ↓
✅ Redireciona para: /dashboard (ou rota anterior)
```

## 🔐 ORDEM DE PRIORIDADE DE REDIRECIONAMENTO

Para usuários **não-MODEL**:

1. **fromPath**: Rota de onde veio (via ProtectedRoute)
2. **returnTo**: Query param `?return_to=/alguma-rota`
3. **lastRoute**: Última rota salva no sessionStorage
4. **Fallback**: `/dashboard`

## 🧪 TESTE

### **Cenário 1: Novo usuário (migrado)**

1. Faça login com `angela_maria1@pregiato.com.br` (MODEL)
2. Contexto cria usuário automaticamente
3. ✅ Redireciona para `/talentos/perfil/{id}`

### **Cenário 2: Usuário ADMIN existente**

1. Faça login com admin
2. Contexto busca no banco → 200 OK
3. ✅ Redireciona para `/dashboard`

### **Cenário 3: Com returnTo**

1. Acesse `/login?return_to=/treinamentos`
2. Faça login
3. ✅ Redireciona para `/treinamentos`

## 📝 LOGS ESPERADOS NO CONSOLE

```
🔐 [Login] Usuário Clerk carregado: usuario@pregiato.com.br
👤 [Login] Usuário do banco: { id, email, role, ... }
🎭 [Login] Role: ADMIN
🔐 [Login] Redirecionando para: /dashboard
```

## ✅ BENEFÍCIOS

1. **🚀 Sem race conditions**: Uma única fonte de verdade (AuthContext)
2. **🔄 Sincronização garantida**: Auto-criação antes do redirect
3. **🛡️ Sem loops**: Aguarda carregamento completo
4. **📊 Logs claros**: Fácil debug do fluxo
5. **🎯 Redirect correto**: Funciona para todos os roles

## 🔗 INTEGRAÇÃO

Esta correção funciona em conjunto com:

1. **Auto-criação de usuários** (`AuthPermissionsContext.tsx`)
2. **Migração em massa** (script `migration-clerk/`)
3. **Protected routes** (verificação de permissões)

## ⚠️ IMPORTANTE

**NÃO** busque o usuário diretamente via services na página de login. Sempre use o `useAuthPermissions` hook que:

- ✅ Busca no banco
- ✅ Cria automaticamente se não existir
- ✅ Gerencia estado de loading
- ✅ Provê role e permissões

---

**💡 RESULTADO**: Login fluido sem loops, com auto-criação transparente para usuários migrados!

