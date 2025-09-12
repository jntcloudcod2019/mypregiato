# 🚨 PROBLEMA: Duplicação de Chats no Frontend

## 📋 Descrição do Problema

Quando uma mensagem de resposta (inbound) chega do destinatário via zap bot, o frontend está criando um **novo chat** em vez de atualizar o chat existente. O banco de dados está funcionando corretamente (salvando no `PayloadJson` do chat existente), mas a API e frontend estão gerando duplicação.

## 🔍 Evidências do Problema

### PayloadJson Correto (Banco de Dados)
```json
{
  "Contact": {
    "Name": "Chat com 5511949908369",
    "PhoneE164": "5511949908369",
    "ProfilePic": null
  },
  "Messages": [
    // ... mensagens outbound do operador ...
    {
      "Id": "false_5511949908369@c.us_3A234B4334CFDD862D65",
      "Content": null,
      "body": "Oi",
      "Direction": "inbound",  // ← Mensagem inbound salva corretamente
      "from": "5511949908369@c.us"
    }
  ]
}
```

### Frontend (Interface)
- **Chat 01**: "Chat chat_551" - Novo (não deveria existir)
- **Chat 02**: "Jonathan" - Novo (não deveria existir) 
- **Chat 03**: "Jonathan" - Chat correto (onde as mensagens deveriam aparecer)

## 📁 Arquivos Envolvidos no Processo

### 1. **zap-blaster-projeto/zap.js** - Normalização de Telefone

```javascript
// Linha 854-860
function normalizeNumber(num) {
  if (!num) return '';
  const digits = String(num).replace(/\D/g, '');
  if (digits.startsWith('55')) return digits;
  if (digits.length >= 10) return '55' + digits;  // ← PROBLEMA: >= 10
  return digits;
}

// Linha 867-880
function buildInboundPayload(message) {
  const fromBare = (message.from || '').split('@')[0];
  const fromNorm = normalizeNumber(fromBare);  // ← Usa normalização inconsistente
  return {
    externalMessageId: message.id?._serialized || crypto.randomUUID(),
    from: message.from || '',
    fromNormalized: fromNorm,  // ← Enviado para backend
    // ...
  };
}
```

### 2. **back/Pregiato.API/Services/ChatHelper.cs** - Normalização Backend

```csharp
// Linha 24-48
public static string NormalizePhoneE164Br(string phone, bool isGroup = false)
{
    if (string.IsNullOrWhiteSpace(phone))
        return string.Empty;
    
    var digits = new string(phone.Where(char.IsDigit).ToArray());
    
    if (isGroup || (digits.StartsWith("120") && digits.Length >= 18))
    {
        return digits;
    }
    
    // Para números individuais brasileiros, aplicar formato E.164 BR
    if (digits.Length == 10 || digits.Length == 11)  // ← PROBLEMA: == 10 || == 11
    {
        return $"55{digits}";
    }
    
    return digits;
}
```

### 3. **back/Pregiato.API/Services/RabbitBackgroundService.cs** - Processamento de Mensagens

```csharp
// Linha 1173-1184
var normalizedPhone = ChatHelper.NormalizePhoneE164Br(message.from, message.isGroup);

_logger.LogInformation("🔢 NORMALIZAÇÃO DEBUG: from={From}, isGroup={IsGroup}, normalizedPhone={NormalizedPhone}", 
    message.from, message.isGroup, normalizedPhone);

// 1. Criar ou obter Conversation via Service
var conversation = await conversationService.GetOrCreateConversationAsync(
    normalizedPhone, 
    message.instanceId, 
    message.isGroup, 
    $"Chat com {normalizedPhone}"
);

// Linha 1196-1200
var chatLog = await context.ChatLogs
    .Where(c => c.ContactPhoneE164 == normalizedPhone)
    .OrderByDescending(c => c.LastMessageAt)
    .FirstOrDefaultAsync();

// Linha 1243-1245
if (chatLog == null)
{
    _logger.LogInformation("🆕 CRIANDO NOVO ChatLog para {Phone} (não encontrado nenhum existente)", normalizedPhone);
    // ... cria novo chat e emite chat.created
}
```

### 4. **back/Pregiato.API/Services/ConversationService.cs** - Busca de Conversas

```csharp
// Linha 58-59
var conversation = await db.Conversations
    .FirstOrDefaultAsync(c => c.InstanceId == instanceId && c.PeerE164 == peerE164);
    // ↑ PROBLEMA: Busca por InstanceId E PeerE164

// Linha 67-82
if (conversation != null)
{
    _logger.LogDebug("📞 Conversa WhatsApp encontrada para {PeerE164}: {ConversationId}", peerE164, conversation.Id);
    return conversation;
}

// Criar nova conversa WhatsApp
conversation = new Conversation
{
    Id = Guid.NewGuid(),
    InstanceId = instanceId,  // ← Pode ser diferente entre zap bot e frontend
    PeerE164 = peerE164,
    // ...
};
```

