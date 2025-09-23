# 🏗️ ARQUITETURA DO SISTEMA PREGIATO

## 📋 Visão Geral
Sistema de atendimento WhatsApp com integração completa entre Frontend, API .NET, ZapBot e serviços de infraestrutura.

## 🎯 Componentes Principais

### 1. 🌐 FRONTEND (React + TypeScript)
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND REACT                           │
├─────────────────────────────────────────────────────────────┤
│ • React 18 + TypeScript                                    │
│ • Vite (Build Tool)                                        │
│ • Tailwind CSS (Styling)                                   │
│ • Clerk (Autenticação)                                     │
│ • SignalR Client (Real-time)                               │
│ • Axios (HTTP Client)                                      │
│ • LocalStorage (Cache)                                     │
└─────────────────────────────────────────────────────────────┘
```

### 2. 🔧 API BACKEND (.NET Core)
```
┌─────────────────────────────────────────────────────────────┐
│                    API .NET CORE                           │
├─────────────────────────────────────────────────────────────┤
│ • .NET 8.0                                                 │
│ • ASP.NET Core Web API                                     │
│ • Entity Framework Core                                    │
│ • SignalR (Real-time Hub)                                  │
│ • Serilog (Logging)                                        │
│ • AutoMapper (Mapping)                                     │
│ • MediatR (CQRS)                                           │
└─────────────────────────────────────────────────────────────┘
```

### 3. 🤖 ZAPBOT (Node.js)
```
┌─────────────────────────────────────────────────────────────┐
│                    ZAPBOT NODE.JS                          │
├─────────────────────────────────────────────────────────────┤
│ • Node.js + JavaScript                                     │
│ • WhatsApp Web.js                                          │
│ • RabbitMQ Client                                          │
│ • MinIO Client                                             │
│ • Retry Logic + Resilience                                 │
│ • Media Processing                                         │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 FLUXO DE COMUNICAÇÃO

```
┌─────────────┐    HTTP/HTTPS    ┌─────────────┐
│  FRONTEND   │◄─────────────────►│   API .NET  │
│   (React)   │                  │   (Backend) │
└─────────────┘                  └─────────────┘
       │                                │
       │ SignalR WebSocket              │ RabbitMQ
       │                                │
       ▼                                ▼
┌─────────────┐                  ┌─────────────┐
│  SIGNALR    │                  │  RABBITMQ   │
│    HUB      │                  │   QUEUE     │
└─────────────┘                  └─────────────┘
                                        │
                                        │ AMQP
                                        ▼
                               ┌─────────────┐
                               │   ZAPBOT    │
                               │  (Node.js)  │
                               └─────────────┘
                                        │
                                        │ WhatsApp Web API
                                        ▼
                               ┌─────────────┐
                               │  WHATSAPP   │
                               │    WEB      │
                               └─────────────┘
```

## 🗄️ BANCO DE DADOS

```
┌─────────────────────────────────────────────────────────────┐
│                    MYSQL DATABASE                          │
├─────────────────────────────────────────────────────────────┤
│ • Railway MySQL                                             │
│ • Entity Framework Core                                     │
│ • Migrations                                                │
│                                                             │
│ 📊 TABELAS PRINCIPAIS:                                      │
│ • ChatLogs (Conversas)                                      │
│ • Messages (Mensagens)                                      │
│ • Conversations (Conversações)                              │
│ • Contacts (Contatos)                                       │
│ • OperatorLeads (Leads por Operador)                       │
│ • ChatSessions (Sessões)                                    │
└─────────────────────────────────────────────────────────────┘
```

## ☁️ SERVIÇOS DE INFRAESTRUTURA

### 1. 🐰 RABBITMQ (Message Broker)
```
┌─────────────────────────────────────────────────────────────┐
│                    RABBITMQ QUEUES                         │
├─────────────────────────────────────────────────────────────┤
│ • whatsapp.outgoing (Mensagens para enviar)                │
│ • whatsapp.incoming (Mensagens recebidas)                  │
│ • out.qrcode (QR Codes)                                    │
│ • session.status (Status da sessão)                        │
│ • chat.assign (Atribuição de chats)                        │
│ • notification.agent (Notificações)                        │
│ • report.update (Relatórios)                               │
└─────────────────────────────────────────────────────────────┘
```

### 2. 🗂️ MINIO (Object Storage)
```
┌─────────────────────────────────────────────────────────────┐
│                    MINIO STORAGE                           │
├─────────────────────────────────────────────────────────────┤
│ • S3-Compatible API                                         │
│ • Media Files (Áudio, Vídeo, Imagem)                       │
│ • Bucket: "midias"                                          │
│ • Public/Private Endpoints                                  │
│ • Base64 → File Upload                                      │
└─────────────────────────────────────────────────────────────┘
```

