# 📊 DIAGRAMAS DE SEQUÊNCIA - FLUXO DE ATENDIMENTO

## 🎯 OBJETIVO
Visualizar os fluxos de mensagens do sistema atual e comparar com a arquitetura proposta usando Meta API.

---

## 📤 DIAGRAMA 1: ENVIO DE MENSAGEM (FLUXO ATUAL)

```mermaid
sequenceDiagram
    participant U as 👤 Operador<br/>(Frontend React)
    participant CS as 🔧 chat-service.ts
    participant API as 🌐 Backend API<br/>(ChatsController)
    participant DB as 💾 PostgreSQL<br/>(ChatLogs)
    participant MIO as 📦 MinIO<br/>(Storage)
    participant RMQ as 🐰 RabbitMQ<br/>(whatsapp.outgoing)
    participant ZAP as 🤖 Zap-Blaster<br/>(Node.js)
    participant WPP as 📱 WhatsApp<br/>(whatsapp-web.js)
    participant SR as 🔔 SignalR<br/>(Hub)
    
    Note over U: Operador digita mensagem<br/>e pressiona Enter
    
    U->>CS: sendMessage(phone, text, attachment)
    activate CS
    Note over CS: Criar mensagem otimista<br/>clientMessageId = UUID()
    CS->>U: Atualiza UI (status: pending)
    
    CS->>API: POST /chats/{phone}/send<br/>{Contact, Messages[]}
    activate API
    
    Note over API: Validar requisição<br/>Buscar/Criar ChatLog
    
    API->>DB: SELECT ChatLog WHERE phone=X
    DB-->>API: ChatLog ou null
    
    alt Chat não existe
        API->>DB: INSERT ChatLog<br/>PayloadJson = estrutura base
    end
    
    alt Mensagem tem attachment (mídia)
        API->>MIO: StoreMediaAsync(base64, mimeType)
        activate MIO
        Note over MIO: Upload arquivo<br/>Gerar URL
        MIO-->>API: mediaUrl
        deactivate MIO
    end
    
    Note over API: Atualizar PayloadJson<br/>Adicionar MessageInfo
    
    API->>DB: UPDATE ChatLog<br/>SET PayloadJson = novo_json
    DB-->>API: OK
    
    Note over API: Montar comando RabbitMQ<br/>{command: "send_message"}
    
    API->>RMQ: PublishAsync("whatsapp.outgoing", cmd)
    activate RMQ
    Note over RMQ: Enfileirar mensagem
    deactivate RMQ
    
    API->>SR: SendAsync("message.outbound",<br/>{chatId, message})
    SR-->>U: Evento SignalR
    Note over U: Atualiza UI<br/>Status: sent
    
    API-->>CS: {success: true, messageId}
    deactivate API
    CS-->>U: Retorna
    deactivate CS
    
    Note over RMQ,ZAP: === Processamento Assíncrono ===
    
    RMQ->>ZAP: Consume message
    activate ZAP
    
    Note over ZAP: Parsear comando<br/>Extrair phone, body, attachment
    
    alt Mensagem tem mídia
        ZAP->>MIO: downloadMediaFromMinIO(url)
        MIO-->>ZAP: buffer
        
        alt É áudio
            Note over ZAP: Converter para Opus/OGG<br/>FFmpeg conversion
        end
        
        Note over ZAP: Base64 encode buffer<br/>Criar MessageMedia
    end
    
    ZAP->>WPP: client.sendMessage(chatId,<br/>media/text, options)
    activate WPP
    Note over WPP: Enviar via WhatsApp Web
    WPP-->>ZAP: {id: messageId}
    deactivate WPP
    
    ZAP->>RMQ: Publish("whatsapp.message-status",<br/>{messageId, status: "sent"})
    ZAP-->>RMQ: ACK message
    deactivate ZAP
    
    Note over RMQ: Mensagem removida da fila
```

---

## 📥 DIAGRAMA 2: RECEBIMENTO DE MENSAGEM (FLUXO ATUAL)

