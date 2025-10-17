# 🧩 CAMADAS COMUNS - MICROSERVIÇO DE ATENDIMENTO

## 📋 VISÃO GERAL

Este diretório contém o código **compartilhado** entre as duas opções de implementação (Web Client e Meta API). Independente da escolha, você implementará estas camadas primeiro.

---

## 🎯 O QUE VOCÊ VAI CONSTRUIR

Um microserviço robusto com:
- ✅ **Domain Layer** - Lógica de negócio pura
- ✅ **Application Layer** - Casos de uso e orquestração
- ✅ **Presentation Layer** - API REST
- ✅ **Infrastructure (Common)** - Serviços compartilhados

---

## 📐 ARQUITETURA DAS CAMADAS COMUNS

```
comum/
├── domain/                    # 🟦 DOMAIN LAYER
│   ├── entities/
│   │   ├── Message.js        # Entidade de mensagem
│   │   ├── Contact.js        # Entidade de contato
│   │   └── Media.js          # Entidade de mídia
│   │
│   └── value-objects/
│       ├── PhoneNumber.js    # Value object para telefone
│       └── MessageStatus.js  # Enum de status
│
├── application/               # 🟩 APPLICATION LAYER
│   ├── services/
│   │   ├── MessageService.js     # Serviço de mensagens
│   │   ├── MediaService.js       # Serviço de mídia
│   │   └── ValidationService.js  # Serviço de validação
│   │
│   └── dtos/
│       ├── SendMessageDto.js
│       └── MessageResponseDto.js
│
├── presentation/              # 🟨 PRESENTATION LAYER
│   ├── routes/
│   │   ├── messages.routes.js
│   │   └── health.routes.js
│   │
│   ├── controllers/
│   │   └── MessageController.js
│   │
│   └── middleware/
│       ├── errorHandler.js
│       ├── validation.js
│       └── logger.js
│
└── infrastructure/            # 🟧 INFRASTRUCTURE (COMUM)
    ├── adapters/
    │   ├── RabbitMQAdapter.js
    │   ├── MinIOAdapter.js
    │   └── MySQLAdapter.js
    │
    └── config/
        ├── database.js
        └── rabbitmq.js
```

---

## 🟦 DOMAIN LAYER

### **Conceito: Coração da Aplicação**

A camada de domínio contém a **lógica de negócio pura**, sem dependências externas.

### **Implementação: Message Entity**

```javascript
// domain/entities/Message.js

class Message {
  constructor(data) {
    this.id = data.id;
    this.from = data.from;
    this.to = data.to;
    this.body = data.body;
    this.type = data.type || 'text';
    this.timestamp = data.timestamp || new Date().toISOString();
    this.status = data.status || 'pending';
    this.metadata = data.metadata || {};
  }

  /**
   * Validações de negócio
   */
  validate() {
    if (!this.from || !this.to || !this.body) {
      throw new Error('Campos obrigatórios: from, to, body');
    }

    if (!this.isValidPhone(this.from) || !this.isValidPhone(this.to)) {
      throw new Error('Números de telefone inválidos');
    }

    if (!this.isValidType()) {
      throw new Error(`Tipo de mensagem inválido: ${this.type}`);
    }

    return true;
  }

  /**
   * Valida formato E.164 do telefone
   */
  isValidPhone(phone) {
    const phoneRegex = /^\d{10,15}$/;
    const digitsOnly = phone.replace(/\D/g, '');
    return phoneRegex.test(digitsOnly);
  }

  /**
   * Valida tipo de mensagem
   */
  isValidType() {
    const validTypes = ['text', 'image', 'audio', 'video', 'document'];
    return validTypes.includes(this.type);
  }

  /**
   * Marca mensagem como enviada
   */
  markAsSent(whatsappMessageId) {
    this.status = 'sent';
    this.metadata.whatsappMessageId = whatsappMessageId;
    this.metadata.sentAt = new Date().toISOString();
  }

  /**
   * Marca mensagem como entregue
   */
  markAsDelivered() {
    this.status = 'delivered';
    this.metadata.deliveredAt = new Date().toISOString();
  }

  /**
   * Marca mensagem como lida
   */
  markAsRead() {
    this.status = 'read';
    this.metadata.readAt = new Date().toISOString();
  }

  /**
   * Marca mensagem como falha
   */
  markAsFailed(error) {
    this.status = 'failed';
    this.metadata.error = error;
    this.metadata.failedAt = new Date().toISOString();
  }

  /**
   * Converte para objeto simples (para persistência)
   */
  toJSON() {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      body: this.body,
      type: this.type,
      timestamp: this.timestamp,
      status: this.status,
      metadata: this.metadata
    };
  }

  /**
   * Cria instância a partir de objeto
   */
  static fromJSON(data) {
    return new Message(data);
  }
}

module.exports = Message;
```

