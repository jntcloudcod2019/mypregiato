# RELATÓRIO TÉCNICO: FLUXO DE ENVIO DE MENSAGENS DE ÁUDIO

## **1. ANÁLISE DO PROBLEMA**

**Objetivo**: Mapear e analisar o fluxo completo de envio de mensagens de áudio desde o frontend até o WhatsApp, incluindo:
- Processamento no frontend
- Armazenamento na API
- Publicação na fila RabbitMQ
- Processamento no zap bot
- Envio para WhatsApp

## **2. ARQUITETURA GERAL**

```
Frontend (React) → API (.NET) → RabbitMQ → Zap Bot (Node.js) → WhatsApp
```

## **3. FLUXO DETALHADO POR COMPONENTE**

### **3.1 FRONTEND - Página de Atendimento**

#### **3.1.1 Função `sendAudio` (Linha 632-661)**
```typescript
const sendAudio = async (dataUrl: string, mimeType: string, fileName = 'gravacao.webm') => {
  // 1. VALIDAÇÃO
  if (!selectedChatId) return;
  
  // 2. CRIAÇÃO DE ID ÚNICO
  const clientMessageId = crypto.randomUUID();
  
  // 3. CRIAÇÃO DE MENSAGEM OTIMISTA
  const optimistic: ChatMessageDto = {
    id: clientMessageId,
    direction: MessageDirection.Out,
    text: '', // VAZIO para áudio
    status: 'pending',
    ts: new Date().toISOString(),
    type: 'audio',
    attachment: { dataUrl, mimeType, fileName }
  };
  
  // 4. ATUALIZAÇÃO DA UI (OTIMISTA)
  setMessages(prev => [...prev, optimistic]);
  
  // 5. ENVIO PARA API
  const leadName = activeChat?.title || '';
  const phoneNumber = activeChat?.contactPhoneE164 || '';
  await chatsApi.send(phoneNumber, '', clientMessageId, leadName, { 
    dataUrl, mimeType, fileName, mediaType: 'audio' 
  });
}
```

#### **3.1.2 Função `sendMessage` (Linha 595-630)**
```typescript
const sendMessage = async (file?: File) => {
  // 1. VALIDAÇÃO
  if (!selectedChatId || (!composer.trim() && !file)) return;
  
  // 2. PROCESSAMENTO DE ARQUIVO
  if (file) {
    const isAudio = (file.type || '').startsWith('audio/');
    const { dataUrl, mimeType } = await readFileAsDataUrl(file);
    const mediaType = isAudio ? 'audio' : 'image';
    
    attachment = { dataUrl, mimeType, fileName: file.name, mediaType };
  }
  
  // 3. ENVIO PARA API
  await chatsApi.send(phoneNumber, text, clientMessageId, leadName, attachment);
}
```

#### **3.1.3 Função `readFileAsDataUrl`**
- Converte arquivo para base64
- Formato: `data:audio/webm;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEA...`

### **3.2 FRONTEND - Serviço de Chat API**

#### **3.2.1 Função `chatsApi.send` (Linha 525-587)**
```typescript
send: async (id: string, text: string, clientMessageId: string, leadName?: string, attachment?: {...}) => {
  // 1. VALIDAÇÃO E NORMALIZAÇÃO
  let normalizedAttachment = attachment;
  if (attachment) {
    // Validar tipo de mídia
    if (!MediaTypeMapper.isValid(attachment.mediaType || 'text')) {
      attachment.mediaType = 'text';
    }
    
    // Normalizar MIME type
    if (!attachment.mimeType) {
      attachment.mimeType = MediaTypeMapper.getDefaultMimeType(attachment.mediaType || 'text');
    }
  }
  
  // 2. CRIAÇÃO DO PAYLOAD
  const request = {
    Contact: {
      Name: leadName || `Cliente ${id}`,
      PhoneE164: id,
      ProfilePic: null
    },
    Messages: [{
      Id: clientMessageId,
      Content: null,
      body: normalizedAttachment?.dataUrl || text, // BASE64 para mídia
      MediaUrl: null,
      Direction: "outbound",
      Ts: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      IsRead: false,
      Status: "pending",
      Type: normalizedAttachment?.mediaType || "text",
      from: "operator@frontend",
      mimeType: normalizedAttachment?.mimeType || null,
      fileName: normalizedAttachment?.fileName || null,
      // ... outros campos
    }]
  };
  
  // 3. ENVIO PARA API
  const { data } = await api.post(`/chats/${id}/send`, request);
  return data;
}
```

