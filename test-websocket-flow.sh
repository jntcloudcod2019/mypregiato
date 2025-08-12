#!/bin/bash

echo "🧪 Testando fluxo completo do WebSocket QR Code"
echo "================================================"

# 1. Verificar se todos os serviços estão rodando
echo "1. Verificando serviços..."
echo "   - API (porta 5656): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5656/api/whatsapp/status)"
echo "   - Frontend (porta 8080): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)"
echo "   - Zap-bot (porta 3030): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3030/status)"

# 2. Testar geração de QR code
echo ""
echo "2. Testando geração de QR code..."
RESPONSE=$(curl -s -X POST http://localhost:5656/api/whatsapp/generate-qr -H "Content-Type: application/json" -d "{}")
echo "   Resposta: $RESPONSE"

# 3. Aguardar e verificar se o QR code foi gerado
echo ""
echo "3. Aguardando QR code..."
sleep 10

QR_RESPONSE=$(curl -s http://localhost:5656/api/whatsapp/qr-code)
if [[ $QR_RESPONSE == *"qrCode"* ]]; then
    echo "   ✅ QR code gerado com sucesso!"
    echo "   📊 Tamanho: $(echo $QR_RESPONSE | jq -r '.qrCode' | wc -c) caracteres"
    echo "   🔍 Começa com data:? $(echo $QR_RESPONSE | jq -r '.qrCode' | grep -c '^data:')"
else
    echo "   ❌ QR code não foi gerado"
    echo "   Resposta: $QR_RESPONSE"
fi

# 4. Verificar logs da API
echo ""
echo "4. Verificando logs da API..."
echo "   Os logs devem mostrar:"
echo "   - 📥 QR Code recebido da fila out.qrcode"
echo "   - 📤 QR Code enviado via SignalR"

echo ""
echo "✅ Teste concluído!"
echo ""
echo "📋 Para testar no frontend:"
echo "   1. Abra http://localhost:8080"
echo "   2. Clique em 'Gerar QR Code'"
echo "   3. Verifique o console do navegador para logs do SignalR"
echo "   4. O QR code deve aparecer automaticamente via WebSocket"
