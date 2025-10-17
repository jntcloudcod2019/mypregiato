# 📱 MÓDULO 5: INTEGRAÇÃO WHATSAPP (ZAP-BLASTER)

## 🎯 OBJETIVOS DE APRENDIZADO

Ao final deste módulo, você será capaz de:

- ✅ Integrar WhatsApp usando whatsapp-web.js
- ✅ Gerenciar autenticação via QR Code
- ✅ Enviar e receber mensagens
- ✅ Trabalhar com mídia (download/upload)
- ✅ Converter áudio para formato WhatsApp
- ✅ Implementar padrões de resiliência
- ✅ Gerenciar sessão do WhatsApp

---

## ⏱️ DURAÇÃO ESTIMADA

**Total:** 12 horas

- Teoria: 3 horas
- Prática: 7 horas
- Exercícios: 2 horas

---

## 📚 CONTEÚDO PROGRAMÁTICO

### **1. INTRODUÇÃO AO WHATSAPP-WEB.JS** (1 hora)

#### O que é whatsapp-web.js?

Biblioteca Node.js que emula o cliente WhatsApp Web através do Puppeteer.

**Características:**
- ✅ Baseado no cliente oficial WhatsApp Web
- ✅ Suporta todas as funcionalidades de mensagens
- ✅ Gerencia sessão via LocalAuth
- ⚠️ **Não oficial** - Viola ToS do WhatsApp
- ⚠️ Instável - sessão pode cair

**Quando usar:**
- Protótipos e MVPs
- Ambientes de desenvolvimento
- Quando Meta API não está disponível

**Alternativa:**
- Meta Cloud API (oficial, recomendado para produção)

---

### **2. ARQUITETURA DO ZAP-BLASTER** (45 min)

#### Diagrama de Componentes

```
┌────────────────────────────────────────┐
│         ZAP-BLASTER (Node.js)          │
│                                        │
│  ┌─────────────────────────────────┐  │
│  │   whatsapp-web.js Client        │  │
│  │   - QR Code Generation          │  │
│  │   - Session Management          │  │
│  │   - Message Events              │  │
│  └──────────┬──────────────────────┘  │
│             │                          │
│  ┌──────────┴──────────────────────┐  │
│  │   Message Handler (zap.js)      │  │
│  │   - onInbound()                 │  │
│  │   - sendOne()                   │  │
│  │   - Media Processing            │  │
│  └──────────┬──────────────────────┘  │
│             │                          │
│  ┌──────────┴──────────────────────┐  │
│  │   Resilience Layer              │  │
│  │   - Circuit Breaker             │  │
│  │   - Retry Manager               │  │
│  │   - Dead Letter Queue           │  │
│  └──────────┬──────────────────────┘  │
│             │                          │
└─────────────┼──────────────────────────┘
              │
      ┌───────┴───────┐
      ▼               ▼
┌──────────┐    ┌──────────┐
│ RabbitMQ │    │  MinIO   │
└──────────┘    └──────────┘
```

---

### **3. SETUP E CONFIGURAÇÃO** (1 hora)

#### 3.1 Instalação de Dependências

```bash
cd zap-blaster-projeto

npm install whatsapp-web.js@1.25.0 \
  puppeteer@22.10.0 \
  qrcode@1.5.4 \
  qrcode-terminal@0.12.0 \
  amqplib@0.10.4 \
  minio@8.0.1 \
  mysql2@3.11.0 \
  axios@1.7.4 \
  dotenv@16.4.5 \
  @ffmpeg-installer/ffmpeg@1.1.0
```

#### 3.2 Configuração do Projeto

**Estrutura de Pastas:**

```
zap-blaster-projeto/
├── zap.js                    # Aplicação principal
├── database.js               # MySQL client
├── minio-service.js          # MinIO client
├── audio-utils.js            # FFmpeg audio conversion
├── WhatsAppDataExtractor.js  # Data extraction
├── resilience/               # Resilience patterns
│   ├── circuit-breaker.js
│   ├── retry-manager.js
│   ├── resilient-sender.js
│   └── dead-letter-queue.js
├── session/                  # WhatsApp session data
├── downloads/                # Temporary downloads
├── temp/                     # Temp files
└── .env                      # Environment variables
```

