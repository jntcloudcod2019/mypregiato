// zap-bot.js — versão resiliente (API e RabbitMQ) — COMPLETO

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

// opcionais
let WhatsAppDataExtractor; try { WhatsAppDataExtractor = require('./WhatsAppDataExtractor'); } catch {}
let HotReloadManager;     try { HotReloadManager = require('./HotReloadManager'); } catch {}
let ResilientMessageSender; try { ({ ResilientMessageSender } = require('./resilience/resilient-sender')); } catch {}

process.env.TZ = 'America/Sao_Paulo';

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
let clientInitializing = false;
let isConnected = false;
let isFullyValidated = false;
let connectedNumber = null;

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
    this.cooldownMs = Number(process.env.API_CB_COOLDOWN_MS || 15000);
    this.lastOpen = 0;
    this.queue = [];
    this.maxQueue = Number(process.env.API_QUEUE_MAX || 500);
    this.flushTimer = null;

    this.startHealthLoop();
  }

  // health loop: tenta voltar do modo offline
  startHealthLoop() {
    setInterval(async () => {
      if (!this.offline) return;
      const now = Date.now();
      if (now - this.lastOpen < this.cooldownMs) return;
      try {
        await axios.get(this.baseUrl + '/health', { timeout: 4000 });
        Log.info('[API] Saúde OK – voltando do modo offline');
        this.offline = false;
        this.failCount = 0;
        this.flushQueue();
      } catch {
        // continua offline
      }
    }, 5000);
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
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null;
        this.flushQueue();
      }, 3000);
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
      setTimeout(() => this.flushQueue(), this.backoffDelay());
      throw e;
    }
  }
}

const apiClient = new ApiClient(API_BASE);

// ========================= RabbitMQ Resiliente =========================
/**
 * - Backoff exponencial com jitter
 * - Health-check periódico
 * - Buffer offline para publicações
 * - Re-anexa consumer automaticamente
 */
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
function backoff(attempt){ return Math.min(1000 * Math.pow(2, Math.min(attempt, 8)), 60000); }

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

    // health check periódico (ping simples)
    startRabbitHealth();
    return true;
  } catch (e) {
    amqpReconnecting = false;
    amqpHealthy = false;
    Log.error('Falha RabbitMQ', { error: e?.message });
    if (amqpAttempts < amqpMaxAttempts) {
      setTimeout(ensureAmqp, delay);
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
      Log.debug('[AMQP] health OK');
    } catch (e) {
      Log.warn('[AMQP] health falhou', { error: e?.message });
      markAmqpDown();
    }
  }, 30000);
}