### 3. 🚀 RAILWAY (Deployment)
```
┌─────────────────────────────────────────────────────────────┐
│                    RAILWAY CLOUD                           │
├─────────────────────────────────────────────────────────────┤
│ • API Backend (Port 5656)                                  │
│ • Frontend (Static Files)                                  │
│ • ZapBot (Node.js Process)                                 │
│ • MySQL Database                                            │
│ • RabbitMQ Service                                          │
│ • MinIO Service                                             │
│ • Environment Variables                                     │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 AUTENTICAÇÃO E SEGURANÇA

```
┌─────────────────────────────────────────────────────────────┐
│                    CLERK AUTH                              │
├─────────────────────────────────────────────────────────────┤
│ • JWT Tokens                                                │
│ • User Management                                           │
│ • Role-based Access                                         │
│ • Session Management                                        │
│ • Protected Routes                                          │
└─────────────────────────────────────────────────────────────┘
```

## 📱 FLUXO DE MENSAGENS

### Envio de Mensagem:
```
1. Frontend → API (POST /chats/{id}/send)
2. API → RabbitMQ (whatsapp.outgoing)
3. ZapBot → WhatsApp Web
4. WhatsApp → Destinatário
5. ZapBot → RabbitMQ (whatsapp.message-status)
6. API → Frontend (SignalR)
```

### Recebimento de Mensagem:
```
1. WhatsApp → ZapBot
2. ZapBot → RabbitMQ (whatsapp.incoming)
3. API → Database (ChatLogs + Messages)
4. API → Frontend (SignalR)
5. Frontend → UI Update
```

## 🎵 PROCESSAMENTO DE MÍDIA

```
┌─────────────────────────────────────────────────────────────┐
│                    MEDIA FLOW                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Frontend: Base64 Upload                                 │
│ 2. API: MinIO Storage                                      │
│ 3. API: URL Generation                                     │
│ 4. RabbitMQ: Media URL                                     │
│ 5. ZapBot: Download from MinIO                             │
│ 6. ZapBot: Send to WhatsApp                                │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 TECNOLOGIAS POR CAMADA

### Frontend Stack:
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Clerk** - Authentication
- **SignalR** - Real-time Communication
- **Axios** - HTTP Client

### Backend Stack:
- **.NET 8.0** - Runtime
- **ASP.NET Core** - Web Framework
- **Entity Framework Core** - ORM
- **SignalR** - Real-time Hub
- **Serilog** - Logging
- **AutoMapper** - Object Mapping
- **MediatR** - CQRS Pattern

### Bot Stack:
- **Node.js** - Runtime
- **WhatsApp Web.js** - WhatsApp API
- **amqplib** - RabbitMQ Client
- **minio** - MinIO Client
- **Custom Retry Logic** - Resilience

### Infrastructure:
- **Railway** - Cloud Platform
- **MySQL** - Database
- **RabbitMQ** - Message Broker
- **MinIO** - Object Storage
- **Docker** - Containerization

## 📊 MONITORAMENTO E LOGS

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGGING SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│ • Serilog (API)                                            │
│ • Console Logs (ZapBot)                                    │
│ • Railway Logs                                             │
│ • Error Tracking                                           │
│ • Performance Metrics                                      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    RAILWAY DEPLOYMENT                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   FRONTEND  │  │    API      │  │   ZAPBOT    │        │
│  │   (Static)  │  │  (.NET 8)   │  │ (Node.js)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    MYSQL    │  │  RABBITMQ   │  │    MINIO    │        │
│  │  DATABASE   │  │   QUEUE     │  │   STORAGE   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 RESILIENCE PATTERNS

### Retry Logic:
- **Exponential Backoff** - ZapBot message processing
- **Circuit Breaker** - API external calls
- **Dead Letter Queue** - Failed messages
- **Health Checks** - Service monitoring

### Error Handling:
- **Graceful Degradation** - Service failures
- **Fallback Mechanisms** - Alternative flows
- **Error Recovery** - Automatic retry
- **User Feedback** - Error notifications

---

## 📝 RESUMO TÉCNICO

O sistema Pregiato é uma arquitetura moderna de atendimento WhatsApp que combina:

- **Frontend React** para interface de usuário
- **API .NET Core** para lógica de negócio
- **ZapBot Node.js** para integração WhatsApp
- **RabbitMQ** para comunicação assíncrona
- **MinIO** para armazenamento de mídia
- **MySQL** para persistência de dados
- **Railway** para deployment em nuvem

A arquitetura é **escalável**, **resiliente** e **modular**, permitindo fácil manutenção e expansão de funcionalidades.
