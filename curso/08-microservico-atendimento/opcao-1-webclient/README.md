# 📱 OPÇÃO 1: IMPLEMENTAÇÃO COM WHATSAPP WEB CLIENT

## 🎯 VOCÊ ESCOLHEU A OPÇÃO 1!

Parabéns! Esta é a opção **ideal para aprendizado**, desenvolvimento local e protótipos rápidos.

**Pré-requisitos:**
- ✅ Ter implementado as camadas comuns
- ✅ Ter um número WhatsApp disponível (pessoal ou teste)
- ⚠️ **NÃO** precisa de Meta Business Account

---

## 🚀 O QUE VOCÊ VAI CONSTRUIR

Um microserviço completo de atendimento WhatsApp usando:
- ✅ whatsapp-web.js (biblioteca Node.js)
- ✅ Puppeteer (browser headless)
- ✅ QR Code authentication
- ✅ LocalAuth (sessão persistente)
- ✅ Todas as features do WhatsApp Web

---

## ⏱️ DURAÇÃO ESTIMADA

**Total:** 5 horas
- Setup e configuração: 1 hora
- WhatsAppWebAdapter: 2 horas
- Integração e testes: 2 horas

---

## 📚 ARQUITETURA ESPECÍFICA

```
opcao-1-webclient/
├── infrastructure/
│   ├── WhatsAppWebAdapter.js    # Adapter principal
│   ├── QRCodeService.js         # Gerenciamento de QR
│   └── SessionManager.js        # Gerenciamento de sessão
│
├── config/
│   └── whatsapp-config.js       # Configurações
│
├── app.js                        # Aplicação principal
├── package.json                  # Dependências
└── .env.example                  # Variáveis de ambiente
```

---

## 📦 PASSO 1: INSTALAÇÃO E SETUP (30 min)

### **1.1 Instalar Dependências**

```bash
cd opcao-1-webclient

npm init -y

npm install whatsapp-web.js@1.25.0 \
  puppeteer@22.10.0 \
  qrcode@1.5.4 \
  qrcode-terminal@0.12.0 \
  express@4.18.2 \
  cors@2.8.5 \
  dotenv@16.4.5 \
  amqplib@0.10.4 \
  minio@8.0.1
```

### **1.2 Criar Estrutura de Pastas**

```bash
mkdir -p infrastructure config temp session
```

### **1.3 Configurar .env**

```bash
# .env
NODE_ENV=development
PORT=3000

# WhatsApp
CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome
SESSION_PATH=./session

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

## 💻 PASSO 2: IMPLEMENTAR WHATSAPPWEBADAPTER (2 horas)

### **2.1 Configuração Base**

```javascript
// config/whatsapp-config.js

module.exports = {
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    executablePath: process.env.CHROME_EXECUTABLE_PATH || undefined
  },

  session: {
    clientId: 'webclient-curso',
    dataPath: process.env.SESSION_PATH || './session'
  },

  webVersion: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1027111951.html'
  }
};
```

### **2.2 WhatsAppWebAdapter Completo**

```javascript
// infrastructure/WhatsAppWebAdapter.js

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const config = require('../config/whatsapp-config');

class WhatsAppWebAdapter {
  constructor(qrCodeService, sessionManager) {
    this.qrCodeService = qrCodeService;
    this.sessionManager = sessionManager;
    this.client = null;
    this.isConnected = false;
    this.connectedNumber = null;
  }

