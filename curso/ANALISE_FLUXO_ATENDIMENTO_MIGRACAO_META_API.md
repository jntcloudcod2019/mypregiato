# 📊 ANÁLISE COMPLETA DO FLUXO DE ATENDIMENTO - MIGRAÇÃO PARA META API

## 🎯 OBJETIVO
Documentar o fluxo atual de atendimento e mapear os pontos que precisam ser alterados para migrar do `zap-blaster` (whatsapp-web.js) para a API oficial do WhatsApp da Meta.

---

## 🔄 FLUXO ATUAL - ARQUITETURA COMPLETA

### 1️⃣ **FRONTEND - PÁGINA DE ATENDIMENTO**
**Arquivo:** `front/src/pages/atendimento/index.tsx`

#### 📤 **ENVIO DE MENSAGENS (Frontend → Backend)**

```typescript
// FUNÇÃO PRINCIPAL: sendMessage() - Linha 734
const sendMessage = async (file?: File) => {
  // 1. Criar mensagem otimista
  const clientMessageId = crypto.randomUUID();
  const optimistic: ChatMessageDto = {
    id: clientMessageId,
    direction: MessageDirection.Out,
    text,
    status: 'pending',
    type: optimisticType,
    attachment: attachment
  };
  
  // 2. Adicionar à UI imediatamente
  setMessages(prev => [...prev, optimistic]);
  
  // 3. Enviar para API Backend
  await chatsApi.send(phoneNumber, text, clientMessageId, leadName, attachment);
}
```

**Service Layer:** `front/src/services/chat-service.ts`

```typescript
// FUNÇÃO: chatsApi.send() - Linha 533
send: async (id, text, clientMessageId, leadName, attachment) => {
  // Estrutura PayloadJson padrão
  const request = {
    Contact: {
      Name: leadName,
      PhoneE164: id, // Número do telefone
      ProfilePic: null
    },
    Messages: [{
      Id: clientMessageId,
      body: attachment?.dataUrl || text, // Base64 para mídia
      Type: attachment?.mediaType || "text",
      Direction: "outbound",
      timestamp: new Date().toISOString(),
      from: connectedNumber + "@c.us",
      mimeType: attachment?.mimeType,
      fileName: attachment?.fileName
    }]
  };
  
  // POST para backend
  await api.post(`/chats/${id}/send`, request);
}
```

#### 📥 **RECEBIMENTO DE MENSAGENS (Backend → Frontend via SignalR)**

```typescript
// LISTENER SIGNALR: message.inbound - Linha 1044
connection.on('message.inbound', async (evt: MessageEvent) => {
  const chatMessage: ChatMessageDto = {
    id: evt.message.id,
    direction: MessageDirection.In,
    text: evt.message.text || evt.message.body,
    type: evt.message.type,
    status: 'delivered',
    attachment: evt.message.attachment
  };
  
  // Adicionar à UI
  setMessages(prev => [...prev, chatMessage]);
  
  // Atualizar lista de chats
  queueChatPatch(finalChatId, { lastMessagePreview: text });
});
```

#### 🔔 **EVENTOS SIGNALR IMPORTANTES**

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `chat.created` | Novo chat criado | `{ chatId, chat: ChatListItem }` |
| `chat.updated` | Chat atualizado | `{ chatId, chat: Partial<ChatListItem> }` |
| `message.inbound` | Mensagem recebida | `{ chatId, message: MessageEvent }` |
| `message.outbound` | Mensagem enviada | `{ chatId, message: MessageEvent }` |
| `message.status` | Status da mensagem | `{ chatId, messageId, status }` |
| `presence.typing` | Usuário digitando | `{ chatId, isTyping }` |
| `chat.read` | Mensagens lidas | `{ chatId, readUpTo }` |

---

### 2️⃣ **BACKEND - API .NET**

#### 📨 **CONTROLLER DE CHATS**
**Arquivo:** `back/Pregiato.API/Controllers/ChatsController.cs`

```csharp
// ENDPOINT: POST /api/chats/{id}/send - Linha 229
[HttpPost("{id}/send")]
public async Task<IActionResult> Send(string id, [FromBody] SendRequest req)
{
    // 1. VALIDAR REQUISIÇÃO
    var message = req.Messages.First();
    
    // 2. BUSCAR/CRIAR CHATLOG
    var chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.ContactPhoneE164 == id);
    
    if (chat == null) {
        // Criar nova Conversation e ChatLog
        var conversation = await _conversationService.GetOrCreateConversationAsync(
            normalizedPhone, 
            "frontend",
            false,
            leadName
        );
        
        chat = new ChatLog {
            ChatId = conversation.Id,
            ContactPhoneE164 = normalizedPhone,
            PayloadJson = JsonSerializer.Serialize(new ChatPayload {
                Contact = new ContactInfo { ... },
                Messages = new List<MessageInfo>()
            })
        };
    }
    
    // 3. PROCESSAR MÍDIA (SE HOUVER)
    MediaResultDto? mediaUrl = null;
    if (isMediaMessage) {
        // Upload para MinIO
        mediaUrl = await _minIOStorageAdapter.StoreMediaAsync(
            message.body, 
            mimeType, 
            phoneNumber, 
            leadName
        );
    }
    
    // 4. ATUALIZAR PAYLOADJSON
    var messageInfo = new MessageInfo {
        Id = message.Id,
        body = isMediaMessage ? mediaUrl.MediaUrl : text,
        Type = message.Type,
        Direction = "outbound",
        timestamp = DateTime.UtcNow.ToString("O"),
        mimeType = attachment?.MimeType,
        fileName = attachment?.FileName,
        MediaUrl = mediaUrl?.MediaUrl
    };
    
    existingPayload.Messages.Add(messageInfo);
    chat.PayloadJson = JsonSerializer.Serialize(existingPayload);
    await _db.SaveChangesAsync();
    
    // 5. PUBLICAR NA FILA RABBITMQ
    var cmd = new {
        command = "send_message",
        phone = normalizedPhone,
        to = normalizedPhone,
        from = connectedNumber + "@c.us",
        body = isMediaMessage ? null : text,
        type = message.Type,
        clientMessageId = message.Id,
        chatId = chat.ChatId,
        attachment = isMediaMessage ? new {
            mediaUrl = mediaUrl.MediaUrl,
            mimeType = attachment.MimeType,
            fileName = attachment.FileName,
            mediaType = attachment.MediaType
        } : null
    };
    
    await _rabbit.PublishAsync("whatsapp.outgoing", cmd);
    
    // 6. NOTIFICAR FRONTEND VIA SIGNALR
    await _hub.Clients.Group("whatsapp").SendAsync("message.outbound", new {
        chatId = chat.Id,
        message = new { id = message.Id, body = messageBody, type = message.Type }
    });
    
    return Ok(new { success = true, messageId = message.Id });
}
```

#### 📥 **PROCESSAMENTO DE MENSAGENS INBOUND**
**Arquivo:** `back/Pregiato.API/Services/RabbitBackgroundService.cs`

