# 🎵 Fluxo Completo: Mensagem de Áudio do Destinatário → Zap Bot → API

## 📋 Resumo do Processo

Quando um destinatário envia uma mensagem de áudio via WhatsApp, o Zap Bot processa e envia para a API através do RabbitMQ. Aqui está o fluxo completo:

---

## 🔄 **1. RECEPÇÃO NO ZAP BOT**

### **1.1 Event Listener (zap.js:662)**
```javascript
client.on('message', async (message) => {
  Log.info('[MESSAGE] Mensagem recebida', { 
    from: message.from, 
    type: message.type, 
    fromMe: message.fromMe,
    body: message.body?.substring(0, 50) + '...' 
  });
  await onInbound(message);
});
```

### **1.2 Processamento Inbound (zap.js:931)**
```javascript
async function onInbound(message) {
  try {
    Log.info('[INBOUND] Processando mensagem', { 
      from: message.from, 
      type: message.type, 
      fromMe: message.fromMe,
      hasMedia: message.hasMedia 
    });
    
    if (message.fromMe) {
      Log.info('[INBOUND] Mensagem própria ignorada');
      return;
    }

    // Extrair número do remetente
    const fromBare = (message.from || '').split('@')[0];
    const fromNorm = normalizeNumber(fromBare);
    
    let payload = buildInboundPayload(message);

    // Processar mídia se existir
    if (message.hasMedia) {
      const media = await message.downloadMedia();
      if (media && media.data) {
        const messageType = mapWppType(message.type);
        
        // Para áudio, incluir base64 no body da mensagem para o frontend
        if (messageType === 'audio' || messageType === 'voice') {
          const dataUrl = `data:${media.mimetype};base64,${media.data}`;
          payload.body = dataUrl; // Frontend precisa do base64 no body
          Log.info('Áudio processado com base64 no body', { 
            type: messageType, 
            mimeType: media.mimetype,
            size: Buffer.byteLength(media.data, 'base64') 
          });
        }
        
        payload.attachment = {
          dataUrl: media.data,
          mimeType: media.mimetype,
          fileName: media.filename || `media_${Date.now()}.bin`,
          mediaType: messageType,
          
          // Campos condicionais baseados no tipo
          fileSize: Buffer.byteLength(media.data, 'base64'),
          duration: (messageType === 'audio' || messageType === 'video') ? null : null,
          width: (messageType === 'image' || messageType === 'video') ? null : null,
          height: (messageType === 'image' || messageType === 'video') ? null : null,
          thumbnail: null
        };
      }
    }

    await publish('whatsapp.incoming', payload);
    Log.info('Inbound publicado', { 
      id: payload.externalMessageId, 
      type: payload.type,
      hasMedia: !!payload.attachment
    });
  } catch (e) {
    Log.error('Erro inbound', { error: e?.message });
  }
}
```

### **1.3 Payload Base (zap.js:893)**
```javascript
function buildInboundPayload(message) {
  const fromBare = (message.from || '').split('@')[0];
  const fromNorm = normalizeNumber(fromBare);
  return {
    // === CAMPOS OBRIGATÓRIOS ===
    externalMessageId: message.id?._serialized || crypto.randomUUID(),
    from: message.from || '', // Ex: "5511949908369@c.us"
    fromNormalized: fromNorm, // Ex: "5511949908369"
    to: connectedNumber || '',
    type: mapWppType(message.type), // "audio" ou "voice"
    timestamp: new Date().toISOString(),
    instanceId,
    fromMe: false,
    isGroup: Boolean(message.isGroupMsg || message.isGroup),
    chatId: `chat_${fromNorm}`,

    // === CAMPOS OPCIONAIS ===
    body: message.body || '', // Para áudio: será sobrescrito com dataUrl
    simulated: false,

    // === MÍDIA UNIFICADA ===
    attachment: null, // Será preenchido se hasMedia

    // === LOCALIZAÇÃO DA SESSÃO ===
    location: {
      latitude: -23.5505,
      longitude: -46.6333,
      address: "São Paulo, Brasil"
    }
  };
}
```

