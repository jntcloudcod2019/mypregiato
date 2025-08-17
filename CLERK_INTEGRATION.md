# Integração do Clerk com My Pregiato

Este documento descreve a implementação da integração do Clerk como provedor de autenticação para o projeto My Pregiato.

## Visão Geral

A integração do Clerk foi implementada tanto no frontend (React) quanto no backend (.NET), proporcionando:

- Autenticação segura com JWT tokens
- Gerenciamento de usuários
- Controle de acesso baseado em roles
- Integração com banco de dados local

## Configuração do Frontend

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na pasta `front/` com as seguintes configurações:

```env
# Configurações do Clerk
VITE_CLERK_PUBLISHABLE_KEY=sua_chave_publica_do_clerk

# Configurações da API
VITE_API_URL=http://localhost:5000

# Configurações de desenvolvimento
VITE_DEV_MODE=true
VITE_ENABLE_CLERK=true
```

### 2. Dependências

As dependências do Clerk já estão instaladas no `package.json`:

```json
{
  "@clerk/backend": "^2.6.2",
  "@clerk/clerk-react": "^5.38.1"
}
```

### 3. Componentes de Autenticação

#### ClerkProvider
Configurado no `main.tsx` para envolver toda a aplicação.

#### ProtectedRoute
Componente para proteger rotas baseado em autenticação e autorização:

```tsx
// Rota que requer autenticação
<AuthenticatedRoute>
  <Dashboard />
</AuthenticatedRoute>

// Rota que requer admin
<AdminRoute>
  <Financas />
</AdminRoute>

// Rota que requer operador
<OperatorRoute>
  <AtendimentoPage />
</OperatorRoute>
```

#### CustomLogin
Componente personalizado de login que integra com o Clerk.

## Configuração do Backend

### 1. Dependências

Adicione a dependência do Clerk no `Pregiato.API.csproj`:

```xml
<PackageReference Include="Clerk.AspNetCore" Version="1.0.0" />
```

### 2. Configuração no appsettings.json

```json
{
  "Clerk": {
    "PublishableKey": "sua_chave_publica_do_clerk",
    "SecretKey": "sua_chave_secreta_do_clerk"
  }
}
```

### 3. Middleware de Autenticação

O `ClerkAuthenticationMiddleware` valida tokens JWT do Clerk e extrai claims do usuário.

### 4. Atributos de Autorização

Use os atributos personalizados para controlar acesso:

```csharp
[ClerkAuthorize] // Requer autenticação
[ClerkAdmin] // Requer role ADMIN
[ClerkOperator] // Requer role OPERATOR ou ADMIN
```

### 5. Serviço de Autenticação

O `ClerkAuthService` fornece métodos para:

- Validar tokens
- Extrair informações do usuário
- Verificar autenticação
- Gerenciar claims

## Fluxo de Autenticação

1. **Login**: Usuário faz login via Clerk no frontend
2. **Token**: Clerk fornece JWT token
3. **Requisição**: Frontend envia token no header Authorization
4. **Validação**: Backend valida token via middleware
5. **Claims**: Informações do usuário são extraídas do token
6. **Autorização**: Atributos verificam permissões
7. **Resposta**: API retorna dados se autorizado

## Estrutura de Roles

- **ADMIN**: Acesso total ao sistema
- **OPERATOR**: Acesso a funcionalidades de operação
- **USER**: Acesso básico ao sistema
- **TALENT**: Acesso limitado (apenas perfil próprio)

## Endpoints da API

### Usuários

- `GET /api/users/me` - Obter usuário atual
- `GET /api/users/by-email/{email}` - Buscar por email
- `GET /api/users/by-clerk-id/{clerkId}` - Buscar por Clerk ID
- `GET /api/users/check-admin/{email}` - Verificar se é admin

## Tratamento de Erros

### Frontend
- Fallback gracioso quando Clerk falha
- Modo de desenvolvimento sem autenticação
- Tratamento de erros de rede

### Backend
- Validação de tokens
- Logs de erro detalhados
- Respostas HTTP apropriadas

## Desenvolvimento

### Modo de Desenvolvimento
Para desenvolvimento sem Clerk, configure:

```env
VITE_ENABLE_CLERK=false
```

### Testes
- Use tokens de teste do Clerk
- Configure banco de dados de teste
- Use mocks para autenticação

## Segurança

- Tokens JWT são validados no backend
- Claims são verificadas em cada requisição
- Roles são verificadas antes do acesso
- Logs de auditoria para ações sensíveis

## Troubleshooting

### Problemas Comuns

1. **Token inválido**: Verifique configuração do Clerk
2. **Usuário não encontrado**: Verifique sincronização com banco
3. **Acesso negado**: Verifique roles do usuário
4. **Clerk não carrega**: Verifique chave publishable

### Logs
- Frontend: Console do navegador
- Backend: Arquivos em `logs/`

## Próximos Passos

1. Configurar Clerk em produção
2. Implementar refresh tokens
3. Adicionar 2FA
4. Implementar auditoria completa
5. Adicionar testes de integração
