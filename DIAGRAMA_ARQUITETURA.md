# 🏗️ DIAGRAMA DE ARQUITETURA DO SISTEMA PREGIATO

## 📊 **VISÃO GERAL DA ARQUITETURA**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                SISTEMA PREGIATO                                │
│                         Plataforma de Gestão de Talentos + CRM                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │   BACKEND API   │    │    ZAP BOT      │    │   BANCO DE      │
│   (React)       │    │   (.NET 8)      │    │   (Node.js)     │    │   DADOS         │
│                 │    │                 │    │                 │    │   (MySQL)       │
│ • React 18      │    │ • ASP.NET Core  │    │ • whatsapp-web  │    │ • Railway       │
│ • TypeScript    │    │ • Entity Frame  │    │ • RabbitMQ      │    │ • EF Core       │
│ • Tailwind CSS  │    │ • SignalR       │    │ • Express       │    │ • Migrations    │
│ • Zustand       │    │ • RabbitMQ      │    │ • MySQL2        │    │                 │
│ • Clerk Auth    │    │ • Serilog       │    │ • Circuit Break │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │                       │                       │                       │
         ▼                       ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              COMUNICAÇÃO                                        │
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   HTTP      │    │   SignalR   │    │  RabbitMQ   │    │   MySQL     │     │
│  │   REST      │    │   Hubs      │    │   Queues    │    │   Queries   │     │
│  │   API       │    │   Real-time │    │   Messages  │    │   ORM       │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 **FLUXO DE COMUNICAÇÃO DETALHADO**

### **1. FLUXO DE MENSAGENS WHATSAPP**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Usuário   │    │   Zap Bot   │    │ Backend API │    │  Frontend   │
│  WhatsApp   │    │  (Node.js)  │    │  (.NET 8)   │    │  (React)    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Mensagem       │                   │                   │
       ├──────────────────▶│                   │                   │
       │                   │ 2. RabbitMQ       │                   │
       │                   ├──────────────────▶│                   │
       │                   │                   │ 3. SignalR        │
       │                   │                   ├──────────────────▶│
       │                   │                   │                   │
       │                   │                   │ 4. Resposta       │
       │                   │                   ◀──────────────────┤
       │                   │ 5. RabbitMQ       │                   │
       │                   ◀──────────────────┤                   │
       │ 6. Entrega        │                   │                   │
       ◀──────────────────┤                   │                   │
```

### **2. FLUXO DE AUTENTICAÇÃO**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │    Clerk    │    │ Backend API │
│  (React)    │    │   Auth      │    │  (.NET 8)   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 1. Login          │                   │
       ├──────────────────▶│                   │
       │ 2. Token JWT      │                   │
       ◀──────────────────┤                   │
       │ 3. Request + Token│                   │
       ├──────────────────────────────────────▶│
       │ 4. Validate Token │                   │
       │                   ◀──────────────────┤
       │ 5. Response       │                   │
       ◀──────────────────────────────────────┤
```

### **3. FLUXO DE DADOS CRM**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │ Backend API │    │   MySQL     │
│  (React)    │    │  (.NET 8)   │    │  Database   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 1. CRUD Request   │                   │
       ├──────────────────▶│                   │
       │ 2. EF Core Query  │                   │
       │                   ├──────────────────▶│
       │ 3. Data Response  │                   │
       │                   ◀──────────────────┤
       │ 4. DTO Response   │                   │
       ◀──────────────────┤                   │