```csharp
// CONSUMIDOR RABBITMQ: whatsapp.incoming - Linha 298
var messageConsumer = new EventingBasicConsumer(_channel);
messageConsumer.Received += async (model, ea) =>
{
    var whatsappMessage = JsonSerializer.Deserialize<WhatsAppMessage>(message);
    
    // 1. BUSCAR CHATID REAL
    var chatLog = context.ChatLogs
        .Where(c => c.ContactPhoneE164 == whatsappMessage.fromNormalized)
        .FirstOrDefault();
    
    string realChatId = chatLog?.ChatId.ToString() ?? $"chat_{whatsappMessage.fromNormalized}";
    
    // 2. NOTIFICAR FRONTEND VIA SIGNALR
    await _hubContext.Clients.Group("whatsapp").SendAsync("message.inbound", new {
        chatId = realChatId,
        fromNormalized = whatsappMessage.fromNormalized,
        message = new {
            id = whatsappMessage.externalMessageId,
            from = whatsappMessage.from,
            fromMe = whatsappMessage.fromMe,
            body = whatsappMessage.body,
            type = whatsappMessage.type,
            attachment = whatsappMessage.attachment
        }
    });
    
    // 3. PROCESSAR E SALVAR NO BANCO
    var conversationId = await ProcessIncomingMessage(whatsappMessage);
    
    // 4. CRIAR ENTIDADE DE MENSAGEM
    var messageEntity = CreateRobustMessageEntity(whatsappMessage, conversationId);
    _messageBatchQueue.Enqueue(messageEntity);
};
```

---

### 3️⃣ **ZAP-BLASTER - BOT WHATSAPP**
**Arquivo:** `zap-blaster-projeto/zap.js`

#### 📤 **CONSUMIDOR RABBITMQ - MENSAGENS OUTBOUND**

```javascript
// FUNÇÃO: startConsumer() - Linha 385
async function startConsumer() {
  const q = 'whatsapp.outgoing';
  
  amqpChan.consume(q, async (msg) => {
    const payload = JSON.parse(msg.content.toString());
    
    if (payload.command === 'send_message') {
      // 1. NORMALIZAR DADOS
      const targetNumber = payload.to;
      const message = payload.body;
      const attachment = payload.attachment;
      const typeMessage = payload.type;
      
      // 2. ENVIAR VIA WHATSAPP-WEB.JS
      const res = await sendOne(targetNumber, { message, attachment }, typeMessage);
      
      if (res.success) {
        amqpChan.ack(msg);
      } else {
        // Sistema de retry
        amqpChan.nack(msg, false, true);
      }
    }
  });
}
```

#### 📨 **FUNÇÃO DE ENVIO - WHATSAPP-WEB.JS**

```javascript
// FUNÇÃO: sendOne() - Linha 1687
async function sendOne(number, msg, typeMessage) {
  const chatId = `${normalizeNumber(number)}@c.us`;
  
  // ==== FLUXO PARA MÍDIA ====
  if (typeMessage && typeMessage !== 'text') {
    // 1. Baixar mídia do MinIO
    const buffer = await downloadMediaFromMinIO(att.mediaUrl, att.fileName);
    
    // 2. Converter para formato WhatsApp (se áudio)
    if (isAudioLike(mediaType, mime)) {
      // Converter para Opus/OGG se necessário
      finalBuffer = await convertToOpus(buffer);
      finalMime = 'audio/ogg; codecs=opus';
    }
    
    // 3. Criar MessageMedia
    const base64Data = finalBuffer.toString('base64');
    const media = new MessageMedia(finalMime, base64Data, fileName);
    
    // 4. Enviar via whatsapp-web.js
    const sent = await client.sendMessage(chatId, media, opts);
    
    // 5. Confirmar entrega
    await sendMessageStatus(number, sent.id._serialized, 'sent', clientMessageId);
    
    return { success: true, messageId: sent.id._serialized };
  }
  
  // ==== FLUXO PARA TEXTO ====
  const sent = await client.sendMessage(chatId, msg.message);
  await sendMessageStatus(number, sent.id._serialized, 'sent', clientMessageId);
  
  return { success: true, messageId: sent.id._serialized };
}
```

#### 📥 **LISTENER DE MENSAGENS INBOUND**

```javascript
// LISTENER: client.on('message') - Linha 952
client.on('message', async (message) => {
  await onInbound(message);
});

// FUNÇÃO: onInbound() - Linha 1237
async function onInbound(message) {
  // 1. Construir payload base
  let payload = buildInboundPayload(message);
  
  // 2. Processar mídia se existir
  if (message.hasMedia) {
    const media = await message.downloadMedia();
    
    // Para áudio: incluir base64 no body
    if (messageType === 'audio' || messageType === 'voice') {
      const dataUrl = `data:${media.mimetype};base64,${media.data}`;
      payload.body = dataUrl; // ✅ CRÍTICO: Frontend precisa disso
    }
    
    payload.attachment = {
      dataUrl: `data:${media.mimetype};base64,${media.data}`,
      mimeType: media.mimetype,
      fileName: media.filename,
      mediaType: messageType,
      fileSize: Buffer.byteLength(media.data, 'base64')
    };
  }
  
  // 3. Publicar para backend via RabbitMQ
  await publish('whatsapp.incoming', payload);
}
```

---

## 🔀 DIAGRAMA DO FLUXO ATUAL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUXO COMPLETO DE ATENDIMENTO                      │
└─────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║                         1. ENVIO DE MENSAGEM                              ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌──────────────┐     POST /chats/{id}/send    ┌──────────────┐
│   FRONTEND   │ ──────────────────────────▶  │   BACKEND    │
│ (React)      │                              │ (API .NET)   │
└──────────────┘                              └──────┬───────┘
                                                     │
                                                     │ 1. Salva no ChatLog.PayloadJson
                                                     │ 2. Upload mídia para MinIO
                                                     │ 3. Publica RabbitMQ
                                                     ▼
                                              ┌──────────────┐
                                              │  RABBITMQ    │
                                              │   Queue:     │
                                              │ whatsapp.    │
                                              │  outgoing    │
                                              └──────┬───────┘
                                                     │
                                                     │ Consome fila
                                                     ▼
                                              ┌──────────────┐
                                              │ ZAP-BLASTER  │
                                              │  (Node.js)   │
                                              └──────┬───────┘
                                                     │
                                                     │ 1. Download mídia do MinIO
                                                     │ 2. Converte áudio para Opus
                                                     │ 3. Envia via whatsapp-web.js
                                                     ▼
                                              ┌──────────────┐
                                              │  WHATSAPP    │
                                              │   (Meta)     │
                                              └──────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║                       2. RECEBIMENTO DE MENSAGEM                          ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌──────────────┐                              ┌──────────────┐
│  WHATSAPP    │    Webhook                   │ ZAP-BLASTER  │
│   (Meta)     │ ────────────────────────▶    │  (Node.js)   │
└──────────────┘                              └──────┬───────┘
                                                     │
                                                     │ 1. onInbound(message)
                                                     │ 2. downloadMedia()
                                                     │ 3. buildInboundPayload()
                                                     │ 4. Publica RabbitMQ
                                                     ▼
                                              ┌──────────────┐
                                              │  RABBITMQ    │
                                              │   Queue:     │
                                              │ whatsapp.    │
                                              │  incoming    │
                                              └──────┬───────┘
                                                     │
                                                     │ Consome fila
                                                     ▼
                                              ┌──────────────┐
                                              │   BACKEND    │
                                              │  (API .NET)  │
                                              └──────┬───────┘
                                                     │
                                                     │ 1. ProcessIncomingMessage()
                                                     │ 2. Salva ChatLog/Messages
                                                     │ 3. Notifica via SignalR
                                                     ▼
                                              ┌──────────────┐
                                              │   SIGNALR    │
                                              │    Hub       │
                                              └──────┬───────┘
                                                     │
                                                     │ message.inbound event
                                                     ▼
                                              ┌──────────────┐
                                              │   FRONTEND   │
                                              │   (React)    │
                                              └──────────────┘