async function startConsumer() {
  if (!amqpChan) return;
  const q = 'whatsapp.outgoing';
  await amqpChan.assertQueue(q, { durable: true });
  Log.info(`Consumidor ONLINE: ${q}`);
  amqpChan.consume(q, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      if (payload.command === 'disconnect') {
        Log.info('COMMAND disconnect');
        try { clearTimers(); if (client) await client.logout().catch(()=>{}); } finally {
          amqpChan.ack(msg);
          process.exit(0);
        }
        return;
      }
      if (payload.command === 'generate_qr') {
        Log.info('[COMMAND] generate_qr recebido', { requestId: payload.requestId });
        await handleGenerateQR(payload.requestId);
        amqpChan.ack(msg);
        Log.info('[COMMAND] generate_qr processado com sucesso');
        return;
      }
      if (payload.command === 'send_message') {
        const { phone, message, template, data, attachment } = payload;
        const res = await sendOne(phone, { message, template, data, attachment });
        if (res.success) amqpChan.ack(msg); else amqpChan.nack(msg, false, true);
        return;
      }

      const phone = payload.toNormalized || payload.phone || payload.to || payload.Phone || payload.To;
      const body  = payload.body || payload.message || payload.text || payload.Message || payload.Body;
      const attachment = payload.attachment || null;
      if (phone && (body || attachment)) {
        const res = await sendOne(phone, { message: body, data: payload, template: payload.template || payload.Template, attachment });
        if (res.success) amqpChan.ack(msg); else amqpChan.nack(msg, false, false);
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
app.get('/status', (req,res)=> res.json({ instanceId, isConnected, isFullyValidated, connectedNumber, ts:new Date().toISOString() }));
app.get('/health', (req,res)=> res.json({ status: 'OK', ts: new Date().toISOString() }));
app.listen(3030, ()=> Log.info('Status server em http://localhost:3030'));

// ========================= WhatsApp Client =========================
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
      args: [
        '--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu',
        '--disable-extensions','--mute-audio','--disable-web-security','--no-first-run'
      ]
    },
    locale: 'pt-BR',
    timezone: 'America/Sao_Paulo'
  });

  client.on('qr', onQR);
  client.on('authenticated', () => { if (qrExpireTimer) clearTimeout(qrExpireTimer); Log.info('[AUTH] autenticado'); });
  client.on('ready', async () => {
    Log.info('[DEBUG] Evento ready disparado');
    try {
      await onReady();
      Log.info('[DEBUG] onReady() processado com sucesso');
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
  client.on('message', onInbound);

  return client;
}

async function initializeClientSafely() {
  if (clientInitializing) { 
    Log.info('[INIT] initializeClientSafely: já em progresso'); 
    return; 
  }
  
  clientInitializing = true;
  Log.info('[INIT] Começando inicialização segura do cliente');
  
  try {
    Log.info('[INIT] Construindo cliente WhatsApp');
    buildClient();
    Log.info('[INIT] Cliente construído, iniciando initialize()...');
    await client.initialize();
    Log.info('[INIT] Client.initialize() concluído com sucesso');
  } catch (e) {
    Log.error('[INIT] Erro durante initialize()', { error: e?.message, stack: e?.stack });
    if (String(e?.message).includes('Execution context') || String(e?.message).includes('ProtocolError')) {
      Log.warn('[INIT] Erro de contexto detectado, limpando sessão e tentando novamente');
      await backupAndClearSession();
      try {
        client = null; 
        Log.info('[INIT] Reconstruindo cliente após erro');
        buildClient();
        await client.initialize();
        Log.info('[INIT] Segunda tentativa de initialize() bem-sucedida');
      } catch (e2) { 
        Log.error('[INIT] Segunda tentativa falhou', { error: e2?.message, stack: e2?.stack }); 
      }
    }
  } finally {
    clientInitializing = false;
    Log.info('[INIT] initializeClientSafely finalizado');
  }
}

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
  }, 3 * 60 * 1000);
}

async function handleGenerateQR(_requestId) {
  Log.info('[QR_GEN] Iniciando processo de geração de QR', { requestId: _requestId });
  await ensureAmqp();
  
  if (isConnected) { 
    Log.info('[QR_GEN] Já conectado – ignorando generate_qr', { isConnected, connectedNumber }); 
    return; 
  }
  
  Log.info('[QR_GEN] Iniciando inicialização do cliente WhatsApp');
  await initializeClientSafely();
  Log.info('[QR_GEN] Processo de inicialização concluído');
}

// ---- READY ----
async function onReady() {
  Log.info('[DEBUG] onReady() iniciado');
  clearTimers();
  Log.info('[DEBUG] timers limpos');
  
  isConnected = true; isFullyValidated = false;
  connectedNumber = client?.info?.wid?.user || null;
  Log.info('[READY] WhatsApp pronto', { connectedNumber });
  Log.info('[DEBUG] variáveis de estado definidas', { isConnected, isFullyValidated, connectedNumber });

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

  // Isolamento do bloco DataExtractor com timeout
  try {
    Log.info('[DEBUG] inicializando DataExtractor');
    if (WhatsAppDataExtractor && !dataExtractor) {
      dataExtractor = new WhatsAppDataExtractor({ dataPath: './whatsapp_data' });
      
      // Adicionar timeout para evitar travamento
      const initPromise = dataExtractor.initialize(client);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DataExtractor timeout')), 10000)
      );
      
      await Promise.race([initPromise, timeoutPromise]);
      Log.info('[DEBUG] DataExtractor inicializado com sucesso');
    } else {
      Log.info('[DEBUG] DataExtractor não disponível ou já inicializado');
    }
  } catch (e) { 
    Log.warn('Extractor falhou', { error: e?.message }); 
  }

  // Validação simples pós-ready
  Log.info('[DEBUG] configurando validationTimer');
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
  }, Number(process.env.VALIDATION_DELAY || 3000));

  // Monitor de sanidade (mantém ativo e reconecta se cair)
  Log.info('[DEBUG] configurando monitorTimer');
  monitorTimer = setInterval(async () => {
    if (!isConnected) return;
    try {
      await client.getChats();
      Log.debug('[WPP] monitor ok');
    } catch (e) {
      Log.warn('[WPP] monitor detectou queda', { error: e?.message });
      await onDisconnected('monitor');
    }
  }, 30000);

  Log.info('[DEBUG] enviando status inicial');
  await sendSessionStatus();
  Log.info('[DEBUG] onReady() concluído com sucesso');
}

