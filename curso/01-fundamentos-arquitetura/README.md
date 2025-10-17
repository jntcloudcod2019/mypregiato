# 📐 MÓDULO 1: FUNDAMENTOS E ARQUITETURA

## 🎯 OBJETIVOS DE APRENDIZADO

Ao final deste módulo, você será capaz de:

- ✅ Compreender a arquitetura completa do sistema
- ✅ Identificar os componentes e suas responsabilidades
- ✅ Entender o fluxo de dados entre componentes
- ✅ Aplicar Clean Architecture e padrões SOLID
- ✅ Configurar o ambiente de desenvolvimento
- ✅ Navegar pela estrutura de código

---

## ⏱️ DURAÇÃO ESTIMADA

**Total:** 8 horas

- Teoria: 2 horas
- Prática: 4 horas
- Exercícios: 2 horas

---

## 📚 CONTEÚDO

### **1. VISÃO GERAL DO SISTEMA** (45 min)

#### O que é o Sistema Pregiato?

Sistema profissional de atendimento ao cliente via WhatsApp, com:

- 💬 Chat em tempo real com clientes
- 📱 Integração com WhatsApp (Web.js + Meta API)
- 👥 Gerenciamento de leads e distribuição
- 📊 Dashboard de métricas
- 🎓 Sistema de treinamento para operadores
- 📁 Upload e gerenciamento de mídia
- 🔔 Notificações em tempo real

#### Principais Funcionalidades:

1. **Atendimento:**
   - Conversas 1:1 com clientes
   - Envio de texto, imagem, áudio, vídeo
   - Histórico completo de conversas
   - Status de mensagens (enviado, entregue, lido)

2. **Gestão de Leads:**
   - Cadastro e importação
   - Distribuição automática para operadores
   - Filtros e busca avançada
   - Métricas de conversão

3. **Treinamentos:**
   - Cursos com vídeo-aulas
   - Progresso do aluno
   - Certificados
   - Quiz de avaliação

4. **Administração:**
   - Gestão de usuários e permissões
   - Configurações do sistema
   - Logs e auditoria
   - Integração com WhatsApp

---

### **2. ARQUITETURA DO SISTEMA** (1 hora)

#### Visão de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIOS FINAIS                       │
│           (Operadores, Admins, Clientes)                │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│   FRONTEND   │          │  WHATSAPP    │
│   (React)    │◄────────►│   (Clients)  │
└──────┬───────┘          └──────────────┘
       │                         │
       │ REST API                │ Messages
       │ SignalR                 │
       ▼                         ▼
┌──────────────────────────────────────┐
│        BACKEND API (.NET)             │
│  ┌────────────┬─────────────────┐   │
│  │ Controllers│   Services      │   │
│  │            │   Repositories  │   │
│  └────────────┴─────────────────┘   │
└────┬─────────────┬───────────────────┘
     │             │
     │             │ RabbitMQ
     │             │
     ▼             ▼
┌──────────┐  ┌──────────────┐
│  MySQL   │  │  ZAP-BLASTER │
│ Database │  │   (Node.js)  │
└──────────┘  └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   WHATSAPP   │
              │  Web Client  │
              └──────────────┘
```

#### Componentes Principais:

**1. Frontend (React + TypeScript)**
- Localização: `/front/src`
- Responsabilidade: Interface do usuário
- Tecnologias: React, TypeScript, Tailwind, Shadcn/UI

**2. Backend API (.NET Core)**
- Localização: `/back/Pregiato.API`
- Responsabilidade: Lógica de negócio, APIs REST
- Tecnologias: ASP.NET Core, Entity Framework, SignalR

**3. Zap-Blaster (Node.js Bot)**
- Localização: `/zap-blaster-projeto`
- Responsabilidade: Integração WhatsApp Web
- Tecnologias: Node.js, whatsapp-web.js, RabbitMQ

**4. Meta API Integration**
- Localização: `/back/Pregiato.Application/Services/Meta*`
- Responsabilidade: Integração oficial WhatsApp
- Tecnologias: Meta Cloud API, Webhooks

**5. Banco de Dados (MySQL)**
- Responsabilidade: Persistência de dados
- Entidades: Users, Leads, ChatLogs, Conversations, etc.

**6. Mensageria (RabbitMQ)**
- Responsabilidade: Comunicação assíncrona
- Filas: whatsapp.incoming, whatsapp.outgoing, out.qrcode

**7. Storage (MinIO)**
- Responsabilidade: Armazenamento de mídia
- Tipo: S3-compatible object storage

---

### **3. CLEAN ARCHITECTURE** (45 min)

#### Camadas da Aplicação

```
┌─────────────────────────────────────────┐
│          PRESENTATION LAYER             │
│     (Controllers, SignalR Hubs)         │
└──────────────┬──────────────────────────┘
               │ Depends on ↓