```mermaid
sequenceDiagram
    participant WPP as 📱 WhatsApp<br/>(Cliente)
    participant WWJ as 🌐 whatsapp-web.js<br/>(Browser)
    participant ZAP as 🤖 Zap-Blaster<br/>(Node.js)
    participant RMQ as 🐰 RabbitMQ<br/>(whatsapp.incoming)
    participant API as 🌐 Backend API<br/>(RabbitConsumer)
    participant DB as 💾 PostgreSQL<br/>(ChatLogs)
    participant SR as 🔔 SignalR<br/>(Hub)
    participant U as 👤 Operador<br/>(Frontend)
    
    Note over WPP: Cliente envia mensagem<br/>via WhatsApp
    
    WPP->>WWJ: Mensagem recebida
    activate WWJ
    WWJ->>ZAP: client.on('message', msg)
    deactivate WWJ
    activate ZAP
    
    Note over ZAP: onInbound(message)<br/>Verificar se fromMe=false
    
    alt Mensagem tem mídia
        ZAP->>WWJ: message.downloadMedia()
        WWJ-->>ZAP: {data, mimetype, filename}
        
        Note over ZAP: Converter para base64<br/>Criar attachment object
        
        alt É áudio ou voice
            Note over ZAP: payload.body = dataUrl<br/>(Frontend precisa!)
        end
    end
    
    Note over ZAP: buildInboundPayload(message)<br/>{from, type, body, attachment}
    
    ZAP->>RMQ: Publish("whatsapp.incoming", payload)
    activate RMQ
    Note over RMQ: Enfileirar mensagem
    deactivate RMQ
    deactivate ZAP
    
    Note over RMQ,API: === Processamento Backend ===
    
    RMQ->>API: Consume message
    activate API
    
    Note over API: Deserializar WhatsAppMessage<br/>Extrair fromNormalized
    
    API->>DB: SELECT ChatLog<br/>WHERE phone = fromNormalized
    DB-->>API: ChatLog ou null
    
    alt Chat não existe
        Note over API: ProcessIncomingMessage()<br/>Criar Conversation + ChatLog
        API->>DB: INSERT Conversation
        API->>DB: INSERT ChatLog<br/>PayloadJson = estrutura inicial
    else Chat existe
        Note over API: Atualizar PayloadJson<br/>Adicionar nova mensagem
        API->>DB: UPDATE ChatLog<br/>SET PayloadJson = json_atualizado
    end
    
    Note over API: CreateRobustMessageEntity()<br/>Enfileirar para batch insert
    
    API->>DB: Batch INSERT Messages<br/>(a cada 50 msgs ou 30s)
    
    Note over API: Buscar ChatId real do ChatLog
    
    API->>SR: SendAsync("message.inbound",<br/>{chatId, message})
    activate SR
    SR->>U: Evento SignalR
    deactivate SR
    activate U
    
    Note over U: connection.on('message.inbound')<br/>Adicionar mensagem à UI
    
    U->>U: setMessages(prev => [...prev, msg])
    U->>U: queueChatPatch(chatId, update)
    
    Note over U: UI atualizada automaticamente
    deactivate U
    
    API-->>RMQ: ACK message
    deactivate API
    
    Note over RMQ: Mensagem removida da fila
```

---

## 🆕 DIAGRAMA 3: ENVIO DE MENSAGEM (NOVA ARQUITETURA META API)