### **Implementação: Contact Entity**

```javascript
// domain/entities/Contact.js

class Contact {
  constructor(data) {
    this.phoneNumber = data.phoneNumber;
    this.name = data.name || 'Unknown';
    this.profilePic = data.profilePic || null;
    this.isLead = data.isLead || false;
  }

  /**
   * Normaliza número para E.164
   */
  normalizePhoneNumber() {
    const digits = this.phoneNumber.replace(/\D/g, '');
    
    // Para números brasileiros (10 ou 11 dígitos)
    if (digits.length === 10 || digits.length === 11) {
      return `55${digits}`; // Adiciona código do Brasil
    }
    
    return digits;
  }

  /**
   * Formata número para exibição
   */
  getFormattedPhone() {
    const normalized = this.normalizePhoneNumber();
    
    // Formato: +55 11 99999-9999
    if (normalized.startsWith('55') && normalized.length === 13) {
      return `+${normalized.slice(0, 2)} ${normalized.slice(2, 4)} ${normalized.slice(4, 9)}-${normalized.slice(9)}`;
    }
    
    return `+${normalized}`;
  }

  /**
   * Verifica se é contato válido
   */
  isValid() {
    const normalized = this.normalizePhoneNumber();
    return normalized.length >= 10 && normalized.length <= 15;
  }

  toJSON() {
    return {
      phoneNumber: this.normalizePhoneNumber(),
      name: this.name,
      profilePic: this.profilePic,
      isLead: this.isLead
    };
  }
}

module.exports = Contact;
```

### **Implementação: Media Entity**

```javascript
// domain/entities/Media.js

class Media {
  constructor(data) {
    this.id = data.id;
    this.type = data.type; // image, audio, video, document
    this.mimeType = data.mimeType;
    this.fileName = data.fileName;
    this.fileSize = data.fileSize;
    this.dataUrl = data.dataUrl || null;
    this.storageUrl = data.storageUrl || null;
    this.metadata = data.metadata || {};
  }

  /**
   * Valida tipo de mídia
   */
  validate() {
    const validTypes = ['image', 'audio', 'video', 'document'];
    
    if (!validTypes.includes(this.type)) {
      throw new Error(`Tipo de mídia inválido: ${this.type}`);
    }

    if (!this.mimeType) {
      throw new Error('MIME type é obrigatório');
    }

    if (!this.dataUrl && !this.storageUrl) {
      throw new Error('DataUrl ou StorageUrl é obrigatório');
    }

    return true;
  }

  /**
   * Verifica se é imagem
   */
  isImage() {
    return this.type === 'image';
  }

  /**
   * Verifica se é áudio
   */
  isAudio() {
    return this.type === 'audio';
  }

  /**
   * Verifica se é vídeo
   */
  isVideo() {
    return this.type === 'video';
  }

  /**
   * Verifica se é documento
   */
  isDocument() {
    return this.type === 'document';
  }

  /**
   * Extrai extensão do arquivo
   */
  getFileExtension() {
    if (this.fileName) {
      return this.fileName.split('.').pop();
    }

    // Fallback baseado em MIME type
    const extensions = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'video/mp4': 'mp4',
      'application/pdf': 'pdf'
    };

    return extensions[this.mimeType] || 'bin';
  }

  /**
   * Formata tamanho do arquivo
   */
  getFormattedSize() {
    if (!this.fileSize) return 'Unknown';

    const kb = this.fileSize / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;

    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      mimeType: this.mimeType,
      fileName: this.fileName,
      fileSize: this.fileSize,
      dataUrl: this.dataUrl,
      storageUrl: this.storageUrl,
      metadata: this.metadata
    };
  }
}

module.exports = Media;
```