**Arquivo .env:**

```bash
# MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=sua_senha
MYSQL_DATABASE=pregiato_dev

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=midias

# API Backend
API_BASE_URL=http://localhost:5656

# WhatsApp
CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome
```

---

### **4. INICIALIZAÇÃO DO CLIENTE WHATSAPP** (1 hora)

#### 4.1 Configuração do Cliente

```javascript
// zap.js
const { Client, LocalAuth } = require('whatsapp-web.js');

function buildClient() {
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: 'zap-bot-prod',
      dataPath: './session'
    }),
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
      ]
    },
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1027111951.html'
    }
  });

  return client;
}
```

**Explicação:**

- **LocalAuth**: Estratégia de autenticação local
  - Salva sessão em disco
  - Permite reconexão sem QR code
  
- **puppeteer.args**: Argumentos para Chrome headless
  - `--no-sandbox`: Necessário em containers
  - `--disable-dev-shm-usage`: Evita problemas de memória
  
- **webVersionCache**: Cache da versão do WhatsApp Web
  - Evita incompatibilidades
  - Usa versão conhecida e estável

#### 4.2 Event Handlers

```javascript
// QR Code gerado
client.on('qr', async (qr) => {
  Log.info('QR Code gerado');
  
  // Exibir no terminal
  qrcode.generate(qr, { small: true });
  
  // Enviar para backend via webhook
  await axios.post(`${API_BASE_URL}/api/whatsapp/receive-qr`, {
    qrCode: qr,
    timestamp: new Date().toISOString()
  });
  
  // Publicar no RabbitMQ
  await amqpChan.publish('direct', 'out.qrcode', 
    Buffer.from(JSON.stringify({ qr }))
  );
});

// Cliente autenticado
client.on('authenticated', () => {
  Log.success('✅ WhatsApp autenticado');
});

// Cliente pronto
client.on('ready', async () => {
  Log.success('✅ WhatsApp pronto!');
  
  isConnected = true;
  connectedNumber = client.info?.wid?.user || 'unknown';
  
  // Inicializar serviços
  await initializeMinIOClient();
  await sendSessionStatus('connected');
});

// Falha de autenticação
client.on('auth_failure', (msg) => {
  Log.error('❌ Falha de autenticação:', msg);
  
  // Limpar sessão corrompida
  fs.rmSync('./session', { recursive: true, force: true });
});

// Desconectado
client.on('disconnected', async (reason) => {
  Log.warn('⚠️ WhatsApp desconectado:', reason);
  
  isConnected = false;
  
  // Tentar reconectar
  setTimeout(async () => {
    Log.info('🔄 Tentando reconectar...');
    await client.initialize();
  }, 5000);
});

// Nova mensagem
client.on('message', async (message) => {
  await onInbound(message);
});
```

---

### **5. PROCESSAMENTO DE MENSAGENS INBOUND** (1.5 horas)

#### 5.1 Fluxo de Recebimento

```
WhatsApp → whatsapp-web.js → onInbound() → RabbitMQ → Backend
```

#### 5.2 Implementação

