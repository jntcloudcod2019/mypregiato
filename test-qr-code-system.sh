#!/bin/bash

echo "🧪 Testando Sistema de QR Code"
echo "================================"

# Função para verificar se um serviço está rodando
check_service() {
    local service_name=$1
    local port=$2
    local url=$3
    
    echo "🔍 Verificando $service_name..."
    if curl -s "$url" > /dev/null 2>&1; then
        echo "✅ $service_name está rodando na porta $port"
        return 0
    else
        echo "❌ $service_name não está rodando na porta $port"
        return 1
    fi
}

# Verificar serviços
echo ""
echo "1. Verificando serviços..."
check_service "Zap-Bot" "3030" "http://localhost:3030/status"
check_service "Backend" "5656" "http://localhost:5656/api/whatsapp/status"
check_service "Frontend" "8080" "http://localhost:8080"

echo ""
echo "2. Testando geração de QR code..."
echo "📤 Enviando comando para gerar QR code..."

# Testar geração de QR code
response=$(curl -s -X POST http://localhost:5656/api/whatsapp/generate-qr)
echo "📥 Resposta: $response"

echo ""
echo "3. Testando fila de QR code..."
echo "📤 Verificando fila out.qrcode..."

# Testar fila de QR code
queue_response=$(curl -s http://localhost:5656/api/whatsapp/queue/qr-code)
echo "📥 Resposta da fila: $queue_response"

echo ""
echo "4. Verificando métricas da fila..."
metrics_response=$(curl -s http://localhost:5656/api/whatsapp/queue/metrics)
echo "📊 Métricas: $metrics_response"

echo ""
echo "5. Status do RabbitMQ..."
echo "🔍 Verificando conexão com RabbitMQ..."

# Verificar se o zap-bot está conectado ao RabbitMQ
if curl -s http://localhost:3030/status | grep -q "RabbitMQ"; then
    echo "✅ Zap-Bot conectado ao RabbitMQ"
else
    echo "❌ Zap-Bot não está conectado ao RabbitMQ"
fi

echo ""
echo "🎯 Teste concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Se algum serviço não estiver rodando, inicie-o"
echo "2. Se o QR code não for gerado, verifique os logs do zap-bot"
echo "3. Se a fila estiver vazia, aguarde o zap-bot gerar o QR code"
echo "4. Se houver erros de 'JavaScript world', reinicie o zap-bot"
echo "5. Teste novamente após alguns segundos"
