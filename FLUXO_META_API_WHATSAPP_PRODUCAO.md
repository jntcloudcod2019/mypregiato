# 📱 FLUXO COMPLETO - META API WHATSAPP BUSINESS CLOUD EM PRODUÇÃO

## 🎯 VISÃO GERAL DO SISTEMA

O sistema Pregiato implementa uma integração completa com a **Meta WhatsApp Business Cloud API** para envio e recebimento de mensagens em produção. O fluxo envolve múltiplas camadas: Frontend React, Backend .NET, Meta API, e processamento de webhooks.

---

## 🏗️ ARQUITETURA DO SISTEMA

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │   BACKEND       │    │   META API      │
│   (React)       │◄──►│   (.NET Core)   │◄──►│   (WhatsApp)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SignalR       │    │   RabbitMQ       │    │   Webhooks      │
│   (Real-time)   │    │   (Message Bus)  │    │   (Meta → API)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔧 COMPONENTES PRINCIPAIS

### 1. **MetaAPIAdapter** (`back/Pregiato.Application/Adapters/MetaAPIAdapter.cs`)
- **Função**: Cliente HTTP para Meta WhatsApp Business Cloud API
- **Responsabilidades**:
  - Envio de mensagens (texto, mídia)
  - Upload/download de mídia
  - Marcar mensagens como lidas
  - Health check da API

### 2. **MetaWebhookProcessor** (`back/Pregiato.Application/Services/MetaWebhookProcessor.cs`)
- **Função**: Processa webhooks recebidos da Meta
- **Responsabilidades**:
  - Converter mensagens Meta para formato interno
  - Processar status updates
  - Gerenciar mídia inbound

### 3. **RabbitBackgroundService** (`back/Pregiato.API/Services/RabbitBackgroundService.cs`)
- **Função**: Processa mensagens via RabbitMQ
- **Responsabilidades**:
  - Consumir mensagens da fila
  - Salvar no banco de dados
  - Notificar frontend via SignalR

### 4. **WhatsAppController** (`back/Pregiato.API/Controllers/WhatsAppController.cs`)
- **Função**: Endpoints REST para WhatsApp
- **Responsabilidades**:
  - Geração de QR Code
  - Status da sessão
  - Webhook endpoint

---

## 📤 FLUXO DE ENVIO DE MENSAGENS

### **Cenário 1: Envio de Mensagem de Texto**

#### **1. Frontend → Backend**
```typescript
// front/src/services/whatsapp-api.ts
const sendMessage = async (phone: string, message: string) => {
  const response = await api.post('/whatsapp/messages/send', {
    phone,
    message
  });
  return response.data;
};
```

#### **2. Backend → Meta API**
```csharp
// back/Pregiato.Application/Adapters/MetaAPIAdapter.cs
public async Task<MetaSendMessageResult> SendTextMessageAsync(
    string to, 
    string body, 
    string? clientMessageId = null)
{
    var request = new MetaTextMessageRequest
    {
        To = to,
        Text = new MetaTextContent
        {
            Body = body,
            PreviewUrl = body.Contains("http://") || body.Contains("https://")
        }
    };

    var url = $"/{_phoneNumberId}/messages";
    var response = await _httpClient.PostAsJsonAsync(url, request);
    
    // Processar resposta...
}
```

#### **3. Meta API → Webhook (Status Update)**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "statuses": [{
          "id": "wamid.xxx",
          "status": "delivered",
          "timestamp": "1234567890",
          "recipient_id": "15551234567"
        }]
      }
    }]
  }]
}
```

#### **4. Webhook → Backend Processing**
```csharp
// back/Pregiato.Application/Services/MetaWebhookProcessor.cs
public async Task ProcessMessageStatusAsync(MetaWebhookStatus status)
{
    // Mapear status da Meta para status interno
    var internalStatus = MapMetaStatusToInternal(status.Status);
    
    // Atualizar no banco
    var message = await _db.Messages
        .Where(m => m.WhatsAppMessageId == status.Id)
        .FirstOrDefaultAsync();
        
    if (message != null)
    {
        message.Status = internalStatus;
        await _db.SaveChangesAsync();
    }
}
```

---

## 📥 FLUXO DE RECEBIMENTO DE MENSAGENS

### **Cenário 2: Recebimento de Mensagem de Texto**

#### **1. Meta API → Webhook**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "messages": [{
          "from": "15551234567",
          "id": "wamid.xxx",
          "timestamp": "1234567890",
          "text": {
            "body": "Olá, como posso ajudar?"
          },
          "type": "text"
        }]
      }
    }]
  }]
}
```

