# 🌐 OPÇÃO 2: IMPLEMENTAÇÃO COM META CLOUD API

## 🎯 VOCÊ ESCOLHEU A OPÇÃO 2!

Excelente escolha! Esta é a opção **oficial e production-ready**, ideal para sistemas profissionais.

**Pré-requisitos:**
- ✅ Ter implementado as camadas comuns
- ✅ Ter Meta Business Account
- ✅ Ter WhatsApp Business Account configurado
- ✅ Ter Phone Number ID e Access Token
- ✅ Webhook com HTTPS configurado

---

## 🚀 O QUE VOCÊ VAI CONSTRUIR

Um microserviço enterprise de atendimento WhatsApp usando:
- ✅ Meta Cloud API (API oficial)
- ✅ Webhooks para recebimento
- ✅ OAuth 2.0 authentication
- ✅ Upload/download de mídia oficial
- ✅ Features enterprise (templates, botões)

---

## ⏱️ DURAÇÃO ESTIMADA

**Total:** 7 horas
- Setup Meta Business: 2 horas
- MetaAPIAdapter: 2 horas
- WebhookHandler: 2 horas
- Integração e testes: 1 hora

---

## 📚 ARQUITETURA ESPECÍFICA

```
opcao-2-meta-api/
├── infrastructure/
│   ├── MetaAPIAdapter.js        # Adapter principal
│   ├── WebhookHandler.js        # Processamento webhooks
│   └── TokenManager.js          # Gerenciamento tokens
│
├── config/
│   └── meta-config.js           # Configurações
│
├── app.js                        # Aplicação principal
├── package.json                  # Dependências
└── .env.example                  # Variáveis de ambiente
```

---

## 🔐 PASSO 1: SETUP META BUSINESS (2 horas)

### **1.1 Criar Meta Business Account**

1. Acesse https://business.facebook.com
2. Clique em "Create Account"
3. Preencha informações da empresa
4. Verifique identidade (documento + email)

### **1.2 Configurar WhatsApp Business**

1. Menu: "WhatsApp Accounts"
2. Botão: "Add WhatsApp Business Account"
3. Preencher:
   ```
   Nome: Pregiato Atendimento
   Categoria: Serviços
   Descrição: Sistema de atendimento ao cliente
   ```

### **1.3 Adicionar Número de Telefone**

**Opção A: Usar número existente**
```
1. Clique "Add Phone Number"
2. Selecione "Use existing number"
3. Digite: +55 11 98765-4321
4. Método: SMS
5. Digite código recebido
6. Confirmar
```

**Opção B: Obter número Meta (grátis)**
```
1. Clique "Add Phone Number"
2. Selecione "Get a new number"
3. País: United States (+1)
4. Número fornecido pela Meta
```

### **1.4 Obter Phone Number ID**

```
WhatsApp Account → Settings → Phone Numbers

Phone Number ID: 123456789012345

📋 COPIE E SALVE!
```

### **1.5 Criar System User e Token**

```
1. Business Settings → Users → System Users
2. Add → Nome: "Pregiato API"
3. Role: Admin
4. Add Assets → WhatsApp Account (Full Control)
5. Generate New Token:
   
   Permissions:
   ✅ whatsapp_business_messaging
   ✅ whatsapp_business_management
   
   Expiration: Never expire
   
6. [Generate Token]

Access Token:
EAABsbCS1iHgBO4ZBxZCXaGlkKJHGFkjhgkjHGjhgKJHgjhG...

⚠️ COPIE AGORA! Não será exibido novamente!
📋 Salve em local seguro!
```

### **1.6 Configurar Webhook**

```
WhatsApp Account → Configuration → Webhook

Callback URL:
https://seu-dominio.com/api/webhooks/meta

Verify Token:
seu_token_secreto_aqui

Subscribe to Fields:
✅ messages
✅ message_status

[Verify and Save]
```

---

## 📦 PASSO 2: INSTALAÇÃO E SETUP (30 min)

### **2.1 Instalar Dependências**

```bash
cd opcao-2-meta-api

npm init -y

npm install axios@1.7.4 \
  express@4.18.2 \
  cors@2.8.5 \
  dotenv@16.4.5 \
  amqplib@0.10.4 \
  minio@8.0.1 \
  crypto
```

### **2.2 Criar Estrutura**

```bash
mkdir -p infrastructure config
```

### **2.3 Configurar .env**