```

---

## 🎯 PONTOS DE INTEGRAÇÃO QUE DEVEM PERMANECER

### ✅ **PRESERVAR - NÃO ALTERAR**

#### 1. **FRONTEND - UI E LÓGICA DE NEGÓCIO**
- ✅ Página de atendimento (`front/src/pages/atendimento/index.tsx`)
- ✅ Componentes de chat (`ChatListLayout`, `MediaRenderer`)
- ✅ Gerenciamento de leads (`LeadsContainer`, `LeadTrackingForm`)
- ✅ Sistema de tickets (`TicketState`, status, steps)
- ✅ Listeners SignalR (apenas estrutura, não conteúdo)
- ✅ Funções de UI: `handleAttend`, `handleStep`, `handleFinalize`
- ✅ Gravação de áudio (`startRecording`, `stopRecording`)
- ✅ Sistema de anexos e mídia
- ✅ Controle de autorização de operadores
- ✅ Cache de histórico de mensagens

#### 2. **BACKEND - LÓGICA DE NEGÓCIO**
- ✅ ChatLogs (estrutura `PayloadJson` deve permanecer)
- ✅ Sistema de Conversations
- ✅ Sistema de Agendamentos
- ✅ Sistema de Leads e alocação de operadores
- ✅ Controle de atendimentos
- ✅ Histórico de mensagens
- ✅ SignalR Hub (estrutura de eventos)

#### 3. **INTEGRAÇÕES ESSENCIAIS**
- ✅ MinIO (armazenamento de mídia)
- ✅ SignalR (comunicação tempo real)
- ✅ Sistema de autenticação de operadores
- ✅ Sistema de permissões

---

## 🔄 PONTOS QUE PRECISAM SER ALTERADOS

### 🔴 **SUBSTITUIR - MIGRAÇÃO NECESSÁRIA**

#### 1. **ZAP-BLASTER → META API CLIENT**

**Arquivo Atual:** `zap-blaster-projeto/zap.js`

##### **FUNÇÕES A SUBSTITUIR:**

| Função Atual | Responsabilidade | Substituir Por |
|--------------|------------------|----------------|
| `client.on('message')` | Receber mensagens | Meta API Webhook Handler |
| `onInbound()` | Processar msg recebida | Processar webhook da Meta |
| `client.sendMessage()` | Enviar mensagens | Meta Cloud API `/messages` |
| `downloadMedia()` | Baixar mídia WPP | Meta API `/media/{id}` download |
| `client.getState()` | Verificar conexão | Meta API health check |
| `client.on('qr')` | QR Code para auth | Meta API Business Account OAuth |
| `getConnectedNumber()` | Número conectado | Meta API `/phone_numbers` |

##### **ESTRUTURA DA META API:**

```javascript
// NOVO MÓDULO: meta-api-client.js

class MetaAPIClient {
  constructor(phoneNumberId, accessToken) {
    this.phoneNumberId = phoneNumberId; // ID do número de telefone na Meta
    this.accessToken = accessToken; // Token de acesso da Meta Business
    this.baseUrl = 'https://graph.facebook.com/v21.0';
  }
  
  // ENVIAR MENSAGEM
  async sendMessage(to, body, type = 'text', mediaId = null) {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
    
    let messagePayload;
    
    if (type === 'text') {
      messagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to, // Número do destinatário
        type: 'text',
        text: { body: body }
      };
    } else if (type === 'audio') {
      messagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'audio',
        audio: { id: mediaId } // ID da mídia uploadada
      };
    } else if (type === 'image') {
      messagePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'image',
        image: { 
          id: mediaId,
          caption: body // Caption opcional
        }
      };
    }
    // ... outros tipos
    
    const response = await axios.post(url, messagePayload, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      success: true,
      messageId: response.data.messages[0].id,
      whatsappId: response.data.messages[0].id
    };
  }
  
  // UPLOAD DE MÍDIA
  async uploadMedia(buffer, mimeType, fileName) {
    const url = `${this.baseUrl}/${this.phoneNumberId}/media`;
    
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: fileName,
      contentType: mimeType
    });
    formData.append('messaging_product', 'whatsapp');
    
    const response = await axios.post(url, formData, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        ...formData.getHeaders()
      }
    });
    
    return {
      mediaId: response.data.id,
      success: true
    };
  }
  
  // BAIXAR MÍDIA RECEBIDA
  async downloadMedia(mediaId) {
    // 1. Obter URL de download
    const urlInfo = `${this.baseUrl}/${mediaId}`;
    const infoResponse = await axios.get(urlInfo, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });
    
    const downloadUrl = infoResponse.data.url;
    
    // 2. Baixar arquivo
    const mediaResponse = await axios.get(downloadUrl, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
      responseType: 'arraybuffer'
    });
    
    return {
      buffer: Buffer.from(mediaResponse.data),
      mimeType: infoResponse.data.mime_type,
      fileName: infoResponse.data.file_name || 'media'
    };
  }
  
  // OBTER INFORMAÇÕES DO NÚMERO
  async getPhoneNumberInfo() {
    const url = `${this.baseUrl}/${this.phoneNumberId}`;
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });
    
    return {
      displayPhoneNumber: response.data.display_phone_number,
      verifiedName: response.data.verified_name,
      quality: response.data.quality_rating
    };
  }
}
```

##### **WEBHOOK HANDLER - META API:**

```javascript
// NOVO MÓDULO: meta-webhook-handler.js

class MetaWebhookHandler {
  constructor(rabbitPublisher) {
    this.rabbitPublisher = rabbitPublisher;
  }
  
  // PROCESSAR WEBHOOK DA META
  async handleWebhook(webhookPayload) {
    const entry = webhookPayload.entry[0];
    const changes = entry.changes[0];
    const value = changes.value;
    
    // Verificar se há mensagens
    if (value.messages && value.messages.length > 0) {
      const message = value.messages[0];
      
      // Construir payload no formato atual (compatível com backend)
      const inboundPayload = {
        externalMessageId: message.id,
        from: message.from,
        fromNormalized: this.normalizeNumber(message.from),
        to: value.metadata.display_phone_number,
        type: message.type,
        timestamp: new Date(message.timestamp * 1000).toISOString(),
        fromMe: false,
        isGroup: false,
        chatId: `chat_${this.normalizeNumber(message.from)}`,
        body: this.extractMessageBody(message),
        attachment: null
      };
      
      // Processar mídia se existir
      if (message.type !== 'text') {
        const mediaData = await this.processInboundMedia(message);
        if (mediaData) {
          inboundPayload.attachment = mediaData.attachment;
          if (message.type === 'audio' || message.type === 'voice') {
            inboundPayload.body = mediaData.attachment.dataUrl;
          }
        }
      }
      
      // Publicar para backend (MESMO FORMATO ATUAL)
      await this.rabbitPublisher.publish('whatsapp.incoming', inboundPayload);
    }
    
    // Processar status updates
    if (value.statuses && value.statuses.length > 0) {
      const status = value.statuses[0];
      await this.rabbitPublisher.publish('whatsapp.message-status', {
        messageId: status.id,
        status: status.status, // sent, delivered, read, failed
        timestamp: new Date(status.timestamp * 1000).toISOString()
      });
    }
  }
  