```javascript
async function onInbound(message) {
  try {
    Log.info(`📨 Mensagem recebida - From: ${message.from}`);
    
    // 1. Normalizar número
    const fromNormalized = normalizePhone(message.from);
    
    // 2. Verificar se é lead cadastrado
    const isLead = await checkIfLead(fromNormalized);
    
    if (!isLead) {
      Log.warn(`⚠️ Número não é lead: ${fromNormalized}`);
      return; // Ignora mensagens de não-leads
    }
    
    // 3. Mapear tipo de mensagem
    const messageType = mapWppType(message.type);
    
    // 4. Construir payload base
    const payload = {
      externalMessageId: message.id._serialized,
      from: message.from,
      fromNormalized: fromNormalized,
      to: message.to,
      type: messageType,
      timestamp: new Date(message.timestamp * 1000).toISOString(),
      fromMe: message.fromMe,
      isGroup: message.from.endsWith('@g.us'),
      chatId: message.from,
      body: message.body || '',
      attachment: null
    };
    
    // 5. Processar mídia se existir
    if (message.hasMedia) {
      Log.info(`📎 Mensagem tem mídia - Type: ${messageType}`);
      
      try {
        // Download da mídia
        const media = await message.downloadMedia();
        
        if (media && media.data) {
          // Converter para data URL
          const dataUrl = `data:${media.mimetype};base64,${media.data}`;
          
          payload.attachment = {
            dataUrl: dataUrl,
            mimeType: media.mimetype,
            fileName: media.filename || `media_${Date.now()}.bin`,
            mediaType: messageType,
            fileSize: Buffer.byteLength(media.data, 'base64')
          };
          
          // CRÍTICO: Para áudio, base64 vai para o body também
          if (messageType === 'audio' || messageType === 'voice') {
            payload.body = dataUrl;
            Log.info('🎵 Áudio processado - Base64 adicionado ao body');
          }
        }
      } catch (mediaError) {
        Log.error('❌ Erro ao baixar mídia:', mediaError.message);
      }
    }
    
    // 6. Publicar no RabbitMQ
    await amqpChan.publish(
      'direct',
      'whatsapp.incoming',
      Buffer.from(JSON.stringify(payload))
    );
    
    Log.success(`✅ Mensagem publicada - ID: ${message.id._serialized}`);
    
  } catch (error) {
    Log.error('❌ Erro em onInbound:', error);
  }
}
```

**Pontos Críticos:**

1. **Normalização de Número**: Sempre normalizar para E.164
2. **Verificação de Lead**: Ignora mensagens de não-leads
3. **Download de Mídia**: `message.downloadMedia()` retorna base64
4. **Áudio Especial**: Base64 vai para `body` E `attachment.dataUrl`
5. **Publicação Assíncrona**: RabbitMQ não bloqueia o recebimento

---

### **6. ENVIO DE MENSAGENS** (1.5 horas)

#### 6.1 Fluxo de Envio

```
Backend → RabbitMQ → sendOne() → WhatsApp Web → Cliente
```

#### 6.2 Consumer RabbitMQ

```javascript
// Consumir fila de saída
await amqpChan.consume('whatsapp.outgoing', async (msg) => {
  if (!msg) return;
  
  try {
    const cmd = JSON.parse(msg.content.toString());
    
    if (cmd.command === 'send_message') {
      await sendOne(cmd);
      amqpChan.ack(msg); // Confirma processamento
    }
    
  } catch (error) {
    Log.error('❌ Erro ao processar mensagem:', error);
    amqpChan.nack(msg, false, false); // Rejeita sem requeue
  }
}, { noAck: false });
```

#### 6.3 Função sendOne()

```javascript
async function sendOne(cmd) {
  const { phone, body, type, clientMessageId, attachment } = cmd;
  
  Log.info(`📤 Enviando mensagem - To: ${phone}, Type: ${type}`);
  
  try {
    // Verificar conexão
    if (!isConnected) {
      throw new Error('WhatsApp não está conectado');
    }
    
    let sentMessage;
    
    if (type === 'text') {
      // Envio de texto
      sentMessage = await client.sendMessage(phone, body);
      
    } else if (['image', 'audio', 'video', 'document'].includes(type)) {
      // Envio de mídia
      
      // 1. Download do MinIO
      const mediaBuffer = await downloadMediaFromMinIO(attachment.mediaUrl);
      
      // 2. Conversão de áudio se necessário
      let finalBuffer = mediaBuffer;
      let finalMimeType = attachment.mimeType;
      
      if (type === 'audio' || type === 'voice') {
        const converted = await convertAudioToOpus(mediaBuffer);
        finalBuffer = converted.buffer;
        finalMimeType = 'audio/ogg; codecs=opus';
      }
      
      // 3. Criar MessageMedia
      const media = new MessageMedia(
        finalMimeType,
        finalBuffer.toString('base64'),
        attachment.fileName
      );
      
      // 4. Enviar
      sentMessage = await client.sendMessage(phone, media, {
        caption: body || ''
      });
    }
    
    // Publicar status de sucesso
    await sendMessageStatus({
      clientMessageId: clientMessageId,
      whatsappMessageId: sentMessage.id._serialized,
      status: 'sent',
      timestamp: new Date().toISOString()
    });
    
    Log.success(`✅ Mensagem enviada - WhatsApp ID: ${sentMessage.id._serialized}`);
    
  } catch (error) {
    Log.error(`❌ Erro ao enviar mensagem:`, error);
    
    // Publicar status de erro
    await sendMessageStatus({
      clientMessageId: clientMessageId,
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}
```

