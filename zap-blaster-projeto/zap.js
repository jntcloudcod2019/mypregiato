// zap.js - Versão final corrigida (whatsapp-web.js + RabbitMQ)
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const amqp = require('amqplib');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const axios = require('axios');
require('dotenv').config();

// -----------------------------------------------------------------------------
// Configuração regional
// -----------------------------------------------------------------------------
process.env.TZ = 'America/Sao_Paulo';
process.env.LANG = 'pt_BR.UTF-8';
process.env.LC_ALL = 'pt_BR.UTF-8';

console.log(`🌍 Timezone: America/Sao_Paulo`);
console.log(`🇧🇷 Locale: pt_BR.UTF-8`);

const instanceId = 'zap-prod';

// Sessão (docker ou local)
const isDocker = process.env.NODE_ENV === 'production' || fs.existsSync('/.dockerenv');
const sessionPath = isDocker ? `/app/session/${instanceId}` : path.join(process.cwd(), 'session', instanceId);
const sessionDir = path.dirname(sessionPath);
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
    console.log(`📁 Diretório de sessão criado: ${sessionDir}`);
}

// -----------------------------------------------------------------------------
// RabbitMQ
// -----------------------------------------------------------------------------
const rabbitConfig = {
  protocol: 'amqps',
  hostname: 'mouse.rmq5.cloudamqp.com',
  port: 5671,
  username: 'ewxcrhtv',
  password: 'DNcdH0NEeP4Fsgo2_w-vd47CqjelFk_S',
  vhost: 'ewxcrhtv'
};

const RABBITMQ_URL = `amqps://${encodeURIComponent(rabbitConfig.username)}:${encodeURIComponent(rabbitConfig.password)}@${rabbitConfig.hostname}:${rabbitConfig.port}/${encodeURIComponent(rabbitConfig.vhost)}`;

let rabbitConnection = null;
let rabbitChannel = null;

// -----------------------------------------------------------------------------
// Estado do WhatsApp
// -----------------------------------------------------------------------------
let isConnected = false;
let isFullyValidated = false;
let connectedNumber = null;
let qrCodeTimer = null;
let validationTimer = null;
let messageQueue = []; // buffer opcional
let qrRequestPending = false;
let qrRequestId = null;

const QR_CODE_DURATION = 3 * 60 * 1000;
const VALIDATION_DELAY = parseInt(process.env.VALIDATION_DELAY || '3000', 10);
const DEV_LOOPBACK = (process.env.DEV_LOOPBACK_INBOUND === 'true') || (process.env.NODE_ENV !== 'production');

// -----------------------------------------------------------------------------
// Utils
// -----------------------------------------------------------------------------
function clearQRCodeTimer() { if (qrCodeTimer) { clearTimeout(qrCodeTimer); qrCodeTimer = null; } }
function clearValidationTimer() { if (validationTimer) { clearTimeout(validationTimer); validationTimer = null; } }

function normalizeNumber(num) {
  if (!num) return null;
  let clean = String(num).replace(/\D/g, '');
  if (clean.startsWith('55') && clean.length >= 12) return clean;
  if (clean.length === 11) return '55' + clean; // BR 11 dígitos
  if (clean.length === 10) return '55' + clean;
  if (clean.length === 9) return '5511' + clean;
  if (clean.length === 8) return '5511' + clean;
  if (clean.length > 0) return '55' + clean;
  return clean;
}

function showConnectionStatus() {
  if (isConnected && isFullyValidated && connectedNumber) {
    console.log(`\n📱 STATUS: CONECTADO E VALIDADO`);
    console.log(`📞 Número: ${connectedNumber}`);
    console.log(`🆔 Instância: ${instanceId}`);
  } else if (isConnected && !isFullyValidated) {
    console.log(`\n📱 STATUS: CONECTADO - VALIDANDO (${connectedNumber || 'N/A'})`);
  } else {
    console.log(`\n📱 STATUS: DESCONECTADO`);
  }
}