  extractMessageBody(message) {
    switch (message.type) {
      case 'text':
        return message.text.body;
      case 'image':
        return message.image.caption || '';
      case 'video':
        return message.video.caption || '';
      case 'audio':
        return ''; // Áudio não tem texto
      case 'document':
        return message.document.caption || message.document.filename || '';
      case 'location':
        return JSON.stringify({
          latitude: message.location.latitude,
          longitude: message.location.longitude,
          name: message.location.name,
          address: message.location.address
        });
      case 'contacts':
        return JSON.stringify(message.contacts);
      default:
        return '';
    }
  }
  
  async processInboundMedia(message) {
    let mediaId;
    let mimeType;
    let fileName;
    
    switch (message.type) {
      case 'image':
        mediaId = message.image.id;
        mimeType = message.image.mime_type;
        fileName = 'image.jpg';
        break;
      case 'audio':
        mediaId = message.audio.id;
        mimeType = message.audio.mime_type;
        fileName = 'audio.ogg';
        break;
      case 'video':
        mediaId = message.video.id;
        mimeType = message.video.mime_type;
        fileName = 'video.mp4';
        break;
      case 'document':
        mediaId = message.document.id;
        mimeType = message.document.mime_type;
        fileName = message.document.filename || 'document';
        break;
      default:
        return null;
    }
    
    // Baixar mídia da Meta API
    const metaApiClient = new MetaAPIClient(
      process.env.META_PHONE_NUMBER_ID,
      process.env.META_ACCESS_TOKEN
    );
    
    const mediaData = await metaApiClient.downloadMedia(mediaId);
    const base64Data = mediaData.buffer.toString('base64');
    const dataUrl = `data:${mediaData.mimeType};base64,${base64Data}`;
    
    return {
      attachment: {
        dataUrl: dataUrl,
        mimeType: mediaData.mimeType,
        fileName: mediaData.fileName || fileName,
        mediaType: message.type,
        fileSize: mediaData.buffer.length
      }
    };
  }
}
```

#### 2. **BACKEND - RABBITMQ PUBLISHER**

**Arquivo Atual:** `back/Pregiato.API/Services/RabbitBackgroundService.cs`

##### **FUNÇÕES A MODIFICAR:**

```csharp
// FUNÇÃO ATUAL: PublishCommand() - Linha 703
// SERÁ SUBSTITUÍDA POR: PublishToMetaAPI()

public async Task PublishToMetaAPI<T>(T command)
{
    // Em vez de publicar no RabbitMQ para zap-blaster,
    // enviar diretamente para Meta Cloud API
    
    if (command is SendMessageCommand sendCmd)
    {
        var metaClient = _services.GetRequiredService<IMetaAPIClient>();
        
        // 1. Se houver mídia, fazer upload primeiro
        string? mediaId = null;
        if (sendCmd.attachment != null)
        {
            // Baixar mídia do MinIO
            var mediaBuffer = await _minIOStorageAdapter.DownloadMediaAsync(
                sendCmd.attachment.mediaUrl
            );
            
            // Upload para Meta
            var uploadResult = await metaClient.UploadMediaAsync(
                mediaBuffer,
                sendCmd.attachment.mimeType,
                sendCmd.attachment.fileName
            );
            
            mediaId = uploadResult.MediaId;
        }
        
        // 2. Enviar mensagem via Meta API
        var result = await metaClient.SendMessageAsync(
            to: sendCmd.phone,
            body: sendCmd.body,
            type: sendCmd.type,
            mediaId: mediaId
        );
        
        // 3. Atualizar status no banco
        await UpdateMessageStatus(
            sendCmd.clientMessageId,
            result.MessageId,
            "sent"
        );
        
        // 4. Notificar frontend via SignalR
        await _hubContext.Clients.Group("whatsapp").SendAsync("message.status", new {
            chatId = sendCmd.chatId,
            messageId = sendCmd.clientMessageId,
            whatsappMessageId = result.MessageId,
            status = "sent"
        });
    }
}
```

#### 3. **NOVO SERVIÇO - META API CLIENT (C#)**

**Novo Arquivo:** `back/Pregiato.Infrastructure/Adapters/MetaAPIAdapter.cs`

```csharp
public interface IMetaAPIClient
{
    Task<SendMessageResult> SendMessageAsync(string to, string body, string type, string? mediaId = null);
    Task<UploadMediaResult> UploadMediaAsync(byte[] buffer, string mimeType, string fileName);
    Task<DownloadMediaResult> DownloadMediaAsync(string mediaId);
    Task<PhoneNumberInfo> GetPhoneNumberInfoAsync();
}

public class MetaAPIAdapter : IMetaAPIClient
{
    private readonly string _phoneNumberId;
    private readonly string _accessToken;
    private readonly HttpClient _httpClient;
    private readonly ILogger<MetaAPIAdapter> _logger;
    private const string BaseUrl = "https://graph.facebook.com/v21.0";
    
    public MetaAPIAdapter(IConfiguration config, ILogger<MetaAPIAdapter> logger)
    {
        _phoneNumberId = config["Meta:PhoneNumberId"];
        _accessToken = config["Meta:AccessToken"];
        _logger = logger;
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_accessToken}");
    }
    
    public async Task<SendMessageResult> SendMessageAsync(
        string to, 
        string body, 
        string type, 
        string? mediaId = null)
    {
        var url = $"{BaseUrl}/{_phoneNumberId}/messages";
        
        object messagePayload;
        
        switch (type.ToLower())
        {
            case "text":
                messagePayload = new {
                    messaging_product = "whatsapp",
                    recipient_type = "individual",
                    to = to,
                    type = "text",
                    text = new { body = body }
                };
                break;
                
            case "audio":
            case "voice":
                messagePayload = new {
                    messaging_product = "whatsapp",
                    recipient_type = "individual",
                    to = to,
                    type = "audio",
                    audio = new { id = mediaId }
                };
                break;
                
            case "image":
                messagePayload = new {
                    messaging_product = "whatsapp",
                    recipient_type = "individual",
                    to = to,
                    type = "image",
                    image = new { 
                        id = mediaId,
                        caption = body
                    }
                };
                break;
                
            // ... outros tipos
                
            default:
                throw new NotSupportedException($"Tipo de mensagem não suportado: {type}");
        }
        
        var response = await _httpClient.PostAsJsonAsync(url, messagePayload);
        var result = await response.Content.ReadFromJsonAsync<MetaMessageResponse>();
        
        return new SendMessageResult {
            Success = true,
            MessageId = result.Messages[0].Id
        };
    }
    
    public async Task<UploadMediaResult> UploadMediaAsync(
        byte[] buffer, 
        string mimeType, 
        string fileName)
    {
        var url = $"{BaseUrl}/{_phoneNumberId}/media";
        
        using var form = new MultipartFormDataContent();
        form.Add(new StringContent("whatsapp"), "messaging_product");
        form.Add(new ByteArrayContent(buffer), "file", fileName);
        
        var response = await _httpClient.PostAsync(url, form);
        var result = await response.Content.ReadFromJsonAsync<MetaMediaUploadResponse>();
        
        return new UploadMediaResult {
            MediaId = result.Id,
            Success = true
        };
    }
    
    public async Task<DownloadMediaResult> DownloadMediaAsync(string mediaId)
    {
        // 1. Obter informações da mídia
        var infoUrl = $"{BaseUrl}/{mediaId}";
        var infoResponse = await _httpClient.GetAsync(infoUrl);
        var info = await infoResponse.Content.ReadFromJsonAsync<MetaMediaInfo>();
        
        // 2. Baixar arquivo
        var downloadResponse = await _httpClient.GetAsync(info.Url);
        var buffer = await downloadResponse.Content.ReadAsByteArrayAsync();
        
        return new DownloadMediaResult {
            Buffer = buffer,
            MimeType = info.MimeType,
            FileName = info.FileName ?? "media",
            FileSize = buffer.Length
        };
    }
    
    public async Task<PhoneNumberInfo> GetPhoneNumberInfoAsync()
    {
        var url = $"{BaseUrl}/{_phoneNumberId}";
        var response = await _httpClient.GetAsync(url);
        var info = await response.Content.ReadFromJsonAsync<MetaPhoneNumberInfo>();
        
        return new PhoneNumberInfo {
            DisplayPhoneNumber = info.DisplayPhoneNumber,
            VerifiedName = info.VerifiedName,
            QualityRating = info.QualityRating
        };
    }
}
```

#### 4. **WEBHOOK ENDPOINT - META API**

**Novo Arquivo:** `back/Pregiato.API/Controllers/MetaWebhookController.cs`

```csharp
[ApiController]
[Route("api/webhooks/meta")]
public class MetaWebhookController : ControllerBase
{
    private readonly IMetaWebhookProcessor _webhookProcessor;
    private readonly ILogger<MetaWebhookController> _logger;
    private readonly IConfiguration _config;
    