  /**
   * Inicializa cliente WhatsApp
   */
  async initialize() {
    try {
      console.log('🔄 Inicializando WhatsApp Web Client...');

      // Criar cliente
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: config.session.clientId,
          dataPath: config.session.dataPath
        }),
        puppeteer: config.puppeteer,
        webVersionCache: config.webVersion
      });

      // Registrar event handlers
      this.setupEventHandlers();

      // Inicializar
      await this.client.initialize();

      console.log('✅ Cliente inicializado');

    } catch (error) {
      console.error('❌ Erro ao inicializar cliente:', error);
      throw error;
    }
  }

  /**
   * Configura handlers de eventos
   */
  setupEventHandlers() {
    // QR Code gerado
    this.client.on('qr', async (qr) => {
      console.log('📱 QR Code gerado');
      await this.qrCodeService.handleQRCode(qr);
    });

    // Autenticado
    this.client.on('authenticated', () => {
      console.log('✅ WhatsApp autenticado');
    });

    // Pronto
    this.client.on('ready', async () => {
      console.log('✅ WhatsApp pronto!');
      this.isConnected = true;
      
      // Obter número conectado
      const info = this.client.info;
      this.connectedNumber = info?.wid?.user || 'unknown';
      
      console.log(`📞 Número conectado: ${this.connectedNumber}`);
      
      await this.sessionManager.handleReady(this.connectedNumber);
    });

    // Falha de autenticação
    this.client.on('auth_failure', async (msg) => {
      console.error('❌ Falha de autenticação:', msg);
      await this.sessionManager.handleAuthFailure();
    });

    // Desconectado
    this.client.on('disconnected', async (reason) => {
      console.warn('⚠️ WhatsApp desconectado:', reason);
      this.isConnected = false;
      await this.sessionManager.handleDisconnected();
      
      // Tentar reconectar
      setTimeout(() => this.reconnect(), 5000);
    });

    // Nova mensagem
    this.client.on('message', async (message) => {
      await this.handleInboundMessage(message);
    });
  }

  /**
   * Envia mensagem de texto
   */
  async sendTextMessage(to, body) {
    try {
      if (!this.isConnected) {
        throw new Error('WhatsApp não está conectado');
      }

      console.log(`📤 Enviando mensagem de texto - To: ${to}`);

      const sentMessage = await this.client.sendMessage(to, body);

      console.log(`✅ Mensagem enviada - ID: ${sentMessage.id._serialized}`);

      return {
        success: true,
        whatsappMessageId: sentMessage.id._serialized
      };

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envia mensagem com mídia
   */
  async sendMediaMessage(to, media, caption = '') {
    try {
      if (!this.isConnected) {
        throw new Error('WhatsApp não está conectado');
      }

      console.log(`📤 Enviando mensagem de mídia - To: ${to}, Type: ${media.type}`);

      // Criar MessageMedia
      const messageMedia = new MessageMedia(
        media.mimeType,
        media.dataUrl.split(',')[1], // Base64
        media.fileName
      );

      // Enviar
      const sentMessage = await this.client.sendMessage(to, messageMedia, {
        caption: caption
      });

      console.log(`✅ Mídia enviada - ID: ${sentMessage.id._serialized}`);

      return {
        success: true,
        whatsappMessageId: sentMessage.id._serialized
      };

    } catch (error) {
      console.error('❌ Erro ao enviar mídia:', error);
      
      // Fallback: enviar como documento
      try {
        console.log('🔄 Tentando enviar como documento...');
        
        const messageMedia = new MessageMedia(
          'application/octet-stream',
          media.dataUrl.split(',')[1],
          media.fileName
        );

        const sentMessage = await this.client.sendMessage(to, messageMedia);

        return {
          success: true,
          whatsappMessageId: sentMessage.id._serialized
        };

      } catch (fallbackError) {
        return {
          success: false,
          error: fallbackError.message
        };
      }
    }
  }

  /**
   * Processa mensagem recebida
   */
  async handleInboundMessage(message) {
    try {
      console.log(`📨 Mensagem recebida - From: ${message.from}`);

      // Criar payload
      const payload = {
        externalMessageId: message.id._serialized,
        from: message.from,
        to: message.to,
        type: message.type,
        body: message.body || '',
        timestamp: new Date(message.timestamp * 1000).toISOString(),
        fromMe: message.fromMe,
        isGroup: message.from.endsWith('@g.us')
      };

      // Se tem mídia, fazer download
      if (message.hasMedia) {
        console.log('📎 Mensagem tem mídia, fazendo download...');
        
        const media = await message.downloadMedia();
        
        if (media) {
          payload.media = {
            mimeType: media.mimetype,
            data: media.data, // Base64
            filename: media.filename
          };
        }
      }

      // Callback para processar
      if (this.onInboundMessage) {
        await this.onInboundMessage(payload);
      }

    } catch (error) {
      console.error('❌ Erro ao processar mensagem inbound:', error);
    }
  }

  /**
   * Reconecta ao WhatsApp
   */
  async reconnect() {
    try {
      console.log('🔄 Tentando reconectar...');
      await this.client.initialize();
    } catch (error) {
      console.error('❌ Erro ao reconectar:', error);
      setTimeout(() => this.reconnect(), 10000);
    }
  }

  /**
   * Desconecta do WhatsApp
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.destroy();
        this.isConnected = false;
        console.log('✅ WhatsApp desconectado');
      }
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
    }
  }

  /**
   * Verifica se está conectado
   */
  isClientConnected() {
    return this.isConnected && this.client;
  }

  /**
   * Obtém informações do cliente
   */
  getClientInfo() {
    return {
      isConnected: this.isConnected,
      connectedNumber: this.connectedNumber,
      state: this.client?.info?.pushname || 'disconnected'
    };
  }
}

module.exports = WhatsAppWebAdapter;
```

### **2.3 QRCodeService**

```javascript
// infrastructure/QRCodeService.js

const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');

class QRCodeService {
  constructor(rabbitMQAdapter) {
    this.rabbitMQAdapter = rabbitMQAdapter;
    this.currentQR = null;
  }

  /**
   * Processa QR Code gerado
   */
  async handleQRCode(qr) {
    try {
      this.currentQR = qr;

      // Exibir no terminal
      console.log('\n📱 ESCANEIE O QR CODE ABAIXO:\n');
      qrcodeTerminal.generate(qr, { small: true });

      // Gerar imagem base64
      const qrImage = await qrcode.toDataURL(qr);

      // Publicar no RabbitMQ
      if (this.rabbitMQAdapter) {
        await this.rabbitMQAdapter.publish('out.qrcode', {
          qr: qr,
          qrImage: qrImage,
          timestamp: new Date().toISOString()
        });
      }

      console.log('✅ QR Code publicado');

    } catch (error) {
      console.error('❌ Erro ao processar QR Code:', error);
    }
  }

  /**
   * Obtém QR Code atual
   */
  getCurrentQR() {
    return this.currentQR;
  }

  /**
   * Limpa QR Code
   */
  clearQR() {
    this.currentQR = null;
  }
}

module.exports = QRCodeService;
```

### **2.4 SessionManager**

```javascript
// infrastructure/SessionManager.js

const fs = require('fs');
const path = require('path');

class SessionManager {
  constructor(sessionPath, rabbitMQAdapter) {
    this.sessionPath = sessionPath;
    this.rabbitMQAdapter = rabbitMQAdapter;
  }

  /**
   * Handle quando WhatsApp estiver pronto
   */
  async handleReady(connectedNumber) {
    try {
      console.log('✅ Sessão estabelecida');

      // Publicar status
      if (this.rabbitMQAdapter) {
        await this.rabbitMQAdapter.publish('session.status', {
          status: 'connected',
          connectedNumber: connectedNumber,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('❌ Erro em handleReady:', error);
    }
  }

  /**
   * Handle falha de autenticação
   */
  async handleAuthFailure() {
    try {
      console.log('🗑️ Limpando sessão corrompida...');

      // Limpar sessão
      await this.clearSession();

      // Publicar status
      if (this.rabbitMQAdapter) {
        await this.rabbitMQAdapter.publish('session.status', {
          status: 'auth_failure',
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('❌ Erro em handleAuthFailure:', error);
    }
  }

  /**
   * Handle desconexão
   */
  async handleDisconnected() {
    try {
      console.log('⚠️ Sessão desconectada');

      // Publicar status
      if (this.rabbitMQAdapter) {
        await this.rabbitMQAdapter.publish('session.status', {
          status: 'disconnected',
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('❌ Erro em handleDisconnected:', error);
    }
  }

  /**
   * Limpa sessão
   */
  async clearSession() {
    try {
      if (fs.existsSync(this.sessionPath)) {
        fs.rmSync(this.sessionPath, { recursive: true, force: true });
        console.log('✅ Sessão limpa');
      }
    } catch (error) {
      console.error('❌ Erro ao limpar sessão:', error);
    }
  }

  /**
   * Verifica se sessão existe
   */
  sessionExists() {
    return fs.existsSync(this.sessionPath);
  }
}

module.exports = SessionManager;
```

---

## 🔌 PASSO 3: INTEGRAÇÃO (1 hora)

### **3.1 Aplicação Principal**

```javascript
// app.js

require('dotenv').config();
const App = require('../comum/presentation/app');
const MessageService = require('../comum/application/services/MessageService');
const MediaService = require('../comum/application/services/MediaService');
const RabbitMQAdapter = require('../comum/infrastructure/adapters/RabbitMQAdapter');
const MinIOAdapter = require('../comum/infrastructure/adapters/MinIOAdapter');
const WhatsAppWebAdapter = require('./infrastructure/WhatsAppWebAdapter');
const QRCodeService = require('./infrastructure/QRCodeService');
const SessionManager = require('./infrastructure/SessionManager');

async function main() {
  try {
    console.log('🚀 Iniciando Microserviço - Opção 1 (Web Client)');

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

    // 2. Inicializar serviços específicos Web Client
    const qrCodeService = new QRCodeService(rabbitMQAdapter);
    const sessionManager = new SessionManager(
      process.env.SESSION_PATH,
      rabbitMQAdapter
    );

    // 3. Inicializar WhatsAppWebAdapter
    const whatsappAdapter = new WhatsAppWebAdapter(
      qrCodeService,
      sessionManager
    );

    // 4. Inicializar serviços de aplicação
    const mediaService = new MediaService(minIOAdapter);
    const messageService = new MessageService(
      whatsappAdapter,
      mediaService,
      rabbitMQAdapter
    );

    // 5. Registrar callback para mensagens inbound
    whatsappAdapter.onInboundMessage = async (payload) => {
      console.log('📨 Mensagem inbound recebida');
      await rabbitMQAdapter.publish('whatsapp.incoming', payload);
    };

    // 6. Inicializar WhatsApp
    await whatsappAdapter.initialize();

    // 7. Iniciar API REST
    const app = new App(messageService);
    app.start(process.env.PORT || 3000);

    console.log('✅ Microserviço iniciado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao iniciar microserviço:', error);
    process.exit(1);
  }
}

// Iniciar
main();
```

---

## 🧪 PASSO 4: TESTES (1 hora)

### **4.1 Testar QR Code**

```bash
node app.js

# Esperado:
# 🚀 Iniciando Microserviço...
# 📱 QR Code gerado
# [QR exibido no terminal]
```

### **4.2 Escanear QR Code**

1. Abra WhatsApp no celular
2. Vá em Configurações → Aparelhos conectados
3. Toque em "Conectar um aparelho"
4. Escaneie o QR Code exibido

### **4.3 Testar Envio de Mensagem**

```bash
# Via curl ou Postman
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999@c.us",
    "body": "Teste de mensagem via Web Client!"
  }'
```

### **4.4 Validar Resposta**

```json
{
  "success": true,
  "message": {
    "id": "msg_1234567890_abc",
    "status": "sent",
    "whatsappMessageId": "3EB0...",
    "timestamp": "2025-10-17T12:00:00.000Z"
  }
}
```

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] whatsapp-web.js instalado
- [ ] WhatsAppWebAdapter implementado
- [ ] QRCodeService funcionando
- [ ] SessionManager implementado
- [ ] QR Code gerado e escaneado
- [ ] Conexão estabelecida
- [ ] Envio de texto funcionando
- [ ] Envio de mídia funcionando
- [ ] Recebimento de mensagens funcionando
- [ ] Integração com RabbitMQ OK

---

## 🎯 RESULTADO FINAL

**Você completou a Opção 1!** 🎉

Agora você tem um microserviço completo de atendimento WhatsApp funcionando com Web Client!

**Próximos passos:**
- ✅ Adicione ao seu portfolio
- ✅ Documente no README do seu GitHub
- ✅ (Opcional) Implemente também a Opção 2
- ✅ Compare as duas implementações

**Parabéns! 🚀**