async function publishToQueue(queue, payload) {
  if (!rabbitChannel) return;
  await rabbitChannel.assertQueue(queue, { durable: true });
  const buf = Buffer.from(JSON.stringify(payload));
  await rabbitChannel.sendToQueue(queue, buf, {
    persistent: true,
    headers: { 'content-type': 'application/json', 'timestamp': new Date().toISOString() }
  });
}

function processMessageTemplate(template, data) {
  if (typeof template !== 'string') return JSON.stringify(template);
  let msg = template;
  if (data) {
    Object.keys(data).forEach(k => { msg = msg.replace(new RegExp(`{{${k}}}`, 'gi'), data[k] || ''); });
    msg = msg
      .replace(/{{currentDate}}/gi, new Date().toLocaleDateString('pt-BR'))
      .replace(/{{currentTime}}/gi, new Date().toLocaleTimeString('pt-BR'))
      .replace(/{{timestamp}}/gi, new Date().toISOString())
      .replace(/{{instanceId}}/gi, instanceId)
      .replace(/{{senderNumber}}/gi, connectedNumber || 'N/A');
  }
  return msg;
}

// -----------------------------------------------------------------------------
// Cliente WhatsApp
// -----------------------------------------------------------------------------
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: sessionPath, clientId: instanceId }),
  restartOnAuthFail: true,
  authTimeoutMs: 120000, // Aumentar para 2 minutos
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-extensions',
      '--disable-default-apps',
      '--no-default-browser-check',
      '--mute-audio',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ],
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  locale: 'pt-BR',
  timezone: 'America/Sao_Paulo'
  }
});

// QR
client.on('qr', async (qr) => {
  clearQRCodeTimer();
  console.log('📱 ESCANEIE O QR CODE NO TERMINAL (3 min):');
  qrcode.generate(qr, { small: true });

  try {
    const qrBase64 = await QRCode.toDataURL(qr, {
      errorCorrectionLevel: 'H', type: 'image/png', margin: 1, width: 300
    });
    console.log('🔗 QR Base64 (para debug/envio a UI):', qrBase64.slice(0, 60) + '...');

    if (rabbitChannel) {
      await publishToQueue('out.qrcode', {
        type: 'qr_code', instanceId, qrCode: qrBase64, requestId: qrRequestId, ts: new Date().toISOString()
      });
      console.log('📨 QR enviado para fila out.qrcode');
    }

    const apiBaseUrl = 'http://localhost:5656';
    try {
      await axios.post(`${apiBaseUrl}/api/whatsapp/webhook/qr-code`, { 
        qrCode: qrBase64, requestId: qrRequestId, timestamp: new Date().toISOString()
      });
      console.log('📨 QR enviado para API');
    } catch (e) {
      console.warn('⚠️ Falha ao enviar QR para API:', e?.message || e);
    }
    
    qrCodeTimer = setTimeout(() => {
      if (!isConnected) console.log('⏰ QR expirado. Gere um novo.');
    }, QR_CODE_DURATION);
  } catch (err) {
    console.error('❌ Erro ao gerar/enviar QR:', err.message);
  }
});

// READY
client.on('ready', async () => {
  clearQRCodeTimer();
  console.log('✅ Client READY. Aguardando delay de segurança 5s...');
  await new Promise(r => setTimeout(r, 5000));
  
  isConnected = true;
  connectedNumber = client.info?.wid?.user || 'N/A';
  isFullyValidated = false;
  
  if (!connectedNumber || connectedNumber === 'N/A') {
    console.log('❌ Número conectado inválido.');
    isConnected = false; connectedNumber = null;
    showConnectionStatus();
    await sendSessionStatusToAPI();
    return;
  }
  
  console.log('📞 Número conectado:', connectedNumber);
  showConnectionStatus();
  await sendSessionStatusToAPI();
  
  validationTimer = setTimeout(async () => {
    const ok = await validateConnection();
    if (ok) {
      isFullyValidated = true;
      showConnectionStatus();
      await sendSessionStatusToAPI();
      await processMessageQueue(); // se você optar por buffer local
    } else {
      console.log('❌ Validação falhou.');
      isConnected = false; connectedNumber = null;
      showConnectionStatus();
      await sendSessionStatusToAPI();
    }
  }, VALIDATION_DELAY);
});