---

## 🟩 APPLICATION LAYER

### **Conceito: Orquestração de Casos de Uso**

A camada de aplicação orquestra a lógica de negócio, coordenando entidades e serviços externos.

### **Implementação: MessageService**

```javascript
// application/services/MessageService.js

class MessageService {
  constructor(whatsappAdapter, mediaService, rabbitMQAdapter) {
    this.whatsappAdapter = whatsappAdapter;
    this.mediaService = mediaService;
    this.rabbitMQAdapter = rabbitMQAdapter;
  }

  /**
   * Envia mensagem de texto
   */
  async sendTextMessage(dto) {
    try {
      // 1. Criar entidade Message
      const message = new Message({
        id: this.generateMessageId(),
        from: dto.from,
        to: dto.to,
        body: dto.body,
        type: 'text'
      });

      // 2. Validar
      message.validate();

      // 3. Enviar via adapter
      const result = await this.whatsappAdapter.sendTextMessage(
        message.to,
        message.body
      );

      // 4. Atualizar status
      if (result.success) {
        message.markAsSent(result.whatsappMessageId);
      } else {
        message.markAsFailed(result.error);
      }

      // 5. Publicar status no RabbitMQ
      await this.rabbitMQAdapter.publish('whatsapp.message-status', {
        clientMessageId: message.id,
        whatsappMessageId: result.whatsappMessageId,
        status: message.status,
        timestamp: new Date().toISOString()
      });

      // 6. Retornar resultado
      return {
        success: result.success,
        message: message.toJSON()
      };

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Envia mensagem com mídia
   */
  async sendMediaMessage(dto) {
    try {
      // 1. Criar entidades
      const message = new Message({
        id: this.generateMessageId(),
        from: dto.from,
        to: dto.to,
        body: dto.caption || '',
        type: dto.mediaType
      });

      const media = new Media({
        id: this.generateMediaId(),
        type: dto.mediaType,
        mimeType: dto.mimeType,
        fileName: dto.fileName,
        dataUrl: dto.dataUrl
      });

      // 2. Validar
      message.validate();
      media.validate();

      // 3. Processar mídia
      const processedMedia = await this.mediaService.processMedia(media);

      // 4. Enviar via adapter
      const result = await this.whatsappAdapter.sendMediaMessage(
        message.to,
        processedMedia,
        message.body
      );

      // 5. Atualizar status
      if (result.success) {
        message.markAsSent(result.whatsappMessageId);
      } else {
        message.markAsFailed(result.error);
      }

      // 6. Publicar status
      await this.rabbitMQAdapter.publish('whatsapp.message-status', {
        clientMessageId: message.id,
        whatsappMessageId: result.whatsappMessageId,
        status: message.status,
        timestamp: new Date().toISOString()
      });

      return {
        success: result.success,
        message: message.toJSON(),
        media: media.toJSON()
      };

    } catch (error) {
      console.error('❌ Erro ao enviar mídia:', error);
      throw error;
    }
  }

  /**
   * Gera ID único para mensagem
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gera ID único para mídia
   */
  generateMediaId() {
    return `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = MessageService;
```

### **Implementação: MediaService**

```javascript
// application/services/MediaService.js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // Para processamento de imagens

class MediaService {
  constructor(minIOAdapter) {
    this.minIOAdapter = minIOAdapter;
  }

  /**
   * Processa mídia antes de enviar
   */
  async processMedia(media) {
    try {
      // 1. Validar
      media.validate();

      // 2. Converter dataUrl para buffer
      const buffer = this.dataUrlToBuffer(media.dataUrl);

      // 3. Processar baseado no tipo
      let processedBuffer = buffer;

      if (media.isImage()) {
        processedBuffer = await this.processImage(buffer);
      } else if (media.isAudio()) {
        processedBuffer = await this.processAudio(buffer);
      }

      // 4. Upload para MinIO
      const storageUrl = await this.minIOAdapter.uploadMedia(
        processedBuffer,
        media.mimeType,
        media.fileName
      );

      // 5. Atualizar media entity
      media.storageUrl = storageUrl;
      media.fileSize = processedBuffer.length;

      return media;

    } catch (error) {
      console.error('❌ Erro ao processar mídia:', error);
      throw error;
    }
  }