```

## 🏗️ **ARQUITETURA DE CAMADAS DO BACKEND**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND API (.NET 8)                              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  CAMADA DE APRESENTAÇÃO (Pregiato.API)                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │Controllers  │  │    Hubs     │  │  Services   │  │ Middleware  │           │
│  │• Chats      │  │• WhatsApp   │  │• RabbitMQ   │  │• Auth       │           │
│  │• Leads      │  │• SignalR    │  │• Media      │  │• CORS       │           │
│  │• Users      │  │• Real-time  │  │• Chat       │  │• Logging    │           │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CAMADA DE APLICAÇÃO (Pregiato.Application)                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  Services   │  │    DTOs     │  │ Interfaces  │  │ Validators  │           │
│  │• Business   │  │• Request    │  │• Contracts  │  │• FluentVal  │           │
│  │• Logic      │  │• Response   │  │• Services   │  │• Rules      │           │
│  │• Mapping    │  │• Transfer   │  │• Repos      │  │• Validation │           │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CAMADA DE DOMÍNIO (Pregiato.Core)                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                            │
│  │  Entities   │  │ Interfaces  │  │    Enums    │                            │
│  │• User       │  │• Services   │  │• Status     │                            │
│  │• Lead       │  │• Repos      │  │• Types      │                            │
│  │• Message    │  │• Contracts  │  │• Roles      │                            │
│  │• Talent     │  │• Business   │  │• Priorities │                            │
│  └─────────────┘  └─────────────┘  └─────────────┘                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CAMADA DE INFRAESTRUTURA (Pregiato.Infrastructure)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                            │
│  │    Data     │  │Repositories │  │ Migrations  │                            │
│  │• DbContext  │  │• Impl       │  │• Schema     │                            │
│  │• Config     │  │• Data Access│  │• Updates    │                            │
│  │• Connection │  │• Queries    │  │• Versioning │                            │
│  └─────────────┘  └─────────────┘  └─────────────┘                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🗄️ **MODELO DE DADOS PRINCIPAL**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ENTIDADES CORE                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │  Operator   │    │    Lead     │    │ OperatorLeads│
│             │    │             │    │             │    │             │
│ • Id        │    │ • Id        │    │ • Id        │    │ • Id        │
│ • ClerkId   │    │ • Name      │    │ • Name      │    │ • EmailOp   │
│ • Email     │    │ • Email     │    │ • Email     │    │ • NameLead  │
│ • Role      │    │ • Role      │    │ • Phone     │    │ • PhoneLead │
│ • CreatedAt │    │ • Status    │    │ • Status    │    │ • StatusCon │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1:1               │ 1:N               │ 1:N               │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Conversation│    │   Message   │    │   Talent    │    │  Contract   │
│             │    │             │    │             │    │             │
│ • Id        │    │ • Id        │    │ • Id        │    │ • Id        │
│ • ContactId │    │ • ConvId    │    │ • FullName  │    │ • TalentId  │
│ • OperatorId│    │ • Direction │    │ • Email     │    │ • LeadId    │
│ • Status    │    │ • Type      │    │ • Phone     │    │ • Amount    │
│ • Channel   │    │ • Text      │    │ • Age       │    │ • Status    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1:N               │                   │ 1:N               │
       ▼                   │                   ▼                   │
┌─────────────┐            │            ┌─────────────┐            │
│  ChatLog    │            │            │  TalentDNA  │            │
│             │            │            │             │            │
│ • Id        │            │            │ • Id        │            │
│ • ContactPh │            │            │ • TalentId  │            │
│ • Title     │            │            │ • Height    │            │
│ • Payload   │            │            │ • Weight    │            │
│ • UnreadCnt │            │            │ • HairColor │            │
└─────────────┘            │            └─────────────┘            │
                           │                   │                   │
                           ▼                   │                   ▼
                    ┌─────────────┐            │            ┌─────────────┐
                    │AttendanceTkt│            │            │  LeadInter  │
                    │             │            │            │             │
                    │ • Id        │            │            │ • Id        │
                    │ • ChatLogId │            │            │ • LeadId    │
                    │ • Status    │            │            │ • Type      │
                    │ • Step      │            │            │ • Subject   │
                    │ • Desc      │            │            │ • Outcome   │
                    └─────────────┘            │            └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   CrmTask   │
                                        │             │
                                        │ • Id        │
                                        │ • LeadId    │
                                        │ • Title     │
                                        │ • Status    │
                                        │ • Priority  │
                                        └─────────────┘
```