```bash
# .env
NODE_ENV=development
PORT=3000

# Meta API
META_PHONE_NUMBER_ID=123456789012345
META_ACCESS_TOKEN=EAABsbCS1iHgBO4ZBxZCXaGlkKJHGFkjhgkjHG...
META_WEBHOOK_VERIFY_TOKEN=seu_token_secreto_aqui
META_API_VERSION=v21.0
META_BASE_URL=https://graph.facebook.com/v21.0

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=midias
```

---

## 💻 PASSO 3: IMPLEMENTAR METAAPIADAPTER (2 horas)

### **3.1 Configuração Base**

```javascript
// config/meta-config.js

module.exports = {
  phoneNumberId: process.env.META_PHONE_NUMBER_ID,
  accessToken: process.env.META_ACCESS_TOKEN,
  webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN,
  apiVersion: process.env.META_API_VERSION || 'v21.0',
  baseUrl: process.env.META_BASE_URL || 'https://graph.facebook.com/v21.0',
  
  timeout: 30000, // 30 segundos
  
  retries: {
    max: 3,
    delay: 1000
  }
};
```

### **3.2 MetaAPIAdapter Completo**

```javascript
// infrastructure/MetaAPIAdapter.js

const axios = require('axios');
const config = require('../config/meta-config');

class MetaAPIAdapter {
  constructor() {
    this.baseUrl = config.baseUrl;
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
    
    // Configurar axios
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Envia mensagem de texto
   */
  async sendTextMessage(to, body) {
    try {
      console.log(`📤 [META] Enviando mensagem de texto - To: ${to}`);

      const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          body: body,
          preview_url: body.includes('http')
        }
      });

      const messageId = response.data.messages[0].id;

      console.log(`✅ [META] Mensagem enviada - ID: ${messageId}`);

      return {
        success: true,
        whatsappMessageId: messageId
      };

    } catch (error) {
      console.error('❌ [META] Erro ao enviar mensagem:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Upload de mídia para Meta
   */
  async uploadMedia(buffer, mimeType, fileName) {
    try {
      console.log(`📤 [META] Uploading mídia - File: ${fileName}, Size: ${buffer.length} bytes`);

      const FormData = require('form-data');
      const form = new FormData();
      
      form.append('messaging_product', 'whatsapp');
      form.append('file', buffer, {
        filename: fileName,
        contentType: mimeType
      });

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/media`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${this.accessToken}`
          },
          timeout: 60000 // 60s para upload
        }
      );

      const mediaId = response.data.id;

      console.log(`✅ [META] Mídia uploaded - Media ID: ${mediaId}`);

      return {
        success: true,
        mediaId: mediaId
      };

    } catch (error) {
      console.error('❌ [META] Erro no upload:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Envia mensagem com mídia
   */
  async sendMediaMessage(to, media, caption = '') {
    try {
      console.log(`📤 [META] Enviando mensagem de mídia - To: ${to}, Type: ${media.type}`);

      // 1. Upload da mídia primeiro
      const uploadResult = await this.uploadMedia(
        media.buffer || this.dataUrlToBuffer(media.dataUrl),
        media.mimeType,
        media.fileName
      );

      if (!uploadResult.success) {
        throw new Error(`Upload failed: ${uploadResult.error}`);
      }

      // 2. Montar request baseado no tipo
      const mediaType = media.type === 'voice' ? 'audio' : media.type;
      
      const request = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: mediaType
      };

      // Adicionar mídia ao campo correto
      request[mediaType] = {
        id: uploadResult.mediaId
      };

      // Adicionar caption se suportado
      if (['image', 'video', 'document'].includes(mediaType) && caption) {
        request[mediaType].caption = caption;
      }

      // 3. Enviar mensagem
      const response = await this.client.post(`/${this.phoneNumberId}/messages`, request);

      const messageId = response.data.messages[0].id;

      console.log(`✅ [META] Mídia enviada - ID: ${messageId}`);

      return {
        success: true,
        whatsappMessageId: messageId,
        mediaId: uploadResult.mediaId
      };

    } catch (error) {
      console.error('❌ [META] Erro ao enviar mídia:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Download de mídia recebida
   */
  async downloadMedia(mediaId) {
    try {
      console.log(`📥 [META] Baixando mídia - Media ID: ${mediaId}`);

      // 1. Obter URL de download
      const infoResponse = await this.client.get(`/${mediaId}`);
      const mediaUrl = infoResponse.data.url;
      const mimeType = infoResponse.data.mime_type;

      console.log(`📋 [META] Media URL obtida - MimeType: ${mimeType}`);

      // 2. Baixar arquivo
      const downloadResponse = await axios.get(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(downloadResponse.data);

      console.log(`✅ [META] Mídia baixada - Size: ${buffer.length} bytes`);

      return {
        success: true,
        buffer: buffer,
        mimeType: mimeType
      };

    } catch (error) {
      console.error('❌ [META] Erro ao baixar mídia:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Marca mensagem como lida
   */
  async markAsRead(messageId) {
    try {
      console.log(`✓ [META] Marcando como lida - Message ID: ${messageId}`);

      await this.client.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      });

      console.log(`✅ [META] Mensagem marcada como lida`);

      return { success: true };

    } catch (error) {
      console.error('❌ [META] Erro ao marcar como lida:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém informações do número
   */
  async getPhoneNumberInfo() {
    try {
      const response = await this.client.get(`/${this.phoneNumberId}`);
      
      return {
        success: true,
        info: response.data
      };

    } catch (error) {
      console.error('❌ [META] Erro ao obter info do número:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check
   */
  async isHealthy() {
    try {
      const result = await this.getPhoneNumberInfo();
      return result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Auxiliar: Converte data URL para buffer
   */
  dataUrlToBuffer(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    return Buffer.from(base64, 'base64');
  }
}

module.exports = MetaAPIAdapter;
```

