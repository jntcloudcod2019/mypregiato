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