## 🔧 **TECNOLOGIAS E STACK**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              STACK TECNOLÓGICO                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │   BACKEND       │    │    ZAP BOT      │    │   INFRAESTRUTURA│
│                 │    │                 │    │                 │    │                 │
│ • React 18      │    │ • .NET 8        │    │ • Node.js       │    │ • MySQL         │
│ • TypeScript    │    │ • ASP.NET Core  │    │ • whatsapp-web  │    │ • RabbitMQ      │
│ • Vite          │    │ • Entity Frame  │    │ • Express       │    │ • Railway       │
│ • Tailwind CSS  │    │ • SignalR       │    │ • amqplib       │    │ • Docker        │
│ • Radix UI      │    │ • AutoMapper    │    │ • MySQL2        │    │ • Serilog       │
│ • Shadcn/ui     │    │ • FluentVal     │    │ • Circuit Break │    │ • Health Checks │
│ • Zustand       │    │ • Serilog       │    │ • Retry Manager │    │ • CORS          │
│ • Axios         │    │ • RabbitMQ      │    │ • Dead Letter   │    │ • JWT           │
│ • SignalR       │    │ • Memory Cache  │    │ • Hot Reload    │    │ • Clerk         │
│ • Clerk         │    │ • Health Check  │    │ • Data Extract  │    │ • ngrok         │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 **ENDPOINTS PRINCIPAIS DA API**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ENDPOINTS API                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     CHATS       │    │   OPERATOR-LEADS│    │     USERS       │    │    TALENTS      │
│                 │    │                 │    │                 │    │                 │
│ GET    /chats   │    │ GET    /leads   │    │ GET    /users   │    │ GET    /talents │
│ POST   /chats   │    │ POST   /leads   │    │ POST   /users   │    │ POST   /talents │
│ GET    /chats/{id}│   │ PUT    /leads  │    │ PUT    /users   │    │ PUT    /talents │
│ DELETE /chats/{id}│   │ DELETE /leads  │    │ DELETE /users   │    │ DELETE /talents │
│ GET    /chats/{id}/messages│           │    │ GET    /users/by-email│              │
│ POST   /chats/{id}/messages│           │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ATTENDANCES   │    │   WHATSAPP      │    │     HEALTH      │    │   CONVERSATIONS │
│                 │    │                 │    │                 │    │                 │
│ GET    /attend  │    │ GET    /status  │    │ GET    /health  │    │ GET    /conv    │
│ POST   /attend  │    │ POST   /send    │    │                 │    │ POST   /conv    │
│ PUT    /attend  │    │ POST   /qr      │    │                 │    │ PUT    /conv    │
│ DELETE /attend  │    │ POST   /connect │    │                 │    │ DELETE /conv    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔐 **SEGURANÇA E AUTENTICAÇÃO**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SEGURANÇA                                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AUTENTICAÇÃO  │    │   AUTORIZAÇÃO   │    │   MIDDLEWARE    │    │   VALIDAÇÃO     │
│                 │    │                 │    │                 │    │                 │
│ • Clerk         │    │ • Roles         │    │ • Auth          │    │ • FluentVal     │
│ • JWT Tokens    │    │ • Permissions   │    │ • CORS          │    │ • Input Valid   │
│ • Session Mgmt  │    │ • Attributes    │    │ • Logging       │    │ • DTO Validation│
│ • Token Refresh │    │ • Policy Based  │    │ • Error Handle  │    │ • Business Rules│
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 **MONITORAMENTO E LOGS**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MONITORAMENTO                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     LOGS        │    │   HEALTH        │    │   METRICS       │    │   ERRORS        │
│                 │    │                 │    │                 │    │                 │
│ • Serilog       │    │ • Health Check  │    │ • Performance   │    │ • Error Bound   │
│ • File Logs     │    │ • API Status    │    │ • Response Time │    │ • Try/Catch     │
│ • Console Logs  │    │ • DB Status     │    │ • Memory Usage  │    │ • Logging       │
│ • Structured    │    │ • RabbitMQ      │    │ • CPU Usage     │    │ • Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

*Diagrama gerado em: 2025-01-05*
*Versão: 1.0.0*