---

## 🚀 **2. ENVIO VIA RABBITMQ**

### **2.1 Publicação na Fila (zap.js:1001)**
```javascript
await publish('whatsapp.incoming', payload);
```

**Payload Final para Áudio:**
```json
{
  "externalMessageId": "false_5511949908369@c.us_3A4BFF98D2C39A78ABD8",
  "from": "5511949908369@c.us",
  "fromNormalized": "5511949908369",
  "to": "5511977240565",
  "type": "audio",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "instanceId": "zap-prod",
  "fromMe": false,
  "isGroup": false,
  "chatId": "chat_5511949908369",
  "body": "data:audio/webm;codecs=opus;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH...",
  "simulated": false,
  "attachment": {
    "dataUrl": "GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH...",
    "mimeType": "audio/webm;codecs=opus",
    "fileName": "media_1705312200000.bin",
    "mediaType": "audio",
    "fileSize": 12345,
    "duration": null,
    "width": null,
    "height": null,
    "thumbnail": null
  }
}
```

---

## 📨 **3. RECEPÇÃO NA API**

### **3.1 Consumidor RabbitMQ (RabbitBackgroundService.cs:296)**
```csharp
var messageConsumer = new EventingBasicConsumer(_channel);
messageConsumer.Received += async (model, ea) =>
{
  try
  {
    var body = ea.Body.ToArray();
    var message = Encoding.UTF8.GetString(body);
    var whatsappMessage = JsonSerializer.Deserialize<WhatsAppMessage>(message);

    if (whatsappMessage != null)
    {
      _logger.LogInformation("📨 Mensagem WhatsApp recebida via RabbitMQ: {From} -> {To}",
          whatsappMessage.from, whatsappMessage.to);

      // Buscar chatId real do banco de dados
      string realChatId;
      using (var scope = _services.CreateScope())
      {
        var context = scope.ServiceProvider.GetRequiredService<PregiatoDbContext>();
        var chatLog = context.ChatLogs
            .Where(c => c.ContactPhoneE164 == whatsappMessage.fromNormalized)
            .FirstOrDefault();
        
        realChatId = chatLog?.ChatId.ToString() ?? $"chat_{whatsappMessage.fromNormalized}";
      }

      // Notificar clientes via SignalR
      await _hubContext.Clients.Group("whatsapp").SendAsync("message.inbound", new {
        chatId = realChatId,
        fromNormalized = whatsappMessage.fromNormalized,
        message = new {
          id = whatsappMessage.externalMessageId,
          externalMessageId = whatsappMessage.externalMessageId,
          from = whatsappMessage.from, // "5511949908369@c.us"
          fromMe = whatsappMessage.fromMe,
          body = whatsappMessage.body, // Base64 do áudio
          type = whatsappMessage.type, // "audio"
          timestamp = whatsappMessage.timestamp,
          attachment = whatsappMessage.attachment
        }
      });

      // Processar mensagem no banco de dados
      await ProcessIncomingMessage(whatsappMessage);
    }
  }
  catch (Exception ex)
  {
    _logger.LogError(ex, "Erro ao processar mensagem recebida");
  }
};
```

### **3.2 Processamento no Banco (RabbitBackgroundService.cs:1472)**
```csharp
private ChatLogService.MessageInfo CreateCompleteMessageInfo(WhatsAppMessage message, string? mediaUrl)
{
  var messageInfo = new ChatLogService.MessageInfo
  {
    Id = message.externalMessageId,
    from = message.from, // "5511949908369@c.us"
    timestamp = message.timestamp,
    Direction = "inbound",
    Type = message.type?.ToLower(), // "audio"
    Status = "delivered",
    MediaUrl = null, // ✅ CORREÇÃO: Campo MediaUrl deve ser null
    IsRead = false,
    
    // ✅ CAMPO PRINCIPAL: Apenas body recebe o conteúdo
    body = message.body, // Base64 do áudio: "data:audio/webm;codecs=opus;base64,..."
    Content = null, // Campo Content deve ser null conforme padrão
    
    // Campos de mídia
    mimeType = message.attachment?.mimeType,
    fileName = message.attachment?.fileName,
    size = message.attachment?.fileSize,
    
    // Campos adicionais
    duration = null,
    thumbnail = null,
    latitude = null,
    longitude = null,
    locationAddress = null,
    contactName = null,
    contactPhone = null
  };
  
  return messageInfo;
}
```

