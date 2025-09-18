

require('dotenv').config();

const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const amqp = require('amqplib');
const path = require('path');
const fs = require('fs');
const qrcodeTerm = require('qrcode-terminal');
const QRCode = require('qrcode');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
const { connectDatabase, isNumberInLeads, getAudioFromPayloadJson } = require('./database');
const { connected } = require('process');
const AudioProcessor = require('./audio-utils');


const instanceId = process.env.INSTANCE_ID || 'zap-prod';
const isDocker = process.env.NODE_ENV === 'production' || fs.existsSync('/.dockerenv');

const API_BASE = process.env.API_BASE || 'http://localhost:5656';
const DEBUG = process.env.DEBUG === 'true';


// ========================= Logging =========================
class Log {
  static _log(level, message, meta = {}) {
    const ts = new Date().toISOString();
    const line = `[${ts}] [${level.toUpperCase()}] ${message}`;
    if (Object.keys(meta).length) {
      console.log(line);
      console.log(JSON.stringify(meta, null, 2));
        } else {
      console.log(line);
    }
  }
  static info(m, meta){ this._log('info', m, meta); }
  static warn(m, meta){ this._log('warn', m, meta); }
  static error(m, meta){ this._log('error', m, meta); }
  static debug(m, meta){ if (DEBUG) this._log('debug', m, meta); }
}

// ========================= Guard rails globais =========================
process.on('uncaughtException', (err) => {
  Log.error('uncaughtException', { error: err?.message, stack: err?.stack });
});
process.on('unhandledRejection', (reason) => {
  Log.error('unhandledRejection', { reason: String(reason) });
});

// ========================= Sessão LocalAuth =========================
const sessionBaseDir = isDocker ? '/app/session' : path.join(process.cwd(), 'session');
const localAuth = new LocalAuth({ dataPath: sessionBaseDir, clientId: instanceId });
const localAuthDir = path.join(sessionBaseDir, `session-${instanceId}`);

async function hasSession() {
  try { return fs.existsSync(localAuthDir) && fs.readdirSync(localAuthDir).length > 0; }
  catch { return false; }
}
async function backupAndClearSession() {
  try {
    if (fs.existsSync(localAuthDir)) {
      const backup = `${localAuthDir}_backup_${Date.now()}`;
      fs.renameSync(localAuthDir, backup);
      Log.warn('Sessão corrompida – backup criado e sessão limpa', { backup });
    }
  } catch (e) {
    Log.error('Erro ao limpar sessão', { error: e.message });
  }
}

// ========================= Estado WhatsApp =========================
let client = null;
let isConnected = false;
let isFullyValidated = false;
let connectedNumber = null || '5511977240565';

let resilientSender = null;
let dataExtractor = null;

// timers
let qrExpireTimer = null;
let validationTimer = null;
let monitorTimer = null;

function clearTimers() {
  if (qrExpireTimer) { clearTimeout(qrExpireTimer); qrExpireTimer = null; }
  if (validationTimer) { clearTimeout(validationTimer); validationTimer = null; }
  if (monitorTimer) { clearInterval(monitorTimer); monitorTimer = null; }
}

// ========================= API Client Resiliente =========================
/**
 * Circuit breaker + fila offline + backoff com jitter
 */
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.offline = false;
    this.failCount = 0;
    this.maxFailBeforeOpen = Number(process.env.API_CB_THRESHOLD || 5);
    this.cooldownMs = Number(process.env.API_CB_COOLDOWN_MS || 5000);
    this.lastOpen = 0;
    this.queue = [];
    this.maxQueue = Number(process.env.API_QUEUE_MAX || 500);
    this.flushTimer = null;

    this.startHealthLoop();
  }

 

  // jitter randômico
  jitter(ms) { return Math.round(ms * (0.7 + Math.random() * 0.6)); }

  // backoff exponencial com topo
  backoffDelay() {
    const base = Math.min(1000 * Math.pow(2, Math.min(this.failCount, 6)), 30000);
    return this.jitter(base);
  }

  openBreaker() {
    this.offline = true;
    this.lastOpen = Date.now();
    Log.warn('[API] Circuit breaker ABERTO');
  }

  // coloca no buffer sem travar app
  enqueue(path, payload) {
    if (this.queue.length >= this.maxQueue) {
      this.queue.shift();
      Log.warn('[API] Fila offline atingiu limite – descartando o mais antigo');
    }
    this.queue.push({ path, payload, ts: Date.now() });
      if (!this.flushTimer) {
    this.flushTimer = setImmediate(() => {
      this.flushTimer = null;
      this.flushQueue();
    });
  }
  }

  async flushQueue() {
    if (!this.queue.length || this.offline) return;
    const items = this.queue.splice(0, this.queue.length);
    for (const it of items) {
      try { await this.post(it.path, it.payload, true); }
      catch { /* se falhar, já caiu em offline e re-enfileirou */ break; }
    }
  }

  async post(pathname, payload, fromFlush = false) {
    const url = this.baseUrl + pathname;
    if (this.offline) {
      if (!fromFlush) this.enqueue(pathname, payload);
      throw new Error('api_offline');
    }
    try {
      await axios.post(url, payload, { timeout: 5000 });
      // sucesso → zera falhas
      this.failCount = 0;
      return true;
    } catch (e) {
      this.failCount++;
      Log.warn('[API] Falha no POST', { url, error: e?.message });
      // re-enfileira se não veio do flush
      if (!fromFlush) this.enqueue(pathname, payload);
      if (this.failCount >= this.maxFailBeforeOpen) {
        this.openBreaker();
      }
        // agenda um flush futuro
  this.flushQueue();
  throw e;
}
  }

  // Health check loop para monitorar a API
  startHealthLoop() {
    setInterval(async () => {
      if (this.offline) {
        // Se está offline, tenta reconectar
        const now = Date.now();
        if (now - this.lastOpen > this.cooldownMs) {
          Log.info('[API] Tentando reconectar após cooldown');
          this.offline = false;
          this.failCount = 0;
        }
      }
    }, 30000); // Verifica a cada 30 segundos
  }
}