    public MetaWebhookController(
        IMetaWebhookProcessor webhookProcessor,
        ILogger<MetaWebhookController> logger,
        IConfiguration config)
    {
        _webhookProcessor = webhookProcessor;
        _logger = logger;
        _config = config;
    }
    
    // VERIFICAÇÃO DO WEBHOOK (Meta envia GET para verificar)
    [HttpGet]
    public IActionResult VerifyWebhook(
        [FromQuery(Name = "hub.mode")] string mode,
        [FromQuery(Name = "hub.verify_token")] string verifyToken,
        [FromQuery(Name = "hub.challenge")] string challenge)
    {
        var expectedToken = _config["Meta:WebhookVerifyToken"];
        
        if (mode == "subscribe" && verifyToken == expectedToken)
        {
            _logger.LogInformation("✅ Webhook verificado com sucesso");
            return Ok(challenge);
        }
        
        _logger.LogWarning("❌ Falha na verificação do webhook");
        return Unauthorized();
    }
    
    // RECEBIMENTO DE MENSAGENS (Meta envia POST)
    [HttpPost]
    public async Task<IActionResult> ReceiveWebhook([FromBody] MetaWebhookPayload payload)
    {
        try
        {
            _logger.LogInformation("📨 Webhook recebido da Meta API");
            
            // Processar webhook de forma assíncrona
            _ = Task.Run(async () => {
                await _webhookProcessor.ProcessWebhookAsync(payload);
            });
            
            // Responder imediatamente (Meta exige resposta rápida)
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro ao processar webhook da Meta");
            return Ok(); // Sempre retornar 200 para não reenviar webhook
        }
    }
}
```

**Novo Serviço:** `back/Pregiato.Application/Services/MetaWebhookProcessor.cs`

```csharp
public class MetaWebhookProcessor : IMetaWebhookProcessor
{
    private readonly IHubContext<WhatsAppHub> _hubContext;
    private readonly PregiatoDbContext _db;
    private readonly IMetaAPIClient _metaClient;
    private readonly ILogger<MetaWebhookProcessor> _logger;
    
    public async Task ProcessWebhookAsync(MetaWebhookPayload payload)
    {
        foreach (var entry in payload.Entry)
        {
            foreach (var change in entry.Changes)
            {
                var value = change.Value;
                
                // PROCESSAR MENSAGENS RECEBIDAS
                if (value.Messages != null)
                {
                    foreach (var message in value.Messages)
                    {
                        await ProcessInboundMessage(message, value.Metadata);
                    }
                }
                
                // PROCESSAR ATUALIZAÇÕES DE STATUS
                if (value.Statuses != null)
                {
                    foreach (var status in value.Statuses)
                    {
                        await ProcessMessageStatus(status);
                    }
                }
            }
        }
    }
    
    private async Task ProcessInboundMessage(MetaMessage message, MetaMetadata metadata)
    {
        // Converter mensagem Meta para formato atual (WhatsAppMessage)
        var whatsappMessage = new WhatsAppMessage
        {
            externalMessageId = message.Id,
            from = message.From,
            fromNormalized = NormalizePhoneNumber(message.From),
            to = metadata.DisplayPhoneNumber,
            type = MapMetaTypeToInternal(message.Type),
            timestamp = DateTimeOffset.FromUnixTimeSeconds(message.Timestamp).UtcDateTime.ToString("O"),
            fromMe = false,
            isGroup = false,
            body = ExtractMessageBody(message),
            attachment = null
        };
        
        // Processar mídia se existir
        if (message.Type != "text")
        {
            var mediaData = await DownloadAndProcessMedia(message);
            if (mediaData != null)
            {
                whatsappMessage.attachment = new WhatsAppAttachment
                {
                    dataUrl = mediaData.DataUrl,
                    mimeType = mediaData.MimeType,
                    fileName = mediaData.FileName,
                    mediaType = message.Type,
                    fileSize = mediaData.FileSize
                };
                
                // Para áudio: base64 no body
                if (message.Type == "audio" || message.Type == "voice")
                {
                    whatsappMessage.body = mediaData.DataUrl;
                }
            }
        }
        
        // REUTILIZAR LÓGICA EXISTENTE - ProcessIncomingMessage()
        // (Mesma função que processa RabbitMQ atualmente)
        var conversationId = await ProcessIncomingMessage(whatsappMessage);
        
        // Buscar ChatLog
        var chatLog = await _db.ChatLogs
            .Where(c => c.ContactPhoneE164 == whatsappMessage.fromNormalized)
            .FirstOrDefaultAsync();
        
        string realChatId = chatLog?.ChatId.ToString() ?? $"chat_{whatsappMessage.fromNormalized}";
        
        // NOTIFICAR FRONTEND VIA SIGNALR (MESMO FORMATO ATUAL)
        await _hubContext.Clients.Group("whatsapp").SendAsync("message.inbound", new {
            chatId = realChatId,
            fromNormalized = whatsappMessage.fromNormalized,
            message = new {
                id = whatsappMessage.externalMessageId,
                from = whatsappMessage.from,
                fromMe = false,
                body = whatsappMessage.body,
                type = whatsappMessage.type,
                attachment = whatsappMessage.attachment
            }
        });
    }
    