client.on('auth_failure', async (msg) => {
  clearQRCodeTimer(); clearValidationTimer();
  isConnected = false; isFullyValidated = false; connectedNumber = null;
  console.error('❌ Falha de autenticação:', msg);
  showConnectionStatus();
  await sendSessionStatusToAPI();
});

client.on('disconnected', async (reason) => {
  clearQRCodeTimer(); clearValidationTimer();
  isConnected = false; isFullyValidated = false; connectedNumber = null;
  console.log('🔌 Cliente desconectado:', reason);
  showConnectionStatus();
  await sendSessionStatusToAPI();
});

client.on('loading_screen', (p, m) => console.log(`⏳ Loading: ${p}% - ${m}`));

// Inbound (recebidas no WhatsApp)
client.on('message', async (message) => {
  try {
    if (message.fromMe) return;
    const fromBare = message.from.split('@')[0];
    const fromNorm = normalizeNumber(fromBare);
    console.log(`📨 INBOUND de ${fromNorm}: ${message.body?.slice(0, 100) || ''}`);

    await sendMessageToAPI(message);
  } catch (e) {
    console.error('❌ Erro ao processar inbound:', e.message);
  }
});

// -----------------------------------------------------------------------------
// Helpers de sessão/API
// -----------------------------------------------------------------------------
async function validateConnection() {
  try {
    if (!client.info || !client.info.wid) return false;
    const number = client.info.wid.user;
    if (!number) return false;
    await client.getChats().catch(() => {});
    console.log('✅ Conexão validada.');
    return true;
  } catch (e) {
    console.log('❌ Erro durante validação:', e.message);
    return false;
  }
}

async function sendSessionStatusToAPI() {
  try {
    if (rabbitChannel) {
      await publishToQueue('session.status', {
        sessionConnected: isConnected,
        connectedNumber,
        isFullyValidated,
        lastActivity: new Date().toISOString(),
        instanceId
      });
    }
    const apiBaseUrl = 'http://localhost:5656';
    await axios.post(`${apiBaseUrl}/api/whatsapp/session/updated`, {
      sessionConnected: isConnected, connectedNumber, isFullyValidated
    }).catch(e => console.warn('⚠️ Webhook session/updated falhou:', e?.message));
  } catch (e) {
    console.warn('⚠️ sendSessionStatusToAPI:', e?.message);
  }
}

async function sendMessageToAPI(message) {
  try {
    if (!rabbitChannel) return;
    const fromBare = message.from.split('@')[0];
    const fromNorm = normalizeNumber(fromBare);

    const data = {
      externalMessageId: message.id._serialized,
      from: fromNorm,
      fromNormalized: fromNorm,
      to: connectedNumber,
      body: message.body,
      type: message.type,
      timestamp: new Date().toISOString(),
      instanceId,
      fromMe: false,
      isGroup: false,
      chatId: `chat_${fromNorm}`
    };
    await publishToQueue('whatsapp.incoming', data);
    console.log('📤 Inbound enviado para fila whatsapp.incoming');
  } catch (e) {
    console.error('❌ Erro ao enviar inbound para API:', e.message);
  }
}

async function sendMessageConfirmationToAPI(phone, messageId, status) {
  try {
    if (!rabbitChannel) return;
    const conf = { phone, messageId, status, timestamp: new Date().toISOString(), instanceId };
    await publishToQueue('whatsapp.message-status', conf);
    console.log(`📤 Status enviado: ${messageId} - ${status}`);
  } catch (e) {
    console.error('❌ Erro ao enviar status:', e.message);
  }
}