```mermaid
sequenceDiagram
    participant U as 👤 Operador<br/>(Frontend React)
    participant CS as 🔧 chat-service.ts
    participant API as 🌐 Backend API<br/>(ChatsController)
    participant DB as 💾 PostgreSQL<br/>(ChatLogs)
    participant MIO as 📦 MinIO<br/>(Storage)
    participant META as ☁️ Meta Cloud API<br/>(graph.facebook.com)
    participant WPP as 📱 WhatsApp<br/>(Meta)
    participant SR as 🔔 SignalR<br/>(Hub)
    
    Note over U: Operador digita mensagem<br/>MESMA AÇÃO QUE ANTES ✅
    
    U->>CS: sendMessage(phone, text, attachment)
    activate CS
    Note over CS: MESMA LÓGICA ✅<br/>clientMessageId = UUID()
    CS->>U: Atualiza UI (status: pending)
    
    CS->>API: POST /chats/{phone}/send<br/>MESMA CHAMADA ✅
    activate API
    
    Note over API: Validar requisição ✅<br/>Buscar/Criar ChatLog ✅
    
    API->>DB: SELECT ChatLog WHERE phone=X
    DB-->>API: ChatLog ou null
    
    alt Chat não existe
        API->>DB: INSERT ChatLog<br/>MESMA ESTRUTURA ✅
    end
    
    Note over API: Atualizar PayloadJson ✅<br/>MESMA LÓGICA
    
    API->>DB: UPDATE ChatLog<br/>MESMO FORMATO ✅
    DB-->>API: OK
    
    Note over API: 🆕 NOVA LÓGICA:<br/>Verificar flag UseMetaAPI
    
    alt UseMetaAPI = true 🆕
        alt Mensagem tem attachment
            Note over API: Baixar mídia do MinIO<br/>(já está lá)
            API->>MIO: DownloadMediaAsync(url)
            MIO-->>API: buffer
            
            Note over API: 🆕 Upload para Meta API
            API->>META: POST /{phoneId}/media<br/>FormData: file + metadata
            activate META
            META-->>API: {id: media_id}
            deactivate META
        end
        
        Note over API: 🆕 Enviar via Meta API
        API->>META: POST /{phoneId}/messages<br/>{to, type, text/media}
        activate META
        Note over META: Processar mensagem<br/>Validar destinatário
        META->>WPP: Enviar via WhatsApp
        META-->>API: {messages: [{id: wppId}]}
        deactivate META
        
        Note over API: Atualizar ChatLog com<br/>WhatsApp Message ID
        API->>DB: UPDATE Messages<br/>SET WhatsAppMessageId = wppId
    else UseMetaAPI = false (MODO LEGADO)
        API->>RabbitMQ: PublishAsync()<br/>FLUXO ANTIGO
    end
    
    API->>SR: SendAsync("message.outbound",<br/>MESMO EVENTO ✅)
    SR-->>U: Evento SignalR
    Note over U: MESMA ATUALIZAÇÃO UI ✅
    
    API-->>CS: {success: true, messageId}
    deactivate API
    CS-->>U: Retorna
    deactivate CS
```

---

## 🆕 DIAGRAMA 4: RECEBIMENTO DE MENSAGEM (NOVA ARQUITETURA META API)

```mermaid
sequenceDiagram
    participant WPP as 📱 WhatsApp<br/>(Cliente)
    participant META as ☁️ Meta Cloud API<br/>(Meta Servers)
    participant WHK as 🌐 Webhook Endpoint<br/>(MetaWebhookController)
    participant PROC as 🔧 Webhook Processor<br/>(MetaWebhookProcessor)
    participant MCLI as 📡 Meta API Client<br/>(MetaAPIAdapter)
    participant DB as 💾 PostgreSQL<br/>(ChatLogs)
    participant SR as 🔔 SignalR<br/>(Hub)
    participant U as 👤 Operador<br/>(Frontend)
    
    Note over WPP: Cliente envia mensagem<br/>via WhatsApp
    
    WPP->>META: Mensagem recebida
    activate META
    Note over META: Processar mensagem<br/>Gerar webhook payload
    
    META->>WHK: POST /api/webhooks/meta<br/>{entry, changes, messages}
    activate WHK
    
    Note over WHK: Validar signature<br/>Validar formato
    
    WHK-->>META: 200 OK (IMEDIATO!)
    deactivate META
    Note over META: Webhook confirmado
    
    WHK->>PROC: ProcessWebhookAsync(payload)
    deactivate WHK
    activate PROC
    
    Note over PROC: Extrair messages array<br/>Loop por cada mensagem
    
    alt Mensagem tem mídia
        Note over PROC: Extrair media_id do payload
        
        PROC->>MCLI: DownloadMediaAsync(media_id)
        activate MCLI
        
        MCLI->>META: GET /{media_id}
        META-->>MCLI: {url, mime_type, file_name}
        
        MCLI->>META: GET {download_url}
        META-->>MCLI: binary data
        
        Note over MCLI: Converter para base64<br/>Criar dataUrl
        
        MCLI-->>PROC: {buffer, mimeType, fileName}
        deactivate MCLI
        
        Note over PROC: Construir attachment object<br/>MESMO FORMATO ATUAL ✅
    end
    
    Note over PROC: 🔄 Converter para formato atual:<br/>WhatsAppMessage {<br/>  externalMessageId,<br/>  from, fromNormalized,<br/>  body, attachment<br/>}
    
    Note over PROC: 🔁 REUTILIZAR FUNÇÃO EXISTENTE:<br/>ProcessIncomingMessage()
    
    PROC->>DB: SELECT ChatLog<br/>WHERE phone = from
    DB-->>PROC: ChatLog ou null
    
    alt Chat não existe
        Note over PROC: MESMA LÓGICA ATUAL ✅<br/>Criar Conversation + ChatLog
        PROC->>DB: INSERT ChatLog
    end
    
    Note over PROC: Atualizar PayloadJson<br/>MESMA ESTRUTURA ✅
    PROC->>DB: UPDATE ChatLog<br/>SET PayloadJson = json_updated
    
    PROC->>DB: INSERT Message entity
    
    Note over PROC: Buscar ChatId real
    
    PROC->>SR: SendAsync("message.inbound",<br/>MESMO EVENTO ✅)
    activate SR
    SR->>U: Evento SignalR
    deactivate SR
    activate U
    
    Note over U: MESMA LÓGICA ✅<br/>connection.on('message.inbound')
    
    U->>U: setMessages(prev => [...prev, msg])
    U->>U: queueChatPatch(chatId, update)
    
    Note over U: UI atualizada<br/>ZERO MUDANÇAS ✅
    deactivate U
    deactivate PROC
```