┌──────────────┴──────────────────────────┐
│         APPLICATION LAYER               │
│  (Services, DTOs, Interfaces)           │
└──────────────┬──────────────────────────┘
               │ Depends on ↓
┌──────────────┴──────────────────────────┐
│           DOMAIN LAYER                  │
│      (Entities, Value Objects)          │
└──────────────┬──────────────────────────┘
               │ Implemented by ↓
┌──────────────┴──────────────────────────┐
│       INFRASTRUCTURE LAYER              │
│  (Repositories, External APIs)          │
└─────────────────────────────────────────┘
```

#### Mapeamento no Projeto:

**Pregiato.Core** → Domain Layer
- Entidades de negócio
- Interfaces de domínio
- Enums e value objects

**Pregiato.Application** → Application Layer
- Serviços de aplicação
- DTOs (Data Transfer Objects)
- Validadores
- Interfaces de serviços

**Pregiato.Infrastructure** → Infrastructure Layer
- Repositórios (implementação)
- Adapters (MinIO, Meta API)
- Configuração de banco

**Pregiato.API** → Presentation Layer
- Controllers (endpoints REST)
- Hubs (SignalR)
- Middleware
- Configuração da API

---

### **4. PADRÕES DE PROJETO UTILIZADOS** (45 min)

#### 4.1 Repository Pattern

**O que é?**
Abstração da camada de acesso a dados.

**Onde está?**
```csharp
// Interface (Pregiato.Core)
public interface ITalentRepository
{
    Task<Talent?> GetByIdAsync(int id);
    Task<IEnumerable<Talent>> GetAllAsync();
    Task AddAsync(Talent talent);
    Task UpdateAsync(Talent talent);
    Task DeleteAsync(int id);
}

// Implementação (Pregiato.Infrastructure)
public class TalentRepository : ITalentRepository
{
    private readonly PregiatoDbContext _context;
    // ... implementação
}
```

**Por que usar?**
- Desacopla lógica de negócio do banco de dados
- Facilita testes (mock de repositórios)
- Permite trocar tecnologia de persistência

#### 4.2 Dependency Injection

**O que é?**
Inversão de controle de dependências.

**Onde está?**
```csharp
// Program.cs
builder.Services.AddScoped<ITalentService, TalentService>();
builder.Services.AddScoped<ITalentRepository, TalentRepository>();

// TalentService.cs
public class TalentService : ITalentService
{
    private readonly ITalentRepository _repository;
    
    public TalentService(ITalentRepository repository)
    {
        _repository = repository; // Injetado automaticamente
    }
}
```

**Por que usar?**
- Facilita testes
- Reduz acoplamento
- Segue princípios SOLID

#### 4.3 DTO (Data Transfer Object)

**O que é?**
Objetos para transferência de dados entre camadas.

**Onde está?**
```csharp
// Pregiato.Application/DTOs/TalentDto.cs
public class CreateTalentDto
{
    public string Name { get; set; }
    public string Email { get; set; }
    // Apenas dados necessários para criação
}

public class TalentResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public DateTime CreatedAt { get; set; }
    // Dados para resposta
}
```

**Por que usar?**
- Expõe apenas dados necessários
- Valida entrada de dados
- Permite versionamento de API

#### 4.4 Circuit Breaker Pattern

**O que é?**
Proteção contra falhas em cascata.

**Onde está?**
```javascript
// zap-blaster-projeto/resilience/circuit-breaker.js
class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.threshold = threshold;
    }
    
    async execute(fn) {
        if (this.state === 'OPEN') {
            throw new Error('Circuit breaker is OPEN');
        }
        // ... lógica
    }
}
```

**Por que usar?**
- Evita sobrecarregar sistemas em falha
- Permite recuperação graceful
- Melhora resiliência

---

### **5. FLUXO DE DADOS** (45 min)

#### Exemplo: Envio de Mensagem

```
1. FRONTEND
   └─> Operador clica "Enviar"
   
2. chat-service.ts
   └─> chatsApi.send(payload)
   