#### **2. Webhook → Backend Processing**
```csharp
// back/Pregiato.Application/Services/MetaWebhookProcessor.cs
public async Task ProcessInboundMessageAsync(
    MetaWebhookMessage message,
    MetaWebhookMetadata metadata)
{
    // Converter mensagem Meta para formato interno
    var whatsappMessage = await ConvertMetaToWhatsAppMessageAsync(message, metadata);
    
    // Buscar ChatLog para obter ChatId real
    var normalizedPhone = NormalizePhoneNumber(message.From);
    var chatLog = await _db.ChatLogs
        .Where(c => c.ContactPhoneE164 == normalizedPhone)
        .FirstOrDefaultAsync();
        
    string realChatId = chatLog?.ChatId.ToString() ?? $"chat_{normalizedPhone}";
    
    // Notificar frontend via SignalR
    await _hubContext.Clients.Group("whatsapp").SendAsync("message.inbound", new {
        chatId = realChatId,
        fromNormalized = whatsappMessage.fromNormalized,
        message = new {
            id = whatsappMessage.externalMessageId,
            from = whatsappMessage.from,
            body = whatsappMessage.body,
            type = whatsappMessage.type,
            timestamp = whatsappMessage.timestamp
        }
    });
}
```

#### **3. Backend → Database**
```csharp
// back/Pregiato.API/Services/RabbitBackgroundService.cs
public async Task<Guid> ProcessIncomingMessage(WhatsAppMessage message)
{
    // Buscar ou criar contato
    var contact = await GetOrCreateContactAsync(message.fromNormalized);
    
    // Buscar ou criar conversa
    var conversation = await GetOrCreateConversationAsync(contact.Id);
    
    // Criar mensagem no banco
    var messageEntity = new Message
    {
        ConversationId = conversation.Id,
        Direction = MessageDirection.In,
        Type = message.type,
        Body = message.body,
        ExternalMessageId = message.externalMessageId,
        CreatedAt = DateTime.UtcNow
    };
    
    _db.Messages.Add(messageEntity);
    await _db.SaveChangesAsync();
    
    return conversation.Id;
}
```

#### **4. Frontend → Real-time Update**
```typescript
// front/src/pages/atendimento/index.tsx
useEffect(() => {
  const connection = new HubConnectionBuilder()
    .withUrl("/whatsapp-hub")
    .build();
    
  connection.on("message.inbound", (data) => {
    // Atualizar interface com nova mensagem
    setMessages(prev => [...prev, data.message]);
  });
  
  connection.start();
}, []);
```

---

## 🎵 FLUXO DE MÍDIA (ÁUDIO/IMAGEM/VIDEO)

### **Cenário 3: Recebimento de Áudio**

#### **1. Meta API → Webhook (com mídia)**
```json
{
  "messages": [{
    "from": "15551234567",
    "id": "wamid.xxx",
    "timestamp": "1234567890",
    "type": "audio",
    "audio": {
      "id": "MEDIA_ID",
      "mime_type": "audio/ogg; codecs=opus"
    }
  }]
}
```

#### **2. Download da Mídia**
```csharp
// back/Pregiato.Application/Adapters/MetaAPIAdapter.cs
public async Task<MetaDownloadMediaResult> DownloadMediaAsync(string mediaId)
{
    // Passo 1: Obter informações da mídia
    var infoUrl = $"/{mediaId}";
    var infoResponse = await _httpClient.GetAsync(infoUrl);
    var mediaInfo = await infoResponse.Content.ReadFromJsonAsync<MetaMediaInfo>();
    
    // Passo 2: Baixar o arquivo
    var downloadResponse = await _httpClient.GetAsync(mediaInfo.Url);
    var buffer = await downloadResponse.Content.ReadAsByteArrayAsync();
    
    // Passo 3: Converter para base64 data URL
    var base64 = Convert.ToBase64String(buffer);
    var dataUrl = $"data:{mediaInfo.MimeType};base64,{base64}";
    
    return new MetaDownloadMediaResult
    {
        Buffer = buffer,
        MimeType = mediaInfo.MimeType,
        DataUrl = dataUrl
    };
}
```

#### **3. Processamento e Armazenamento**
```csharp
// back/Pregiato.Application/Services/MetaWebhookProcessor.cs
private async Task<MetaDownloadMediaResult?> ProcessInboundMediaAsync(MetaWebhookMessage message)
{
    string? mediaId = message.Type switch
    {
        "audio" => message.Audio?.Id,
        "image" => message.Image?.Id,
        "video" => message.Video?.Id,
        _ => null
    };
    
    if (string.IsNullOrEmpty(mediaId))
        return null;
        
    // Baixar mídia via Meta API
    var mediaData = await _metaClient.DownloadMediaAsync(mediaId);
    
    return mediaData;
}
```

#### **4. Frontend → Renderização de Áudio**
```typescript
// front/src/components/whatsapp/MediaRenderer.tsx
case MessageType.Audio:
case MessageType.Voice:
  return (
    <audio
      src={mediaSource} // dataUrl do base64
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      controls
    />
  );
```

---

## ⚙️ CONFIGURAÇÃO PARA PRODUÇÃO