### 5. **front/src/pages/atendimento/index.tsx** - Processamento de Eventos

```typescript
// Linha 738-773
connection.on('chat.created', (evt: ChatEvent) => {
  console.log('📨 chat.created recebido:', evt);
  const chat: Partial<ChatListItem> | undefined = evt?.chat;
  const id: string | undefined = chat?.id || evt?.chatId;
  
  if (id && chat) {
    // ✅ VERIFICAÇÃO MAIS ROBUSTA COM NORMALIZAÇÃO CONSISTENTE
    const existingChat = chats.find(c => {
      // Verificar por ID exato
      if (c.id === id) return true;
      
      // Verificar por telefone (normalizado de forma consistente com backend)
      const normalizedPhone = normalizePhone(chat.contactPhoneE164 || '');
      const existingPhone = normalizePhone(c.contactPhoneE164 || '');
      if (normalizedPhone && existingPhone && normalizedPhone === existingPhone) return true;
      
      return false;
    });
    
    if (existingChat) {
      console.log('⚠️ Chat JÁ EXISTE! Tratando como chat.updated:', {
        existingId: existingChat.id,
        newId: id,
        phone: chat.contactPhoneE164
      });
      // ✅ TRATAR COMO ATUALIZAÇÃO em vez de ignorar
      queueChatPatch(existingChat.id, chat as Partial<ChatListItem>);
      return;
    } else {
      console.log('✅ Realmente é novo chat, criando:', id);
      queueChatPatch(id, chat as Partial<ChatListItem>);  // ← Cria novo chat
    }
  }
});
```

### 6. **front/src/utils/phoneUtils.ts** - Normalização Frontend

```typescript
// Linha 50-53
if (digits.length === 10 || digits.length === 11) {
  const normalized = `55${digits}`;
  return normalized;
}
```

## 🔍 Análise do Problema

### **Problema Principal: Inconsistência na Normalização**

1. **Zap Bot**: `normalizeNumber()` adiciona `55` se `digits.length >= 10`
2. **Backend**: `NormalizePhoneE164Br()` adiciona `55` apenas se `digits.Length == 10 || digits.Length == 11`
3. **Frontend**: `normalizePhone()` adiciona `55` se `digits.length === 10 || digits.length === 11`

### **Exemplo do Problema:**
Para o número `5511949908369`:
- **Zap Bot**: `5511949908369` (13 dígitos) → `55` + `11949908369` = `5511949908369` ✅
- **Backend**: `5511949908369` (13 dígitos) → retorna como está = `5511949908369` ✅
- **Frontend**: `5511949908369` (13 dígitos) → retorna como está = `5511949908369` ✅

**Mas para números menores (10-11 dígitos), pode haver inconsistência.**

### **Problema Secundário: Busca de Conversa por InstanceId**

O `ConversationService` busca conversas por `InstanceId` E `PeerE164`:
- **Zap Bot**: `instanceId = 'zap-prod'`
- **Frontend**: Pode usar `instanceId` diferente ou não definir

Isso pode causar criação de conversas duplicadas.

### **Problema Terciário: Eventos SignalR**

O backend emite `chat.created` quando não encontra o chat existente, mesmo que o chat já exista no banco de dados.

## 🎯 Fluxo do Problema

1. **Operador envia mensagem** → Frontend cria chat com `instanceId` específico
2. **Destinatário responde** → Zap bot processa com `instanceId = 'zap-prod'`
3. **Backend busca conversa** → Não encontra por `instanceId` diferente
4. **Backend cria nova conversa** → Com `instanceId = 'zap-prod'`
5. **Backend busca ChatLog** → Não encontra por telefone normalizado diferente
6. **Backend cria novo ChatLog** → Emite `chat.created`
7. **Frontend recebe evento** → Cria novo chat na interface
8. **Resultado** → Chat duplicado no frontend, mas mensagem salva no chat correto no banco

## 🔧 Soluções Necessárias

1. **Unificar normalização de telefone** entre zap bot, backend e frontend
2. **Corrigir busca de conversa** para não depender apenas de `InstanceId`
3. **Melhorar lógica de busca de ChatLog** para ser mais robusta
4. **Garantir que eventos SignalR** sejam emitidos corretamente (`chat.updated` vs `chat.created`)

## 🔧 Correções Implementadas