const apiClient = new ApiClient(API_BASE);

// ========================= RabbitMQ Resiliente =========================
const rabbitCfg = {
  protocol: 'amqps',
  hostname: process.env.RABBIT_HOST || 'mouse.rmq5.cloudamqp.com',
  port: Number(process.env.RABBIT_PORT || 5671),
  username: process.env.RABBIT_USER || 'ewxcrhtv',
  password: process.env.RABBIT_PASS || 'DNcdH0NEeP4Fsgo2_w-vd47CqjelFk_S',
  vhost: process.env.RABBIT_VHOST || 'ewxcrhtv',
};
const RABBIT_URL = `amqps://${encodeURIComponent(rabbitCfg.username)}:${encodeURIComponent(rabbitCfg.password)}@${rabbitCfg.hostname}:${rabbitCfg.port}/${encodeURIComponent(rabbitCfg.vhost)}?heartbeat=30`;

let amqpConn = null, amqpChan = null;
let amqpHealthy = false;
let amqpReconnecting = false;
let amqpAttempts = 0;
const amqpMaxAttempts = Number(process.env.RABBIT_MAX_ATTEMPTS || 50);

const outQueues = ['out.qrcode','whatsapp.incoming','whatsapp.outgoing','whatsapp.message-status','session.status'];
const bufferOut = [];
const bufferOutMax = Number(process.env.RABBIT_BUFFER_MAX || 2000);

function jitter(ms){ return Math.round(ms * (0.7 + Math.random() * 0.6)); }
function backoff(attempt){ return Math.min(500 * Math.pow(2, Math.min(attempt, 4)), 10000); }

async function ensureAmqp() {
  if (amqpHealthy && amqpChan) return true;
  if (amqpReconnecting) return false;

  amqpReconnecting = true;
  amqpAttempts++;
  const delay = jitter(backoff(amqpAttempts));
  try {
    Log.info(`Conectando RabbitMQ (tentativa ${amqpAttempts}/${amqpMaxAttempts})`);
    amqpConn = await amqp.connect(RABBIT_URL);
    amqpChan = await amqpConn.createChannel();
    await amqpChan.prefetch(1);
    for (const q of outQueues) await amqpChan.assertQueue(q, { durable:true });

    amqpHealthy = true; amqpReconnecting = false; amqpAttempts = 0;

    amqpConn.on('close', () => { Log.warn('RabbitMQ fechou'); markAmqpDown(); });
    amqpConn.on('error', (err) => { Log.warn('RabbitMQ erro', { error: err?.message }); markAmqpDown(); });

    Log.info('RabbitMQ conectado');
    await flushBuffer();
    await startConsumer();

 
  startRabbitHealth();
  return true;
} catch (e) {
  amqpReconnecting = false;
  amqpHealthy = false;
  Log.error('Falha RabbitMQ', { error: e?.message });
  if (amqpAttempts < amqpMaxAttempts) {
    ensureAmqp();
  }
  return false;
}
}

function markAmqpDown() {
  amqpHealthy = false;
  try { if (amqpChan) amqpChan.close().catch(()=>{}); } catch {}
  try { if (amqpConn) amqpConn.close().catch(()=>{}); } catch {}
  amqpChan = null; amqpConn = null;
  if (!amqpReconnecting) ensureAmqp();
}

async function publish(queue, payload) {
  if (!amqpHealthy || !amqpChan) {
    if (bufferOut.length >= bufferOutMax) {
      bufferOut.shift();
      Log.warn('[AMQP] buffer atingiu o limite – descartando o mais antigo');
    }
    bufferOut.push({ queue, payload, ts: Date.now() });
    if (!amqpReconnecting) ensureAmqp();
    return;
  }
  try {
    await amqpChan.assertQueue(queue, { durable: true });
    amqpChan.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true, contentType: 'application/json' });
    } catch (e) {
    Log.warn('publish falhou – enfileirando', { queue, error: e?.message });
    amqpHealthy = false;
    bufferOut.push({ queue, payload, ts: Date.now() });
    ensureAmqp();
  }
}

async function flushBuffer() {
  if (!bufferOut.length || !amqpHealthy || !amqpChan) return;
  Log.info(`[AMQP] drenando buffer (${bufferOut.length})`);
  const items = bufferOut.splice(0, bufferOut.length);
  for (const it of items) {
    try { await publish(it.queue, it.payload); } catch {}
  }
}

let rabbitHealthTimer = null;
function startRabbitHealth() {
  if (rabbitHealthTimer) return;
  rabbitHealthTimer = setInterval(async () => {
    if (!amqpHealthy || !amqpChan) return;
    try {
      await amqpChan.checkQueue('whatsapp.incoming');
    } catch (e) {
      Log.warn('[AMQP] health falhou', { error: e?.message });
      markAmqpDown();
    }
  }, 10000);
}

