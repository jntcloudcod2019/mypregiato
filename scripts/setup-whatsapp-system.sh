#!/bin/bash

echo "🚀 Configurando sistema completo de WhatsApp Gateway..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script na raiz do projeto"
    exit 1
fi

log "Verificando dependências..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado. Instale o Node.js primeiro."
    exit 1
fi

# Verificar .NET
if ! command -v dotnet &> /dev/null; then
    error ".NET não está instalado. Instale o .NET 8.0 primeiro."
    exit 1
fi

# Verificar Docker
if ! command -v docker &> /dev/null; then
    warning "Docker não está instalado. Alguns serviços podem não funcionar."
fi

log "Criando estrutura de diretórios..."

# Criar diretórios necessários
mkdir -p backend/WhatsAppGateway/sessions
mkdir -p backend/WhatsAppGateway/logs
mkdir -p backend/Pregiato.API/logs
mkdir -p uploads

log "Configurando WhatsApp Gateway..."

# Navegar para o diretório do WhatsApp Gateway
cd backend/WhatsAppGateway

# Instalar dependências do WhatsApp Gateway
if [ -f "package.json" ]; then
    log "Instalando dependências do WhatsApp Gateway..."
    npm install
else
    error "package.json não encontrado no WhatsApp Gateway"
    exit 1
fi

# Voltar para a raiz
cd ../..

log "Configurando .NET API..."

# Navegar para o diretório da API
cd backend/Pregiato.API

# Restaurar pacotes .NET
log "Restaurando pacotes .NET..."
dotnet restore

# Compilar projeto
log "Compilando projeto .NET..."
dotnet build

# Voltar para a raiz
cd ../..

log "Configurando banco de dados..."

# Criar banco de dados SQLite (temporário)
if [ -f "backend/Pregiato.API/pregiato.db" ]; then
    log "Banco de dados já existe"
else
    log "Criando banco de dados..."
    cd backend/Pregiato.API
    dotnet run --no-build --environment Development
    cd ../..
fi

log "Configurando variáveis de ambiente..."

# Criar arquivo .env para o WhatsApp Gateway
cat > backend/WhatsAppGateway/.env << EOF
# Configurações do WhatsApp Gateway
PORT=3001
FRONTEND_URL=http://localhost:3000
RABBITMQ_URL=amqp://localhost
SESSION_PATH=./sessions

# Logs
LOG_LEVEL=info

# Segurança
NODE_ENV=development
EOF

# Criar arquivo appsettings.Development.json para a API
cat > backend/Pregiato.API/appsettings.Development.json << EOF
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=pregiato.db"
  },
  "WhatsAppGateway": {
    "Url": "http://localhost:3001"
  },
  "FileStorage": {
    "BasePath": "uploads",
    "MaxSize": 10485760,
    "AllowedExtensions": [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx"]
  }
}
EOF

log "Configurando Docker Compose..."

# Criar docker-compose.yml para desenvolvimento
cat > docker-compose.dev.yml << EOF
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: pregiato-mysql
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: pregiato
      MYSQL_USER: pregiato
      MYSQL_PASSWORD: pregiato123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - pregiato-network

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3-management
    container_name: pregiato-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - pregiato-network

  # Redis
  redis:
    image: redis:7-alpine
    container_name: pregiato-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - pregiato-network

volumes:
  mysql_data:
  rabbitmq_data:
  redis_data:

networks:
  pregiato-network:
    driver: bridge
EOF

log "Criando scripts de inicialização..."

# Script para iniciar o WhatsApp Gateway
cat > scripts/start-whatsapp-gateway.sh << 'EOF'
#!/bin/bash
cd backend/WhatsAppGateway
npm run dev
EOF

# Script para iniciar a API .NET
cat > scripts/start-api.sh << 'EOF'
#!/bin/bash
cd backend/Pregiato.API
dotnet run --environment Development
EOF

# Script para iniciar o frontend
cat > scripts/start-frontend.sh << 'EOF'
#!/bin/bash
npm run dev
EOF

# Script para iniciar tudo
cat > scripts/start-all.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando sistema completo de WhatsApp..."

# Iniciar serviços de infraestrutura
echo "📦 Iniciando serviços de infraestrutura..."
docker-compose -f docker-compose.dev.yml up -d mysql rabbitmq redis

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# Iniciar WhatsApp Gateway
echo "📱 Iniciando WhatsApp Gateway..."
cd backend/WhatsAppGateway
npm run dev &
GATEWAY_PID=$!

# Iniciar API .NET
echo "🔧 Iniciando API .NET..."
cd ../Pregiato.API
dotnet run --environment Development &
API_PID=$!

# Iniciar Frontend
echo "🌐 Iniciando Frontend..."
cd ../..
npm run dev &
FRONTEND_PID=$!

echo "✅ Sistema iniciado!"
echo "📱 WhatsApp Gateway: http://localhost:3001"
echo "🔧 API .NET: http://localhost:5000"
echo "🌐 Frontend: http://localhost:3000"
echo "📊 RabbitMQ Management: http://localhost:15672 (admin/admin123)"

# Função para limpar processos ao sair
cleanup() {
    echo "🛑 Parando serviços..."
    kill $GATEWAY_PID $API_PID $FRONTEND_PID 2>/dev/null
    docker-compose -f docker-compose.dev.yml down
    exit 0
}

trap cleanup SIGINT SIGTERM

# Manter script rodando
wait
EOF

# Tornar scripts executáveis
chmod +x scripts/start-whatsapp-gateway.sh
chmod +x scripts/start-api.sh
chmod +x scripts/start-frontend.sh
chmod +x scripts/start-all.sh

log "Criando documentação..."

# Criar README para o sistema WhatsApp
cat > README-WHATSAPP-SYSTEM.md << 'EOF'
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
EOF

log "✅ Sistema configurado com sucesso!"

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Execute: ./scripts/start-all.sh"
echo "2. Acesse: http://localhost:3000"
echo "3. Conecte o WhatsApp escaneando o QR Code"
echo "4. Teste o sistema!"
echo ""
echo "📚 Documentação: README-WHATSAPP-SYSTEM.md"
echo "" 