---

## 🔄 DIAGRAMA 5: STATUS UPDATE DE MENSAGEM (META API)

```mermaid
sequenceDiagram
    participant META as ☁️ Meta Cloud API
    participant WHK as 🌐 Webhook Endpoint
    participant PROC as 🔧 Webhook Processor
    participant DB as 💾 PostgreSQL
    participant SR as 🔔 SignalR
    participant U as 👤 Operador<br/>(Frontend)
    
    Note over META: Mensagem foi entregue<br/>ao destinatário
    
    META->>WHK: POST /api/webhooks/meta<br/>{statuses: [{<br/>  id: wppMessageId,<br/>  status: "delivered"<br/>}]}
    
    activate WHK
    WHK-->>META: 200 OK
    
    WHK->>PROC: ProcessStatusUpdate(status)
    deactivate WHK
    activate PROC
    
    Note over PROC: Extrair:<br/>- whatsappMessageId<br/>- novo status
    
    PROC->>DB: UPDATE Messages<br/>SET Status = 'delivered'<br/>WHERE WhatsAppMessageId = X
    DB-->>PROC: OK
    
    PROC->>DB: SELECT ChatLog<br/>JOIN Messages<br/>WHERE Messages.Id = X
    DB-->>PROC: {chatId, clientMessageId}
    
    PROC->>SR: SendAsync("message.status", {<br/>  chatId,<br/>  messageId: clientMessageId,<br/>  status: "delivered"<br/>})
    activate SR
    SR->>U: Evento SignalR
    deactivate SR
    activate U
    
    Note over U: connection.on('message.status')<br/>MESMA LÓGICA ✅
    
    U->>U: setMessages(prev => <br/>  prev.map(m => <br/>    m.id === messageId <br/>    ? {...m, status: 'delivered'}<br/>    : m<br/>  ))
    
    Note over U: Ícone de check duplo ✓✓
    deactivate U
    deactivate PROC
```

---

## 🔀 DIAGRAMA 6: COMPARAÇÃO DUAL MODE