### **3.3 API - ChatsController**

#### **3.3.1 Endpoint `Send` (Linha 240-385)**
```csharp
[HttpPost("{id}/send")]
public async Task<IActionResult> Send(string id, [FromBody] ChatLogService.ChatPayload req)
{
  // 1. BUSCA DO CHAT
  var chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.Id == Guid.Parse(id));
  if (chat == null) {
    chat = await _db.ChatLogs.FirstOrDefaultAsync(c => c.ContactPhoneE164 == id);
  }
  
  // 2. DETECÇÃO DE TIPO DE MENSAGEM
  var messageType = message.Type;
  var isMediaMessage = IsMediaType(messageType) || 
                      (!string.IsNullOrEmpty(message.body) && message.body.StartsWith("data:"));
  
  // 3. PROCESSAMENTO DO BODY
  var messageBody = isMediaMessage ? message.body : message.body; // Base64 para mídia
  
  // 4. CRIAÇÃO DE CHAT (SE NÃO EXISTIR)
  if (chat == null) {
    var normalizedPhone = NormalizePhoneE164Br(req.Contact.PhoneE164);
    var conversation = await _conversationService.GetOrCreateConversationAsync(
      normalizedPhone, "frontend", false, leadName);
    
    chat = new ChatLog {
      Id = Guid.NewGuid(),
      ChatId = conversation.Id,
      PhoneNumber = normalizedPhone,
      ContactPhoneE164 = normalizedPhone,
      Title = leadName,
      PayloadJson = JsonSerializer.Serialize(new ChatLogService.ChatPayload {
        Contact = new ChatLogService.ContactInfo {
          Name = $"Chat com {normalizedPhone}",
          PhoneE164 = normalizedPhone,
          ProfilePic = null
        },
        Messages = new List<ChatLogService.MessageInfo>()
      }),
      UnreadCount = 0,
      LastMessageAt = DateTime.UtcNow,
      CreatedAt = DateTime.UtcNow
    };
    
    await _db.ChatLogs.AddAsync(chat);
    await _db.SaveChangesAsync();
  }
  
  // 5. CRIAÇÃO DE ATTACHMENT (SE FOR MÍDIA)
  var attachment = null as ChatLogService.ChatAttachment;
  if (isMediaMessage) {
    var mimeType = message.mimeType;
    if (string.IsNullOrEmpty(mimeType) && message.body.StartsWith("data:")) {
      var dataUrlParts = message.body.Split(',');
      if (dataUrlParts.Length > 0) {
        var mimePart = dataUrlParts[0].Replace("data:", "");
        mimeType = mimePart;
      }
    }
    
    if (string.IsNullOrEmpty(mimeType)) {
      mimeType = messageType == "audio" || messageType == "voice" ? "audio/webm" : "application/octet-stream";
    }
    
    attachment = new ChatLogService.ChatAttachment {
      DataUrl = message.body, // Base64 da mídia
      MimeType = mimeType,
      FileName = message.fileName ?? $"audio-message.{GetExtensionFromMimeType(mimeType)}",
      MediaType = messageType
    };
  }
  
  // 6. ADIÇÃO DA MENSAGEM
  var (updatedChat, msg) = await _chatService.AddOutboundPendingAsync(
    chat.Id, messageBody, message.Id, DateTime.UtcNow, attachment);
  
  // 7. NOTIFICAÇÃO VIA SIGNALR
  await _hub.Clients.Group("whatsapp").SendAsync("message.outbound", 
    new { chatId = updatedChat.Id, message = msg });
  
  // 8. PUBLICAÇÃO NA FILA RABBITMQ
  var payload = _chatService.Deserialize(updatedChat.PayloadJson);
  var to = payload.Contact?.PhoneE164;
  if (string.IsNullOrWhiteSpace(to)) to = updatedChat.ContactPhoneE164;
  
  var toNormalized = NormalizePhoneE164Br(toClean, isGroup);
  
  var cmd = new {
    command = "send_message",
    phone = toNormalized,
    to = toNormalized,
    from = "5511977240565", // Número conectado no ZapBot
    body = isMediaMessage ? messageBody : messageBody, // Base64 para mídia
    clientMessageId = message.Id,
    chatId = updatedChat.ChatId,
    attachment = attachment != null ? new {
      mimeType = attachment.MimeType,
      fileName = attachment.FileName,
      mediaType = attachment.MediaType
    } : null
  };
  
  await _rabbit.PublishAsync("whatsapp.outgoing", cmd);
  
  return Ok(new { success = true, messageId = message.Id });
}
```