---

## 📡 **4. NOTIFICAÇÃO VIA SIGNALR**

### **4.1 Evento message.inbound**
```csharp
await _hubContext.Clients.Group("whatsapp").SendAsync("message.inbound", new {
  chatId = realChatId,
  fromNormalized = whatsappMessage.fromNormalized,
  message = new {
    id = whatsappMessage.externalMessageId,
    externalMessageId = whatsappMessage.externalMessageId,
    from = whatsappMessage.from, // "5511949908369@c.us"
    fromMe = whatsappMessage.fromMe,
    body = whatsappMessage.body, // Base64 do áudio
    type = whatsappMessage.type, // "audio"
    timestamp = whatsappMessage.timestamp,
    attachment = whatsappMessage.attachment
  }
});
```

---

## 🎯 **5. PONTOS CRÍTICOS**

### **5.1 Campo `body` é o ÚNICO que recebe conteúdo**
- ✅ **Zap Bot**: `payload.body = dataUrl` (base64 do áudio)
- ✅ **API**: `messageInfo.body = message.body` (base64 do áudio)
- ✅ **SignalR**: `body = whatsappMessage.body` (base64 do áudio)

### **5.2 Campos que devem ser `null`**
- ❌ `Content` = null
- ❌ `MediaUrl` = null
- ❌ `text` = null (não usado)

### **5.3 Estrutura do Attachment**
```json
{
  "attachment": {
    "dataUrl": "base64_puro_sem_data_url",
    "mimeType": "audio/webm;codecs=opus",
    "fileName": "media_1705312200000.bin",
    "mediaType": "audio",
    "fileSize": 12345
  }
}
```

---

## 🔍 **6. VALIDAÇÃO DO FLUXO**

### **6.1 Logs do Zap Bot**
```
[MESSAGE] Mensagem recebida { from: "5511949908369@c.us", type: "ptt", fromMe: false }
[INBOUND] Processando mensagem { from: "5511949908369@c.us", type: "ptt", hasMedia: true }
Áudio processado com base64 no body { type: "audio", mimeType: "audio/webm;codecs=opus", size: 12345 }
Inbound publicado { id: "false_5511949908369@c.us_3A4BFF98D2C39A78ABD8", type: "audio", hasMedia: true }
```

### **6.2 Logs da API**
```
📨 Mensagem WhatsApp recebida via RabbitMQ: 5511949908369@c.us -> 5511977240565
📋 Deserializando PayloadJson existente (tamanho: 1234 chars)
📝 ✅ Mensagem adicionada ao ChatLog existente: ChatId=chat_5511949908369, ChatLogId=123e4567-e89b-12d3-a456-426614174000
📡 ✅ Evento message.inbound emitido
```

---

## ✅ **7. CONCLUSÃO**

O fluxo está **CORRETO** e segue o padrão estabelecido:

1. **Zap Bot** recebe áudio do WhatsApp
2. **Download** da mídia via `message.downloadMedia()`
3. **Base64** colocado no campo `body` como `dataUrl`
4. **RabbitMQ** envia payload completo para API
5. **API** processa e salva no `PayloadJson`
6. **SignalR** notifica frontend em tempo real
7. **Frontend** recebe áudio no campo `body` e pode reproduzir

**🎵 O áudio chega íntegro do destinatário até o frontend!**