---

## 🔄 PASSO 4: IMPLEMENTAR WEBHOOKHANDLER (2 horas)

### **4.1 WebhookHandler Completo**

```javascript
// infrastructure/WebhookHandler.js

const crypto = require('crypto');
const config = require('../config/meta-config');

class WebhookHandler {
  constructor(rabbitMQAdapter, metaAPIAdapter) {
    this.rabbitMQAdapter = rabbitMQAdapter;
    this.metaAPIAdapter = metaAPIAdapter;
  }

  /**
   * Verifica webhook (GET request da Meta)
   */
  verifyWebhook(mode, verifyToken, challenge) {
    console.log('📞 [WEBHOOK] Verificação recebida');

    if (mode === 'subscribe' && verifyToken === config.webhookVerifyToken) {
      console.log('✅ [WEBHOOK] Verificação bem-sucedida');
      return challenge;
    }

    console.warn('⚠️ [WEBHOOK] Verificação falhou');
    return null;
  }

  /**
   * Processa webhook (POST request da Meta)
   */
  async processWebhook(payload) {
    try {
      console.log('📨 [WEBHOOK] Webhook recebido - Entries: ' + (payload.entry?.length || 0));

      if (!payload.entry || !payload.entry.length) {
        console.warn('⚠️ [WEBHOOK] Payload sem entries');
        return;
      }

      for (const entry of payload.entry) {
        if (!entry.changes || !entry.changes.length) continue;

        for (const change of entry.changes) {
          const value = change.value;

          // Processar mensagens
          if (value.messages && value.messages.length) {
            for (const message of value.messages) {
              await this.processInboundMessage(message, value.metadata);
            }
          }

          // Processar status updates
          if (value.statuses && value.statuses.length) {
            for (const status of value.statuses) {
              await this.processMessageStatus(status);
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ [WEBHOOK] Erro ao processar:', error);
    }
  }

  /**
   * Processa mensagem recebida
   */
  async processInboundMessage(message, metadata) {
    try {
      console.log(`📨 [WEBHOOK] Mensagem inbound - From: ${message.from}, Type: ${message.type}`);

      // Criar payload no formato interno
      const payload = {
        externalMessageId: message.id,
        from: message.from,
        to: metadata.phone_number_id,
        type: this.mapMetaType(message.type),
        body: this.extractMessageBody(message),
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        fromMe: false,
        isGroup: false
      };

      // Processar mídia se existir
      if (this.hasMedia(message)) {
        const mediaId = this.extractMediaId(message);
        
        if (mediaId) {
          console.log(`📎 [WEBHOOK] Mensagem tem mídia - ID: ${mediaId}`);
          
          // Download da mídia
          const mediaResult = await this.metaAPIAdapter.downloadMedia(mediaId);
          
          if (mediaResult.success) {
            // Converter para data URL
            const base64 = mediaResult.buffer.toString('base64');
            const dataUrl = `data:${mediaResult.mimeType};base64,${base64}`;
            
            payload.media = {
              mimeType: mediaResult.mimeType,
              data: base64,
              dataUrl: dataUrl
            };

            // Para áudio, adicionar ao body também
            if (payload.type === 'audio' || payload.type === 'voice') {
              payload.body = dataUrl;
            }
          }
        }
      }

      // Publicar no RabbitMQ
      await this.rabbitMQAdapter.publish('whatsapp.incoming', payload);

      // Marcar como lida
      await this.metaAPIAdapter.markAsRead(message.id);

      console.log(`✅ [WEBHOOK] Mensagem processada - ID: ${message.id}`);

    } catch (error) {
      console.error('❌ [WEBHOOK] Erro ao processar mensagem:', error);
    }
  }

  /**
   * Processa status update
   */
  async processMessageStatus(status) {
    try {
      console.log(`📊 [WEBHOOK] Status update - ID: ${status.id}, Status: ${status.status}`);

      const payload = {
        whatsappMessageId: status.id,
        status: this.mapMetaStatus(status.status),
        recipientId: status.recipient_id,
        timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString()
      };

      // Publicar no RabbitMQ
      await this.rabbitMQAdapter.publish('whatsapp.message-status', payload);

      console.log(`✅ [WEBHOOK] Status publicado`);

    } catch (error) {
      console.error('❌ [WEBHOOK] Erro ao processar status:', error);
    }
  }

  /**
   * Mapeia tipo da Meta para tipo interno
   */
  mapMetaType(metaType) {
    const typeMap = {
      'text': 'text',
      'image': 'image',
      'audio': 'audio',
      'voice': 'voice',
      'video': 'video',
      'document': 'document',
      'sticker': 'sticker',
      'location': 'location',
      'contacts': 'contact'
    };

    return typeMap[metaType] || 'text';
  }

  /**
   * Mapeia status da Meta para status interno
   */
  mapMetaStatus(metaStatus) {
    const statusMap = {
      'sent': 'sent',
      'delivered': 'delivered',
      'read': 'read',
      'failed': 'failed'
    };

    return statusMap[metaStatus] || 'sent';
  }

  /**
   * Extrai corpo da mensagem
   */
  extractMessageBody(message) {
    switch (message.type) {
      case 'text':
        return message.text?.body || '';
      case 'image':
        return message.image?.caption || '';
      case 'video':
        return message.video?.caption || '';
      case 'document':
        return message.document?.caption || message.document?.filename || '';
      case 'location':
        return JSON.stringify(message.location);
      case 'contacts':
        return message.contacts?.[0]?.name?.formatted_name || '';
      default:
        return '';
    }
  }

  /**
   * Verifica se mensagem tem mídia
   */
  hasMedia(message) {
    return ['image', 'audio', 'voice', 'video', 'document', 'sticker'].includes(message.type);
  }

  /**
   * Extrai media ID
   */
  extractMediaId(message) {
    if (message.image) return message.image.id;
    if (message.audio) return message.audio.id;
    if (message.voice) return message.voice.id || message.audio?.id;
    if (message.video) return message.video.id;
    if (message.document) return message.document.id;
    if (message.sticker) return message.sticker.id;
    return null;
  }
}

module.exports = WebhookHandler;
```

