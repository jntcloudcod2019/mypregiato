# Sistema WhatsApp Gateway - Pregiato

## Visão Geral

Este sistema implementa uma arquitetura completa de WhatsApp Gateway com:

- **WhatsApp Gateway (Node.js)**: Gerencia conexão com WhatsApp via Baileys
- **API .NET Core**: Orquestra filas, operadores e conversas
- **Frontend React**: Interface para operadores
- **RabbitMQ**: Comunicação entre serviços
- **SignalR**: Comunicação em tempo real

## Arquitetura

```
[Frontend React] ←→ [API .NET Core] ←→ [WhatsApp Gateway Node.js] ←→ [WhatsApp]
                           ↓
                    [RabbitMQ/Redis]
```

## Componentes

### 1. WhatsApp Gateway (Node.js)
- **Porta**: 3001
- **Tecnologia**: Express + Baileys + Socket.IO
- **Funções**:
  - Gerenciar sessão WhatsApp
  - Gerar QR Code
  - Enviar/receber mensagens
  - Emitir eventos via Socket.IO

### 2. API .NET Core
- **Porta**: 5000
- **Tecnologia**: ASP.NET Core + Entity Framework + SignalR
- **Funções**:
  - Gerenciar contatos, conversas, mensagens
  - Roteamento de fila
  - Comunicação em tempo real via SignalR
  - Integração com RabbitMQ

### 3. Frontend React
- **Porta**: 3000
- **Funções**:
  - Interface para operadores
  - Chat em tempo real
  - Gerenciamento de fila
  - Controle de sessão WhatsApp

## Como Usar

### 1. Iniciar Sistema Completo
```bash
./scripts/start-all.sh
```

### 2. Iniciar Serviços Individuais

#### WhatsApp Gateway
```bash
./scripts/start-whatsapp-gateway.sh
```

#### API .NET
```bash
./scripts/start-api.sh
```

#### Frontend
```bash
./scripts/start-frontend.sh
```

### 3. Acessar Interfaces

- **Frontend**: http://localhost:3000
- **API Swagger**: http://localhost:5000/swagger
- **WhatsApp Gateway**: http://localhost:3001
- **RabbitMQ Management**: http://localhost:15672 (admin/admin123)

## Fluxos Principais

### 1. Conectar WhatsApp
1. Acessar frontend
2. Clicar em "Conectar WhatsApp"
3. Escanear QR Code
4. Aguardar conexão

### 2. Receber Mensagem
1. WhatsApp → Gateway → API → Frontend
2. Mensagem aparece na fila
3. Operador assume conversa
4. Chat fica disponível

### 3. Enviar Mensagem
1. Operador digita no frontend
2. Frontend → API → Gateway → WhatsApp
3. Confirmação de entrega

## Configuração

### Variáveis de Ambiente

#### WhatsApp Gateway (.env)
```
PORT=3001
FRONTEND_URL=http://localhost:3000
RABBITMQ_URL=amqp://localhost
SESSION_PATH=./sessions
```

#### API .NET (appsettings.json)
```json
{
  "WhatsAppGateway": {
    "Url": "http://localhost:3001"
  }
}
```

## Desenvolvimento

### Estrutura de Arquivos
```
backend/
├── WhatsAppGateway/     # Node.js Gateway
├── Pregiato.API/       # .NET Core API
├── Pregiato.Core/      # Entidades
├── Pregiato.Application/ # Serviços
└── Pregiato.Infrastructure/ # Data Access

scripts/
├── start-all.sh        # Iniciar tudo
├── start-whatsapp-gateway.sh
├── start-api.sh
└── start-frontend.sh
```

### Comandos Úteis

```bash
# Compilar .NET
cd backend/Pregiato.API && dotnet build

# Instalar dependências Node.js
cd backend/WhatsAppGateway && npm install

# Ver logs
tail -f backend/WhatsAppGateway/logs/app.log
tail -f backend/Pregiato.API/logs/pregiato-.txt
```

## Troubleshooting

### WhatsApp não conecta
1. Verificar se QR Code foi escaneado
2. Verificar logs do Gateway
3. Tentar reconectar

### Mensagens não chegam
1. Verificar conexão RabbitMQ
2. Verificar logs da API
3. Verificar SignalR

### Frontend não atualiza
1. Verificar conexão SignalR
2. Verificar CORS
3. Verificar logs do frontend