async function startConsumer() {
  if (!amqpChan) return;
  const q = 'whatsapp.outgoing';
  await amqpChan.assertQueue(q, { durable: true });
  Log.info(`🎧 [QUEUE] Consumidor ONLINE: ${q}`);
  
  amqpChan.consume(q, async (msg) => {
    if (!msg) {
      Log.warn('[QUEUE] ⚠️ Mensagem nula recebida da fila');
      return;
    }
    
    const messageId = msg.properties?.messageId || 'unknown';
    const deliveryTag = msg.fields?.deliveryTag || 'unknown';
    
    Log.info('[QUEUE] 📨 Nova mensagem recebida da fila', {
      queue: q,
      messageId: messageId,
      deliveryTag: deliveryTag,
      bodyLength: msg.content?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    try {
      const payload = JSON.parse(msg.content.toString());
      
      Log.info('[QUEUE] 📋 Payload processado', {
        command: payload.command,
        phone: payload.phone,
        to: payload.to,
        hasBody: !!payload.body,
        bodyLength: payload.body?.length || 0,
        hasAttachment: !!payload.attachment,
        attachmentType: payload.attachment?.mediaType,
        attachmentMime: payload.attachment?.mimeType,
        attachmentDataUrlLength: payload.attachment?.dataUrl?.length || 0,
        clientMessageId: payload.clientMessageId
      });
      if (payload.command === 'disconnect') {
        Log.info('[QUEUE] 🔌 COMMAND disconnect recebido', { messageId, deliveryTag });
        try { 
          clearTimers(); 
          if (client) await client.logout().catch(()=>{}); 
        } finally {
          amqpChan.ack(msg);
          Log.info('[QUEUE] ✅ COMMAND disconnect processado - encerrando processo');
          process.exit(0);
        }
        return;
      }
      
      if (payload.command === 'generate_qr') {
        Log.info('[QUEUE] 🔄 COMMAND generate_qr recebido', { 
          requestId: payload.requestId, 
          messageId, 
          deliveryTag 
        });
        await handleGenerateQR(payload.requestId);
        amqpChan.ack(msg);
        Log.info('[QUEUE] ✅ COMMAND generate_qr processado com sucesso');
        return;
      }
      
      if (payload.command === 'force_new_auth') {
        Log.info('[QUEUE] 🔐 COMMAND force_new_auth recebido', { 
          requestId: payload.requestId, 
          messageId, 
          deliveryTag 
        });
        await handleForceNewAuth(payload.requestId);
        amqpChan.ack(msg);
        Log.info('[QUEUE] ✅ COMMAND force_new_auth processado com sucesso');
        return;
      }
      if (payload.command === 'send_message') {
        Log.info('[QUEUE] 📤 COMMAND send_message recebido', {
          messageId,
          deliveryTag,
          phone: payload.phone,
          to: payload.to,
          clientMessageId: payload.clientMessageId,
          hasAttachment: !!payload.attachment
        });

        // 🔧 Normalização de campos
        const targetNumber = payload.to;
        const message     = payload.body ?? payload.message ?? payload.text ?? payload.Message ?? payload.Body ?? null;
        const template    = payload.template ?? payload.Template ?? null;
        const data        = payload.data ?? payload.vars ?? payload.payload ?? null;
        const attachment  = payload.attachment || null;

        // Avisos de integridade (opcional)
        if (payload.from && payload.from !== connectedNumber) {
          Log.warn('[QUEUE] ⚠️ Inconsistência detectada (from != connectedNumber)', {
            payloadFrom: payload.from, connectedNumber, targetNumber, messageId, deliveryTag
          });
        }

        Log.debug('[QUEUE] payload normalizado', {
          targetNumber,
          hasMessage: typeof message === 'string',
          hasTemplate: !!template,
          hasData: !!data
         
        });

        const res = await sendOne(targetNumber, { message, template, data, attachment });

        if (res.success) {
          Log.info('[QUEUE] ✅ Mensagem enviada com sucesso', {
            targetNumber,
            messageId: res.messageId,
            queueMessageId: messageId,
            deliveryTag
          });
          amqpChan.ack(msg);
        } else {
          Log.error('[QUEUE] ❌ Falha ao enviar mensagem', {
            targetNumber,
            reason: res.reason,
            queueMessageId: messageId,
            deliveryTag
          });
          amqpChan.nack(msg, false, true);
        }
        return;
      }
    
      const phone = payload.toNormalized || payload.phone || payload.to || payload.Phone || payload.To;
      const body  = payload.body || payload.message || payload.text || payload.Message || payload.Body;
      const attachment = payload.attachment || null;
      
      if (phone && (body || attachment)) {
        const res = await sendOne(phone, { message: body, data: payload, template: payload.template || payload.Template, attachment });
        if (res.success) {
          amqpChan.ack(msg);
        } else {
          // ✅ RESILIÊNCIA ADICIONAL: Se falhou e é áudio, tentar recuperar do banco antes de nack
          const clientMessageId = payload.clientMessageId || payload.Id || payload.id;
          if (clientMessageId && 
              (attachment?.mediaType === 'audio' || attachment?.mediaType === 'voice' ||
               (body && body.includes('audio')))) {
            
            Log.info('🔄 [QUEUE_RESILIENCE] Falha no envio de áudio, tentando recuperação...', {
              clientMessageId: clientMessageId,
              phone: phone,
              reason: res.reason
            });
            
            try {
              const audioData = await getAudioFromPayloadJson(clientMessageId);
              if (audioData && audioData.base64Data) {
                Log.info('🎵 [QUEUE_RESILIENCE] Tentando reenvio com dados do banco...');
                const retryRes = await sendOne(phone, { 
                  message: '', 
                  data: { ...payload, recoveredFromDB: true }, 
                  attachment: {
                    dataUrl: audioData.base64Data,
                    mimeType: audioData.mimeType,
                    fileName: audioData.fileName,
                    mediaType: 'audio'
                  }
                });
                
                if (retryRes.success) {
                  Log.info('✅ [QUEUE_RESILIENCE] Áudio reenviado com sucesso!');
                  amqpChan.ack(msg);
                  return;
                }
              }
            } catch (recoveryError) {
              Log.error('❌ [QUEUE_RESILIENCE] Falha na recuperação:', recoveryError.message);
            }
          }
          
          amqpChan.nack(msg, false, false);
        }
        return;
      }
      amqpChan.ack(msg);
    } catch (e) {
      Log.error('Erro consumer', { error: e?.message });
      amqpChan.nack(msg, false, false);
    }
  });
}

// ========================= Express (status) =========================
const app = express();
app.use(cors());
app.use(express.json());

// ✅ MIDDLEWARE: Log de todas as requisições HTTP
app.use((req, res, next) => {
  Log.info('[HTTP] 📥 Requisição recebida', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});
app.get('/status', (req,res)=> {
  try {
  const status = {
    instanceId,
    isConnected,
    isFullyValidated,
    connectedNumber,
    ts: new Date().toISOString(),
    // ✅ CORREÇÃO: Adicionar campos que a API espera
    sessionConnected: isConnected,
    status: isConnected ? (isFullyValidated ? 'connected' : 'connecting') : 'disconnected',
    lastActivity: new Date().toISOString(),
    queueMessageCount: 0,
    canGenerateQR: connectedNumber ? false : true,
      hasQRCode: true,
      // ✅ DEBUG: Adicionar informações do ambiente
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3030,
      railway: !!process.env.RAILWAY_ENVIRONMENT
    };
    
    Log.info('[STATUS] ✅ Endpoint /status respondendo', {
      status: status.status,
      isConnected,
      connectedNumber,
      port: process.env.PORT
    });
    
  res.json(status);
  } catch (error) {
    Log.error('[STATUS] ❌ Erro no endpoint /status:', error.message);
    res.status(500).json({ 
      error: 'Erro interno', 
      message: error.message,
      ts: new Date().toISOString()
    });
  }
});
app.get('/health', (req,res)=> res.json({ status: 'OK', ts: new Date().toISOString() }));
// ✅ CORREÇÃO: Configurar servidor para escutar em todas as interfaces (necessário para Railway)
const PORT = process.env.PORT || 3030;
app.listen(PORT, '0.0.0.0', ()=> Log.info(`Status server em http://0.0.0.0:${PORT}`));

// ========================= WhatsApp Client =========================

// ✅ CORREÇÃO: Função para obter connectedNumber de forma robusta
async function getConnectedNumber() {
  try {
    // Tentar obter do client.info primeiro
    if (client?.info?.wid?.user) {
      Log.info('[CONNECTED_NUMBER] Obtido do client.info:', client.info.wid.user);
      return client.info.wid.user;
    }
    
    // Se não estiver disponível, tentar obter do getState
    if (client?.getState) {
      const state = await client.getState();
      Log.info('[CONNECTED_NUMBER] Estado do cliente:', state);
      
      if (state === 'CONNECTED' && client.info?.wid?.user) {
        Log.info('[CONNECTED_NUMBER] Obtido após getState:', client.info.wid.user);
        return client.info.wid.user;
      }
    }
    
    // Se ainda não conseguir, aguardar um pouco e tentar novamente
    Log.warn('[CONNECTED_NUMBER] client.info não disponível, aguardando...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (client?.info?.wid?.user) {
      Log.info('[CONNECTED_NUMBER] Obtido após delay:', client.info.wid.user);
      return client.info.wid.user;
    }
    
    Log.warn('[CONNECTED_NUMBER] Não foi possível obter o número conectado');
    return null;
  } catch (error) {
    Log.error('[CONNECTED_NUMBER] Erro ao obter número conectado:', { error: error?.message });
    return null;
  }
}

function buildClient() {
  if (client) return client;
  client = new Client({
    authStrategy: localAuth,
  restartOnAuthFail: true,
    authTimeoutMs: 180000,
    qrMaxRetries: 3,
  puppeteer: {
    headless: true,
    timeout: 60000,
    protocolTimeout: 240000,
    // Configurar apenas pasta de download (userDataDir conflita com LocalAuth)
    downloadPath: path.join(process.cwd(), 'downloads'),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--mute-audio',
      '--disable-web-security',
      '--no-first-run',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=VizDisplayCompositor',
      '--disable-ipc-flooding-protection',
      '--disable-default-apps',
      '--disable-sync',
      '--metrics-recording-only',
      '--no-default-browser-check',
      '--no-experiments',
      '--disable-translate',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-domain-reliability',
      '--disable-features=TranslateUI',
      '--disable-print-preview',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--force-color-profile=srgb',
      '--metrics-recording-only',
      '--safebrowsing-disable-auto-update'
    ],
    // Usar versão mais recente do Chromium
    executablePath: process.env.CHROME_PATH || undefined
  },
  locale: 'pt-BR',
  timezone: 'America/Sao_Paulo'
});

  client.on('qr', onQR);
  client.on('authenticated', async () => { 
    if (qrExpireTimer) clearTimeout(qrExpireTimer); 
    Log.info('[AUTH] autenticado - processando diretamente');
    
    // Processar onReady diretamente após autenticação
    try {
      await onReady();
      Log.info('[AUTH] onReady processado com sucesso');
    } catch (e) {
      Log.error('[AUTH] Erro ao processar onReady', { error: e?.message });
    }
  });
  client.on('ready', async () => {
    Log.info('[DEBUG] Evento ready disparado');
    try {
      // Configurar comportamento de download após conexão
      try {
        const page = client.pupPage;
        if (page) {
          await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: path.join(process.cwd(), 'downloads')
          });
          Log.info('[DOWNLOAD] Comportamento de download configurado');
        }
      } catch (downloadError) {
        Log.warn('[DOWNLOAD] Erro ao configurar download:', { error: downloadError?.message });
      }
      
      await onReady();
      Log.info('[DEBUG] onReady() processado com sucesso');
      
      // Validação pós-ready - agora o cliente está garantidamente funcional
      Log.info('[DEBUG] configurando validação pós-ready');
      validationTimer = setTimeout(async () => {
        Log.info('[DEBUG] executando validação pós-ready');
        try {
          await client.getChats();
          isFullyValidated = true;
          Log.info('[DEBUG] validação concluída com sucesso');
          await sendSessionStatus();
        } catch (e) {
          Log.warn('Validação pós-ready falhou', { error: e?.message });
          isConnected = false; isFullyValidated = false; connectedNumber = null;
          await sendSessionStatus();
        }
      }, Number(process.env.VALIDATION_DELAY || 1000));
      
    } catch (e) {
      Log.error('[DEBUG] onReady() falhou', { error: e?.message, stack: e?.stack });
      // Tentar enviar status mesmo com falha
      try {
        await sendSessionStatus();
      } catch (statusError) {
        Log.error('[DEBUG] Falha ao enviar status de emergência', { error: statusError?.message });
      }
    }
  });
  client.on('auth_failure', async (m) => { await onDisconnected('[AUTH_FAILURE] '+m); });
  client.on('disconnected', async (r) => { await onDisconnected('[DISCONNECTED] '+r); });
  client.on('message', async (message) => {
    Log.info('[MESSAGE] Mensagem recebida', { 
      from: message.from, 
      type: message.type, 
      fromMe: message.fromMe,
      body: message.body?.substring(0, 50) + '...' 
    });
    await onInbound(message);
  });

  return client;
}