---

### **7. CONVERSÃO DE ÁUDIO** (1 hora)

#### 7.1 Por que converter?

WhatsApp Web aceita áudio em formatos específicos:
- **Audio**: MP3, OGG
- **Voice Note (PTT)**: Opus/OGG com flag PTT

#### 7.2 Implementação com FFmpeg

```javascript
// audio-utils.js
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function convertAudioToOpus(inputBuffer) {
  return new Promise((resolve, reject) => {
    const tempInput = path.join(__dirname, 'temp', `input_${Date.now()}.bin`);
    const tempOutput = path.join(__dirname, 'temp', `output_${Date.now()}.ogg`);
    
    try {
      // Salvar buffer de entrada
      fs.writeFileSync(tempInput, inputBuffer);
      
      // Comando FFmpeg
      const ffmpeg = spawn(ffmpegPath, [
        '-i', tempInput,                    // Input
        '-acodec', 'libopus',               // Codec Opus
        '-b:a', '128k',                     // Bitrate
        '-vbr', 'on',                       // Variable bitrate
        '-compression_level', '10',         // Máxima compressão
        '-frame_duration', '60',            // 60ms frames
        '-application', 'voip',             // Otimizado para voz
        '-y',                               // Overwrite
        tempOutput                          // Output
      ]);
      
      let stderr = '';
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffmpeg.on('close', (code) => {
        // Limpar input
        fs.unlinkSync(tempInput);
        
        if (code !== 0) {
          return reject(new Error(`FFmpeg falhou: ${stderr}`));
        }
        
        try {
          // Ler arquivo convertido
          const outputBuffer = fs.readFileSync(tempOutput);
          
          // Limpar output
          fs.unlinkSync(tempOutput);
          
          resolve({
            buffer: outputBuffer,
            mimeType: 'audio/ogg; codecs=opus',
            size: outputBuffer.length
          });
          
        } catch (error) {
          reject(error);
        }
      });
      
      ffmpeg.on('error', (error) => {
        // Limpar arquivos
        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
        
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { convertAudioToOpus };
```

**Parâmetros Importantes:**

- **`-acodec libopus`**: Codec Opus (requerido pelo WhatsApp)
- **`-b:a 128k`**: Bitrate de 128kbps (qualidade boa)
- **`-application voip`**: Otimizado para voz (não música)
- **`-frame_duration 60`**: Frames de 60ms (padrão WhatsApp)

---

### **8. PADRÕES DE RESILIÊNCIA** (1.5 horas)

#### 8.1 Circuit Breaker

```javascript
// resilience/circuit-breaker.js
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.nextAttempt = Date.now();
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      
      // Tentar recuperação
      this.state = 'HALF_OPEN';
      console.log('🔄 Circuit breaker: HALF_OPEN (tentando recuperar)');
    }
    
    try {
      const result = await fn();
      
      // Sucesso!
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
        console.log('✅ Circuit breaker: CLOSED (recuperado)');
      }
      
      return result;
      
    } catch (error) {
      this.failureCount++;
      
      if (this.failureCount >= this.threshold) {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + this.timeout;
        console.log(`⛔ Circuit breaker: OPEN (${this.failureCount} falhas)`);
      }
      
      throw error;
    }
  }
  
  getState() {
    return this.state;
  }
  
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    console.log('🔄 Circuit breaker resetado manualmente');
  }
}

module.exports = CircuitBreaker;
```

**Uso:**