```mermaid
flowchart TB
    START([Operador envia mensagem])
    
    START --> FE[Frontend React<br/>sendMessage]
    FE --> API[Backend API<br/>ChatsController.Send]
    
    API --> SAVE[Salvar ChatLog<br/>PayloadJson]
    SAVE --> UPLOAD[Upload mídia MinIO]
    UPLOAD --> CHECK{UseMetaAPI<br/>flag?}
    
    %% FLUXO LEGADO
    CHECK -->|false<br/>LEGADO| RMQ[RabbitMQ<br/>whatsapp.outgoing]
    RMQ --> ZAP[Zap-Blaster]
    ZAP --> WMINIO[Download MinIO]
    WMINIO --> CONV[Converter áudio<br/>se necessário]
    CONV --> WWEB[whatsapp-web.js<br/>client.sendMessage]
    WWEB --> WPP1[WhatsApp Web]
    WPP1 --> DEST1[Destinatário]
    
    %% FLUXO META API
    CHECK -->|true<br/>META API 🆕| DOWN[Download mídia<br/>do MinIO]
    DOWN --> METAUP[Upload Meta API<br/>POST /media]
    METAUP --> METASEND[Enviar Meta API<br/>POST /messages]
    METASEND --> METAWPP[Meta Cloud API]
    METAWPP --> DEST2[Destinatário]
    
    %% NOTIFICAÇÃO SIGNALR (AMBOS)
    WWEB --> SIG1[SignalR<br/>message.outbound]
    METASEND --> SIG2[SignalR<br/>message.outbound]
    
    SIG1 --> UI[Frontend UI<br/>MESMA ATUALIZAÇÃO ✅]
    SIG2 --> UI
    
    style CHECK fill:#ff6b6b,stroke:#c92a2a,stroke-width:3px,color:#fff
    style UI fill:#51cf66,stroke:#2f9e44,stroke-width:3px,color:#000
    style SAVE fill:#4dabf7,stroke:#1971c2,stroke-width:2px
    style UPLOAD fill:#4dabf7,stroke:#1971c2,stroke-width:2px
```

---

## 🎯 DIAGRAMA 7: MAPEAMENTO DE RESPONSABILIDADES

```mermaid
mindmap
  root((SISTEMA DE<br/>ATENDIMENTO))
    FRONTEND ✅<br/>NÃO MUDA
      UI Components
        ChatListLayout
        MediaRenderer
        LeadsContainer
        OperatorStatus
      Business Logic
        Tickets System
        Audio Recording
        File Attachments
        Security Filters
      Service Layer
        chat-service.ts
        SignalR Listeners
        Type Converters
      State Management
        useState hooks
        Chat store
        Message cache
    
    BACKEND ✅<br/>LÓGICA PRESERVADA
      Database
        ChatLogs
        Conversations
        Messages
        Leads
        Attendances
      Services
        ChatLogService
        ConversationService
        MinIOStorageAdapter
        EmojiResilienceService
      Business Logic
        ProcessIncomingMessage
        Batch Processing
        Duplicate Detection
        Operator Authorization
      SignalR Hub
        WhatsAppHub
        Event Emission
        Groups
    
    INTEGRAÇÃO 🔴<br/>SUBSTITUIR
      Zap-Blaster<br/>whatsapp-web.js
        client.sendMessage
          🆕 MetaAPIAdapter<br/>SendMessageAsync
        client.on message
          🆕 MetaWebhookController<br/>ReceiveWebhook
        downloadMedia
          🆕 DownloadMediaAsync<br/>Meta API
        QR Auth
          🆕 OAuth<br/>Business Manager
      RabbitMQ Queues
        whatsapp.outgoing
          🆕 Direct<br/>Meta API Call
        whatsapp.incoming
          🆕 Meta<br/>Webhook
        message-status
          🆕 Meta Status<br/>Webhook
```

---

## 📊 DIAGRAMA 8: FLUXO DE DADOS - ESTRUTURAS

```mermaid
flowchart LR
    subgraph FRONTEND["🖥️ FRONTEND (React)"]
        FUI[User Interface]
        FMSG[ChatMessageDto]
        FREQ[SendMessageRequest]
    end
    
    subgraph API["🌐 BACKEND API (.NET)"]
        CTRL[ChatsController]
        CHATLOG[(ChatLog<br/>PayloadJson)]
        MSG[(Message<br/>Entity)]
    end
    
    subgraph META["☁️ META CLOUD API"]
        MSEND[POST /messages]
        MDOWN[GET /media]
        MWEB[Webhook Events]
    end
    
    %% ENVIO
    FUI -->|1. User action| FMSG
    FMSG -->|2. chatsApi.send| FREQ
    FREQ -->|3. POST /chats/send| CTRL
    CTRL -->|4. Save| CHATLOG
    CTRL -->|5. Send| MSEND
    MSEND -->|6. Deliver| DEST[📱 Destinatário]
    
    %% RECEBIMENTO
    SENDER[📱 Remetente] -->|1. Send msg| MWEB
    MWEB -->|2. Webhook| CTRL
    CTRL -->|3. ProcessIncoming| CHATLOG
    CTRL -->|4. Save| MSG
    CTRL -->|5. SignalR| FUI
    
    %% MÍDIA
    CTRL <-->|Media Storage| MINIO[(📦 MinIO)]
    CTRL <-->|Media Upload/Download| MDOWN
    
    style CHATLOG fill:#4dabf7,stroke:#1971c2
    style FUI fill:#51cf66,stroke:#2f9e44
    style MSEND fill:#ff6b6b,stroke:#c92a2a
    style MWEB fill:#ff6b6b,stroke:#c92a2a
```