// Função initializeClientSafely removida - usando inicialização direta

// ---- QR ----
async function onQR(qr) {
  if (qrExpireTimer) clearTimeout(qrExpireTimer);
  Log.info('[QR] recebido – escaneie no terminal em até 3min');
  qrcodeTerm.generate(qr, { small: true });

  try {
    const b64 = await QRCode.toDataURL(qr, { errorCorrectionLevel: 'H', type: 'image/png', margin: 1, width: 300 });
    await publish('out.qrcode', { type: 'qr_code', instanceId, qrCode: b64, ts: new Date().toISOString() });
    // usa cliente resiliente: não derruba se API cair
    await apiClient.post('/api/whatsapp/webhook/qr-code', { qrCode: b64, timestamp: new Date().toISOString(), instanceId });
  } catch (e) {
    Log.warn('Falha ao propagar QR (fila/API)', { error: e?.message });
  }

  qrExpireTimer = setTimeout(async () => {
    Log.warn('[QR] expirado');
    await publish('out.qrcode', { type: 'qr_expired', instanceId, qrCode: null, ts: new Date().toISOString() });
  }, 60 * 1000);
}

async function handleGenerateQR(_requestId) {
  Log.info('[QR_GEN] Iniciando processo de geração de QR', { requestId: _requestId });
  await ensureAmqp();
  
  if (isConnected) { 
    Log.info('[QR_GEN] Já conectado – ignorando generate_qr', { isConnected, connectedNumber }); 
    return;
  }
  
  Log.info('[QR_GEN] Criando e inicializando cliente diretamente');
  try {
    Log.info('[QR_GEN] Chamando buildClient()...');
    client = buildClient();
    Log.info('[QR_GEN] Cliente criado:', { clientExists: !!client, clientType: typeof client });
    
    Log.info('[QR_GEN] Chamando client.initialize()...');
    await client.initialize();
    Log.info('[QR_GEN] Cliente inicializado com sucesso'); 
    
  } catch (e) {
    Log.error('[QR_GEN] Erro na inicialização', { error: e?.message, stack: e?.stack });
    throw e;
  }
}