    private string MapMetaTypeToInternal(string metaType)
    {
        return metaType switch
        {
            "text" => "text",
            "image" => "image",
            "audio" => "audio",
            "video" => "video",
            "document" => "document",
            "voice" => "voice",
            "sticker" => "sticker",
            "location" => "location",
            "contacts" => "contact",
            _ => "text"
        };
    }
}
```

---

## 📋 CHECKLIST DE MIGRAÇÃO

### ✅ **FASE 1: PREPARAÇÃO (SEM QUEBRAR SISTEMA ATUAL)**

- [ ] Criar `IMetaAPIClient` interface
- [ ] Implementar `MetaAPIAdapter` 
- [ ] Criar `MetaWebhookController`
- [ ] Implementar `MetaWebhookProcessor`
- [ ] Adicionar variáveis de ambiente Meta API
  - `META_PHONE_NUMBER_ID`
  - `META_ACCESS_TOKEN`
  - `META_WEBHOOK_VERIFY_TOKEN`
  - `META_API_VERSION` (v21.0)
- [ ] Configurar webhook na Meta Business Manager
- [ ] Testar recebimento de webhooks (mensagens de teste)

### ✅ **FASE 2: DUAL MODE (FUNCIONAM OS DOIS)**

- [ ] Adicionar flag `USE_META_API` no appsettings
- [ ] Modificar `ChatsController.Send()` para suportar dual mode:
  ```csharp
  if (_config.GetValue<bool>("WhatsApp:UseMetaAPI"))
  {
      await _metaAPIClient.SendMessageAsync(...);
  }
  else
  {
      await _rabbit.PublishAsync("whatsapp.outgoing", cmd);
  }
  ```
- [ ] Modificar recebimento para dual mode:
  - RabbitMQ consumer continua ativo
  - Webhook Meta também ativo
  - Ambos chamam a mesma função `ProcessIncomingMessage()`
- [ ] Testar ambos os fluxos simultaneamente
- [ ] Validar que não há duplicação de mensagens
- [ ] Validar que frontend funciona com ambas as fontes

### ✅ **FASE 3: MIGRAÇÃO COMPLETA**

- [ ] Desativar `USE_META_API = false`
- [ ] Remover código do zap-blaster (ou manter como backup)
- [ ] Remover consumidores RabbitMQ de whatsapp.outgoing
- [ ] Manter RabbitMQ apenas para processamento interno (se necessário)
- [ ] Atualizar documentação
- [ ] Treinar equipe nas diferenças

### ✅ **FASE 4: OTIMIZAÇÃO META API**

- [ ] Implementar rate limiting da Meta
- [ ] Implementar retry strategy específica da Meta
- [ ] Implementar cache de media IDs
- [ ] Implementar monitoramento de quotas Meta
- [ ] Implementar fallback para diferentes tipos de erro
- [ ] Otimizar conversão de formatos de mídia

---

## 🔑 PONTOS CRÍTICOS DE COMPATIBILIDADE

### 1. **FORMATO DE PAYLOAD - DEVE PERMANECER IGUAL**

O backend já espera este formato em `ProcessIncomingMessage()`:

```csharp
public class WhatsAppMessage
{
    public string externalMessageId { get; set; }
    public string from { get; set; }
    public string fromNormalized { get; set; }
    public string to { get; set; }
    public string type { get; set; }
    public string timestamp { get; set; }
    public bool fromMe { get; set; }
    public bool isGroup { get; set; }
    public string chatId { get; set; }
    public string body { get; set; }
    public WhatsAppAttachment? attachment { get; set; }
}
```

**✅ AÇÃO:** O `MetaWebhookProcessor` deve CONVERTER webhooks da Meta para este formato exato.

### 2. **SIGNALR EVENTS - DEVEM PERMANECER IGUAIS**

Frontend espera estes eventos exatos:

```typescript
// NÃO ALTERAR
connection.on('message.inbound', (evt) => { ... });
connection.on('message.outbound', (evt) => { ... });
connection.on('message.status', (evt) => { ... });
connection.on('chat.updated', (evt) => { ... });
connection.on('chat.created', (evt) => { ... });
```

**✅ AÇÃO:** Meta API deve emitir os mesmos eventos SignalR que o zap-blaster emite atualmente.

### 3. **ESTRUTURA DE ATTACHMENT - DEVE PERMANECER IGUAL**

```typescript
// NÃO ALTERAR
attachment: {
  dataUrl: string;      // "data:audio/mpeg;base64,..."
  mimeType: string;     // "audio/mpeg"
  fileName: string;     // "audio.mp3"
  mediaType: string;    // "audio"
  fileSize: number;     // tamanho em bytes
}
```

**✅ AÇÃO:** Converter mídia da Meta para base64 Data URL (ou manter URLs do MinIO).

### 4. **TIPOS DE MENSAGEM - MAPEAMENTO**

| Frontend/Backend | Meta API | Ação Necessária |
|------------------|----------|-----------------|
| `text` | `text` | ✅ Direto |
| `image` | `image` | ✅ Direto |
| `audio` | `audio` | ⚠️ Verificar formato Opus |
| `voice` | `audio` | ⚠️ Converter para `audio` |
| `video` | `video` | ✅ Direto |
| `document` | `document` | ✅ Direto |
| `sticker` | `sticker` | ✅ Direto |
| `location` | `location` | ⚠️ Converter estrutura |
| `contact` | `contacts` | ⚠️ Converter estrutura (plural) |

### 5. **STATUS DE MENSAGEM - MAPEAMENTO**

| Sistema Atual | Meta API | Conversão |
|---------------|----------|-----------|
| `pending` | - | Status local apenas |
| `sent` | `sent` | ✅ Direto |
| `delivered` | `delivered` | ✅ Direto |
| `read` | `read` | ✅ Direto |
| `failed` | `failed` | ✅ Direto |

---

## 🏗️ ARQUITETURA PROPOSTA - APÓS MIGRAÇÃO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     NOVA ARQUITETURA COM META API                            │
└─────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║                         ENVIO DE MENSAGEM                                 ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌──────────────┐     POST /chats/{id}/send    ┌──────────────┐
│   FRONTEND   │ ──────────────────────────▶  │   BACKEND    │
│ (React)      │      (MESMA CHAMADA)         │ (API .NET)   │
└──────────────┘                              └──────┬───────┘
                                                     │
                                                     │ 1. Salva ChatLog.PayloadJson ✅
                                                     │ 2. Upload mídia MinIO ✅
                                                     │ 3. Upload mídia Meta API 🆕
                                                     │ 4. Envia via Meta API 🆕
                                                     ▼
                                              ┌──────────────┐
                                              │  META CLOUD  │
                                              │     API      │
                                              │ /messages    │
                                              └──────┬───────┘
                                                     │
                                                     │ Envia via WhatsApp
                                                     ▼
                                              ┌──────────────┐
                                              │  WHATSAPP    │
                                              │  Destinatário│
                                              └──────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║                      RECEBIMENTO DE MENSAGEM                              ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌──────────────┐                              ┌──────────────┐
│  WHATSAPP    │    Webhook                   │  META CLOUD  │
│  Remetente   │ ────────────────────────▶    │     API      │
└──────────────┘                              └──────┬───────┘
                                                     │
                                                     │ POST Webhook
                                                     ▼
                                              ┌──────────────┐
                                              │   BACKEND    │
                                              │/api/webhooks/│
                                              │    meta      │ 🆕
                                              └──────┬───────┘
                                                     │
                                                     │ 1. Download mídia Meta 🆕
                                                     │ 2. ProcessIncomingMessage() ✅
                                                     │ 3. Salva ChatLog/Messages ✅
                                                     │ 4. Notifica SignalR ✅
                                                     ▼
                                              ┌──────────────┐
                                              │   SIGNALR    │
                                              │     Hub      │
                                              └──────┬───────┘
                                                     │
                                                     │ message.inbound event ✅
                                                     ▼
                                              ┌──────────────┐
                                              │   FRONTEND   │
                                              │   (React)    │
                                              └──────────────┘
```

---

## 🎨 COMPONENTES QUE NÃO MUDAM (PRESERVAR)

### ✅ **FRONTEND - ZERO ALTERAÇÕES**

1. **UI Components:**
   - ✅ `front/src/pages/atendimento/index.tsx` - Página principal
   - ✅ `front/src/components/chat/ChatListLayout.tsx` - Lista de chats
   - ✅ `front/src/components/whatsapp/MediaRenderer.tsx` - Renderização de mídia
   - ✅ `front/src/components/attendance/LeadsContainer.tsx` - Container de leads
   - ✅ `front/src/components/attendance/LeadTrackingForm.tsx` - Formulário de tracking