---

## 🔐 DIAGRAMA 9: AUTENTICAÇÃO - ANTES E DEPOIS

```mermaid
flowchart TB
    subgraph ANTES["⚡ ANTES - Zap-Blaster (whatsapp-web.js)"]
        A1[Operador acessa sistema]
        A2[Backend solicita QR via RabbitMQ]
        A3[Zap-Blaster gera QR]
        A4[QR exibido no frontend]
        A5[Operador escaneia com celular]
        A6[WhatsApp Web autentica]
        A7[Sessão salva localmente]
        A8[✅ Sistema conectado]
        
        A1 --> A2 --> A3 --> A4 --> A5 --> A6 --> A7 --> A8
    end
    
    subgraph DEPOIS["🆕 DEPOIS - Meta Cloud API"]
        D1[Admin acessa Meta Business Manager]
        D2[Criar WhatsApp Business Account]
        D3[Verificar número de telefone]
        D4[Gerar System User Token permanente]
        D5[Configurar webhook URL]
        D6[Adicionar tokens no backend]
        D7[✅ Sistema conectado]
        
        D1 --> D2 --> D3 --> D4 --> D5 --> D6 --> D7
        
        Note1[📝 Nota: Configuração única<br/>Token não expira<br/>Múltiplos números permitidos]
        D7 -.-> Note1
    end
    
    style A8 fill:#51cf66,stroke:#2f9e44
    style D7 fill:#51cf66,stroke:#2f9e44
    style Note1 fill:#fff3bf,stroke:#f59f00
```

---

## 📈 DIAGRAMA 10: ESCALABILIDADE

```mermaid
graph TD
    subgraph ATUAL["⚡ ARQUITETURA ATUAL"]
        UA[Frontend N operadores]
        BA[Backend API]
        RA[RabbitMQ]
        ZA[Zap-Blaster<br/>1 INSTÂNCIA]
        WA[WhatsApp Web<br/>1 SESSÃO]
        
        UA --> BA --> RA --> ZA --> WA
        
        LIMA[❌ LIMITAÇÃO:<br/>1 sessão WhatsApp Web<br/>por instância zap-blaster]
    end
    
    subgraph NOVA["🆕 ARQUITETURA META API"]
        UN[Frontend N operadores]
        BN[Backend API]
        MN1[Meta API<br/>Phone 1]
        MN2[Meta API<br/>Phone 2]
        MN3[Meta API<br/>Phone N]
        
        UN --> BN
        BN --> MN1
        BN --> MN2
        BN --> MN3
        
        LIMN[✅ VANTAGEM:<br/>Múltiplos números simultâneos<br/>Múltiplas Business Accounts<br/>Escalabilidade horizontal]
    end
    
    style LIMA fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style LIMN fill:#51cf66,stroke:#2f9e44,color:#000
```

---

## 🎨 DIAGRAMA 11: PRESERVAÇÃO DA UI

```mermaid
flowchart LR
    subgraph UI["🖥️ INTERFACE DO USUÁRIO - ZERO MUDANÇAS"]
        CHAT[Lista de Chats]
        MSGS[Área de Mensagens]
        COMP[Composer<br/>Digite aqui...]
        MEDIA[MediaRenderer<br/>Áudio/Imagem/Vídeo]
        LEADS[Container de Leads]
        TICKET[Sistema de Tickets]
        STATUS[Status Cards<br/>Bot + Operador]
    end
    
    subgraph EVENTS["🔔 EVENTOS SIGNALR - MESMOS"]
        E1[message.inbound]
        E2[message.outbound]
        E3[message.status]
        E4[chat.created]
        E5[chat.updated]
        E6[presence.typing]
    end
    
    subgraph BACKEND["🔧 BACKEND - NOVA FONTE DE DADOS"]
        OLD[❌ Zap-Blaster<br/>whatsapp-web.js]
        NEW[✅ Meta Cloud API<br/>Webhooks]
    end
    
    BACKEND --> EVENTS
    EVENTS --> UI
    
    OLD -.->|REMOVER| EVENTS
    NEW ==>|ADICIONAR| EVENTS
    
    NOTE[📝 FRONTEND NÃO SABE<br/>A DIFERENÇA!<br/>Mesmos eventos = Mesma UI]
    
    EVENTS -.-> NOTE
    
    style UI fill:#51cf66,stroke:#2f9e44
    style EVENTS fill:#4dabf7,stroke:#1971c2
    style OLD fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style NEW fill:#51cf66,stroke:#2f9e44
    style NOTE fill:#fff3bf,stroke:#f59f00
```