async function onDisconnected(reason) {
  clearTimers();
  Log.warn('WhatsApp desconectado', { reason });
  isConnected = false; isFullyValidated = false; connectedNumber = null;
  await sendSessionStatus();

  // backoff simples para reinit
  const retryMs = jitter(backoff(1));
  setTimeout(() => initializeClientSafely().catch(()=>{}), retryMs);
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
    if (message.fromMe) return;
    let payload = buildInboundPayload(message);

    // Processar mídia se existir
    if (message.hasMedia) {
      const media = await message.downloadMedia();
      if (media && media.data) {
        const messageType = mapWppType(message.type);
        
        payload.attachment = {
          dataUrl: media.data,
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
  if (typeof tpl !== 'string') return String(tpl || '');
  let s = tpl;
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
    if (resilientSender) {
      const res = await resilientSender.sendMessage({
        to: number, body, attachment, clientMessageId: crypto.randomUUID()
      });
      if (res.success) { await sendMessageStatus(number, res.messageId, 'sent'); return { success: true, messageId: res.messageId }; }
      return { success: false, reason: res.error || 'unknown' };
    }

    // fallback
    let sent;
    if (attachment) {
      const base64 = String(attachment.dataUrl || '').split(',')[1] || attachment.dataUrl;
      const mime = attachment.mimeType || 'application/octet-stream';
      const media = new MessageMedia(mime, base64 || '', attachment.fileName || 'file');
      sent = await client.sendMessage(chatId, media, { caption: body || undefined });
    } else {
      sent = await client.sendMessage(chatId, body);
    }
    if (sent?.id) { await sendMessageStatus(number, sent.id._serialized, 'sent'); return { success: true, messageId: sent.id }; }
    throw new Error('sendMessage retornou vazio');
  } catch (e) {
    Log.error('Erro sendOne', { error: e?.message, to: number });
    return { success: false, reason: e.message };
  }
}

// ---- API wrappers (resilientes) ----
async function sendSessionStatus() {
  await apiClient.post('/api/whatsapp/session/updated', {
    sessionConnected: isConnected, connectedNumber, isFullyValidated, instanceId
  }).catch(() => {}); // silencioso
}

async function sendMessageStatus(phone, externalMessageId, status) {
  await publish('whatsapp.message-status', {
    phone, externalMessageId, status, ts: new Date().toISOString(), instanceId
  });
}

// ========================= Bootstrap =========================
(async function start() {
  Log.info('[INFO] Iniciando Zap Bot', { instanceId, sessionBaseDir, localAuthDir, API_BASE, RABBIT_URL });

  // RabbitMQ inicial
  await ensureAmqp();

  // Timeout de emergência para detectar falhas de conexão
  setTimeout(async () => {
    if (!isConnected) {
      Log.info('[EMERGENCY] Timeout: Sistema aguardando comando generate_qr após 60s');
      try {
        await sendSessionStatus();
      } catch (e) {
        Log.error('[EMERGENCY] Falha ao enviar status de emergência', { error: e?.message });
      }
    } else {
      Log.info('[EMERGENCY] Timeout: Sistema funcionando normalmente');
    }
  }, 60000); // 1 minuto após inicialização

  // REMOVIDO: Subida automática via arquivos de sessão
  // Sempre aguardar comando generate_qr via RabbitMQ para inicialização limpa
  Log.info('[INIT] Sistema iniciado - aguardando comando generate_qr via RabbitMQ para autenticação');
})();