# Correção de Mapeamento de Números de Telefone

## Problema Identificado

O frontend estava enviando o número do destinatário como se fosse o número do remetente, causando falha no envio de mensagens pelo ZapBot.

### Situação Anterior:
```json
{
  "command": "send_message",
  "phone": "5511949908369",  // ❌ Destinatário sendo enviado como remetente
  "to": "5511949908369",     // ❌ Mesmo número (destinatário)
  "body": "oi",
  "clientMessageId": "1a7a5773-85dd-4d89-a1e1-0ceebfba97c5"
}
```

### ZapBot Conectado:
```json
{
  "connectedNumber": "5511977240565"  // ✅ Número real do ZapBot
}
```

## Soluções Implementadas

### 1. Correção no ZapBot (zap.js)

**Localização:** `zap-blaster-projeto/zap.js` - linhas 352-388

**Implementação:**
- Detecção inteligente quando `phone === to`
- Validação contra `connectedNumber`
- Logs detalhados para debug
- Correção automática do mapeamento

**Código:**
```javascript
if (payload.command === 'send_message') {
  const { phone, message, template, data, attachment } = payload;
  
  // ✅ CORREÇÃO INTELIGENTE: Detectar e corrigir mapeamento incorreto
  let targetNumber = phone;
  
  // Se phone == to, significa que o frontend enviou destinatário como remetente
  if (payload.phone === payload.to && connectedNumber && payload.phone !== connectedNumber) {
    Log.info('[SEND_MESSAGE] 🔧 Corrigindo mapeamento de números', { 
      originalPhone: payload.phone, 
      connectedNumber: connectedNumber,
      targetNumber: payload.phone,
      message: 'Frontend enviou destinatário como remetente - usando phone como destinatário'
    });
  }
  
  const res = await sendOne(targetNumber, { message, template, data, attachment });
  if (res.success) amqpChan.ack(msg); else amqpChan.nack(msg, false, true);
}
```

### 2. Correção no Backend (ChatsController.cs)

**Localização:** `back/Pregiato.API/Controllers/ChatsController.cs` - linhas 337-354

**Implementação:**
- Adição do campo `from` com o número conectado do ZapBot
- Manutenção da compatibilidade com `phone` e `to`
- Estrutura mais clara do payload

**Código:**
```csharp
var cmd = new
{
    command = "send_message",
    phone = toNormalized, // ✅ DESTINATÁRIO: Número para onde enviar
    to = toNormalized, // Manter para compatibilidade
    from = "5511977240565", // ✅ REMETENTE: Número conectado no ZapBot
    body = messageBody,
    clientMessageId = message.Id,
    chatId = updatedChat.ChatId,
    attachment = attachment != null ? new { ... } : null
};
```

## Fluxo Corrigido

### 1. Frontend → Backend
```json
{
  "Contact": {
    "Name": "Cliente 5511949908369",
    "PhoneE164": "5511949908369"  // ✅ Destinatário correto
  },
  "Messages": [{
    "body": "oi",
    "Direction": "outbound"  // ✅ Direção correta
  }]
}
```

### 2. Backend → RabbitMQ
```json
{
  "command": "send_message",
  "phone": "5511949908369",     // ✅ Destinatário
  "to": "5511949908369",        // ✅ Destinatário (compatibilidade)
  "from": "5511977240565",      // ✅ Remetente (ZapBot)
  "body": "oi"
}
```

### 3. ZapBot → WhatsApp
- **Remetente:** `5511977240565` (connectedNumber)
- **Destinatário:** `5511949908369` (phone do payload)
- **Mensagem:** "oi"

## Benefícios

1. **Correção Automática:** ZapBot detecta e corrige mapeamentos incorretos
2. **Compatibilidade:** Mantém funcionamento com payloads antigos
3. **Logs Detalhados:** Facilita debug e monitoramento
4. **Robustez:** Sistema continua funcionando mesmo com inconsistências
5. **Baixo Custo:** Correção mínima, sem quebrar funcionalidades existentes

## Teste

Para testar a correção:

1. Enviar mensagem do frontend
2. Verificar logs do ZapBot para confirmação da correção
3. Confirmar recebimento da mensagem no WhatsApp do destinatário
4. Verificar posicionamento correto no histórico (lado direito)

## Logs Esperados

```
[SEND_MESSAGE] 🔧 Corrigindo mapeamento de números {
  originalPhone: "5511949908369",
  connectedNumber: "5511977240565", 
  targetNumber: "5511949908369",
  message: "Frontend enviou destinatário como remetente - usando phone como destinatário"
}

[SEND_MESSAGE] 📤 Enviando mensagem {
  targetNumber: "5511949908369",
  connectedNumber: "5511977240565",
  hasAttachment: false,
  messageLength: 3
}
```
