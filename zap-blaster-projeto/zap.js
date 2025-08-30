// zap.js - Versão final corrigida (whatsapp-web.js + RabbitMQ + Sistema de Sessão)
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const amqp = require('amqplib');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const axios = require('axios');
const crypto = require('crypto');
const WhatsAppDataExtractor = require('./WhatsAppDataExtractor');
const HotReloadManager = require('./HotReloadManager');

// Resiliência - Classes importadas
const { ResilientMessageSender } = require('./resilience/resilient-sender');

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

// Instância global do message sender resiliente
let resilientSender = null;

// -----------------------------------------------------------------------------
// Sistema de Logging Estruturado
// -----------------------------------------------------------------------------
class StructuredLogger {
    static log(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            instanceId,
            ...metadata
        };
        
        // Formato legível para console
        const logLine = `[${timestamp}] [${logEntry.level}] ${message}`;
        const metadataStr = Object.keys(metadata).length > 0 ? JSON.stringify(metadata, null, 2) : '';
        
        if (metadataStr) {
            console.log(logLine);
            console.log(metadataStr);
        } else {
            console.log(logLine);
        }
    }
    
    static info(message, metadata = {}) { 
        this.log('info', message, metadata); 
    }
    
    static error(message, metadata = {}) { 
        this.log('error', message, metadata); 
    }
    
    static warn(message, metadata = {}) { 
        this.log('warn', message, metadata); 
    }
    
    static debug(message, metadata = {}) { 
        this.log('debug', message, metadata); 
    }
}

// Sessão (docker ou local)
const isDocker = process.env.NODE_ENV === 'production' || fs.existsSync('/.dockerenv');
const sessionPath = isDocker ? `/app/session/${instanceId}` : path.join(process.cwd(), 'session', instanceId);
const sessionDir = path.dirname(sessionPath);
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
    StructuredLogger.info('Diretório de sessão criado', { sessionDir });
}

// -----------------------------------------------------------------------------
// Sistema Avançado de Processamento de Mídias
// -----------------------------------------------------------------------------
class AdvancedMediaProcessor {
    static async processMedia(message) {
        if (!message.hasMedia) return null;
        
        try {
            StructuredLogger.info('Processando mídia', { 
                messageId: message.id._serialized,
                type: message.type 
            });
            
            const media = await message.downloadMedia();
            
            // Validação da mídia
            if (!media || !media.data) {
                throw new Error('Mídia inválida ou corrompida');
            }
            
            // Determinar o tipo de mídia baseado no MIME type
            const mediaType = this.getMediaTypeFromMime(media.mimetype);
            
            // Gerar nome de arquivo único se não existir
            const fileName = media.filename || this.generateFileName(media.mimetype);
            
            const mediaPayload = {
                dataUrl: media.data, // Base64 completo
                mimeType: media.mimetype,
                fileName: fileName,
                mediaType: mediaType // Campo obrigatório para a API
            };
            
            StructuredLogger.info('Mídia processada com sucesso', {
                messageId: message.id._serialized,
                mimeType: media.mimetype,
                fileName: mediaPayload.fileName,
                mediaType: mediaPayload.mediaType
            });
            
            return mediaPayload;
            
        } catch (error) {
            StructuredLogger.error('Falha ao processar mídia', { 
                messageId: message.id._serialized,
                error: error.message,
                type: message.type
            });
            
            // Retornar payload de erro para a API
            return {
                dataUrl: null,
                mimeType: null,
                fileName: null,
                mediaType: 'error',
                error: error.message
            };
        }
    }
    
    static getMediaTypeFromMime(mimeType) {
        if (!mimeType) return 'unknown';
        
        const mime = mimeType.toLowerCase();
        if (mime.startsWith('image/')) return 'image';
        if (mime.startsWith('video/')) return 'video';
        if (mime.startsWith('audio/')) return 'audio';
        if (mime.startsWith('application/') || mime.includes('document')) return 'document';
        
        return 'unknown';
    }
    
    static generateFileName(mimeType) {
        const extension = this.getExtensionFromMime(mimeType);
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return `media_${timestamp}_${random}.${extension}`;
    }
    
    static getExtensionFromMime(mimeType) {
        const mime = mimeType.toLowerCase();
        if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
        if (mime.includes('png')) return 'png';
        if (mime.includes('gif')) return 'gif';
        if (mime.includes('webp')) return 'webp';
        if (mime.includes('mp4')) return 'mp4';
        if (mime.includes('avi')) return 'avi';
        if (mime.includes('mov')) return 'mov';
        if (mime.includes('mp3')) return 'mp3';
        if (mime.includes('wav')) return 'wav';
        if (mime.includes('ogg')) return 'ogg';
        if (mime.includes('pdf')) return 'pdf';
        if (mime.includes('doc')) return 'doc';
        if (mime.includes('docx')) return 'docx';
        if (mime.includes('xls')) return 'xls';
        if (mime.includes('xlsx')) return 'xlsx';
        if (mime.includes('txt')) return 'txt';
        
        return 'bin';
    }
}

// -----------------------------------------------------------------------------
// Sistema Avançado de Validação e Normalização de Mensagens
// -----------------------------------------------------------------------------
class AdvancedMessageValidator {
    static validateMessage(message) {
        const errors = [];
        
        // Validação básica
        if (!message.id?._serialized) errors.push('ID inválido');
        if (!message.from) errors.push('Remetente inválido');
        
        // Validação de tamanho do ID (evitar erro de campo muito longo)
        if (message.id._serialized?.length > 255) {
            errors.push('ID muito longo');
        }
        
        // Validação de tipo de mensagem
        if (!this.isValidMessageType(message.type)) {
            errors.push(`Tipo de mensagem não suportado: ${message.type}`);
        }
        
        return { isValid: errors.length === 0, errors };
    }
    