### **3.4 ZAP BOT - Consumer RabbitMQ**

#### **3.4.1 Função `startConsumer` (Linha 308-446)**
```javascript
async function startConsumer() {
  const q = 'whatsapp.outgoing';
  await amqpChan.assertQueue(q, { durable: true });
  
  amqpChan.consume(q, async (msg) => {
    // 1. VALIDAÇÃO DA MENSAGEM
    if (!msg) {
      Log.warn('[QUEUE] ⚠️ Mensagem nula recebida da fila');
      return;
    }
    
    // 2. PARSE DO PAYLOAD
    const payload = JSON.parse(msg.content.toString());
    
    // 3. PROCESSAMENTO POR COMANDO
    if (payload.command === 'send_message') {
      // Normalização de campos
      const targetNumber = payload.phone || payload.to;
      const message = payload.body ?? payload.message ?? payload.text ?? null;
      const attachment = payload.attachment || null;
      
      // Envio da mensagem
      const res = await sendOne(targetNumber, { message, template, data, attachment });
      
      if (res.success) {
        amqpChan.ack(msg);
      } else {
        amqpChan.nack(msg, false, true);
      }
    }
  });
}
```

#### **3.4.2 Função `sendOne` (Linha 1004-1113)**
```javascript
async function sendOne(number, msg) {
  // 1. VALIDAÇÕES
  if (!client) return { success: false, reason: 'client_not_ready' };
  const to = normalizeNumber(number);
  if (!to || to.length < 10) return { success: false, reason: 'invalid_number' };
  
  const whatsappRecipientId = `${to}@c.us`;
  
  // 2. RESOLUÇÃO DO BODY
  const attachment = msg?.attachment || null;
  const body = resolveBody(msg);
  
  if (!body && !attachment) {
    return { success: false, reason: 'empty_body' };
  }
  
  // 3. PROCESSAMENTO DE MÍDIA
  let sent;
  let tempFilePath = null;
  
  try {
    if (attachment) {
      // Processamento com attachment
      let base64;
      if (attachment.dataUrl) {
        base64 = String(attachment.dataUrl).split(',')[1] || attachment.dataUrl;
      } else if (body && (attachment.mediaType === 'audio' || attachment.mediaType === 'voice')) {
        base64 = String(body).split(',')[1] || body;
      }
      
      const mime = attachment.mimeType || 'application/octet-stream';
      const media = new MessageMedia(mime, base64 || '', attachment.fileName || 'file');
      sent = await client.sendMessage(whatsappRecipientId, media, { caption: body || undefined });
      
    } else if (body && body.startsWith('data:audio/')) {
      // ✅ NOVA FUNCIONALIDADE: Processamento de base64 no body
      const { media, tempFilePath: tempFile } = await createAudioMediaFromBase64(body);
      tempFilePath = tempFile;
      sent = await client.sendMessage(whatsappRecipientId, media);
      
    } else {
      // Mensagem de texto
      sent = await client.sendMessage(whatsappRecipientId, body);
    }
  } finally {
    // Limpeza de arquivo temporário
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
  
  // 4. RETORNO DO RESULTADO
  if (sent?.id) { 
    await sendMessageStatus(number, sent.id._serialized, 'sent'); 
    return { success: true, messageId: sent.id }; 
  }
  throw new Error('sendMessage retornou vazio');
}
```

#### **3.4.3 Função `createAudioMediaFromBase64` (Linha 1116-1181)**
```javascript
async function createAudioMediaFromBase64(body) {
  // 1. EXTRAÇÃO DE INFORMAÇÕES
  const [header, base64Data] = body.split(',');
  const mimeType = header.split(';')[0].split(':')[1];
  
  // 2. CONVERSÃO PARA BUFFER
  const audioBuffer = Buffer.from(base64Data, 'base64');
  
  // 3. VALIDAÇÃO COM AUDIOPROCESSOR
  const validation = AudioProcessor.validateAudio(audioBuffer, mimeType);
  if (!validation.isValid) {
    throw new Error(`Áudio inválido: ${validation.error}`);
  }
  
  // 4. CRIAÇÃO DE ARQUIVO TEMPORÁRIO
  const extension = AudioProcessor.getExtensionFromMimeType(validation.mimeType);
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const fileName = `audio_${timestamp}_${randomId}.${extension}`;
  const tempFilePath = path.join(tempDir, fileName);
  
  // 5. SALVAMENTO DO ARQUIVO
  fs.writeFileSync(tempFilePath, audioBuffer);
  
  // 6. CRIAÇÃO DE MESSAGEMEDIA
  const media = MessageMedia.fromFilePath(tempFilePath);
  media.mimetype = validation.mimeType;
  
  return { media, tempFilePath };
}
```