2. **Business Logic:**
   - ✅ Sistema de tickets (status, steps)
   - ✅ Gravação de áudio
   - ✅ Sistema de anexos
   - ✅ Autorização de operadores
   - ✅ Filtros de segurança por operador

3. **Service Layer:**
   - ✅ `front/src/services/chat-service.ts` - Interface permanece igual
   - ✅ Listeners SignalR permanecem iguais
   - ✅ Funções de conversão de tipos

### ✅ **BACKEND - LÓGICA DE NEGÓCIO PRESERVADA**

1. **Database Layer:**
   - ✅ `ChatLogs` table (estrutura `PayloadJson` preservada)
   - ✅ `Conversations` table
   - ✅ `Messages` table
   - ✅ `Leads` table e alocação de operadores
   - ✅ `Attendances` table

2. **Services:**
   - ✅ `ChatLogService` - Serialização/Deserialização PayloadJson
   - ✅ `ConversationService` - Gerenciamento de conversas
   - ✅ `MinIOStorageAdapter` - Armazenamento de mídia
   - ✅ `EmojiResilienceService` - Processamento de emojis

3. **Business Logic:**
   - ✅ `ProcessIncomingMessage()` - Processamento de mensagens inbound
   - ✅ `CreateRobustMessageEntity()` - Criação de entidades
   - ✅ Sistema de batch processing de mensagens
   - ✅ Sistema de detecção de duplicatas

4. **SignalR:**
   - ✅ `WhatsAppHub` - Hub permanece igual
   - ✅ Eventos emitidos permanecem iguais
   - ✅ Estrutura de grupos

---

## 🔧 COMPONENTES QUE MUDAM (SUBSTITUIR)

### 🔴 **A SER SUBSTITUÍDO**

#### 1. **ZAP-BLASTER (Node.js) → META API CLIENT (C#)**

| Componente Atual | Novo Componente | Localização |
|------------------|-----------------|-------------|
| `zap-blaster-projeto/zap.js` | `MetaAPIAdapter.cs` | `back/Pregiato.Infrastructure/Adapters/` |
| `client.sendMessage()` | `metaClient.SendMessageAsync()` | Método do adapter |
| `client.on('message')` | `MetaWebhookController` | `back/Pregiato.API/Controllers/` |
| `onInbound()` | `MetaWebhookProcessor.ProcessInboundMessage()` | `back/Pregiato.Application/Services/` |
| `downloadMedia()` | `metaClient.DownloadMediaAsync()` | Método do adapter |
| `sendOne()` | `metaClient.SendMessageAsync()` | Método do adapter |

#### 2. **RABBITMQ OUTGOING → DIRECT META API CALL**

**Antes:**
```
Backend → RabbitMQ (whatsapp.outgoing) → Zap-Blaster → WhatsApp Web
```

**Depois:**
```
Backend → Meta API Client → Meta Cloud API → WhatsApp
```

**Arquivo:** `back/Pregiato.API/Controllers/ChatsController.cs`

**Mudança:**
```csharp
// ANTES (Linha 602)
await _rabbit.PublishAsync("whatsapp.outgoing", cmd);

// DEPOIS
if (_config.GetValue<bool>("WhatsApp:UseMetaAPI"))
{
    var metaClient = _services.GetRequiredService<IMetaAPIClient>();
    
    // Upload mídia se necessário
    string? mediaId = null;
    if (isMediaMessage && attachment != null)
    {
        var mediaBuffer = await _minIOStorageAdapter.DownloadMediaAsync(attachment.DataUrl);
        var uploadResult = await metaClient.UploadMediaAsync(
            mediaBuffer, 
            attachment.MimeType, 
            attachment.FileName
        );
        mediaId = uploadResult.MediaId;
    }
    
    // Enviar via Meta API
    var result = await metaClient.SendMessageAsync(
        to: toNormalized,
        body: isMediaMessage ? null : messageBody,
        type: message.Type,
        mediaId: mediaId
    );
    
    // Atualizar ChatLog com WhatsApp Message ID
    // (Para tracking de status via webhooks)
}
else
{
    // Fluxo antigo via RabbitMQ
    await _rabbit.PublishAsync("whatsapp.outgoing", cmd);
}
```

#### 3. **RABBITMQ INCOMING → META WEBHOOK**

**Antes:**
```
WhatsApp → Zap-Blaster → RabbitMQ (whatsapp.incoming) → Backend → SignalR → Frontend
```

**Depois:**
```
WhatsApp → Meta Cloud API → Webhook → Backend → SignalR → Frontend
```

**Mudança:**
- ✅ Criar endpoint `/api/webhooks/meta` (GET e POST)
- ✅ Implementar `MetaWebhookProcessor`
- ✅ Reutilizar `ProcessIncomingMessage()` existente
- ✅ Manter emissão dos mesmos eventos SignalR

---

## 📊 COMPARAÇÃO DE FEATURES

| Feature | Zap-Blaster (Web.js) | Meta Cloud API | Compatibilidade |
|---------|----------------------|----------------|-----------------|
| Enviar texto | ✅ `client.sendMessage(chat, text)` | ✅ POST `/messages` | ✅ 100% |
| Enviar imagem | ✅ `MessageMedia` | ✅ Upload + envio | ✅ 100% |
| Enviar áudio | ✅ `MessageMedia` (Opus/OGG) | ✅ Upload + envio | ⚠️ Verificar formato |
| Enviar vídeo | ✅ `MessageMedia` | ✅ Upload + envio | ✅ 100% |
| Enviar documento | ✅ `MessageMedia` | ✅ Upload + envio | ✅ 100% |
| Receber texto | ✅ `client.on('message')` | ✅ Webhook | ✅ 100% |
| Receber mídia | ✅ `downloadMedia()` | ✅ Webhook + download | ✅ 100% |
| Status delivery | ✅ Via eventos | ✅ Webhook `statuses` | ✅ 100% |
| Typing indicator | ✅ Via eventos | ❌ Não suportado | ⚠️ Remover feature |
| Presença (online) | ✅ Via eventos | ❌ Não suportado | ⚠️ Remover feature |
| Grupos | ✅ Suportado | ✅ Suportado | ✅ 100% |
| QR Code auth | ✅ Sim | ❌ Usa OAuth | 🔴 Fluxo totalmente diferente |

---

## ⚠️ LIMITAÇÕES DA META API

### 🔴 **FEATURES QUE SERÃO PERDIDAS**

1. **Typing Indicator (digitando...)**
   - ❌ Meta API não envia quando usuário está digitando
   - **Solução:** Remover indicador de "digitando..." do frontend

2. **Presença Online/Offline**
   - ❌ Meta API não informa se usuário está online
   - **Solução:** Remover indicadores de presença

3. **QR Code Authentication**
   - ❌ Meta API usa OAuth via Business Manager
   - **Solução:** Implementar fluxo de OAuth + configuração manual

4. **Multiple Sessions Simultâneas**
   - ❌ Zap-blaster permite múltiplas sessões
   - ✅ Meta API permite múltiplos números via Business Account
   - **Solução:** Configurar múltiplos phone_number_ids na Meta

### ⚠️ **RESTRIÇÕES DA META API**

1. **Rate Limits:**
   - 80 mensagens/segundo (tier 1)
   - 1000 mensagens/dia (tier 1, grátis)
   - **Solução:** Implementar rate limiting no backend