// -----------------------------------------------------------------------------
// Envio de mensagens (saída)
// -----------------------------------------------------------------------------
async function sendOne(client, number, messageData) {
  if (!client?.info?.wid) return { success: false, reason: 'client_not_authenticated' };

  if (!isFullyValidated) {
    console.log(`⏳ Aguardando validação. Reenfileirar: ${number}`);
    // (opção buffer local)
//    messageQueue.push({ phone: number, messageData });
    return { success: false, reason: 'waiting_validation' };
  }

  const own = normalizeNumber(client.info?.wid?.user);
  const to = normalizeNumber(number);
  if (!own) return { success: false, reason: 'own_number_unavailable' };
  if (!to || to.length < 10) return { success: false, reason: 'invalid_number' };

  try {
    const chatId = `${to}@c.us`;
    let finalMessage, attachment = null;
    
    if (typeof messageData === 'string') {
      finalMessage = messageData;
    } else if (messageData.template) {
      finalMessage = processMessageTemplate(messageData.template, messageData.data);
    } else if (messageData.message) {
      finalMessage = processMessageTemplate(messageData.message, messageData);
    } else {
      return { success: false, reason: 'invalid_message_format' };
    }

    if (messageData.attachment) attachment = messageData.attachment;
    if ((!finalMessage || finalMessage.trim() === '') && !attachment) {
      return { success: false, reason: 'empty_message' };
    }

    let sent;
    if (attachment) {
      const base64Data = String(attachment.dataUrl || '').split(',')[1];
      const mimeType = attachment.mimeType || 'application/octet-stream';
      const media = new MessageMedia(mimeType, base64Data || '', attachment.fileName || undefined);
      sent = await client.sendMessage(chatId, media, { caption: finalMessage || undefined });
        } else {
      sent = await client.sendMessage(chatId, finalMessage);
    }

    if (sent?.id) {
      await sendMessageConfirmationToAPI(number, sent.id._serialized, 'sent');
      return { success: true, messageId: sent.id };
    }
    throw new Error('sendMessage retornou vazio');
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

// -----------------------------------------------------------------------------
// Consumer da fila de saída
// -----------------------------------------------------------------------------
async function initializeRabbitMQ() {
      const url = RABBITMQ_URL + '?heartbeat=30';
  rabbitConnection = await amqp.connect(url);
  rabbitChannel = await rabbitConnection.createChannel();
  await rabbitChannel.prefetch(1);
  console.log('✅ Conexão RabbitMQ estabelecida. (prefetch=1)');

  await rabbitChannel.assertQueue('out.qrcode', { durable: true });
  await rabbitChannel.assertQueue('whatsapp.incoming', { durable: true });
  await rabbitChannel.assertQueue('whatsapp.outgoing', { durable: true });
  await rabbitChannel.assertQueue('whatsapp.message-status', { durable: true });
  await rabbitChannel.assertQueue('session.status', { durable: true });

  rabbitConnection.on('close', () => {
    console.log('🔌 Conexão RabbitMQ fechada. Reconnect em 5s.');
    setTimeout(() => startQueueConsumer().catch(()=>{}), 5000);
  });
  rabbitConnection.on('error', (err) => console.error('❌ Erro AMQP:', err?.message || err));
}

async function startQueueConsumer() {
  if (!rabbitChannel) {
    console.log('⚠️ RabbitMQ não pronto ainda; aguardando...');
    return;
  }
  const queueName = 'whatsapp.outgoing';
  await rabbitChannel.assertQueue(queueName, { durable: true });
  console.log(`[AMQP] Consumidor ONLINE na fila ${queueName}.`);

  rabbitChannel.consume(queueName, async (msg) => {
    if (!msg) return;
    try {
      const raw = msg.content.toString();
      console.log('📥 Mensagem bruta recebida:', raw);
      const payload = JSON.parse(raw);

      // Comandos
          if (payload.command === 'disconnect') {
        console.log('🛠️ Comando disconnect: logout + encerrar.');
        try { clearQRCodeTimer(); clearValidationTimer(); await client.logout().catch(()=>{}); } finally {
          rabbitChannel.ack(msg);
              process.exit(0);
            }
            return;
          }
          if (payload.command === 'generate_qr') {
        console.log('🛠️ Comando generate_qr: inicializando cliente p/ emitir QR.');
        try {
          qrRequestPending = true;
          qrRequestId = payload.requestId || null;
          client.initialize().catch(e => console.error('init error:', e.message));
        } catch (e) {
          console.error('❌ Erro generate_qr:', e.message);
        }
        rabbitChannel.ack(msg);
            return;
          }

      if (payload.command === 'send_message') {
        console.log('🛠️ Comando send_message recebido:', payload);
        const phone = payload.phone;
        const message = payload.message;
        
        if (phone && message) {
          const result = await sendOne(client, phone, {
            message: message,
            template: payload.template,
            data: payload.data
          });
          
          if (result.success) {
            console.log(`✅ Mensagem enviada com sucesso para ${phone}`);
            rabbitChannel.ack(msg);
          } else {
            console.log(`⚠️ Falha no envio para ${phone}: ${result.reason}`);
            rabbitChannel.nack(msg, false, true); // requeue
          }
        } else {
          console.log('❌ Comando send_message inválido: phone ou message ausentes');
          rabbitChannel.nack(msg, false, false);
        }
        return;
      }

      // Envio normal (aceitando múltiplos formatos)
      const phone =
        payload.toNormalized ||
        payload.phone || payload.Phone ||
        payload.to || payload.To;

      const body =
        payload.body || payload.Body ||
        payload.message || payload.Message ||
        payload.text;

      const attachment = payload.attachment || payload.Attachment || null;

      if (phone && (body || attachment)) {
        const result = await sendOne(client, phone, {
          message: body,
          template: payload.template || payload.Template,
          data: payload.data || payload.Data || payload,
          attachment,
          isGroup: !!payload.isGroup
        });

        if (result.success) {
          await publishToQueue('whatsapp.message-status', {
            chatId: payload.chatId,
            messageId: payload.clientMessageId,
            externalMessageId: result.messageId?._serialized,
            status: 'sent',
            timestamp: new Date().toISOString()
          });
          rabbitChannel.ack(msg);
        } else if (result.reason === 'waiting_validation') {
          console.log(`⏳ Aguardando validação. Requeue para ${phone}.`);
          rabbitChannel.nack(msg, false, true); // requeue
        } else {
          console.log(`⚠️ Falha no envio para ${phone}: ${result.reason}`);
          rabbitChannel.nack(msg, false, false); // descarta (ou mude para true se quiser requeue)
        }
        return;
      }

      console.log('ℹ️ Payload não reconhecido (sem phone/to ou sem body/attachment). Ack.');
      rabbitChannel.ack(msg);
    } catch (e) {
      console.error('❌ Erro ao processar mensagem:', e.message);
      rabbitChannel.nack(msg, false, false);
    }
  });
}

// -----------------------------------------------------------------------------
// Heartbeat para API
// -----------------------------------------------------------------------------
function startHeartbeatToAPI() {
  const apiBaseUrl = 'http://localhost:5656';
  const timer = setInterval(async () => {
    try {
      await axios.post(`${apiBaseUrl}/api/whatsapp/session/updated`, {
        sessionConnected: isConnected, connectedNumber, isFullyValidated
      }, {
        timeout: 5000, // 5 segundos de timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('💓 Heartbeat enviado para API');
    } catch (e) {
      // Log mais silencioso para evitar spam
      if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
        console.log('💓 API não disponível (normal durante desenvolvimento)');
      } else {
        console.warn('⚠️ Heartbeat falhou:', e?.message || e);
      }
    }
  }, 30000);
  process.on('SIGINT', () => clearInterval(timer));
  process.on('SIGTERM', () => clearInterval(timer));
}

// -----------------------------------------------------------------------------
// Inicialização
// -----------------------------------------------------------------------------
async function startApp() {
  console.log('🚀 Inicializando Zap Blaster...');
  console.log(`📁 Sessão: ${sessionPath}`);
  console.log('📱 Será necessário escanear QR Code quando solicitado (generate_qr).');

  await initializeRabbitMQ().catch(err => {
    console.error('❌ Erro AMQP:', err?.message || err);
  });
  await startQueueConsumer().catch(()=>{});
  startHeartbeatToAPI();
}
startApp();

// Observação: o cliente WhatsApp **não** é inicializado aqui.
// Ele só é inicializado quando chegar um comando `generate_qr` na fila,
// o que evita boot com browser travado quando não for necessário.