---

## 🔌 PASSO 5: INTEGRAÇÃO (1 hora)

### **5.1 Criar Rotas de Webhook**

```javascript
// routes/webhook.routes.js

const express = require('express');
const router = express.Router();

module.exports = (webhookHandler) => {
  /**
   * GET - Verificação de webhook pela Meta
   */
  router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const result = webhookHandler.verifyWebhook(mode, token, challenge);

    if (result) {
      res.status(200).send(result);
    } else {
      res.status(403).send('Forbidden');
    }
  });

  /**
   * POST - Recebimento de webhooks
   */
  router.post('/', async (req, res) => {
    try {
      const payload = req.body;

      // Processar assincronamente
      webhookHandler.processWebhook(payload).catch(err => {
        console.error('❌ Erro no processamento assíncrono:', err);
      });

      // Responder imediatamente (Meta exige < 5s)
      res.status(200).send('OK');

    } catch (error) {
      console.error('❌ Erro ao receber webhook:', error);
      res.status(200).send('OK'); // Sempre retornar OK
    }
  });

  return router;
};
```

### **5.2 Aplicação Principal**

```javascript
// app.js

require('dotenv').config();
const express = require('express');
const App = require('../comum/presentation/app');
const MessageService = require('../comum/application/services/MessageService');
const MediaService = require('../comum/application/services/MediaService');
const RabbitMQAdapter = require('../comum/infrastructure/adapters/RabbitMQAdapter');
const MinIOAdapter = require('../comum/infrastructure/adapters/MinIOAdapter');
const MetaAPIAdapter = require('./infrastructure/MetaAPIAdapter');
const WebhookHandler = require('./infrastructure/WebhookHandler');
const webhookRoutes = require('./routes/webhook.routes');

async function main() {
  try {
    console.log('🚀 Iniciando Microserviço - Opção 2 (Meta API)');

    // 1. Inicializar adapters comuns
    const rabbitMQAdapter = new RabbitMQAdapter(process.env.RABBITMQ_URL);
    await rabbitMQAdapter.connect();

    const minIOAdapter = new MinIOAdapter({
      endpoint: process.env.MINIO_ENDPOINT,
      port: parseInt(process.env.MINIO_PORT),
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      bucket: process.env.MINIO_BUCKET
    });

    // 2. Inicializar MetaAPIAdapter
    const metaAPIAdapter = new MetaAPIAdapter();

    // 3. Verificar health da Meta API
    const isHealthy = await metaAPIAdapter.isHealthy();
    if (!isHealthy) {
      console.warn('⚠️ Meta API não está acessível');
    } else {
      console.log('✅ Meta API conectada');
    }

    // 4. Inicializar WebhookHandler
    const webhookHandler = new WebhookHandler(
      rabbitMQAdapter,
      metaAPIAdapter
    );

    // 5. Inicializar serviços de aplicação
    const mediaService = new MediaService(minIOAdapter);
    const messageService = new MessageService(
      metaAPIAdapter,
      mediaService,
      rabbitMQAdapter
    );

    // 6. Iniciar API REST
    const app = new App(messageService);

    // 7. Adicionar rotas de webhook
    app.app.use('/api/webhooks/meta', webhookRoutes(webhookHandler));

    app.start(process.env.PORT || 3000);

    console.log('✅ Microserviço iniciado com sucesso!');
    console.log(`📍 Webhook URL: http://localhost:${process.env.PORT || 3000}/api/webhooks/meta`);

  } catch (error) {
    console.error('❌ Erro ao iniciar microserviço:', error);
    process.exit(1);
  }
}