    static isValidMessageType(type) {
        const validTypes = [
            'chat', 'text', 'image', 'video', 'audio', 'document', 
            'sticker', 'location', 'contact', 'ptt', 'revoked',
            'unknown', 'broadcast'
        ];
        return validTypes.includes(type);
    }
    
    static normalizeMessageId(messageId) {
        if (!messageId) return `msg_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        
        // Truncar se muito longo, mas manter unicidade
        if (messageId.length > 255) {
            return messageId.substring(0, 200) + '_' + 
                   crypto.createHash('md5').update(messageId).digest('hex').substring(0, 8);
        }
        return messageId;
    }
    
    static normalizePhoneNumber(phone) {
        if (!phone) return '';
        
        // Remover caracteres especiais e normalizar
        let normalized = phone.replace(/[^\d]/g, '');
        
        // Adicionar código do país se não existir
        if (normalized.length === 11 && normalized.startsWith('11')) {
            normalized = '55' + normalized;
        }
        
        return normalized;
    }
    
    static getMessageTypeForAPI(whatsappType) {
        const typeMap = {
            'chat': 'text',
            'text': 'text',
            'image': 'image',
            'video': 'video',
            'audio': 'audio',
            'ptt': 'audio',
            'document': 'document',
            'sticker': 'image',
            'location': 'text',
            'contact': 'text',
            'revoked': 'text',
            'unknown': 'text',
            'broadcast': 'text'
        };
        
        return typeMap[whatsappType] || 'text';
    }
}

// -----------------------------------------------------------------------------
// Sistema de Processamento Resiliente de Mensagens
// -----------------------------------------------------------------------------
class ResilientMessageProcessor {
    static async processMessage(message) {
        try {
            // Validação inicial
            const validation = AdvancedMessageValidator.validateMessage(message);
            if (!validation.isValid) {
                StructuredLogger.warn('Mensagem inválida recebida', { 
                    errors: validation.errors,
                    messageId: message.id?._serialized 
                });
                
                // Enviar mensagem de erro para a API
                return this.createErrorMessage(message, validation.errors);
            }
            
            const fromBare = message.from.split('@')[0];
            const fromNorm = AdvancedMessageValidator.normalizePhoneNumber(fromBare);
            
            StructuredLogger.info('Mensagem recebida', {
                from: fromNorm,
                type: message.type,
                hasMedia: message.hasMedia,
                messageId: message.id._serialized,
                bodyPreview: message.body?.slice(0, 100) || ''
            });

            // Processar mídia se existir
            let mediaPayload = null;
            if (message.hasMedia) {
                mediaPayload = await AdvancedMediaProcessor.processMedia(message);
            }

            // Preparar payload da mensagem com todos os campos obrigatórios
            const messagePayload = {
                externalMessageId: AdvancedMessageValidator.normalizeMessageId(message.id._serialized),
                from: message.from,
                fromNormalized: fromNorm,
                to: connectedNumber || 'unknown',
                type: AdvancedMessageValidator.getMessageTypeForAPI(message.type),
                timestamp: new Date().toISOString(),
                instanceId: instanceId,
                fromMe: false,
                isGroup: message.isGroup || false,
                body: message.body || '',
                attachment: mediaPayload,
                simulated: false, // Campo obrigatório para a API
                chatId: `chat_${fromNorm}`
            };

            return messagePayload;
            
        } catch (error) {
            StructuredLogger.error('Erro crítico ao processar mensagem', { 
                error: error.message,
                messageId: message.id?._serialized,
                stack: error.stack
            });
            
            // Retornar mensagem de erro para manter o fluxo
            return this.createErrorMessage(message, [error.message]);
        }
    }
    
    static createErrorMessage(message, errors) {
        const fromBare = message.from?.split('@')[0] || 'unknown';
        const fromNorm = AdvancedMessageValidator.normalizePhoneNumber(fromBare);
        
        return {
            externalMessageId: AdvancedMessageValidator.normalizeMessageId(message.id?._serialized),
            from: message.from || 'unknown',
            fromNormalized: fromNorm,
            to: connectedNumber || 'unknown',
            type: 'text',
            timestamp: new Date().toISOString(),
            instanceId: instanceId,
            fromMe: false,
            isGroup: false,
            body: `[ERRO] Não foi possível processar esta mensagem: ${errors.join(', ')}`,
            attachment: null,
            simulated: false,
            chatId: `chat_${fromNorm}`,
            error: true,
            errorDetails: errors
        };
    }
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

// 🚀 NOVO: Sistema de resiliência RabbitMQ
let rabbitReconnectAttempts = 0;
let maxRabbitReconnectAttempts = 10;
let rabbitReconnectTimer = null;
let isReconnectingRabbit = false;
let rabbitConnectionHealthy = false;
let messageQueue = []; // Buffer para mensagens durante reconexão

// -----------------------------------------------------------------------------
// Estado do WhatsApp
// -----------------------------------------------------------------------------
let isConnected = false;
let isFullyValidated = false;
let connectedNumber = null;
let qrCodeTimer = null;
let validationTimer = null;
let qrRequestPending = false;
let qrRequestId = null;

// 🚀 NOVO: Variáveis para reconexão automática
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;
let reconnectTimer = null;
let connectionValidationTimer = null;
let lastSuccessfulConnection = null;

// 🔒 Sistema de sessão simplificado (usa LocalAuth nativo)
// 📊 Sistema de extração de dados do WhatsApp
let dataExtractor = null;

// 🔥 Sistema de Hot Reload para desenvolvimento
let hotReloadManager = null;

const QR_CODE_DURATION = 3 * 60 * 1000;
const VALIDATION_DELAY = parseInt(process.env.VALIDATION_DELAY || '3000', 10);
const DEV_LOOPBACK = (process.env.DEV_LOOPBACK_INBOUND === 'true') || (process.env.NODE_ENV !== 'production');

// -----------------------------------------------------------------------------
// Utils
// -----------------------------------------------------------------------------
function clearQRCodeTimer() { if (qrCodeTimer) { clearTimeout(qrCodeTimer); qrCodeTimer = null; } }
function clearValidationTimer() { if (validationTimer) { clearTimeout(validationTimer); validationTimer = null; } }

// 🚀 NOVO: Funções para gerenciar reconexão
function clearReconnectTimer() { 
  if (reconnectTimer) { 
    clearTimeout(reconnectTimer); 
    reconnectTimer = null; 
  } 
}

function clearConnectionValidationTimer() { 
  if (connectionValidationTimer) { 
    clearTimeout(connectionValidationTimer); 
    connectionValidationTimer = null; 
  } 
}

function clearAllTimers() {
  clearQRCodeTimer();
  clearValidationTimer();
  clearReconnectTimer();
  clearConnectionValidationTimer();
}

function normalizeNumber(number) {
  if (!number) return '';
  return number.replace(/[^\d]/g, '');
}

function showConnectionStatus() {
  const status = isConnected ? '✅' : '❌';
  const validation = isFullyValidated ? '✅' : '❌';
  console.log(`📱 Status: ${status} Conectado | ${validation} Validado | 📞 ${connectedNumber || 'N/A'}`);
}

// 🚀 NOVO: Função de reconexão automática
async function attemptReconnection() {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.log(`❌ Máximo de tentativas de reconexão atingido (${maxReconnectAttempts}). Parando tentativas.`);
    return;
  }

  if (isConnected) {
    console.log('✅ Já conectado, cancelando reconexão.');
    return;
  }

  reconnectAttempts++;
  const delay = Math.min(5000 * reconnectAttempts, 30000); // 5s, 10s, 15s, 20s, 25s, 30s max
  
  console.log(`🔄 Tentativa de reconexão ${reconnectAttempts}/${maxReconnectAttempts} em ${delay/1000}s...`);
  
  reconnectTimer = setTimeout(async () => {
    try {
      console.log('🚀 Iniciando reconexão automática...');
      await initializeClientSafely();
    } catch (e) {
      console.error(`❌ Erro na reconexão (tentativa ${reconnectAttempts}):`, e.message);
      // Tentar novamente se não atingiu o limite
      if (reconnectAttempts < maxReconnectAttempts) {
        attemptReconnection();
      }
    }
  }, delay);
}

// 🚀 NOVO: Função de validação periódica da conexão
function startConnectionValidation() {
  if (connectionValidationTimer) return; // Já está rodando
  
  console.log('💓 Iniciando validação periódica da conexão WhatsApp...');
  
  connectionValidationTimer = setInterval(async () => {
    if (!isConnected || !connectedNumber) return;
    
    try {
      // Testar a conexão tentando obter chats
      await client.getChats();
      console.log('💓 Conexão WhatsApp válida');
      lastSuccessfulConnection = new Date();
      
      // Reset contador de tentativas se conexão estável
      if (reconnectAttempts > 0) {
        console.log('✅ Conexão restaurada, resetando contador de tentativas');
        reconnectAttempts = 0;
      }
    } catch (e) {
      console.log('⚠️ Conexão WhatsApp perdida durante validação:', e.message);
      isConnected = false;
      isFullyValidated = false;
      
      // Tentar reconectar automaticamente
      if (connectedNumber) {
        console.log('🔄 Iniciando reconexão automática...');
        attemptReconnection();
      }
    }
  }, 30000); // A cada 30 segundos
}

// 🚀 MELHORADO: Função resiliente para publicar na fila
async function publishToQueue(queue, payload) {
  try {
    // Se não há canal ou conexão não está saudável, tentar reconectar
    if (!rabbitChannel || !rabbitConnectionHealthy) {
      console.log(`⚠️ Canal RabbitMQ não disponível para ${queue}. Adicionando ao buffer...`);
      
      // Adicionar ao buffer para reenvio posterior
      messageQueue.push({ queue, payload, timestamp: Date.now() });
      
      // Limitar tamanho do buffer (evitar memory leak)
      if (messageQueue.length > 1000) {
        messageQueue.shift(); // Remove mensagem mais antiga
        console.log('⚠️ Buffer de mensagens atingiu limite. Removendo mensagem mais antiga.');
      }
      
      // Tentar reconectar se não estiver já tentando
      if (!isReconnectingRabbit) {
        await attemptRabbitReconnection();
      }
      
      return;
    }
    
  await rabbitChannel.assertQueue(queue, { durable: true });
  const buf = Buffer.from(JSON.stringify(payload));
  await rabbitChannel.sendToQueue(queue, buf, {
    persistent: true,
    headers: { 'content-type': 'application/json', 'timestamp': new Date().toISOString() }
  });
    
    console.log(`📤 Mensagem enviada para fila ${queue} com sucesso`);
    
  } catch (error) {
    console.error(`❌ Erro ao enviar para fila ${queue}:`, error.message);
    
    // Marcar conexão como não saudável
    rabbitConnectionHealthy = false;
    
    // Adicionar ao buffer para retry
    messageQueue.push({ queue, payload, timestamp: Date.now() });
    
    // Tentar reconectar
    if (!isReconnectingRabbit) {
      await attemptRabbitReconnection();
    }
  }
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
  authTimeoutMs: 180000, // 3 minutos para dar mais tempo
  qrMaxRetries: 3, // Máximo 3 tentativas de QR
  puppeteer: {
    headless: true,
    timeout: 60000, // Timeout de 60 segundos para operações
    protocolTimeout: 240000, // 4 minutos para protocolo
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
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--enable-features=NetworkService,NetworkServiceLogging',
      '--memory-pressure-off',
      '--max_old_space_size=4096'
    ]
    // Usar user agent padrão do Puppeteer para máxima compatibilidade
  },
  locale: 'pt-BR',
  timezone: 'America/Sao_Paulo'
});

// 🔒 Verificação simples de sessão existente
function checkSessionExists() {
  try {
    const sessionClientPath = path.join(sessionPath, instanceId);
    return fs.existsSync(sessionClientPath) && fs.readdirSync(sessionClientPath).length > 0;
  } catch (error) {
    return false;
  }
}

// 🧹 Limpar sessão corrompida
async function clearCorruptedSession() {
  try {
    console.log('🧹 Limpando sessão corrompida...');
    
    const sessionClientPath = path.join(sessionPath, instanceId);
    
    if (fs.existsSync(sessionClientPath)) {
      // Fazer backup antes de limpar
      const backupPath = `${sessionClientPath}_backup_${Date.now()}`;
      fs.renameSync(sessionClientPath, backupPath);
      console.log(`📦 Backup da sessão corrompida salvo em: ${backupPath}`);
    }
    
    console.log('✅ Sessão limpa. Será necessário escanear QR code novamente.');
    
  } catch (error) {
    console.error('❌ Erro ao limpar sessão:', error);
  }
}

// 🔄 Reinicializar cliente com tratamento de erro
async function initializeClientSafely() {
  try {
    console.log('🚀 Inicializando cliente WhatsApp...');
    await client.initialize();
    return true;
  } catch (error) {
    console.error('❌ Erro na inicialização do cliente:', error.message);
    
    // Se for erro de contexto destruído, limpar sessão
    if (error.message.includes('Execution context was destroyed') || 
        error.message.includes('ProtocolError')) {
      
      console.log('🔍 Detectado erro de contexto/protocolo, limpando sessão...');
      await clearCorruptedSession();
      
      console.log('🔄 Tentando reinicializar com sessão limpa...');
      try {
        await client.initialize();
        return true;
      } catch (retryError) {
        console.error('❌ Falha na segunda tentativa:', retryError.message);
        return false;
      }
    }
    
    return false;
  }
}

// QR
client.on('qr', async (qr) => {
  clearQRCodeTimer();
  console.log('📱 QR Code recebido');
  
  // 🖼️ RENDERIZAR QR CODE NO CONSOLE
  console.log('\n🔲 ESCANEIE O QR CODE ABAIXO COM SEU WHATSAPP:\n');
  qrcode.generate(qr, { small: true });
  console.log('\n📱 Aguardando conexão...\n');
  
  try {
    const qrCode = await QRCode.toDataURL(qr);
      await publishToQueue('out.qrcode', {
      qrCode: qrCode,
      timestamp: new Date().toISOString(),
      instanceId: instanceId,
      requestId: qrRequestId,
      type: 'qr_code'
    });
    
    console.log('✅ QR Code enviado para API');
    
    qrCodeTimer = setTimeout(() => {
      console.log('⏰ QR Code expirado');
      publishToQueue('out.qrcode', {
        qrCode: null,
        timestamp: new Date().toISOString(),
        instanceId: instanceId,
        requestId: qrRequestId,
        type: 'qr_expired'
      });
    }, QR_CODE_DURATION);
    
  } catch (e) {
    console.error('❌ Erro ao processar QR:', e.message);
  }
});

// AUTHENTICATED
client.on('authenticated', () => {
  clearQRCodeTimer();
  console.log('🔐 Autenticado');
  qrRequestPending = false;
});

// READY
client.on('ready', async () => {
  clearQRCodeTimer();
  clearReconnectTimer(); // 🚀 NOVO: Limpar timer de reconexão
  
  console.log('✅ Client READY. Aguardando delay de segurança 5s...');
  await new Promise(r => setTimeout(r, 5000));
  
  isConnected = true;
  connectedNumber = client.info?.wid?.user || 'N/A';
  isFullyValidated = false;
  
  // 🔒 Cliente conectado com sucesso
  console.log('🔒 Sessão WhatsApp ativa e funcional');
  
  // 🛡️ Inicializar Resilient Message Sender
  try {
    resilientSender = new ResilientMessageSender(client, StructuredLogger, sendMessageConfirmationToAPI);
    StructuredLogger.info('🛡️ Resilient Message Sender inicializado com sucesso');
  } catch (error) {
    StructuredLogger.error('❌ Erro ao inicializar Resilient Message Sender', { error: error.message });
  }
  
  // 📊 Inicializar e executar extração de dados
  try {
    if (!dataExtractor) {
      dataExtractor = new WhatsAppDataExtractor({
        dataPath: './whatsapp_data'
      });
      await dataExtractor.initialize(client);
    }
    
    // Extrair dados da conexão
    console.log('📊 Iniciando extração de dados da conta conectada...');
    const extractionData = await dataExtractor.extractConnectionData();
    
    if (extractionData) {
      console.log('✅ Dados extraídos e armazenados com sucesso');
      console.log(`📱 Conta: ${extractionData.accountInfo?.phoneNumber}`);
      console.log(`👤 Nome: ${extractionData.profileInfo?.displayName || 'N/A'}`);
      console.log(`📞 Contatos: ${extractionData.contactsSummary?.totalContacts || 0}`);
      console.log(`👥 Grupos: ${extractionData.groupsSummary?.totalGroups || 0}`);
      
      // Gerar relatório
      await dataExtractor.generateExtractionReport();
    }
    
  } catch (error) {
    console.error('❌ Erro durante extração de dados:', error);
  }
  
  // 🚀 NOVO: Reset contador de tentativas de reconexão
  reconnectAttempts = 0;
  lastSuccessfulConnection = new Date();
  
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
  
  // 🚀 NOVO: Iniciar validação periódica da conexão
  startConnectionValidation();
  
  validationTimer = setTimeout(async () => {
    const ok = await validateConnection();
    if (ok) {
      isFullyValidated = true;
      showConnectionStatus();
      await sendSessionStatusToAPI();
      // processMessageQueue removido - não é necessário para esta implementação
    } else {
      console.log('❌ Validação falhou.');
      isConnected = false; connectedNumber = null;
      showConnectionStatus();
      await sendSessionStatusToAPI();
    }
  }, VALIDATION_DELAY);
});

client.on('auth_failure', async (msg) => {
  clearAllTimers(); // 🚀 NOVO: Limpar todos os timers
  isConnected = false; isFullyValidated = false; connectedNumber = null;
  console.error('❌ Falha de autenticação:', msg);
  showConnectionStatus();
  await sendSessionStatusToAPI();
  
  // 🚀 NOVO: Tentar reconectar automaticamente se tínhamos um número conectado
  if (connectedNumber) {
    console.log('🔄 Tentando reconectar após falha de autenticação...');
    attemptReconnection();
  }
});

client.on('disconnected', async (reason) => {
  clearAllTimers(); // 🚀 NOVO: Limpar todos os timers
  isConnected = false; isFullyValidated = false; connectedNumber = null;
  console.log('🔌 Cliente desconectado:', reason);
  showConnectionStatus();
  await sendSessionStatusToAPI();
  
  // 🚀 NOVO: Tentar reconectar automaticamente se tínhamos um número conectado
  if (connectedNumber) {
    console.log('🔄 Tentando reconectar após desconexão...');
    attemptReconnection();
  }
});

client.on('loading_screen', (p, m) => console.log(`⏳ Loading: ${p}% - ${m}`));

// Inbound (recebidas no WhatsApp) - PROCESSAMENTO UNIFICADO
client.on('message', async (message) => {
  try {
    if (message.fromMe) return;
    
    StructuredLogger.info('📥 Nova mensagem recebida', {
      type: message.type,
      from: message.from,
      hasMedia: message.hasMedia,
      isGroup: message.isGroupMsg
    });
    
    // Processar mensagem usando lógica original (sem unified processor)
    await processOriginalMessage(message);
    
  } catch (e) {
    StructuredLogger.error('Erro crítico ao processar mensagem recebida', { 
      error: e.message,
      messageId: message.id?._serialized,
      messageType: message.type,
      stack: e.stack
    });
    
    // Tentar enviar mensagem de erro para manter o fluxo
    try {
      const errorPayload = {
        externalMessageId: message.id?._serialized || crypto.randomUUID(),
        from: message.from || 'unknown',
        fromNormalized: message.from ? AdvancedMessageValidator.normalizePhoneNumber(message.from.replace('@c.us', '')) : '+55',
        to: message.to || '',
        type: 'System',
      timestamp: new Date().toISOString(),
        instanceId: instanceId,
      fromMe: false,
        isGroup: message.isGroupMsg || false,
        chatId: message.from || '',
        body: `[Erro ao processar mensagem: ${e.message}]`,
        simulated: false,
        metadata: {
          originalError: e.message,
          originalType: message.type,
          errorTimestamp: new Date().toISOString()
        }
      };
      
      await sendMessageToAPI(errorPayload);
    } catch (sendError) {
      StructuredLogger.error('Falha ao enviar mensagem de erro para API', { 
        originalError: e.message,
        sendError: sendError.message 
      });
    }
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

async function sendMessageToAPI(messagePayload) {
  try {
    if (!rabbitChannel) {
      StructuredLogger.warn('Canal RabbitMQ não disponível');
      return;
    }

    // Garantir que todos os campos obrigatórios estejam presentes
    const finalPayload = {
      externalMessageId: messagePayload.externalMessageId,
      from: messagePayload.from,
      fromNormalized: messagePayload.fromNormalized,
      to: messagePayload.to,
      type: messagePayload.type,
      timestamp: messagePayload.timestamp,
      instanceId: messagePayload.instanceId,
      fromMe: messagePayload.fromMe,
      isGroup: messagePayload.isGroup,
      body: messagePayload.body,
      attachment: messagePayload.attachment,
      simulated: messagePayload.simulated || false,
      chatId: messagePayload.chatId
    };

    await publishToQueue('whatsapp.incoming', finalPayload);
    
    StructuredLogger.info('Mensagem enviada para API', {
      messageId: finalPayload.externalMessageId,
      from: finalPayload.fromNormalized,
      type: finalPayload.type,
      hasMedia: !!finalPayload.attachment,
      hasError: !!messagePayload.error
    });
    
  } catch (e) {
    StructuredLogger.error('Erro ao enviar mensagem para API', { 
      error: e.message,
      messageId: messagePayload.externalMessageId 
    });
  }
}

// Função para processar mensagem usando a lógica original (sem unified processor)
async function processOriginalMessage(message) {
  try {
    // Usar a lógica que estava na função original processValidMessage
    const fromBare = message.from.replace('@c.us', '');
    const fromNorm = AdvancedMessageValidator.normalizePhoneNumber(fromBare);
    
    StructuredLogger.info('Mensagem recebida', {
      from: fromNorm,
      type: message.type,
      hasMedia: message.hasMedia,
      messageId: message.id._serialized,
      bodyPreview: message.body?.slice(0, 100) || ''
    });

    // Processar mídia se existir
    let mediaPayload = null;
    if (message.hasMedia) {
      mediaPayload = await AdvancedMediaProcessor.processMedia(message);
    }

    // Preparar payload da mensagem com todos os campos obrigatórios
    const messagePayload = {
      externalMessageId: AdvancedMessageValidator.normalizeMessageId(message.id._serialized),
      from: message.from,
      fromNormalized: fromNorm,
      to: connectedNumber || 'unknown',
      type: AdvancedMessageValidator.getMessageTypeForAPI(message.type),
      timestamp: new Date().toISOString(),
      instanceId: instanceId,
      fromMe: false,
      isGroup: message.isGroup || false,
      body: message.body || '',
      attachment: mediaPayload,
      simulated: false, // Campo obrigatório para a API
      chatId: `chat_${fromNorm}`
    };

    await sendMessageToAPI(messagePayload);
    
  } catch (e) {
    StructuredLogger.error('❌ Erro ao processar mensagem original', {
      error: e.message,
      messageId: message.id?._serialized,
      stack: e.stack
    });
    throw e;
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
    // Preparar dados da mensagem
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

    // 🛡️ Usar Resilient Sender se disponível, senão fallback para método original
    if (resilientSender) {
      StructuredLogger.info('🛡️ Enviando mensagem via Resilient Sender', { to: number });
      
      const messagePayload = {
        to: number,
        body: finalMessage,
        attachment: attachment,
        clientMessageId: crypto.randomUUID()
      };
      
      const result = await resilientSender.sendMessage(messagePayload);
      
      if (result.success) {
        return { success: true, messageId: result.messageId };
      } else {
        return { success: false, reason: result.error };
      }
    } else {
      // Fallback para método original
      StructuredLogger.warn('⚠️ Resilient Sender não disponível, usando método original');
      
      const chatId = `${to}@c.us`;
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
    }
  } catch (err) {
    StructuredLogger.error('❌ Erro no envio de mensagem', { 
      to: number, 
      error: err.message 
    });
    return { success: false, reason: err.message };
  }
}

// -----------------------------------------------------------------------------
// Consumer da fila de saída
// -----------------------------------------------------------------------------
async function initializeRabbitMQ() {
  try {
      const url = RABBITMQ_URL + '?heartbeat=30';
    console.log('🔗 Conectando ao RabbitMQ...');
    
  rabbitConnection = await amqp.connect(url);
  rabbitChannel = await rabbitConnection.createChannel();
  await rabbitChannel.prefetch(1);

    // Configurar filas essenciais
  await rabbitChannel.assertQueue('whatsapp.incoming', { durable: true });
    await rabbitChannel.assertQueue('whatsapp.outgoing', { durable: true });
    await rabbitChannel.assertQueue('out.qrcode', { durable: true });
    await rabbitChannel.assertQueue('session.status', { durable: true });
    
    // Marcar conexão como saudável
    rabbitConnectionHealthy = true;
    rabbitReconnectAttempts = 0;
    
    console.log('✅ Conexão RabbitMQ estabelecida com sucesso. (prefetch=1)');
    
    // Processar mensagens em buffer
    await processMessageBuffer();
    
    // Configurar eventos de erro e fechamento
  rabbitConnection.on('close', () => {
      console.log('🔌 Conexão RabbitMQ fechada. Iniciando reconexão...');
      rabbitConnectionHealthy = false;
      rabbitChannel = null;
      rabbitConnection = null;
      
      if (!isReconnectingRabbit) {
        attemptRabbitReconnection();
      }
    });
    
    rabbitConnection.on('error', (err) => {
      console.error('❌ Erro RabbitMQ:', err?.message || err);
      rabbitConnectionHealthy = false;
      
      if (!isReconnectingRabbit) {
        attemptRabbitReconnection();
      }
    });
    
    // Configurar heartbeat de saúde
    startRabbitHealthCheck();
    
  } catch (error) {
    console.error('❌ Erro ao inicializar RabbitMQ:', error.message);
    rabbitConnectionHealthy = false;
    
    if (!isReconnectingRabbit) {
      await attemptRabbitReconnection();
    }
  }
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
        try { clearAllTimers(); await client.logout().catch(()=>{}); } finally {
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
          
          // 🔔 NOTIFICAR API QUE COMANDO FOI RECEBIDO
          try {
            const apiBaseUrl = 'http://localhost:5656';
            await axios.post(`${apiBaseUrl}/api/whatsapp/webhook/command-received`, {
              command: 'generate_qr',
              requestId: qrRequestId,
              status: 'processing',
              timestamp: new Date().toISOString()
            }).catch(e => console.warn('⚠️ Webhook command-received falhou:', e?.message));
          } catch (notifyError) {
            console.warn('⚠️ Falha ao notificar API:', notifyError.message);
          }
          
          // 🔒 Comando para gerar QR code recebido
          
          initializeClientSafely().catch(e => console.error('init error:', e.message));
        } catch (e) {
          console.error('❌ Erro generate_qr:', e.message);
        }
        rabbitChannel.ack(msg);
            return;
          }
          if (payload.command === 'reset_reconnect') {
        console.log('🛠️ Comando reset_reconnect: resetando contador de tentativas.');
        reconnectAttempts = 0;
        clearReconnectTimer();
        console.log('✅ Contador de reconexão resetado');
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
          await publishToQueue('whatsapp.incoming', {
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
  console.log('🔄 Reconexão automática habilitada (máximo 5 tentativas)');
  console.log('💓 Validação periódica da conexão habilitada (30s)');

  await initializeRabbitMQ().catch(err => {
    console.error('❌ Erro AMQP:', err?.message || err);
  });
  await startQueueConsumer().catch(()=>{});
  startHeartbeatToAPI();
  
  // 🚀 NOVO: Iniciar validação periódica mesmo sem conexão inicial
  startConnectionValidation();
}
startApp();

// -----------------------------------------------------------------------------
// Funções auxiliares que estavam faltando
// -----------------------------------------------------------------------------



function processMessageTemplate(template, data) {
  if (!template) return '';
  
  let processed = template;
  if (data) {
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = data[key] || '';
      processed = processed.replace(new RegExp(placeholder, 'g'), value);
    });
  }
  
  return processed;
}

// 🚀 NOVO: Funções para reconexão automática
async function attemptReconnection() {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.log(`❌ Máximo de tentativas de reconexão atingido (${maxReconnectAttempts})`);
    return;
  }
  
  reconnectAttempts++;
  console.log(`🔄 Tentativa de reconexão ${reconnectAttempts}/${maxReconnectAttempts}`);
  
  try {
    clearReconnectTimer();
    await initializeClientSafely();
    console.log('✅ Reconexão bem-sucedida');
    reconnectAttempts = 0;
  } catch (error) {
    console.error(`❌ Falha na tentativa ${reconnectAttempts}:`, error.message);
    
    // Agendar próxima tentativa com backoff exponencial
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);
    reconnectTimer = setTimeout(() => attemptReconnection(), delay);
  }
}

function startConnectionValidation() {
  if (connectionValidationTimer) {
    clearTimeout(connectionValidationTimer);
  }
  
  connectionValidationTimer = setTimeout(async () => {
    if (isConnected && isFullyValidated) {
      try {
        const isValid = await validateConnection();
        if (!isValid) {
          console.log('⚠️ Validação periódica falhou - tentando reconectar');
          isConnected = false;
          isFullyValidated = false;
          await sendSessionStatusToAPI();
          attemptReconnection();
        } else {
          console.log('💓 Conexão WhatsApp válida');
        }
      } catch (error) {
        console.error('❌ Erro na validação periódica:', error.message);
      }
    }
    
    // Agendar próxima validação
    startConnectionValidation();
  }, 30000); // 30 segundos
}

// -----------------------------------------------------------------------------
// Sistema de Resiliência RabbitMQ
// -----------------------------------------------------------------------------

async function attemptRabbitReconnection() {
  if (isReconnectingRabbit) {
    console.log('🔄 Reconexão RabbitMQ já em andamento...');
    return;
  }
  
  if (rabbitReconnectAttempts >= maxRabbitReconnectAttempts) {
    console.log(`❌ Máximo de tentativas de reconexão RabbitMQ atingido (${maxRabbitReconnectAttempts}). Parando tentativas.`);
    return;
  }
  
  isReconnectingRabbit = true;
  rabbitReconnectAttempts++;
  
  const delay = Math.min(5000 * rabbitReconnectAttempts, 60000); // 5s, 10s, 15s... máximo 60s
  
  console.log(`🔄 Tentativa ${rabbitReconnectAttempts}/${maxRabbitReconnectAttempts} de reconexão RabbitMQ em ${delay/1000}s...`);
  console.log(`📊 Buffer de mensagens: ${messageQueue.length} mensagens pendentes`);
  
  rabbitReconnectTimer = setTimeout(async () => {
    try {
      console.log('🚀 Reconectando ao RabbitMQ...');
      
      // Limpar conexões antigas
      if (rabbitChannel) {
        try { await rabbitChannel.close(); } catch {}
        rabbitChannel = null;
      }
      if (rabbitConnection) {
        try { await rabbitConnection.close(); } catch {}
        rabbitConnection = null;
      }
      
      // Tentar reconectar
      await initializeRabbitMQ();
      
      if (rabbitConnectionHealthy) {
        console.log('✅ Reconexão RabbitMQ bem-sucedida!');
        isReconnectingRabbit = false;
        rabbitReconnectAttempts = 0;
        
        // Reiniciar consumer
        await startQueueConsumer();
      } else {
        throw new Error('Conexão não estabelecida corretamente');
      }
      
    } catch (error) {
      console.error(`❌ Falha na tentativa ${rabbitReconnectAttempts} de reconexão RabbitMQ:`, error.message);
      isReconnectingRabbit = false;
      
      // Tentar novamente se não atingiu o limite
      if (rabbitReconnectAttempts < maxRabbitReconnectAttempts) {
        setTimeout(() => attemptRabbitReconnection(), 2000);
      } else {
        console.log('💀 Todas as tentativas de reconexão RabbitMQ falharam. Sistema crítico!');
        // TODO: Implementar notificação de alerta crítico
      }
    }
  }, delay);
}

async function processMessageBuffer() {
  if (messageQueue.length === 0) return;
  
  console.log(`📤 Processando ${messageQueue.length} mensagens do buffer...`);
  
  const messagesToProcess = [...messageQueue];
  messageQueue.length = 0; // Limpar buffer
  
  let successCount = 0;
  let failCount = 0;
  
  for (const { queue, payload, timestamp } of messagesToProcess) {
    try {
      // Verificar se mensagem não está muito antiga (evitar spam)
      const messageAge = Date.now() - timestamp;
      if (messageAge > 300000) { // 5 minutos
        console.log(`⏰ Mensagem muito antiga descartada (${Math.round(messageAge/1000)}s): ${queue}`);
        continue;
      }
      
      await publishToQueue(queue, payload);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Erro ao reenviar mensagem para ${queue}:`, error.message);
      failCount++;
      