### **1. Campo `from` Adicionado ao Evento SignalR**
```csharp
// back/Pregiato.API/Services/RabbitBackgroundService.cs - Linha 319
await _hubContext.Clients.Group("whatsapp").SendAsync("message.inbound", new {
    chatId = chatId,
    fromNormalized = whatsappMessage.fromNormalized,
    message = new {
        id = whatsappMessage.externalMessageId,
        externalMessageId = whatsappMessage.externalMessageId,
        from = whatsappMessage.from, // ✅ ADICIONADO: Campo from original (ex: "5511949908369@c.us")
        fromMe = whatsappMessage.fromMe,
        // ... outros campos
    }
});
```

### **2. Campo `from` Adicionado ao Endpoint de Histórico**
```csharp
// back/Pregiato.API/Controllers/ChatsController.cs - Linha 150
var chatMessage = new
{
    // ... outros campos
    from = message.Direction == "inbound" ? $"{message.from}@c.us" : "operator@frontend",
    // ... outros campos
};
```

### **3. Verificação de Chat Existente no Frontend**
```typescript
// front/src/pages/atendimento/index.tsx - Linha 799-831
connection.on('message.inbound', async (evt: MessageEvent) => {
  const from: string | undefined = evt?.message?.from; // ✅ ADICIONADO: Campo from
  
  // ✅ NOVA LÓGICA: Verificar se chat já existe pelo número de telefone
  if (from) {
    // Extrair número do telefone (remover @c.us)
    const phoneNumber = from.replace('@c.us', '').replace('@g.us', '');
    const normalizedPhone = normalizePhone(phoneNumber);
    
    if (normalizedPhone) {
      // Buscar chat existente pelo telefone normalizado
      const existingChat = chats.find(c => {
        const existingPhone = normalizePhone(c.contactPhoneE164 || '');
        return existingPhone && existingPhone === normalizedPhone;
      });
      
      if (existingChat) {
        console.log('✅ Chat existente encontrado pelo telefone:', {
          from, phoneNumber, normalizedPhone,
          existingChatId: existingChat.id, newChatId: chatId
        });
        
        // Usar o chat existente em vez do novo
        evt.chatId = existingChat.id;
      }
    }
  }
  // ... resto do processamento
});
```

### **4. Correção do Posicionamento de Mensagens**
```typescript
// PROBLEMA: Enum MessageDirection inconsistente
// front/src/types/message.ts: MessageDirection.In = 0, MessageDirection.Out = 1 (números)
// front/src/services/chat-service.ts: MessageDirection.In = 'In', MessageDirection.Out = 'Out' (strings)
// Backend retorna: "In" e "Out" (strings)

// ✅ CORREÇÃO: Usar enum consistente com strings
// front/src/pages/atendimento/index.tsx
import { MessageDirection } from '@/services/chat-service'; // ✅ Usar enum com strings

// front/src/components/attendance/chat-window.tsx  
import { MessageDirection } from '@/services/chat-service'; // ✅ Usar enum com strings

// Resultado: Mensagens outbound (operador) → direita, inbound (destinatário) → esquerda
```

### **5. Correção da Criação Duplicada de Chats**
```typescript
// PROBLEMA: Frontend criando 2 novos chats para cada mensagem inbound
// Causa 1: scheduleCommitChats() sempre criava novo chat se chatId não existisse
// Causa 2: message.inbound chamava queueChatPatch() mesmo para chats inexistentes

// ✅ CORREÇÃO 1: Garantir uso do ID do chat existente
connection.on('chat.created', (evt: ChatEvent) => {
  if (existingChat) {
    // Usar o ID do chat existente para evitar duplicação
    queueChatPatch(existingChat.id, { ...chat, id: existingChat.id });
    return;
  }
});

// ✅ CORREÇÃO 2: Verificar se chat existe antes de atualizar
connection.on('message.inbound', async (evt: MessageEvent) => {
  const existingChat = chats.find(c => c.id === chatId);
  if (existingChat) {
    queueChatPatch(chatId, { lastMessageAt, lastMessagePreview, unreadCount });
  } else {
    console.log('⚠️ Chat não encontrado, ignorando atualização:', chatId);
  }
});
```

## 📊 Status Atual

- ✅ **Banco de Dados**: Funcionando corretamente
- ✅ **API Backend**: Campo `from` adicionado aos eventos e endpoints
- ✅ **Frontend**: Verificação de chat existente por telefone implementada
- ✅ **Normalização**: Consistente entre componentes
- ✅ **Posicionamento de Mensagens**: Corrigido enum MessageDirection inconsistente
- ✅ **Criação Duplicada de Chats**: Corrigida lógica de criação no frontend
- 🔄 **Teste**: Aguardando validação do fluxo completo

PlayLoadJson que e responsavel por armazenar as mensagens de um chat