3. HTTP POST /api/chats/{id}/send
   └─> ChatsController.Send()
   
4. BACKEND
   ├─> Valida dados
   ├─> Salva no banco (ChatLog)
   ├─> Upload mídia (MinIO) se necessário
   └─> Publica mensagem (RabbitMQ)
   
5. RABBITMQ
   └─> Fila: whatsapp.outgoing
   
6. ZAP-BLASTER
   ├─> Consume mensagem
   ├─> Download mídia do MinIO
   ├─> Converte áudio se necessário
   └─> Envia via WhatsApp Web
   
7. WHATSAPP
   └─> Mensagem entregue ao cliente
   
8. CALLBACK (Status)
   ├─> WhatsApp confirma entrega
   ├─> Zap-Blaster publica status (RabbitMQ)
   ├─> Backend consome status
   └─> SignalR notifica frontend
   
9. FRONTEND
   └─> Status da mensagem atualiza (✓ → ✓✓)
```

---

### **6. ESTRUTURA DE PASTAS** (30 min)

#### Backend (.NET)

```
back/
├── Pregiato.Core/              # Domain Layer
│   ├── Entities/               # Entidades de negócio
│   │   ├── Talent.cs
│   │   ├── Lead.cs
│   │   ├── ChatLog.cs
│   │   └── ...
│   ├── Interfaces/             # Contratos
│   │   ├── ITalentRepository.cs
│   │   └── ...
│   └── Enums/                  # Enumerações
│
├── Pregiato.Application/       # Application Layer
│   ├── DTOs/                   # Data Transfer Objects
│   ├── Services/               # Serviços de aplicação
│   ├── Interfaces/             # Interfaces de serviços
│   ├── Validators/             # Validações FluentValidation
│   └── Mappings/               # AutoMapper profiles
│
├── Pregiato.Infrastructure/    # Infrastructure Layer
│   ├── Data/                   # DbContext, Migrations
│   ├── Repositories/           # Implementação dos repositórios
│   └── Adapters/               # Adapters externos (MinIO, Meta)
│
└── Pregiato.API/               # Presentation Layer
    ├── Controllers/            # Endpoints REST
    ├── Hubs/                   # SignalR Hubs
    ├── Services/               # Services específicos da API
    ├── Middleware/             # Middleware customizados
    └── Program.cs              # Configuração da aplicação
```

#### Frontend (React)

```
front/src/
├── components/                 # Componentes reutilizáveis
│   ├── ui/                    # Componentes UI (Shadcn)
│   ├── whatsapp/              # Componentes específicos WhatsApp
│   │   ├── chat-list.tsx
│   │   ├── message-composer.tsx
│   │   └── MediaRenderer.tsx
│   └── layout/                # Layouts
│
├── pages/                      # Páginas (rotas)
│   ├── atendimento/           # Página de atendimento
│   ├── leads/                 # Gestão de leads
│   └── treinamentos/          # Sistema de treinamentos
│
├── services/                   # Serviços (API calls)
│   ├── chat-service.ts
│   ├── lead-service.ts
│   └── training-service.ts
│
├── hooks/                      # Custom hooks
│   ├── useWhatsAppConnection.ts
│   └── useChats.ts
│
├── contexts/                   # React Context
│   └── AuthContext.tsx
│
├── types/                      # TypeScript types
│   └── chat.ts
│
└── lib/                        # Utilidades
    └── utils.ts
```

#### Zap-Blaster (Node.js)

```
zap-blaster-projeto/
├── zap.js                     # Aplicação principal
├── database.js                # MySQL connection
├── minio-service.js           # MinIO client
├── audio-utils.js             # Conversão de áudio (FFmpeg)
├── WhatsAppDataExtractor.js   # Extração de dados
└── resilience/                # Padrões de resiliência
    ├── circuit-breaker.js
    ├── retry-manager.js
    ├── resilient-sender.js
    └── dead-letter-queue.js
```

---

### **7. SETUP DO AMBIENTE** (2 horas)

#### 7.1 Pré-requisitos

**Instalar:**

1. **.NET SDK 8.0+**
   ```bash
   # Verificar instalação
   dotnet --version
   ```

2. **Node.js 18+**
   ```bash
   # Verificar instalação
   node --version
   npm --version
   ```

3. **MySQL 8.0+**
   ```bash
   # Verificar instalação
   mysql --version
   ```

4. **Git**
   ```bash
   # Verificar instalação
   git --version
   ```

5. **Visual Studio Code**
   - Extensões recomendadas:
     - C# Dev Kit
     - ESLint
     - Prettier
     - Tailwind CSS IntelliSense

#### 7.2 Clonar Repositório

```bash
git clone https://github.com/seu-usuario/pregiato.git
cd pregiato
```

#### 7.3 Configurar Backend

```bash
cd back/Pregiato.API