---

## 🔧 DIAGRAMA 12: PROCESSAMENTO DE ÁUDIO - COMPARAÇÃO

```mermaid
sequenceDiagram
    participant U as Operador
    participant F as Frontend
    participant B as Backend
    participant S as Storage
    participant W as WhatsApp
    
    Note over U,W: === FLUXO ATUAL (Zap-Blaster) ===
    
    U->>F: Gravar áudio (WebM/Opus)
    F->>F: Convert to base64
    F->>B: POST /send<br/>{dataUrl: "data:audio/webm;base64,..."}
    B->>S: Upload para MinIO<br/>(armazena WebM)
    B->>RabbitMQ: {attachment: {mediaUrl}}
    RabbitMQ->>Zap: Consome fila
    Zap->>S: Download WebM
    Zap->>Zap: FFmpeg: WebM → Opus/OGG<br/>(-c:a libopus -b:a 16k)
    Zap->>W: sendMessage(OGG buffer)
    W->>Dest[Cliente]: 🎵 Áudio reproduzível
    
    Note over U,W: === NOVO FLUXO (Meta API) ===
    
    U->>F: Gravar áudio (WebM/Opus)<br/>MESMA GRAVAÇÃO ✅
    F->>F: Convert to base64<br/>MESMA CONVERSÃO ✅
    F->>B: POST /send<br/>MESMA CHAMADA ✅
    B->>S: Upload para MinIO<br/>MESMO UPLOAD ✅
    
    B->>B: 🆕 Download do MinIO
    B->>B: 🆕 Verificar formato:<br/>- WebM/Opus → Converter para OGG<br/>- OGG/Opus → Usar direto<br/>- MP3/outros → Converter
    B->>Meta[Meta API]: 🆕 POST /media<br/>(upload OGG/Opus)
    Meta-->>B: {id: media_id}
    B->>Meta: 🆕 POST /messages<br/>{type: "audio", audio: {id}}
    Meta->>W: Enviar via Cloud API
    W->>Dest: 🎵 Áudio reproduzível
    
    style F fill:#51cf66,stroke:#2f9e44
    style Meta fill:#ff6b6b,stroke:#c92a2a,color:#fff
```

---

## 💡 DIAGRAMA 13: PONTOS DE INTEGRAÇÃO

```mermaid
graph TB
    subgraph MANTEM["✅ MANTER - NÃO ALTERAR"]
        direction TB
        M1[Frontend UI/UX]
        M2[SignalR Events]
        M3[ChatLog PayloadJson]
        M4[Leads System]
        M5[Tickets System]
        M6[Attendances]
        M7[MinIO Storage]
        M8[Operator Auth]
        M9[Message History]
        M10[Business Logic]
    end
    
    subgraph ALTERA["🔴 ALTERAR - SUBSTITUIR"]
        direction TB
        A1[zap-blaster/zap.js]
        A2[whatsapp-web.js]
        A3[RabbitMQ outgoing queue]
        A4[RabbitMQ incoming queue]
        A5[QR Code generation]
        A6[Session persistence]
    end
    
    subgraph ADICIONA["🆕 ADICIONAR - NOVO"]
        direction TB
        N1[MetaAPIAdapter]
        N2[MetaWebhookController]
        N3[MetaWebhookProcessor]
        N4[Meta OAuth Config]
        N5[Webhook Verification]
        N6[Rate Limiting Meta]
        N7[Media Upload Meta]
        N8[Status Webhooks]
    end
    
    MANTEM -.->|Integra com| ADICIONA
    ALTERA -->|Substituído por| ADICIONA
    
    style MANTEM fill:#51cf66,stroke:#2f9e44
    style ALTERA fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style ADICIONA fill:#4dabf7,stroke:#1971c2
```

