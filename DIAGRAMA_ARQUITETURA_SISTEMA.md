# 🏗️ ARQUITETURA DO SISTEMA PREGIATO

## 📋 Visão Geral
Sistema de atendimento WhatsApp com arquitetura distribuída usando microserviços, message queues e storage em nuvem.

## 🎯 Componentes Principais

### 1. 🌐 FRONTEND (React + TypeScript)
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND REACT                           │
├─────────────────────────────────────────────────────────────┤
│ • Páginas: Atendimento, CRM, Leads                         │
│ • Componentes: Chat, MediaRenderer, BotStatus              │
│ • Hooks: useWhatsAppConnection, useSignalR                 │
│ • Serviços: chat-service, global-cache, conversations-api  │
│ • Autenticação: Clerk                                      │
│ • Storage: localStorage (persistência de sessão)           │
└─────────────────────────────────────────────────────────────┘
```

### 2. 🔧 API BACKEND (.NET Core)
```
┌─────────────────────────────────────────────────────────────┐
│                    PREGIATO API                             │
├─────────────────────────────────────────────────────────────┤
│ • Controllers: ChatsController, WhatsAppController          │
│ • Services: RabbitBackgroundService, ChatLogService        │
│ • Hubs: WhatsAppHub (SignalR)                              │
│ • Entities: ChatLog, Message, Conversation                 │
│ • Repositories: ChatLogRepository, MessageRepository       │
│ • Middleware: Authentication, Error Handling               │
└─────────────────────────────────────────────────────────────┘
```

### 3. 🤖 ZAP BOT (Node.js)
```
┌─────────────────────────────────────────────────────────────┐
│                    ZAP BOT                                  │
├─────────────────────────────────────────────────────────────┤
│ • WhatsApp Web Integration (whatsapp-web.js)               │
│ • RabbitMQ Consumer (whatsapp.outgoing, whatsapp.incoming) │
│ • MinIO Integration (media storage)                        │
│ • Session Management (QR Code, Status)                     │
│ • Message Processing (text, media, audio)                  │
│ • Retry Logic (exponential backoff)                        │
└─────────────────────────────────────────────────────────────┘
```

### 4. 🗄️ BANCO DE DADOS (MySQL)
```
┌─────────────────────────────────────────────────────────────┐
│                    MYSQL DATABASE                           │
├─────────────────────────────────────────────────────────────┤
│ • ChatLogs (conversas e mensagens)                         │
│ • Messages (mensagens individuais)                         │
│ • Conversations (conversas ativas)                         │
│ • Contacts (contatos dos leads)                            │
│ • OperatorLeads (alocação de operadores)                   │
│ • ChatSessions (sessões WhatsApp)                          │
└─────────────────────────────────────────────────────────────┘
```

### 5. 📨 MESSAGE QUEUE (RabbitMQ)
```
┌─────────────────────────────────────────────────────────────┐
│                    RABBITMQ                                 │
├─────────────────────────────────────────────────────────────┤
│ • whatsapp.outgoing (mensagens para enviar)                │
│ • whatsapp.incoming (mensagens recebidas)                  │
│ • out.qrcode (códigos QR)                                  │
│ • session.status (status da sessão)                        │
│ • chat.assign (atribuição de chats)                        │
│ • notification.agent (notificações)                        │
└─────────────────────────────────────────────────────────────┘
```

### 6. 🗂️ OBJECT STORAGE (MinIO)
```
┌─────────────────────────────────────────────────────────────┐
│                    MINIO STORAGE                            │
├─────────────────────────────────────────────────────────────┤
│ • Bucket: midias                                            │
│ • Tipos: audio, image, video, document                     │
│ • URLs: https://bucket-production-1aef.up.railway.app      │
│ • Autenticação: Access Key + Secret Key                    │
│ • Integração: S3-compatible API                            │
└─────────────────────────────────────────────────────────────┘
```

### 7. 🚀 HOSTING (Railway)
```
┌─────────────────────────────────────────────────────────────┐
│                    RAILWAY CLOUD                            │
├─────────────────────────────────────────────────────────────┤
│ • API: my-pregiato-production.up.railway.app               │
│ • Frontend: my-pregiato-production.up.railway.app          │
│ • ZapBot: zap-bot-production-b642.up.railway.app           │
│ • MinIO: bucket-production-1aef.up.railway.app             │
│ • RabbitMQ: trolley.proxy.rlwy.net:57530                   │
│ • MySQL: Railway MySQL Database                            │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 FLUXOS PRINCIPAIS

### 1. 📱 Fluxo de Envio de Mensagem
```
Frontend → API → RabbitMQ → ZapBot → WhatsApp → Cliente
    ↓         ↓        ↓        ↓         ↓
  SignalR   ChatLog   Queue   Process   Send
```

### 2. 📥 Fluxo de Recebimento de Mensagem
```
WhatsApp → ZapBot → RabbitMQ → API → Frontend
    ↓         ↓        ↓        ↓        ↓
  Receive   Process   Queue   ChatLog  SignalR
```