      // Re-adicionar ao buffer se falhou
      messageQueue.push({ queue, payload, timestamp });
    }
  }
  
  console.log(`✅ Buffer processado: ${successCount} sucessos, ${failCount} falhas`);
}

function startRabbitHealthCheck() {
  setInterval(async () => {
    if (!rabbitConnectionHealthy || !rabbitChannel) return;
    
    try {
      // Ping simples para verificar se a conexão está viva
      await rabbitChannel.checkQueue('whatsapp.incoming');
      console.log('💓 RabbitMQ conexão saudável');
      
    } catch (error) {
      console.log('⚠️ RabbitMQ falhou no health check:', error.message);
      rabbitConnectionHealthy = false;
      
      if (!isReconnectingRabbit) {
        attemptRabbitReconnection();
      }
    }
  }, 60000); // A cada 1 minuto
}

function clearRabbitTimers() {
  if (rabbitReconnectTimer) {
    clearTimeout(rabbitReconnectTimer);
    rabbitReconnectTimer = null;
  }
}

// Graceful shutdown
// Shutdown gracioso melhorado
async function gracefulShutdown(signal) {
  console.log(`🛑 Recebido ${signal}. Encerrando graciosamente...`);
  
  try {
    // Parar hot reload
    if (hotReloadManager) {
      await hotReloadManager.stop();
    }
    
    // Parar extrator de dados
    if (dataExtractor) {
      await dataExtractor.gracefulShutdown();
    }
    
    // Limpar timers
    clearAllTimers();
    clearRabbitTimers();
    
    console.log('✅ Shutdown gracioso concluído');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro durante shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// 🔒 Verificação simples de sessão WhatsApp
async function autoInitializeIfSessionExists() {
  try {
    console.log('🔍 Verificando se existe sessão WhatsApp válida...');
    
    // Verificar se existem arquivos de sessão do WhatsApp (LocalAuth)
    const sessionClientPath = path.join(sessionPath, instanceId);
    
    try {
      const fs = require('fs').promises;
      const stats = await fs.stat(sessionClientPath);
      
      if (stats.isDirectory()) {
        const sessionFiles = await fs.readdir(sessionClientPath);
        
        if (sessionFiles.length > 0) {
          console.log('✅ Sessão WhatsApp encontrada! Tentando restaurar conexão automaticamente...');
          console.log(`📂 Arquivos de sessão: ${sessionFiles.length} itens`);
          console.log('🚀 Inicializando cliente WhatsApp com sessão existente...');
          
                  // Tentar inicializar cliente com sessão existente
        await initializeClientSafely();
          
          return true;
        }
      }
    } catch (error) {
      // Pasta não existe ou está vazia
      console.log('📁 Nenhuma sessão WhatsApp encontrada');
    }
    
    console.log('💡 O cliente será inicializado apenas quando receber comando generate_qr');
    return false;
    
  } catch (error) {
    console.error('❌ Erro durante verificação de sessão:', error);
    console.log('💡 Continuando sem inicialização automática...');
    return false;
  }
}

// Executar verificação de sessão após conectar ao RabbitMQ
setTimeout(async () => {
  try {
    const initialized = await autoInitializeIfSessionExists();
    
    if (initialized) {
      console.log('🎉 Sistema inicializado automaticamente com sessão existente!');
    } else {
      console.log('⏳ Aguardando comando generate_qr para inicializar...');
    }
  } catch (error) {
    console.error('❌ Erro na inicialização automática:', error);
  }
}, 3000); // Aguardar 3 segundos para RabbitMQ estar estável

// 🔥 Inicializar Hot Reload System
async function initializeHotReload() {
  try {
    if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_HOT_RELOAD !== 'true') {
      hotReloadManager = new HotReloadManager({
        debounceDelay: 3000, // 3 segundos para evitar reloads muito frequentes durante testes
        excludePaths: [
          'node_modules/**',
          'session/**',
          'whatsapp_data/**',
          '.git/**',
          'logs/**',
          '*.log',
          'backup/**'
        ]
      });

      // Registrar callbacks para módulos importantes
      hotReloadManager.onModuleReload('./WhatsAppDataExtractor.js', async (newModule, oldModule) => {
        console.log('🔄 Atualizando WhatsAppDataExtractor...');
        
        // Recriar extrator com nova versão se existir
        if (dataExtractor) {
          const client = dataExtractor.client;
          dataExtractor = new newModule({
            dataPath: './whatsapp_data'
          });
          if (client) {
            await dataExtractor.initialize(client);
          }
          console.log('✅ WhatsAppDataExtractor atualizado');
        }
      });

      hotReloadManager.onModuleReload('./emoji-resilience-processor.js', async (newModule) => {
        console.log('🔄 Emoji processor atualizado');
      });

      await hotReloadManager.start();
      
      // Criar interface de comandos para debug
      global.hotReload = hotReloadManager.createCommandInterface();
      
      console.log('🔥 Hot Reload ativo! Use global.hotReload para comandos');
      console.log('💡 Comandos disponíveis:');
      console.log('   hotReload.stats() - Ver estatísticas');
      console.log('   hotReload.reload("arquivo.js") - Forçar reload');
      console.log('   hotReload.stop() - Parar hot reload');
      
    } else {
      console.log('🔥 Hot Reload desabilitado (produção ou DISABLE_HOT_RELOAD=true)');
    }
    
  } catch (error) {
    console.error('❌ Erro ao inicializar hot reload:', error);
  }
}

// Inicializar hot reload após pequeno delay
setTimeout(initializeHotReload, 5000);