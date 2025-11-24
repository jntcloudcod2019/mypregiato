# 🚀 Migração em Massa de Usuários para Clerk

Script baseado no [repositório oficial do Clerk](https://github.com/clerk/migration-script) para importar usuários do arquivo `nomes_unicos.json` em massa.

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Arquivo `nomes_unicos.json` na raiz do projeto

## 🔧 Instalação

```bash
cd migration-clerk
npm install
```

## ⚙️ Configuração

O arquivo `.env` já está configurado com:

- `CLERK_SECRET_KEY`: Chave secreta de produção
- `ORGANIZATION_ID`: ID da organização Pregiato
- `DELAY_MS`: Delay entre requisições (1000ms = 1s)
- `RETRY_DELAY_MS`: Delay quando hit rate limit (10s)
- `OFFSET`: Começar do usuário N (útil para continuar migração)

## 📝 Como usar

### 1. Processar nomes

Converte `nomes_unicos.json` em formato válido para Clerk:

```bash
npm run process
```

Este comando:
- ✅ Lê o arquivo `nomes_unicos.json` da raiz do projeto
- ✅ Limpa nomes (remove menores, barras, etc)
- ✅ Gera emails únicos no formato `primeiro_sobrenome@pregiato.com.br`
- ✅ Cria IDs externos: `user_primeiro_123`
- ✅ Adiciona hash bcrypt da senha `modelpregiato123`
- ✅ Define role como `MODEL`
- ✅ Gera arquivo `users-processed.json`

### 2. Executar migração

Envia usuários processados para o Clerk:

```bash
npm start
```

Este comando:
- ✅ Cria usuários no Clerk via Backend API
- ✅ Adiciona automaticamente à organização
- ✅ Respeita rate limits (1 req/segundo)
- ✅ Retry automático em caso de rate limit (429)
- ✅ Ignora duplicatas (email já existe)
- ✅ Gera logs: `migration-success.json` e `migration-errors.json`

## 📊 Estrutura dos Dados

### Entrada (`nomes_unicos.json`):
```json
[
  "Adriano Domingos Sobrinho",
  "Amanda Mendes Cibriano / Clara (Menor)",
  "ADRIA ALEXANDRE BARROS/ ADDAM\nWAYRON BARROS MARIANO"
]
```

### Processado (`users-processed.json`):
```json
[
  {
    "external_id": "user_adriano_0",
    "email_address": ["adriano_domingos@pregiato.com.br"],
    "first_name": "Adriano",
    "last_name": "Domingos Sobrinho",
    "password": "$2a$12$v83NUNkzXpd4w03jW.En.OVdUbvTtVhMYxOPy4TIhR3lRZ/jhIpLi",
    "password_hasher": "bcrypt",
    "public_metadata": {
      "systemRole": "MODEL"
    },
    "skip_password_checks": true,
    "skip_password_requirement": false
  }
]
```

## 🔁 Continuar Migração Interrompida

Se a migração parar no meio, edite `.env`:

```env
OFFSET=500  # Começar do usuário 500
```

E execute novamente:

```bash
npm start
```

## 📈 Rate Limits

O Clerk tem limites de requisições:
- **Free/Pro**: 20 req/10s (2 req/segundo)
- **Enterprise**: 100 req/10s (10 req/segundo)

O script usa **1 req/segundo** por padrão (seguro para todos os planos).

## 🐛 Troubleshooting

### Erro: "users-processed.json não encontrado"
Execute `npm run process` primeiro.

### Erro: "Clerk Secret Key inválida"
Verifique o `.env` e confirme que a chave está correta.

### Erro: Rate limit (429)
O script aguarda 10s e tenta novamente automaticamente.

### Emails duplicados
O script adiciona sufixos numéricos automaticamente: `nome_sobrenome1@pregiato.com.br`

## 📁 Arquivos Gerados

- `users-processed.json`: Usuários prontos para migração
- `process-errors.json`: Erros durante processamento de nomes
- `migration-success.json`: Usuários criados com sucesso
- `migration-errors.json`: Erros durante migração

## 🔐 Credenciais Padrão

Todos os usuários são criados com:
- **Email**: `primeiro_sobrenome@pregiato.com.br`
- **Senha**: `modelpregiato123`
- **Role**: `MODEL`
- **Organização**: Pregiato (org_35XUIz5zcKDS57ibItdzgNiIh99)

## 📞 Suporte

Em caso de dúvidas, consulte:
- [Documentação Clerk Backend API](https://clerk.com/docs/reference/backend-api)
- [Script oficial de migração](https://github.com/clerk/migration-script)