// Iniciar
main();
```

---

## 🧪 PASSO 6: TESTES (1 hora)

### **6.1 Testar Webhook Verification**

```bash
curl -X GET "http://localhost:3000/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=seu_token_secreto_aqui&hub.challenge=test123"

# Esperado: test123
```

### **6.2 Testar Envio de Mensagem**

```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "body": "Teste via Meta Cloud API!"
  }'
```

### **6.3 Validar Resposta**

```json
{
  "success": true,
  "message": {
    "id": "msg_1234567890_abc",
    "status": "sent",
    "whatsappMessageId": "wamid.HBgNNTUxMTk4NzY1NDMyMRUC...",
    "timestamp": "2025-10-17T12:00:00.000Z"
  }
}
```

### **6.4 Testar Recebimento via Webhook**

Envie uma mensagem do WhatsApp para o número configurado e verifique os logs:

```
📨 [WEBHOOK] Webhook recebido
📨 [WEBHOOK] Mensagem inbound - From: 5511999999999
✅ [WEBHOOK] Mensagem processada
```

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] Meta Business Account configurada
- [ ] WhatsApp Business Account criado
- [ ] Número verificado
- [ ] Phone Number ID obtido
- [ ] Access Token gerado
- [ ] Webhook configurado
- [ ] MetaAPIAdapter implementado
- [ ] WebhookHandler implementado
- [ ] Webhook verification funcionando
- [ ] Envio de texto funcionando
- [ ] Envio de mídia funcionando
- [ ] Recebimento via webhook OK
- [ ] Status updates funcionando

---

## 🎯 RESULTADO FINAL

**Você completou a Opção 2!** 🎉

Agora você tem um microserviço **enterprise-grade** de atendimento WhatsApp usando a API oficial da Meta!

**Diferenciais desta implementação:**
- ✅ API oficial (não viola ToS)
- ✅ Estável e confiável
- ✅ Pronto para produção
- ✅ Escalável
- ✅ Suporte oficial da Meta

**Próximos passos:**
- ✅ Deploy em produção (Railway/AWS)
- ✅ Configure HTTPS para webhook
- ✅ Adicione ao portfolio
- ✅ Compare com Opção 1

**Parabéns! Você dominou a Meta Cloud API! 🚀**