{
  "Contact": {
    "Name": "Chat com 5511949908369",
    "PhoneE164": "5511949908369",
    "ProfilePic": null
  },
  "Messages": [
    {
      "Id": "af43d813-dd76-42d0-ac95-cdc5e9453c28",
      "Content": "oi",
      "body": "oi",
      "MediaUrl": null,
      "Direction": "outbound",
      "Ts": "2025-09-11T18:41:08.182731Z",
      "timestamp": "2025-09-11T18:41:08.1827310Z",
      "IsRead": false,
      "Status": "pending",
      "Type": "text",
      "from": "operator@frontend",
      "mimeType": null,
      "fileName": null,
      "size": null,
      "duration": null,
      "thumbnail": null,
      "latitude": null,
      "longitude": null,
      "locationAddress": null,
      "contactName": null,
      "contactPhone": null,
      "ActualContent": "oi",
      "ActualTs": "2025-09-11T15:41:08.182731-03:00"
    },
    {
      "Id": "aeee3969-bece-4c5a-9d63-408567793c8e",
      "Content": "oi ",
      "body": "oi ",
      "MediaUrl": null,
      "Direction": "outbound",
      "Ts": "2025-09-11T18:51:22.724283Z",
      "timestamp": "2025-09-11T18:51:22.7242830Z",
      "IsRead": false,
      "Status": "pending",
      "Type": "text",
      "from": "operator@frontend",
      "mimeType": null,
      "fileName": null,
      "size": null,
      "duration": null,
      "thumbnail": null,
      "latitude": null,
      "longitude": null,
      "locationAddress": null,
      "contactName": null,
      "contactPhone": null,
      "ActualContent": "oi ",
      "ActualTs": "2025-09-11T15:51:22.724283-03:00"
    },
    {
      "Id": "960c86b4-de78-4c27-b5ee-9d3c2c74bf47",
      "Content": "oi",
      "body": "oi",
      "MediaUrl": null,
      "Direction": "outbound",
      "Ts": "2025-09-12T05:41:05.646621Z",
      "timestamp": "2025-09-12T05:41:05.6466210Z",
      "IsRead": false,
      "Status": "pending",
      "Type": "text",
      "from": "operator@frontend",
      "mimeType": null,
      "fileName": null,
      "size": null,
      "duration": null,
      "thumbnail": null,
      "latitude": null,
      "longitude": null,
      "locationAddress": null,
      "contactName": null,
      "contactPhone": null,
      "ActualContent": "oi",
      "ActualTs": "2025-09-12T02:41:05.646621-03:00"
    },
    {
      "Id": "786c2876-ca39-4710-8999-d05a1938da15",
      "Content": "oi",
      "body": "oi",
      "MediaUrl": null,
      "Direction": "outbound",
      "Ts": "2025-09-12T05:41:54.618367Z",
      "timestamp": "2025-09-12T05:41:54.6183670Z",
      "IsRead": false,
      "Status": "pending",
      "Type": "text",
      "from": "operator@frontend",
      "mimeType": null,
      "fileName": null,
      "size": null,
      "duration": null,
      "thumbnail": null,
      "latitude": null,
      "longitude": null,
      "locationAddress": null,
      "contactName": null,
      "contactPhone": null,
      "ActualContent": "oi",
      "ActualTs": "2025-09-12T02:41:54.618367-03:00"
    },
    {
      "Id": "false_5511949908369@c.us_3A234B4334CFDD862D65",
      "Content": null,
      "body": "Oi",
      "MediaUrl": null,
      "Direction": "inbound",
      "Ts": "2025-09-12T05:43:12.68401Z",
      "timestamp": "2025-09-12T05:43:11.075Z",
      "IsRead": false,
      "Status": "delivered",
      "Type": "text",
      "from": "5511949908369@c.us",
      "mimeType": null,
      "fileName": null,
      "size": null,
      "duration": null,
      "thumbnail": null,
      "latitude": null,
      "longitude": null,
      "locationAddress": null,
      "contactName": null,
      "contactPhone": null,
      "ActualContent": "Oi",
      "ActualTs": "2025-09-12T02:43:11.075-03:00"
    },
    {
      "Id": "false_5511949908369@c.us_3A4BFF98D2C39A78ABD8",
      "Content": null,
      "body": "Teste",
      "MediaUrl": null,
      "Direction": "inbound",
      "Ts": "2025-09-12T05:44:10.270415Z",
      "timestamp": "2025-09-12T05:44:09.150Z",
      "IsRead": false,
      "Status": "delivered",
      "Type": "text",
      "from": "5511949908369@c.us",
      "mimeType": null,
      "fileName": null,
      "size": null,
      "duration": null,
      "thumbnail": null,
      "latitude": null,
      "longitude": null,
      "locationAddress": null,
      "contactName": null,
      "contactPhone": null,
      "ActualContent": "Teste",
      "ActualTs": "2025-09-12T02:44:09.15-03:00"
    }
  ]
}