  /**
   * Processa imagem (compressão, resize)
   */
  async processImage(buffer) {
    try {
      return await sharp(buffer)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch (error) {
      console.error('❌ Erro ao processar imagem:', error);
      return buffer; // Retorna original se falhar
    }
  }

  /**
   * Processa áudio (conversão para Opus se necessário)
   */
  async processAudio(buffer) {
    // TODO: Implementar conversão FFmpeg se necessário
    return buffer;
  }

  /**
   * Converte data URL para buffer
   */
  dataUrlToBuffer(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      throw new Error('Data URL inválida');
    }

    // Extrair base64
    const base64 = dataUrl.split(',')[1];
    
    if (!base64) {
      throw new Error('Base64 não encontrado na data URL');
    }

    return Buffer.from(base64, 'base64');
  }

  /**
   * Converte buffer para data URL
   */
  bufferToDataUrl(buffer, mimeType) {
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }
}

module.exports = MediaService;
```

---

## 🟨 PRESENTATION LAYER

### **Conceito: Interface Externa (API REST)**

A camada de apresentação expõe a funcionalidade via API REST.

### **Implementação: Express Server**

```javascript
// presentation/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const messageRoutes = require('./routes/messages.routes');
const healthRoutes = require('./routes/health.routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

class App {
  constructor(messageService) {
    this.app = express();
    this.messageService = messageService;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Logging
    this.app.use(logger);
  }

  setupRoutes() {
    // Health check
    this.app.use('/health', healthRoutes);

    // Messages API
    this.app.use('/api/messages', messageRoutes(this.messageService));
  }

  setupErrorHandling() {
    // 404 Handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });

    // Error handler
    this.app.use(errorHandler);
  }

  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`🚀 Microserviço rodando na porta ${port}`);
    });
  }
}

module.exports = App;
```

### **Implementação: Message Routes**

```javascript
// presentation/routes/messages.routes.js

const express = require('express');
const router = express.Router();

module.exports = (messageService) => {
  /**
   * POST /api/messages/send
   * Envia mensagem de texto ou mídia
   */
  router.post('/send', async (req, res, next) => {
    try {
      const { to, body, type, media } = req.body;

      // Validação básica
      if (!to || (!body && !media)) {
        return res.status(400).json({
          success: false,
          error: 'Campos obrigatórios: to, body ou media'
        });
      }

      let result;

      // Enviar texto ou mídia
      if (media) {
        result = await messageService.sendMediaMessage({
          to,
          caption: body,
          mediaType: media.type,
          mimeType: media.mimeType,
          fileName: media.fileName,
          dataUrl: media.dataUrl
        });
      } else {
        result = await messageService.sendTextMessage({ to, body });
      }

      res.json(result);

    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/messages/:id/status
   * Obtém status de uma mensagem
   */
  router.get('/:id/status', async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // TODO: Implementar busca de status
      
      res.json({
        success: true,
        message: {
          id,
          status: 'sent'
        }
      });

    } catch (error) {
      next(error);
    }
  });

  return router;
};
```

---

## 🔨 EXERCÍCIOS PRÁTICOS

### **Exercício 1: Implementar Domain Layer** (2 horas)

1. Crie `Message.js` completo
2. Crie `Contact.js` completo
3. Crie `Media.js` completo
4. Escreva testes unitários para cada entidade

### **Exercício 2: Implementar Application Layer** (2 horas)

1. Implemente `MessageService`
2. Implemente `MediaService`
3. Teste com mocks dos adapters

### **Exercício 3: Implementar Presentation Layer** (2 horas)

1. Configure Express server
2. Crie rotas de mensagens
3. Teste com Postman

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] Message entity implementada e testada
- [ ] Contact entity implementada e testada
- [ ] Media entity implementada e testada
- [ ] MessageService implementado
- [ ] MediaService implementado
- [ ] Express server configurado
- [ ] Rotas de API criadas
- [ ] Middleware de erro funcionando
- [ ] Testes unitários passando

---

## 🎯 PRÓXIMO PASSO

Agora escolha sua opção de implementação:

- **Opção 1:** `opcao-1-webclient/README.md`
- **Opção 2:** `opcao-2-meta-api/README.md`

**Ambas usarão estas camadas comuns que você acabou de implementar!**