async function handleForceNewAuth(_requestId) {
  Log.info('[FORCE_AUTH] Iniciando processo de nova autenticação forçada', { requestId: _requestId });
  await ensureAmqp();
  
  // Limpar estado atual
  clearTimers();
  isConnected = false;
  isFullyValidated = false;
  connectedNumber = null;
  
  // Desconectar cliente atual se existir
  if (client) {
    try {
      Log.info('[FORCE_AUTH] Desconectando cliente atual');
      await client.logout();
  } catch (e) {
      Log.warn('[FORCE_AUTH] Erro ao desconectar cliente', { error: e?.message });
    }
    client = null;
  }
  
  // Limpar sessão salva
  try {
    Log.info('[FORCE_AUTH] Limpando sessão salva');
    await backupAndClearSession();
  } catch (e) {
    Log.warn('[FORCE_AUTH] Erro ao limpar sessão', { error: e?.message });
  }
  

  
  // Agora gerar novo QR Code
  Log.info('[FORCE_AUTH] Gerando novo QR Code');
  try {
    client = buildClient();
    await client.initialize();
    Log.info('[FORCE_AUTH] Cliente inicializado com sucesso - aguardando QR Code');
  } catch (e) {
    Log.error('[FORCE_AUTH] Erro na inicialização', { error: e?.message });
    throw e;
  }
}