# Restaurar pacotes
dotnet restore

# Configurar connection string
# Edite appsettings.json:
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=pregiato_dev;Uid=root;Pwd=sua_senha;"
  }
}

# Criar banco de dados
dotnet ef database update

# Compilar
dotnet build

# Executar
dotnet run
```

#### 7.4 Configurar Frontend

```bash
cd front

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Crie .env:
VITE_API_BASE_URL=http://localhost:5656
VITE_SIGNALR_URL=http://localhost:5656/hubs/whatsapp

# Executar
npm run dev
```

#### 7.5 Configurar Zap-Blaster (Opcional)

```bash
cd zap-blaster-projeto

# Instalar dependências
npm install

# Configurar .env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=sua_senha
MYSQL_DATABASE=pregiato_dev

# Executar
npm start
```

---

### **8. PRIMEIRO TESTE** (30 min)

#### Verificar se tudo está funcionando:

**1. Backend rodando:**
```bash
# Em /back/Pregiato.API
dotnet run

# Esperado:
Now listening on: http://localhost:5656
```

**2. Frontend rodando:**
```bash
# Em /front
npm run dev

# Esperado:
Local: http://localhost:5173
```

**3. Acessar aplicação:**
```
http://localhost:5173
```

**4. Testar API:**
```bash
curl http://localhost:5656/health

# Esperado:
Healthy
```

---

## 🔨 EXERCÍCIOS PRÁTICOS

### **Exercício 1: Explorar a Estrutura** (30 min)

1. Navegue pelos arquivos do backend
2. Identifique 3 entidades de negócio
3. Encontre o DbContext
4. Localize 2 controllers
5. Identifique 1 serviço de aplicação

**Resposta esperada:**
- Entidades: `Talent.cs`, `Lead.cs`, `ChatLog.cs`
- DbContext: `PregiatoDbContext.cs`
- Controllers: `TalentsController.cs`, `ChatsController.cs`
- Serviço: `TalentService.cs`

### **Exercício 2: Mapear um Fluxo** (45 min)

Desenhe o fluxo completo de:
"Operador visualiza lista de conversas"

1. Qual componente frontend é responsável?
2. Qual endpoint da API é chamado?
3. Qual controller processa?
4. Qual serviço é usado?
5. Qual repositório acessa o banco?
6. Qual tabela é consultada?

### **Exercício 3: Identificar Padrões** (30 min)

No código do backend, identifique exemplos de:

1. Repository Pattern
2. Dependency Injection
3. DTO Pattern
4. Middleware
5. AutoMapper usage

---

## 📖 REFERÊNCIAS

### **Documentação Oficial:**
- [ASP.NET Core](https://docs.microsoft.com/aspnet/core)
- [React](https://react.dev)
- [Entity Framework Core](https://docs.microsoft.com/ef/core)
- [SignalR](https://docs.microsoft.com/aspnet/core/signalr)

### **Padrões e Arquitetura:**
- [Clean Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html)

### **Livros Recomendados:**
- "Clean Architecture" - Robert C. Martin
- "Domain-Driven Design" - Eric Evans
- "Patterns of Enterprise Application Architecture" - Martin Fowler

---

## ✅ CHECKLIST DE CONCLUSÃO

Antes de avançar para o próximo módulo:

- [ ] Entendo a arquitetura geral do sistema
- [ ] Identifiquei todos os componentes principais
- [ ] Compreendo o fluxo de dados
- [ ] Ambiente de desenvolvimento configurado
- [ ] Backend compilando e rodando
- [ ] Frontend compilando e rodando
- [ ] Consigo navegar pela estrutura de código
- [ ] Completei os exercícios práticos

---

## 🎯 PRÓXIMO MÓDULO

**Módulo 2: Backend - API REST com .NET Core**

Aprenderemos a:
- Criar controllers e endpoints
- Implementar repositórios
- Usar Entity Framework Core
- Validar dados com FluentValidation
- Aplicar AutoMapper

**Vamos lá! 🚀**