### 3. 🎵 Fluxo de Mídia (Áudio/Imagem)
```
Frontend → API → MinIO → URL → RabbitMQ → ZapBot → WhatsApp
    ↓         ↓       ↓      ↓        ↓        ↓
  Upload   Store   Return  Queue   Download   Send
```

### 4. 🔐 Fluxo de Autenticação
```
Frontend → Clerk → JWT → API → Protected Routes
    ↓        ↓      ↓      ↓
  Login   Verify  Token  Authorize
```

## 🛠️ TECNOLOGIAS UTILIZADAS

### Frontend
- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **SignalR Client** - Real-time communication
- **Clerk** - Authentication
- **Axios** - HTTP client

### Backend
- **.NET 8** - Framework principal
- **Entity Framework Core** - ORM
- **SignalR** - Real-time communication
- **Serilog** - Logging
- **RabbitMQ.Client** - Message queue
- **MinIO SDK** - Object storage
- **MySQL** - Database

### ZapBot
- **Node.js** - Runtime
- **whatsapp-web.js** - WhatsApp integration
- **amqplib** - RabbitMQ client
- **minio** - Object storage client
- **express** - Web server

### Infrastructure
- **Railway** - Cloud hosting
- **RabbitMQ** - Message broker
- **MinIO** - Object storage
- **MySQL** - Database
- **Docker** - Containerization

## 🔧 CONFIGURAÇÕES DE AMBIENTE

### API (.NET)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "MySQL connection string"
  },
  "RabbitMQ": {
    "Host": "trolley.proxy.rlwy.net",
    "Port": 57530,
    "Username": "maqItSI6EBLd3Nmy",
    "Password": "faLY4tAuA93tNFysRsigQ6VtBkmf2WoF"
  },
  "MinIO": {
    "Endpoint": "bucket.railway.internal:9000",
    "AccessKey": "7bW6zf9Vo0QBtueWnzM73OMHcsTIFuWi",
    "SecretKey": "OduQXA4WGbZ83GhL5vclllgRmmVr0xas2QhLCPOq6o8Qhpgt"
  }
}
```

### ZapBot (Node.js)
```javascript
{
  "RABBITMQ_URL": "amqp://maqItSI6EBLd3Nmy:faLY4tAuA93tNFysRsigQ6VtBkmf2WoF@trolley.proxy.rlwy.net:57530",
  "MINIO_PRIVATE_ENDPOINT": "http://bucket.railway.internal:9000",
  "MINIO_ROOT_USER": "7bW6zf9Vo0QBtueWnzM73OMHcsTIFuWi",
  "MINIO_ROOT_PASSWORD": "OduQXA4WGbZ83GhL5vclllgRmmVr0xas2QhLCPOq6o8Qhpgt",
  "ZAP_BOT_URL": "https://zap-bot-production-b642.up.railway.app"
}
```

## 📊 MONITORAMENTO E LOGS

### Logs Estruturados
- **API**: Serilog com diferentes níveis (INFO, WARN, ERROR)
- **ZapBot**: Console logs com timestamps
- **Frontend**: Console logs para debug

### Métricas
- **RabbitMQ**: Queue depth, message rates
- **MinIO**: Storage usage, request rates
- **MySQL**: Connection pool, query performance
- **Railway**: CPU, Memory, Network usage

## 🔒 SEGURANÇA

### Autenticação
- **Clerk**: JWT tokens, session management
- **API**: Bearer token validation
- **Frontend**: Protected routes, token refresh

### Autorização
- **Operator-based**: Leads alocados por operador
- **Phone validation**: Verificação de números autorizados
- **Rate limiting**: Proteção contra spam

### Dados
- **HTTPS**: Todas as comunicações criptografadas
- **Environment variables**: Credenciais em variáveis de ambiente
- **Input validation**: Sanitização de dados de entrada

## 🚀 DEPLOYMENT

### Railway Services
1. **API**: Auto-deploy on git push
2. **Frontend**: Build and deploy static files
3. **ZapBot**: Node.js service deployment
4. **MinIO**: Object storage service
5. **RabbitMQ**: Message broker service
6. **MySQL**: Database service

### CI/CD
- **GitHub**: Source control
- **Railway**: Automatic deployments
- **Environment**: Production, Staging (se configurado)

## 📈 ESCALABILIDADE

### Horizontal Scaling
- **API**: Multiple instances behind load balancer
- **ZapBot**: Multiple bot instances for different numbers
- **RabbitMQ**: Cluster configuration
- **MinIO**: Distributed storage

### Vertical Scaling
- **Railway**: Auto-scaling based on resource usage
- **Database**: Connection pooling, query optimization
- **Storage**: MinIO cluster for high availability

---

*Diagrama criado em: 2025-01-23*
*Versão: 1.0*
*Sistema: Pregiato WhatsApp Integration*