```javascript
const circuitBreaker = new CircuitBreaker(5, 60000); // 5 falhas, 60s timeout

try {
  await circuitBreaker.execute(async () => {
    return await client.sendMessage(phone, body);
  });
} catch (error) {
  console.error('Envio falhou:', error.message);
}
```

#### 8.2 Retry com Exponential Backoff

```javascript
// resilience/retry-manager.js
class RetryManager {
  constructor(maxRetries = 3, baseDelay = 1000, maxDelay = 30000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }
  
  async execute(fn, context = '') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
        
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          console.log(`❌ [${context}] Todas as ${this.maxRetries} tentativas falharam`);
          break;
        }
        
        // Calcular delay exponencial: 1s, 2s, 4s, 8s, ...
        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt - 1),
          this.maxDelay
        );
        
        console.log(`🔄 [${context}] Tentativa ${attempt}/${this.maxRetries} falhou. Retry em ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

module.exports = RetryManager;
```

**Uso:**

```javascript
const retryManager = new RetryManager(3, 1000, 30000);

await retryManager.execute(async () => {
  return await client.sendMessage(phone, body);
}, 'send_message');
```

---

### **9. MONITORAMENTO E LOGS** (45 min)

#### 9.1 Sistema de Logs

```javascript
// Custom Log class
class Log {
  static info(message, ...args) {
    console.log(`ℹ️  [INFO] ${new Date().toISOString()} - ${message}`, ...args);
  }
  
  static success(message, ...args) {
    console.log(`✅ [SUCCESS] ${new Date().toISOString()} - ${message}`, ...args);
  }
  
  static warn(message, ...args) {
    console.warn(`⚠️  [WARN] ${new Date().toISOString()} - ${message}`, ...args);
  }
  
  static error(message, ...args) {
    console.error(`❌ [ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  }
  
  static debug(message, ...args) {
    if (process.env.DEBUG === 'true') {
      console.log(`🐛 [DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
}
```

#### 9.2 Health Check Endpoint

```javascript
const express = require('express');
const app = express();

app.get('/status', (req, res) => {
  res.json({
    status: isConnected ? 'connected' : 'disconnected',
    connectedNumber: connectedNumber,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    rabbitmq: amqpConn ? 'connected' : 'disconnected',
    circuitBreaker: {
      state: circuitBreaker.getState(),
      failures: circuitBreaker.failureCount
    }
  });
});

app.get('/health', (req, res) => {
  const healthy = isConnected && amqpConn;
  res.status(healthy ? 200 : 503).json({ healthy });
});

app.listen(3030, () => {
  console.log('🚀 Zap-Blaster rodando na porta 3030');
});
```

---

## 🔨 EXERCÍCIOS PRÁTICOS

### **Exercício 1: Setup Básico** (1 hora)

1. Instale o Zap-Blaster
2. Configure o .env
3. Execute e gere QR Code
4. Autentique com seu WhatsApp
5. Envie uma mensagem de teste

### **Exercício 2: Processar Mídia** (1 hora)

1. Envie uma imagem via WhatsApp
2. Verifique o log de `onInbound()`
3. Confirme que o base64 foi extraído
4. Verifique se foi publicado no RabbitMQ

### **Exercício 3: Conversão de Áudio** (45 min)

1. Grave um áudio de voz no WhatsApp
2. Envie para o bot
3. Verifique o formato original (MP3/AAC)
4. Implemente conversão para Opus/OGG
5. Teste o envio de volta

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] WhatsApp Web.js instalado e configurado
- [ ] QR Code gerado e autenticado
- [ ] Recebimento de mensagens funcionando
- [ ] Envio de mensagens funcionando
- [ ] Download de mídia implementado
- [ ] Conversão de áudio funcionando
- [ ] Circuit Breaker implementado
- [ ] Retry mechanism implementado
- [ ] Health check endpoint criado
- [ ] Logs detalhados

---

## 🎯 PRÓXIMO MÓDULO

**Módulo 6: Mensageria com RabbitMQ**

Vamos aprender a arquitetura de mensageria completa!

**Vamos lá! 🚀**