// ---- READY ----
async function onReady() {
  Log.info('[DEBUG] onReady() iniciado');
  clearTimers();
  Log.info('[DEBUG] timers limpos');
  
  isConnected = true; 
  isFullyValidated = false;
  
  // ✅ CORREÇÃO: Tentar obter connectedNumber de forma mais robusta
  connectedNumber = await getConnectedNumber();
  
  Log.info('[READY] WhatsApp pronto', { connectedNumber });
  Log.info('[DEBUG] variáveis de estado definidas', { isConnected, isFullyValidated, connectedNumber });
  
  // ✅ CORREÇÃO: Enviar status imediatamente após conectar
  await sendSessionStatus();

  // Isolamento do bloco ResilientSender
  try { 
    Log.info('[DEBUG] inicializando ResilientSender');
    if (ResilientMessageSender) {
      resilientSender = new ResilientMessageSender(client, Log, sendMessageStatus);
      Log.info('[DEBUG] ResilientSender inicializado com sucesso');
    } else {
      Log.info('[DEBUG] ResilientSender não disponível');
    }
  } catch (e) {
    Log.warn('ResilientSender indisponível', { error: e?.message }); 
  }

  // Isolamento do bloco DataExtractor
  try {
    Log.info('[DEBUG] inicializando DataExtractor');
    if (WhatsAppDataExtractor && !dataExtractor) {
      dataExtractor = new WhatsAppDataExtractor({ dataPath: './whatsapp_data' });
      await dataExtractor.initialize(client);
      Log.info('[DEBUG] DataExtractor inicializado com sucesso');
      } else {
      Log.info('[DEBUG] DataExtractor não disponível ou já inicializado');
    }
  } catch (e) {
    Log.warn('Extractor falhou', { error: e?.message }); 
  }

  // Monitor de sanidade (mantém ativo e reconecta se cair)
  Log.info('[DEBUG] configurando monitorTimer');
  monitorTimer = setInterval(async () => {
    if (!isConnected) return;
    try {
      await client.getChats();
      // ✅ REMOVIDO: Log de loop infinito - apenas logar problemas
    } catch (e) {
      Log.warn('[WPP] monitor detectou queda', { error: e?.message });
      await onDisconnected('monitor');
    }
  }, 10000);

  Log.info('[DEBUG] enviando status inicial');
  await sendSessionStatus();
  Log.info('[DEBUG] onReady() concluído com sucesso');
}