## **4. ANÁLISE TÉCNICA DETALHADA**

### **4.1 Pontos de Falha Identificados**

#### **4.1.1 Frontend**
- **Validação de arquivo**: Não há validação de tamanho ou formato
- **Tratamento de erro**: Falha silenciosa em alguns casos
- **Otimização**: Base64 pode ser muito grande para arquivos de áudio

#### **4.1.2 API**
- **Duplicação de dados**: Base64 é armazenado em múltiplos campos
- **Validação**: Não há validação robusta de formato de áudio
- **Performance**: Serialização/deserialização de JSON grande

#### **4.1.3 Zap Bot**
- **Extração de base64**: Uso de `split(',')` pode truncar dados
- **Gerenciamento de arquivos**: Arquivos temporários podem acumular
- **Validação**: Dependência do AudioProcessor para validação

### **4.2 Melhorias Implementadas**

#### **4.2.1 Integração do AudioProcessor**
- Validação robusta de formatos de áudio
- Detecção automática de tipo
- Prevenção de arquivos corrompidos

#### **4.2.2 Gerenciamento de Arquivos Temporários**
- Criação automática de diretório temp
- Limpeza automática de arquivos antigos
- Nomes únicos para evitar conflitos

#### **4.2.3 Logs Estruturados**
- Logs detalhados em cada etapa
- Informações de debug para troubleshooting
- Rastreamento de IDs de mensagem

## **5. FLUXO DE DADOS**

### **5.1 Estrutura do Payload**

#### **5.1.1 Frontend → API**
```json
{
  "Contact": {
    "Name": "Nome do Lead",
    "PhoneE164": "5511999999999",
    "ProfilePic": null
  },
  "Messages": [{
    "Id": "uuid",
    "Content": null,
    "body": "data:audio/webm;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEA...",
    "MediaUrl": null,
    "Direction": "outbound",
    "Ts": "2025-01-15T10:30:00.000Z",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "IsRead": false,
    "Status": "pending",
    "Type": "audio",
    "from": "operator@frontend",
    "mimeType": "audio/webm",
    "fileName": "gravacao.webm"
  }]
}
```

#### **5.1.2 API → RabbitMQ**
```json
{
  "command": "send_message",
  "phone": "5511999999999",
  "to": "5511999999999",
  "from": "5511977240565",
  "body": "data:audio/webm;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEA...",
  "clientMessageId": "uuid",
  "chatId": "conversation-uuid",
  "attachment": {
    "mimeType": "audio/webm",
    "fileName": "gravacao.webm",
    "mediaType": "audio"
  }
}
```

## **6. RECOMENDAÇÕES**

### **6.1 Melhorias de Performance**
1. **Compressão de áudio**: Implementar compressão antes do envio
2. **Streaming**: Usar streaming para arquivos grandes
3. **Cache**: Implementar cache para dados frequentes

### **6.2 Melhorias de Segurança**
1. **Validação de entrada**: Validar todos os inputs
2. **Sanitização**: Sanitizar dados antes do processamento
3. **Rate limiting**: Implementar limitação de taxa

### **6.3 Melhorias de Monitoramento**
1. **Métricas**: Implementar métricas de performance
2. **Alertas**: Configurar alertas para falhas
3. **Logs**: Melhorar estrutura de logs

## **7. CONCLUSÃO**

O fluxo de envio de mensagens de áudio está funcionalmente completo, mas pode ser otimizado em vários aspectos. As melhorias implementadas com o AudioProcessor e o gerenciamento de arquivos temporários aumentaram significativamente a robustez do sistema.

### **7.1 Pontos Fortes**
- Fluxo completo implementado
- Tratamento de erros em cada etapa
- Logs detalhados para debugging
- Validação robusta de áudio

### **7.2 Pontos de Melhoria**
- Otimização de performance
- Melhor tratamento de arquivos grandes
- Implementação de cache
- Monitoramento avançado

### **7.3 Próximos Passos**
1. Implementar compressão de áudio
2. Adicionar métricas de performance
3. Configurar alertas de monitoramento
4. Otimizar gerenciamento de memória