---

## 🎯 RESUMO VISUAL

### **PRINCÍPIO FUNDAMENTAL:**

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  "ALTERAR APENAS A CAMADA DE TRANSPORTE,                     │
│   PRESERVAR TODA A LÓGICA DE NEGÓCIO"                        │
│                                                               │
│  Frontend ──► Backend ──► [CAMADA DE TRANSPORTE] ──► WhatsApp│
│     ✅           ✅              🔄 ALTERAR                    │
│  PRESERVA    PRESERVA         Zap-Blaster → Meta API         │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### **ONDE ESTÁ CADA COISA:**

```
📁 ESTRUTURA DO PROJETO
│
├── 🖥️ front/
│   ├── src/pages/atendimento/
│   │   └── index.tsx ✅ NÃO ALTERAR
│   ├── src/services/
│   │   └── chat-service.ts ✅ NÃO ALTERAR (interface)
│   └── src/components/whatsapp/
│       └── MediaRenderer.tsx ✅ NÃO ALTERAR
│
├── 🌐 back/
│   ├── Pregiato.API/
│   │   ├── Controllers/
│   │   │   ├── ChatsController.cs 🔄 MODIFICAR (adicionar Meta API)
│   │   │   └── MetaWebhookController.cs 🆕 CRIAR
│   │   ├── Services/
│   │   │   └── RabbitBackgroundService.cs 🔄 MODIFICAR (opcional)
│   │   └── Hubs/
│   │       └── WhatsAppHub.cs ✅ NÃO ALTERAR
│   │
│   ├── Pregiato.Application/
│   │   └── Services/
│   │       ├── ChatLogService.cs ✅ NÃO ALTERAR
│   │       └── MetaWebhookProcessor.cs 🆕 CRIAR
│   │
│   └── Pregiato.Infrastructure/
│       └── Adapters/
│           ├── MinIOStorageAdapter.cs ✅ NÃO ALTERAR
│           └── MetaAPIAdapter.cs 🆕 CRIAR
│
└── 🤖 zap-blaster-projeto/
    └── zap.js 🔴 DEPRECAR (manter backup)

LEGENDA:
✅ NÃO ALTERAR - Funciona perfeitamente, preservar
🔄 MODIFICAR - Adicionar suporte dual mode
🆕 CRIAR - Novos componentes para Meta API
🔴 DEPRECAR - Será substituído gradualmente
```

---

## 📋 CHECKLIST DE COMPATIBILIDADE

### ✅ **GARANTIR COMPATIBILIDADE TOTAL:**

- [ ] Frontend recebe mesmos eventos SignalR
- [ ] Estrutura de `attachment` permanece igual
- [ ] Tipos de mensagem mapeados corretamente
- [ ] Status de mensagens mapeados corretamente
- [ ] ChatLog.PayloadJson mantém mesma estrutura
- [ ] MinIO continua sendo usado para storage
- [ ] Sistema de leads funciona igual
- [ ] Sistema de tickets funciona igual
- [ ] Autorização de operadores funciona igual
- [ ] Histórico de mensagens funciona igual
- [ ] Gravação de áudio funciona igual
- [ ] Envio de anexos funciona igual
- [ ] Renderização de mídia funciona igual

### 🆕 **NOVOS REQUISITOS META API:**

- [ ] Configurar Meta Business Account
- [ ] Verificar número de telefone com Meta
- [ ] Obter Phone Number ID
- [ ] Gerar Access Token permanente
- [ ] Configurar webhook na Meta Business Manager
- [ ] Implementar endpoint de verificação webhook
- [ ] Implementar endpoint de recebimento webhook
- [ ] Validar assinatura dos webhooks (security)
- [ ] Implementar rate limiting
- [ ] Implementar retry específico Meta
- [ ] Monitorar quotas e limites
- [ ] Configurar templates (para mensagens proativas)

---

**Documento gerado em:** 2025-10-17  
**Versão:** 1.0  
**Tipo:** Diagramas de Sequência e Fluxo