async function onDisconnected(reason) {
  clearTimers();
  Log.warn('WhatsApp desconectado', { reason });
  isConnected = false; isFullyValidated = false; connectedNumber = null;
  await sendSessionStatus();

  // Reconexão com delay e tratamento de erro melhorado
  try {
    Log.info('[RECONNECT] Aguardando 5 segundos antes de tentar reconectar...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    Log.info('[RECONNECT] Tentando reconectar após desconexão');
    
    // Limpar cliente anterior completamente
    if (client) {
      try {
        // ✅ CORREÇÃO: Usar logout() ao invés de destroy() para evitar erro de contexto
        await client.logout();
        Log.info('[RECONNECT] Cliente anterior desconectado com sucesso');
      } catch (e) {
        Log.warn('[RECONNECT] Erro ao desconectar cliente anterior:', { error: e?.message });
        // Tentar destroy() como fallback apenas se logout() falhar
        try {
          await client.destroy();
        } catch (destroyError) {
          Log.warn('[RECONNECT] Erro ao destruir cliente anterior:', { error: destroyError?.message });
        }
      }
      client = null;
    }
    
    // Criar novo cliente
    client = buildClient();
    await client.initialize();
    Log.info('[RECONNECT] Reconectado com sucesso');
  } catch (e) {
    Log.error('[RECONNECT] Falha na reconexão', { error: e?.message, stack: e?.stack });
    
    // Se falhar, aguardar mais tempo antes de tentar novamente
    setTimeout(async () => {
      try {
        Log.info('[RECONNECT] Tentativa de reconexão adicional...');
        await onDisconnected('retry_after_failure');
      } catch (retryError) {
        Log.error('[RECONNECT] Falha na tentativa adicional:', { error: retryError?.message });
      }
    }, 30000); // 30 segundos
  }
}

// ---- Inbound ----
function normalizeNumber(num) {
  if (!num) return '';
  const digits = String(num).replace(/\D/g, '');
  if (digits.startsWith('55')) return digits;
  if (digits.length >= 10) return '55' + digits;
  return digits;
}

function mapWppType(t) {
  const map = { chat: 'text', text: 'text', image: 'image', video: 'video', audio: 'audio', ptt: 'audio', document: 'document', sticker: 'image' };
  return map[t] || 'text';
}

function buildInboundPayload(message) {
  const fromBare = (message.from || '').split('@')[0];
  const fromNorm = normalizeNumber(fromBare);
  return {
    // === CAMPOS OBRIGATÓRIOS ===
    externalMessageId: message.id?._serialized || crypto.randomUUID(),
    from: message.from || '',
      fromNormalized: fromNorm,
    to: connectedNumber || '',
    type: mapWppType(message.type),
      timestamp: new Date().toISOString(),
    instanceId,
      fromMe: false,
    isGroup: Boolean(message.isGroupMsg || message.isGroup),
    chatId: `chat_${fromNorm}`,

    // === CAMPOS OPCIONAIS ===
      body: message.body || '',
    simulated: false,

    // === MÍDIA UNIFICADA ===
    attachment: null, // Será preenchido em onInbound se hasMedia

    // === LOCALIZAÇÃO DA SESSÃO ===
    location: {
      latitude: -23.5505,  // São Paulo (localização da sessão do bot)
      longitude: -46.6333,
      address: "São Paulo, Brasil"
    },

    // === CONTATO DO REMETENTE ===
    contact: {
      name: fromNorm,  // Número como nome
      phone: fromNorm  // Número do remetente
    }
  };
}

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
    
    // Buscar informações do lead (opcional - não bloqueia processamento)
    const leadInfo = await isNumberInLeads(fromNorm);
    
    if (leadInfo) {
      Log.info('[INBOUND] Número encontrado na lista de leads - processando mensagem', { 
        from: fromNorm,
        leadName: leadInfo.NameLead,
        operatorId: leadInfo.OperatorId 
      });
    } else {
      Log.info('[INBOUND] Número não está na lista de leads - processando mesmo assim', { 
        from: fromNorm,
        messageType: message.type 
      });
    }

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
          dataUrl: `data:${media.mimetype};base64,${media.data}`,
          mediaUrl: null,
          mimeType: media.mimetype || 'application/octet-stream',
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

// ---- Outbound ----
function renderTemplate(tpl, data) {
  let s = '';
  if (typeof tpl === 'string') {
    s = tpl;
  } else if (tpl && typeof tpl.text === 'string') {
    s = tpl.text;
  } else {
    // Último recurso: não quebrar o fluxo
    return String(tpl || '');
  }

  if (data) {
    for (const k of Object.keys(data)) {
      s = s.replace(new RegExp(`{{${k}}}`, 'g'), String(data[k] ?? ''));
    }
  }

  return s
    .replace(/{{currentDate}}/gi, new Date().toLocaleDateString('pt-BR'))
    .replace(/{{currentTime}}/gi, new Date().toLocaleTimeString('pt-BR'))
    .replace(/{{timestamp}}/gi, new Date().toISOString())
    .replace(/{{instanceId}}/gi, instanceId)
    .replace(/{{senderNumber}}/gi, connectedNumber || 'N/A');
}

async function sendOne(number, msg) {
  if (!client) return { success: false, reason: 'client_not_ready' };
  const to = normalizeNumber(number);
  if (!to || to.length < 10) return { success: false, reason: 'invalid_number' };

  const chatId = `${to}@c.us`;
  let body = '';
  if (typeof msg?.message === 'string') body = msg.message;
  else if (msg?.template) body = renderTemplate(msg.template, msg.data);
  else body = renderTemplate(String(msg || ''), msg?.data);

  const attachment = msg?.attachment || null;
  try {
    // Handle attachments (mídia)
      if (attachment) {
      const base64 = String(attachment.dataUrl || '').split(',')[1] || attachment.dataUrl;
        const mime = attachment.mimeType || 'application/octet-stream';
        const media = new MessageMedia(mime, base64 || '', attachment.fileName || 'file');
      const sent = await client.sendMessage(chatId, media, { caption: body || undefined });
      
      if (sent?.id) { 
        await sendMessageStatus(number, sent.id._serialized, 'sent'); 
        return { success: true, messageId: sent.id._serialized }; 
      }
      throw new Error('sendMessage retornou vazio');
    } else {
      // Handle text messages (sem attachment)
      const sent = await client.sendMessage(chatId, body);
    
    if (sent?.id) { 
      await sendMessageStatus(number, sent.id._serialized, 'sent'); 
        return { success: true, messageId: sent.id._serialized }; 
    }
    throw new Error('sendMessage retornou vazio');
    }
  } catch (e) {
    Log.error('Erro sendOne', { error: e?.message, to: number });
    return { success: false, reason: e.message };
  }
}

// ✅ FUNÇÃO: Processar base64 de áudio e criar MessageMedia
async function createAudioMediaFromBase64(body) {
  let tempFilePath = null;
  
  try {
    Log.info('🎵 Processando base64 de áudio', { 
      bodyLength: body?.length || 0
    });

    // Extrair informações do data URL
    const [header, base64Data] = body.split(',');
    const mimeType = header.split(';')[0].split(':')[1];
    
    // Converter base64 para buffer
    const audioBuffer = Buffer.from(base64Data, 'base64');
    
    // ✅ VALIDAÇÃO: Usar AudioProcessor para validar o áudio
    const validation = AudioProcessor.validateAudio(audioBuffer, mimeType);
    if (!validation.isValid) {
      throw new Error(`Áudio inválido: ${validation.error}`);
    }
    
    Log.info('✅ Áudio validado com sucesso', {
      mimeType: validation.mimeType,
      size: validation.size,
      sizeFormatted: AudioProcessor.formatFileSize(validation.size)
    });
    
    // Obter extensão correta
    const extension = AudioProcessor.getExtensionFromMimeType(validation.mimeType);
    
    // Criar pasta temporária se não existir
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileName = `audio_${timestamp}_${randomId}.${extension}`;
    tempFilePath = path.join(tempDir, fileName);
    
    // Salvar arquivo validado
    fs.writeFileSync(tempFilePath, audioBuffer);
    
    Log.info('📁 Arquivo de áudio criado', { 
      filePath: tempFilePath,
      fileName: fileName,
      fileSize: audioBuffer.length,
      mimeType: validation.mimeType
    });
    
    // Criar MessageMedia a partir do arquivo
    const media = MessageMedia.fromFilePath(tempFilePath);
    media.mimetype = validation.mimeType;
    
    return { media, tempFilePath };
    
  } catch (error) {
    Log.error('❌ Erro ao processar base64 de áudio', { 
      error: error.message
    });
    throw error;
  }
}

// ✅ FUNÇÃO: Limpar arquivo temporário
function cleanupTempFile(tempFilePath) {
  if (tempFilePath && fs.existsSync(tempFilePath)) {
    try {
      fs.unlinkSync(tempFilePath);
      Log.info('🗑️ Arquivo temporário excluído', { filePath: tempFilePath });
    } catch (deleteError) {
      Log.error('⚠️ Erro ao excluir arquivo temporário', { 
        filePath: tempFilePath,
        error: deleteError.message
      });
    }
  }
}

// ✅ FUNÇÃO: Limpeza automática de arquivos temporários antigos
function cleanupOldTempFiles() {
  try {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      return;
    }
    
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutos
    
    let cleanedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtime.getTime();
      
      if (age > maxAge) {
        try {
          fs.unlinkSync(filePath);
          cleanedCount++;
          Log.info('🧹 Arquivo temporário antigo removido', { filePath });
        } catch (error) {
          Log.error('⚠️ Erro ao remover arquivo antigo', { 
            filePath, 
            error: error.message 
          });
        }
      }
    });
    
    if (cleanedCount > 0) {
      Log.info('🧹 Limpeza automática concluída', { 
        filesRemoved: cleanedCount,
        tempDir: tempDir
      });
    }
  } catch (error) {
    Log.error('❌ Erro na limpeza automática', { error: error.message });
  }
}