2. **Formatos de Mídia:**
   - Áudio: máx 16MB, formatos específicos
   - Imagem: máx 5MB, JPG/PNG
   - Vídeo: máx 16MB, MP4/3GPP
   - **Solução:** Validar e converter formatos no backend

3. **Message Templates:**
   - Mensagens iniciadas pelo negócio precisam usar templates aprovados
   - Após 24h sem resposta do cliente, precisa template
   - **Solução:** Implementar sistema de templates

---

## 🚀 PLANO DE IMPLEMENTAÇÃO DETALHADO

### **SEMANA 1: INFRAESTRUTURA**

#### Dia 1-2: Configuração Meta API
- [ ] Criar Meta Business Account
- [ ] Configurar WhatsApp Business API
- [ ] Obter Phone Number ID
- [ ] Gerar Access Token (permanente)
- [ ] Configurar webhook na Meta
- [ ] Testar webhook com ferramenta da Meta

#### Dia 3-4: Implementar Adapters
- [ ] Criar `IMetaAPIClient` interface
- [ ] Implementar `MetaAPIAdapter`
- [ ] Criar testes unitários
- [ ] Criar `MetaWebhookController`
- [ ] Criar `MetaWebhookProcessor`

#### Dia 5: Configuração Ambiente
- [ ] Adicionar variáveis ambiente (.env, appsettings)
- [ ] Configurar DI (Dependency Injection)
- [ ] Testar envio de mensagem teste
- [ ] Testar recebimento de webhook

### **SEMANA 2: DUAL MODE**

#### Dia 1-2: Implementar Flag de Feature
- [ ] Adicionar `WhatsApp:UseMetaAPI` config
- [ ] Modificar `ChatsController.Send()` para dual mode
- [ ] Modificar processamento inbound para dual mode
- [ ] Garantir que não há duplicação

#### Dia 3-4: Testes Integrados
- [ ] Testar envio texto (ambos modos)
- [ ] Testar envio imagem (ambos modos)
- [ ] Testar envio áudio (ambos modos)
- [ ] Testar envio documento (ambos modos)
- [ ] Testar recebimento (ambos modos)
- [ ] Validar status updates (ambos modos)

#### Dia 5: Validação com Usuários
- [ ] Teste com operadores reais
- [ ] Validar que frontend funciona igual
- [ ] Validar histórico de mensagens
- [ ] Validar leads e agendamentos
- [ ] Validar sistema de tickets

### **SEMANA 3: MIGRAÇÃO**

#### Dia 1: Preparação
- [ ] Backup completo do banco de dados
- [ ] Documentar configuração atual
- [ ] Preparar rollback plan

#### Dia 2-3: Ativação Meta API
- [ ] Ativar `UseMetaAPI = true`
- [ ] Monitorar logs intensivamente
- [ ] Validar todas as features
- [ ] Corrigir bugs emergentes

#### Dia 4-5: Otimização
- [ ] Implementar rate limiting
- [ ] Implementar cache de media IDs
- [ ] Otimizar processamento de webhooks
- [ ] Implementar retry strategy Meta-specific

### **SEMANA 4: DESATIVAÇÃO ZAP-BLASTER**

#### Dia 1-2: Limpeza
- [ ] Desativar consumidores RabbitMQ antigos
- [ ] Manter zap-blaster como backup (não excluir)
- [ ] Atualizar documentação

#### Dia 3-4: Monitoramento
- [ ] Monitorar métricas de entrega
- [ ] Monitorar latência de mensagens
- [ ] Validar qualidade com Meta
- [ ] Ajustar configurações baseado em métricas

#### Dia 5: Fechamento
- [ ] Documentação final
- [ ] Treinamento da equipe
- [ ] Celebração 🎉

---

## 🔐 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

### **Meta API Configuration**

```env
# Meta Business API
META_PHONE_NUMBER_ID=123456789012345
META_BUSINESS_ACCOUNT_ID=987654321098765
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
META_WEBHOOK_VERIFY_TOKEN=meu_token_secreto_verificacao_12345
META_API_VERSION=v21.0
META_APP_ID=123456789012345
META_APP_SECRET=abcdef1234567890abcdef1234567890

# Configuração de Feature Flag
WHATSAPP_USE_META_API=true

# Webhook URL (para configurar na Meta)
# https://seu-dominio.com/api/webhooks/meta
```

### **Manter Configurações Existentes:**

```env
# Banco de Dados ✅
DATABASE_CONNECTION=...

# MinIO ✅
MINIO_ENDPOINT=...
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...

# RabbitMQ ✅ (manter para processamento interno)
RABBITMQ_HOST=...
RABBITMQ_USER=...
RABBITMQ_PASS=...

# SignalR ✅
SIGNALR_URL=...
```

---

## 📝 RESUMO EXECUTIVO

### **O QUE MUDA:**

1. 🔴 **Zap-Blaster (whatsapp-web.js)** → **Meta Cloud API**
2. 🔴 **RabbitMQ whatsapp.outgoing** → **Direct Meta API calls**
3. 🔴 **client.on('message')** → **Meta Webhooks**
4. 🔴 **QR Code auth** → **OAuth Business Manager**

### **O QUE NÃO MUDA:**

1. ✅ **Frontend completo** - Zero alterações
2. ✅ **SignalR events** - Mesmos eventos
3. ✅ **ChatLogs/PayloadJson** - Mesma estrutura
4. ✅ **Leads/Agendamentos** - Mesma lógica
5. ✅ **Sistema de tickets** - Mesma lógica
6. ✅ **MinIO storage** - Permanece
7. ✅ **Autorização operadores** - Permanece

### **BENEFÍCIOS DA MIGRAÇÃO:**

1. ✅ **Estabilidade:** Sem dependência de web scraping
2. ✅ **Escalabilidade:** Suporta mais mensagens
3. ✅ **Compliance:** API oficial da Meta
4. ✅ **Recursos:** Acesso a features exclusivas (templates, flows)
5. ✅ **Suporte:** Suporte oficial da Meta
6. ✅ **Performance:** Latência menor

### **DESAFIOS:**

1. ⚠️ **Custo:** Meta API pode ter custos após tier gratuito
2. ⚠️ **Configuração:** Processo de setup mais complexo
3. ⚠️ **Limitações:** Menos features que web.js (sem typing, presença)
4. ⚠️ **Templates:** Mensagens proativas precisam templates aprovados

---

## 🎯 CONCLUSÃO

A migração para Meta API é **totalmente viável** mantendo **100% da lógica de negócio** do frontend e backend. 

**Estratégia recomendada:**
1. ✅ Implementar em **dual mode** primeiro
2. ✅ Validar **100% das funcionalidades**
3. ✅ Migrar **gradualmente** (por operador ou por horário)
4. ✅ Manter **zap-blaster como fallback** por 30 dias
5. ✅ **Monitorar** intensivamente nas primeiras 2 semanas

**Impacto no usuário final:** 
- ✅ **ZERO** - Interface permanece idêntica
- ✅ **MELHOR** - Mensagens mais rápidas e confiáveis
- ⚠️ **DIFERENÇA** - Sem indicador "digitando..." (mas isso é aceitável)

---

## 📚 REFERÊNCIAS

- [Meta Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Webhooks Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Media Upload](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media)
- [Message Types](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages)
- [Rate Limits](https://developers.facebook.com/docs/whatsapp/cloud-api/overview#throughput)

---

**Documento gerado em:** 2025-10-17  
**Versão:** 1.0  
**Autor:** Análise Técnica - Migração Meta API

