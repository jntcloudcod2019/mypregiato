# Setup Local - Projeto Pregiato Talents

## Pré-requisitos

- Node.js 18+ 
- MySQL 8.0+
- Git

## Bibliotecas e Dependências

O projeto usa as seguintes tecnologias principais:

### Frontend
- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização
- **React Router Dom** - Roteamento
- **TanStack Query** - Cache e sincronização de dados
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

### Backend/Database
- **Prisma** - ORM para banco de dados
- **MySQL** - Banco de dados principal

### UI Components
- **Shadcn/ui** - Componentes de interface
- **Radix UI** - Primitivos de acessibilidade
- **Lucide React** - Ícones

### Autenticação
- **Clerk** - Autenticação e gerenciamento de usuários

## Comandos para Instalação e Execução

### 1. Clone e instale dependências
```bash
git clone <seu-repositorio>
cd pregiato-talents
npm install
```

### 2. Configure o banco de dados MySQL
```bash
# Crie um banco de dados MySQL
mysql -u root -p
CREATE DATABASE pregiato_talents;
```

### 3. Configure as variáveis de ambiente
Edite o arquivo `.env` com suas credenciais:

```bash
# Database Configuration
DATABASE_URL="mysql://seu_usuario:sua_senha@localhost:3306/pregiato_talents"

# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY="sua_clerk_publishable_key"
CLERK_SECRET_KEY="sua_clerk_secret_key"

# Environment
NODE_ENV="development"
```

### 4. Execute as migrações do Prisma
```bash
# Gera o cliente Prisma
npx prisma generate

# Executa as migrações para criar as tabelas
npx prisma db push

# Ou use migrate para versionamento
npx prisma migrate dev --name init
```

### 5. (Opcional) Visualize o banco de dados
```bash
# Abre o Prisma Studio para gerenciar dados
npx prisma studio
```

### 6. Execute o projeto
```bash
# Inicia o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## Scripts Disponíveis

```bash
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Gera build de produção
npm run preview      # Prévia do build de produção
npm run lint         # Executa o linter
npm run type-check   # Verifica tipos TypeScript
```

## Estrutura das Tabelas

O projeto inclui as seguintes tabelas principais:

- **User** - Usuários do sistema (produtores, admins, etc.)
- **Talent** - Talentos/modelos cadastrados
- **TalentDNA** - Características físicas e demográficas dos talentos
- **File** - Arquivos (fotos, documentos) dos talentos

## Funcionalidades Implementadas

✅ Sistema de autenticação com Clerk
✅ CRUD completo de talentos
✅ Sistema de DNA (características) dos talentos
✅ Upload e gerenciamento de arquivos
✅ Filtros avançados
✅ Dashboard com estatísticas
✅ Sistema de convites
✅ Interface responsiva

## Próximos Passos

1. Configure o upload real de arquivos (AWS S3, Cloudinary, etc.)
2. Implemente notificações por email
3. Configure ambiente de produção
4. Adicione testes automatizados

## Troubleshooting

### Erro de conexão com MySQL
- Verifique se o MySQL está rodando
- Confirme as credenciais no `.env`
- Teste a conexão: `mysql -u usuario -p -h localhost`

### Erro do Prisma Client
```bash
npx prisma generate
```

### Erro de CORS
- Configure as origens permitidas no backend
- Verifique as configurações do Vite

### Problemas com Clerk
- Verifique as chaves no dashboard do Clerk
- Confirme o domínio configurado no Clerk