// ---- API wrappers (resilientes) ----
async function sendSessionStatus() {
  const statusData = {
    sessionConnected: isConnected, 
    connectedNumber, 
    isFullyValidated, 
    instanceId,
    timestamp: new Date().toISOString()
  };
  
  Log.info('[SESSION_STATUS] Enviando status para API', statusData);
  
  try {
    await apiClient.post('/api/whatsapp/session/updated', statusData);
    Log.info('[SESSION_STATUS] ✅ Status enviado com sucesso para API');
  } catch (error) {
    Log.error('[SESSION_STATUS] ❌ Erro ao enviar status para API', { error: error?.message });
  }
}

async function sendMessageStatus(phone, externalMessageId, status) {
  await publish('whatsapp.message-status', {
    phone, externalMessageId, status, ts: new Date().toISOString(), instanceId
  });
}

// ========================= Bootstrap =========================
async function ensureDirectories() {
  const dirs = [
    path.join(process.cwd(), 'downloads'),
    path.join(process.cwd(), 'logs'),
    path.join(process.cwd(), 'temp')
  ];
  
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        Log.info(`Diretório criado: ${dir}`);
      }
    } catch (e) {
      Log.warn(`Erro ao criar diretório ${dir}:`, { error: e.message });
    }
  }
}

(async function start() {
  Log.info('[INFO] Iniciando Zap Bot', { instanceId, sessionBaseDir, localAuthDir, API_BASE, RABBIT_URL });

  // Criar diretórios necessários
  await ensureDirectories();

  // Conexão com o banco de dados
  await connectDatabase();

  // Atualizar cache periodicamente (a cada 5 minutos)
  setInterval(async () => {
    try {
      const { loadOperatorLeadsCache } = require('./database');
      await loadOperatorLeadsCache();
    } catch (error) {
      Log.error('Erro ao atualizar cache periodicamente:', { error: error.message });
    }
  }, 5 * 60 * 1000); // 5 minutos

  // ✅ Limpeza automática de arquivos temporários antigos
  cleanupOldTempFiles();
  
  // ✅ Agendar limpeza automática a cada 10 minutos
  setInterval(cleanupOldTempFiles, 10 * 60 * 1000);

  // RabbitMQ inicial
  await ensureAmqp();

  // REMOVIDO: Subida automática via arquivos de sessão
  // Sempre aguardar comando generate_qr via RabbitMQ para inicialização limpa
  Log.info('[INIT] Sistema iniciado - aguardando comando generate_qr via RabbitMQ para autenticação');
})();