### **1. Variáveis de Ambiente**
```json
// appsettings.Production.json
{
  "Meta": {
    "PhoneNumberId": "SEU_PHONE_NUMBER_ID",
    "AccessToken": "SEU_ACCESS_TOKEN",
    "ApiVersion": "v21.0",
    "WebhookVerifyToken": "SEU_WEBHOOK_VERIFY_TOKEN"
  }
}
```

### **2. Webhook Configuration**
```csharp
// back/Pregiato.API/Controllers/WhatsAppController.cs
[HttpPost("webhook")]
public async Task<IActionResult> Webhook([FromBody] MetaWebhookPayload payload)
{
    // Verificar se é challenge do Meta
    if (Request.Query.ContainsKey("hub.mode") && 
        Request.Query["hub.mode"] == "subscribe")
    {
        var challenge = Request.Query["hub.challenge"];
        var verifyToken = Request.Query["hub.verify_token"];
        
        if (verifyToken == _configuration["Meta:WebhookVerifyToken"])
        {
            return Ok(challenge);
        }
    }
    
    // Processar webhook
    await _metaWebhookProcessor.ProcessWebhookAsync(payload);
    return Ok();
}
```

### **3. Frontend Configuration**
```typescript
// front/src/services/api-client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pregiato-api-production.up.railway.app';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
```

---

## 🔄 CENÁRIOS DE PRODUÇÃO

### **Cenário A: Cliente envia mensagem de texto**
1. **Cliente** → WhatsApp → **Meta API**
2. **Meta API** → **Webhook** → **Backend**
3. **Backend** → **Database** → **SignalR** → **Frontend**
4. **Frontend** → **Atualização em tempo real**

### **Cenário B: Operador responde com mídia**
1. **Frontend** → **Backend** → **Meta API**
2. **Meta API** → **Webhook** (status) → **Backend**
3. **Backend** → **Database** → **SignalR** → **Frontend**

### **Cenário C: Cliente envia áudio**
1. **Cliente** → WhatsApp → **Meta API**
2. **Meta API** → **Webhook** → **Backend**
3. **Backend** → **Download mídia** → **Base64** → **Database**
4. **Frontend** → **Player de áudio** → **Reprodução**

---

## 🚨 PONTOS CRÍTICOS DE SEGURANÇA

### **1. Validação de Webhook**
```csharp
// Sempre validar o webhook da Meta
if (verifyToken != _configuration["Meta:WebhookVerifyToken"])
{
    return Unauthorized();
}
```

### **2. Rate Limiting**
```csharp
// Implementar rate limiting para evitar spam
[EnableRateLimiting("WhatsAppPolicy")]
public async Task<IActionResult> SendMessage(...)
```

### **3. Logs de Auditoria**
```csharp
// Log detalhado para auditoria
_logger.LogInformation("📤 [META] Mensagem enviada - To: {To}, ID: {Id}", 
    to, whatsappMessageId);
```

---

## 📊 MONITORAMENTO E LOGS

### **1. Health Check**
```csharp
// back/Pregiato.Application/Adapters/MetaAPIAdapter.cs
public async Task<bool> IsHealthyAsync()
{
    try
    {
        var info = await GetPhoneNumberInfoAsync();
        return info != null && !string.IsNullOrEmpty(info.DisplayPhoneNumber);
    }
    catch
    {
        return false;
    }
}
```

### **2. Logs Estruturados**
```csharp
_logger.LogInformation("📨 [META] Mensagem processada - From: {From}, Type: {Type}, ID: {Id}",
    message.From, message.Type, message.Id);
```

### **3. Métricas de Performance**
- Tempo de resposta da Meta API
- Taxa de sucesso de envio
- Volume de mensagens por minuto
- Erros de webhook

---

## 🔧 TROUBLESHOOTING

### **Problema 1: Mensagens não chegam**
- ✅ Verificar webhook URL
- ✅ Validar access token
- ✅ Conferir phone number ID

### **Problema 2: Mídia não carrega**
- ✅ Verificar permissões de mídia
- ✅ Validar formato de arquivo
- ✅ Conferir timeout de download

### **Problema 3: Status não atualiza**
- ✅ Verificar webhook de status
- ✅ Validar mapeamento de status
- ✅ Conferir logs de processamento

---

## 🎯 CONCLUSÃO

O sistema implementa uma integração robusta e escalável com a Meta WhatsApp Business Cloud API, oferecendo:

- ✅ **Envio e recebimento** de mensagens em tempo real
- ✅ **Processamento de mídia** (áudio, imagem, vídeo)
- ✅ **Status updates** automáticos
- ✅ **Webhook processing** resiliente
- ✅ **Real-time notifications** via SignalR
- ✅ **Logs detalhados** para monitoramento
- ✅ **Configuração flexível** para produção

O fluxo garante alta disponibilidade e performance em ambiente de produção, com fallbacks e tratamento de erros robustos.
