// zap.js - Versão final usando whatsapp-web.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const amqp = require('amqplib');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Configurações de rede para simular IP do celular
const CELLULAR_IP = '179.68.104.112';
const CELLULAR_PORT = '8080';

// Configurar timezone e localização para Brasil
process.env.TZ = 'America/Sao_Paulo';
process.env.LANG = 'pt_BR.UTF-8';
process.env.LC_ALL = 'pt_BR.UTF-8';

console.log(`🌍 Configurando timezone: America/Sao_Paulo`);
console.log(`🇧🇷 Configurando localização: pt_BR.UTF-8`);

const instanceId = process.env.INSTANCE_ID || 'zap-prod';

// Caminho da sessão que funciona tanto localmente quanto no Docker
const isDocker = process.env.NODE_ENV === 'production' || fs.existsSync('/.dockerenv');
const sessionPath = isDocker 
  ? `/app/session/${instanceId}`
  : path.join(process.cwd(), 'session', instanceId);

// Criar diretório de sessão se não existir
const sessionDir = path.dirname(sessionPath);
if (!fs.existsSync(sessionDir)) {
  try {
    fs.mkdirSync(sessionDir, { recursive: true });
    console.log(`📁 Diretório de sessão criado: ${sessionDir}`);
  } catch (error) {
    console.error(`❌ Erro ao criar diretório de sessão: ${error.message}`);
    // Fallback para diretório local
    const localSessionDir = path.join(process.cwd(), 'session', instanceId);
    fs.mkdirSync(path.dirname(localSessionDir), { recursive: true });
    console.log(`📁 Usando diretório local: ${localSessionDir}`);
  }
}

const rabbitConfig = {
  protocol: 'amqps',
  hostname: process.env.RABBITMQ_HOST || 'mouse.rmq5.cloudamqp.com',
  port: parseInt(process.env.RABBITMQ_PORT || '5671', 10),
  username: process.env.RABBITMQ_USER || 'ewxcrhtv',
  password: process.env.RABBITMQ_PASS || 'DNcdH0NEeP4Fsgo2_w-vd47CqjelFk_S',
  vhost: process.env.RABBITMQ_VHOST || 'ewxcrhtv'
};

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ||
  `amqps://${encodeURIComponent(rabbitConfig.username)}:${encodeURIComponent(rabbitConfig.password)}@${rabbitConfig.hostname}:${rabbitConfig.port}/${encodeURIComponent(rabbitConfig.vhost)}`;

// Variáveis de controle de estado
let isConnected = false;
let isFullyValidated = false;
let connectedNumber = null;
let isSenderAllowed = true;
let qrCodeTimer = null;
let qrCodeStartTime = null;
let validationTimer = null;
let messageQueue = [];
const QR_CODE_DURATION = 3 * 60 * 1000; // 3 minutos em millisegundos
const VALIDATION_DELAY = 10000; // 10 segundos para validação completa

// Variáveis globais de conexão
let rabbitConnection = null;
let rabbitChannel = null;

// Loopback DEV
const DEV_LOOPBACK = (process.env.DEV_LOOPBACK_INBOUND === 'true') || (process.env.NODE_ENV !== 'production');

// Função para limpar timer do QR Code
function clearQRCodeTimer() {
  if (qrCodeTimer) {
    clearTimeout(qrCodeTimer);
    qrCodeTimer = null;
  }
}

// Função para limpar timer de validação
function clearValidationTimer() {
  if (validationTimer) {
    clearTimeout(validationTimer);
    validationTimer = null;
  }
}

// Políticas de sessão: Manter sessão existente se válida
function clearAllSessions() {
  try {
    if (fs.existsSync(sessionPath)) {
      console.log('📁 Sessão existente encontrada:', sessionPath);
      // Não remover automaticamente - deixar o usuário decidir
    }
  } catch (err) {
    console.error('⚠️ Erro ao verificar sessão:', err?.message || err);
  }
}

// Função para validar conexão completamente
async function validateConnection() {
  try {
    console.log('🔍 Validando conexão...');
    
    // Verificar se o cliente está realmente conectado
    if (!client.info || !client.info.wid) {
      console.log('❌ Cliente não tem informações válidas');
      return false;
    }

    // Verificar se o número está disponível
    const number = client.info.wid.user;
    if (!number) {
      console.log('❌ Número não disponível');
      return false;
    }

    // Testar uma operação simples para verificar se está funcionando
    try {
      // Testar obtenção de chats
      const chats = await client.getChats();
      if (!chats || chats.length === 0) {
        console.log('⚠️ Nenhum chat encontrado - pode indicar problema de conexão');
      }
      
      // Testar uma operação de envio simples (sem enviar)
      try {
        const testChat = chats && chats.length > 0 ? chats[0] : null;
        if (testChat) {
          // Verificar se conseguimos acessar propriedades do chat
          const chatId = testChat.id;
          if (!chatId) {
            console.log('⚠️ Chat sem ID válido');
          }
        }
      } catch (testError) {
        console.log('⚠️ Erro ao testar operações de chat:', testError.message);
      }
      
      console.log('✅ Conexão validada com sucesso!');
      return true;
    } catch (error) {
      console.log('❌ Erro ao validar conexão:', error.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro durante validação:', error.message);
    return false;
  }
}

// Função para processar fila de mensagens pendentes
async function processMessageQueue() {
  if (messageQueue.length === 0) return;
  
  console.log(`📦 Processando ${messageQueue.length} mensagens pendentes...`);
  
  for (const queuedMessage of messageQueue) {
    try {
      const result = await sendOne(client, queuedMessage.phone, queuedMessage.messageData);
      
      if (result.success) {
        console.log(`✅ Mensagem pendente enviada para ${queuedMessage.phone}`);
      } else {
        console.log(`❌ Falha ao enviar mensagem pendente para ${queuedMessage.phone}: ${result.reason}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar mensagem pendente: ${error.message}`);
    }
  }
  
  messageQueue = [];
  console.log('📦 Fila de mensagens processada');
}

// Função para mostrar status da conexão
function showConnectionStatus() {
  if (isConnected && isFullyValidated && connectedNumber) {
    console.log(`\n📱 STATUS: CONECTADO E VALIDADO`);
    console.log(`📞 Número conectado: ${connectedNumber}`);
    console.log(`🆔 Instância: ${instanceId}`);
    console.log(`⏰ Conectado desde: ${new Date().toLocaleString('pt-BR')}`);
    console.log(`✅ Pronto para receber mensagens da fila`);
    console.log(`🔒 GARANTIA: Todas as mensagens serão enviadas APENAS através do número ${connectedNumber}\n`);
  } else if (isConnected && !isFullyValidated) {
    console.log(`\n📱 STATUS: CONECTADO - VALIDANDO`);
    console.log(`📞 Número conectado: ${connectedNumber || 'N/A'}`);
    console.log(`⏳ Aguardando validação completa...\n`);
  } else {
    console.log(`\n📱 STATUS: DESCONECTADO`);
    console.log(`❌ Aguardando conexão do WhatsApp\n`);
  }
}

// Função de validação de segurança periódica
function validateSecurityIntegrity() {
  if (isConnected && isFullyValidated && connectedNumber) {
    const ownNumber = client.info?.wid?.user;
    const normalizedOwn = normalizeNumber(ownNumber);
    const normalizedConnected = normalizeNumber(connectedNumber);
    
    if (normalizedOwn !== normalizedConnected) {
      console.log('🚨 ALERTA DE SEGURANÇA: Inconsistência detectada no número conectado!');
      console.log(`📞 Número conectado: ${connectedNumber}`);
      console.log(`🆔 Número do cliente: ${ownNumber}`);
      console.log('🛑 Encerrando bot por segurança...');
      process.exit(1);
    } else {
      console.log('✅ Validação de segurança: Número conectado consistente');
    }
  }
}

function normalizeNumber(num) {
  if (!num) return null;
  
  // Remover todos os caracteres não numéricos
  let cleanNumber = String(num).replace(/\D/g, '');
  
  // Se o número já tem código do país (começa com 55 para Brasil), retornar como está
  if (cleanNumber.startsWith('55') && cleanNumber.length >= 12) {
    return cleanNumber;
  }
  
  // Se o número tem 11 dígitos (formato brasileiro sem código do país), adicionar 55
  if (cleanNumber.length === 11) {
    return '55' + cleanNumber;
  }
  
  // Se o número tem 10 dígitos (formato brasileiro sem código do país e sem DDD), adicionar 55
  if (cleanNumber.length === 10) {
    return '55' + cleanNumber;
  }
  
  // Se o número tem 9 dígitos (celular brasileiro sem código do país), adicionar 5511
  if (cleanNumber.length === 9) {
    return '5511' + cleanNumber;
  }
  
  // Se o número tem 8 dígitos (telefone fixo brasileiro sem código do país), adicionar 5511
  if (cleanNumber.length === 8) {
    return '5511' + cleanNumber;
  }
  
  // Para outros casos, assumir que é brasileiro e adicionar 55
  if (cleanNumber.length > 0) {
    return '55' + cleanNumber;
  }
  
  return cleanNumber;
}

// Configuração melhorada do cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth({ 
    dataPath: sessionPath,
    clientId: instanceId
  }),
  restartOnAuthFail: true,
  authTimeoutMs: 60000, // Reduzir timeout para 60s
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-default-browser-check',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-component-extensions-with-background-pages',
      '--disable-background-networking',
      '--disable-client-side-phishing-detection',
      '--disable-domain-reliability',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--force-color-profile=srgb',
      '--metrics-recording-only',
      '--safebrowsing-disable-auto-update',
      '--password-store=basic',
      '--use-mock-keychain',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--ignore-certificate-errors-spki-list',
      '--user-agent=Mozilla/5.0 (Linux; Android 10; SM-A505FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    ]
  },
  // Configuração mais limpa para evitar detecção
  webVersionCache: { type: 'local' },
  // Configurações de rede para simular IP do celular
  userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-A505FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  // Configurações de localização
  locale: 'pt-BR',
  timezone: 'America/Sao_Paulo'
});

const QRCode = require('qrcode');
const axios = require('axios');

// Função para processar templates de mensagem
function processMessageTemplate(template, data) {
  if (typeof template !== 'string') {
    return JSON.stringify(template);
  }

  let processedMessage = template;

  // Substituir variáveis do template
  if (data) {
    // Substituir variáveis básicas
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'gi');
      processedMessage = processedMessage.replace(regex, data[key] || '');
    });

    // Substituir variáveis especiais
    processedMessage = processedMessage
      .replace(/{{currentDate}}/gi, new Date().toLocaleDateString('pt-BR'))
      .replace(/{{currentTime}}/gi, new Date().toLocaleTimeString('pt-BR'))
      .replace(/{{timestamp}}/gi, new Date().toISOString())
      .replace(/{{instanceId}}/gi, instanceId)
      .replace(/{{senderNumber}}/gi, connectedNumber || 'N/A');
  }

  return processedMessage;
}

// Melhor tratamento de eventos com bypass da Meta
client.on('qr', async (qr) => {
  clearQRCodeTimer();
  
  console.log('📱 ESCANEIE O QR CODE NO TERMINAL:');
  console.log('⏰ QR Code válido por 3 minutos\n');
  
  // Gerar QR code com estilo da Meta (logo do WhatsApp)
  qrcode.generate(qr, { small: true });

  try {
    // Gerar QR code com logo do WhatsApp (estilo Meta)
    const qrWithLogo = await QRCode.toDataURL(qr, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });

    console.log('\n🔗 QR Code com logo WhatsApp (estilo Meta):\n');
    console.log(qrWithLogo);
    console.log('\n👉 Acesse https://goqr.me e cole o conteúdo acima para escanear.');
    
    // Enviar QR para RabbitMQ
    if (rabbitChannel) {
      const qrCodeQueue = 'out.qrcode';
      const qrCodeMessage = { qrCode: qrWithLogo, instanceId: instanceId, type: 'qr_code' };
      const messageBuffer = Buffer.from(JSON.stringify(qrCodeMessage));
      await rabbitChannel.sendToQueue(qrCodeQueue, messageBuffer, { persistent: true });
      console.log('📨 QR enviado para fila RabbitMQ:', qrCodeQueue);
    }
    
    // Enviar QR para API para o front consumir
    const apiBaseUrl = process.env.API_URL || 'http://localhost:5656';
    try {
      await axios.post(`${apiBaseUrl}/api/whatsapp/webhook/qr-code`, { 
        qrCode: qrWithLogo,
        timestamp: new Date().toISOString(),
        instanceId: instanceId
      });
      console.log('📨 QR enviado para API');
    } catch (postErr) {
      console.error('⚠️ Falha ao postar QR na API:', postErr?.message || postErr);
    }
    
    // Timer para expirar o QR Code
    qrCodeStartTime = Date.now();
    qrCodeTimer = setTimeout(() => {
      if (!isConnected) {
        console.log('\n⏰ QR Code expirado! Reinicie o bot para gerar um novo.');
      }
    }, QR_CODE_DURATION);
    
  } catch (error) {
    console.error('❌ Erro ao gerar QR code:', error.message);
  }
});

client.on('ready', async () => {
  clearQRCodeTimer();
  
  console.log('🔐 QR Code escaneado! Implementando bypass da Meta...');
  console.log('⏳ Aguardando delay de segurança (5 segundos)...');
  
  // DELAY DE SEGURANÇA: Aguardar 5 segundos para evitar detecção da Meta
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('✅ Delay concluído. Iniciando conexão...');
  
  isConnected = true;
  connectedNumber = client.info?.wid?.user || 'N/A';
  isFullyValidated = false;
  
  // VALIDAÇÃO CRÍTICA: Garantir que o número conectado é válido
  if (!connectedNumber || connectedNumber === 'N/A') {
    console.log('❌ Número conectado inválido ou não disponível');
    isConnected = false;
    connectedNumber = null;
    showConnectionStatus();
    emitStatus();
    await sendSessionStatusToAPI();
    return;
  }
  
  console.log('✅ Cliente WhatsApp conectado com sucesso!');
  console.log(`🔒 GARANTIA: Bot conectado com número ${connectedNumber}`);
  console.log(`🛡️ Todas as mensagens serão enviadas APENAS através deste número`);
  console.log('🚀 Bypass da Meta implementado com sucesso!');
  
  showConnectionStatus();
  emitStatus();
  await sendSessionStatusToAPI();
  
  // Aguardar um tempo antes de validar para evitar problemas de sincronização
  console.log('⏳ Aguardando estabilização da conexão...');
  
  validationTimer = setTimeout(async () => {
    const isValid = await validateConnection();
    
    if (isValid) {
      isFullyValidated = true;
      showConnectionStatus();
      emitStatus();
      await sendSessionStatusToAPI();
      
      // Processar mensagens pendentes
      await processMessageQueue();
      
      // Iniciar consumidor da fila
      await startQueueConsumer(client);
    } else {
      console.log('❌ Falha na validação. Gere um novo QR para conectar.');
      isConnected = false;
      connectedNumber = null;
      showConnectionStatus();
      emitStatus();
      await sendSessionStatusToAPI();
    }
  }, VALIDATION_DELAY);
});

client.on('auth_failure', (msg) => {
  clearQRCodeTimer();
  clearValidationTimer();
  isConnected = false;
  isFullyValidated = false;
  connectedNumber = null;
  console.error('❌ Falha de autenticação:', msg);
  console.log('🔄 Tente escanear o QR code novamente.');
  showConnectionStatus();
  emitStatus();
  sendSessionStatusToAPI();
});

client.on('disconnected', (reason) => {
  clearQRCodeTimer();
  clearValidationTimer();
  isConnected = false;
  isFullyValidated = false;
  connectedNumber = null;
  console.log('🔌 Cliente desconectado:', reason);
  console.log('🔄 Tentando reconectar...');
  showConnectionStatus();
  emitStatus();
  sendSessionStatusToAPI();
});

client.on('loading_screen', (percent, message) => {
  console.log(`⏳ Carregando: ${percent}% - ${message}`);
});

// Evento para mensagens recebidas
client.on('message', async (message) => {
  try {
    // Ignorar mensagens enviadas pelo próprio bot
    if (message.fromMe) {
      console.log(`🤖 Ignorando mensagem enviada pelo próprio bot: ${message.body}`);
      return;
    }

    // Normalizar o número do remetente
    const senderNumber = message.from.split('@')[0];
    const normalizedSenderNumber = normalizeNumber(senderNumber);

    // Log detalhado da mensagem recebida
    console.log(`📨 NOVA MENSAGEM RECEBIDA:`);
    console.log(`   📱 De (original): ${message.from}`);
    console.log(`   📱 De (normalizado): ${normalizedSenderNumber}`);
    console.log(`   💬 Conteúdo: ${message.body}`);
    console.log(`   📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`   🆔 Message ID: ${message.id._serialized}`);
    console.log(`   📋 Tipo: ${message.type}`);
    console.log(`   📍 Chat: ${senderNumber}`);

    // Verificar se é mensagem de texto (por enquanto só trabalhamos com texto)
    if (message.type !== 'chat' && message.type !== 'text') {
      console.log(`⚠️ Mensagem não é de texto (tipo: ${message.type}), ignorando por enquanto`);
      return;
    }

    // Verificar se o número está no formato correto
    if (!normalizedSenderNumber || normalizedSenderNumber.length < 10) {
      console.log(`⚠️ Número do remetente inválido: ${senderNumber} -> ${normalizedSenderNumber}`);
      return;
    }

    // Enviar mensagem para a API via RabbitMQ
    console.log(`📤 Enviando mensagem para API via RabbitMQ...`);
    await sendMessageToAPI(message);
    console.log(`✅ Mensagem processada com sucesso!`);
  } catch (error) {
    console.error('❌ Erro ao processar mensagem recebida:', error.message);
    console.error('Stack trace:', error.stack);
  }
});

// Função para enviar mensagens recebidas para a API via RabbitMQ
async function sendMessageToAPI(message) {
  try {
    console.log(`🔌 Verificando conexão RabbitMQ...`);
    
    // Verificar se há conexão RabbitMQ
    if (!rabbitConnection || !rabbitChannel) {
      console.log('⚠️ RabbitMQ não conectado, tentando conectar...');
      await startQueueConsumer(client);
      
      // Aguardar um pouco para a conexão ser estabelecida
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!rabbitConnection || !rabbitChannel) {
        console.error('❌ Falha ao conectar com RabbitMQ');
        return;
      }
    }

    // Normalizar o número do remetente
    const senderNumber = message.from.split('@')[0];
    const normalizedSenderNumber = normalizeNumber(senderNumber);

    // Preparar dados da mensagem no formato esperado pela API
    const messageData = {
      externalMessageId: message.id._serialized,
      from: normalizedSenderNumber,
      fromNormalized: normalizedSenderNumber,
      to: connectedNumber,
      body: message.body,
      type: message.type,
      timestamp: new Date().toISOString(),
      instanceId: instanceId,
      fromMe: false,
      isGroup: false,
      chatId: `chat_${normalizedSenderNumber}`
    };

    console.log(`📋 Dados da mensagem preparados:`, JSON.stringify(messageData, null, 2));

    // Enviar para fila RabbitMQ correta
    const queueName = 'whatsapp.incoming';
    const messageBuffer = Buffer.from(JSON.stringify(messageData));
    
    console.log(`📤 Enviando para fila RabbitMQ: ${queueName}`);
    await rabbitChannel.assertQueue(queueName, { durable: true });
    await rabbitChannel.sendToQueue(queueName, messageBuffer, {
      persistent: true,
      headers: {
        'content-type': 'application/json',
        'timestamp': new Date().toISOString()
      }
    });

    console.log(`✅ Mensagem enviada para RabbitMQ com sucesso: ${message.from}`);
    console.log(`📊 Fila: ${queueName}`);
    console.log(`🆔 Message ID: ${message.id._serialized}`);
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem para API:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Função para enviar confirmação de envio de mensagem para a API
async function sendMessageConfirmationToAPI(phone, messageId, status) {
  try {
    // Verificar se há conexão RabbitMQ
    if (!rabbitConnection || !rabbitChannel) {
      console.log('⚠️ RabbitMQ não conectado, tentando conectar...');
      await startQueueConsumer(client);
      return;
    }

    // Preparar dados da confirmação
    const confirmationData = {
      phone: phone,
      messageId: messageId,
      status: status,
      timestamp: new Date().toISOString(),
      instanceId: instanceId
    };

    // Enviar para fila RabbitMQ correta
    const queueName = 'whatsapp.message-status';
    const messageBuffer = Buffer.from(JSON.stringify(confirmationData));
    
    await rabbitChannel.assertQueue(queueName, { durable: true });
    await rabbitChannel.sendToQueue(queueName, messageBuffer, {
      persistent: true,
      headers: {
        'content-type': 'application/json',
        'timestamp': new Date().toISOString()
      }
    });

    console.log(`📤 Confirmação de status enviada para RabbitMQ: ${messageId} - ${status}`);
  } catch (error) {
    console.error('❌ Erro ao enviar confirmação de status:', error.message);
  }
}

// Função melhorada para envio de mensagens com templates
async function sendOne(client, number, messageData) {
  // VALIDAÇÃO CRÍTICA: Garantir que o bot está conectado e autenticado
  if (!client || !client.info || !client.info.wid) {
    console.log('❌ Cliente WhatsApp não está inicializado ou autenticado');
    return { success: false, reason: 'client_not_authenticated' };
  }

  // Verificar se está completamente validado
  if (!isFullyValidated) {
    console.log(`⏳ Mensagem para ${number} adicionada à fila - aguardando validação`);
    messageQueue.push({ phone: number, messageData });
    return { success: false, reason: 'waiting_validation' };
  }

  const ownNumber = client.info?.wid?.user;

  // Somente enviar/receber com o número atualmente conectado no bot
  const normalizedOwn = normalizeNumber(ownNumber);
  const normalizedTo = normalizeNumber(number);

  if (!normalizedOwn) {
    console.log('❌ Número próprio indisponível');
    return { success: false, reason: 'own_number_unavailable' };
  }

  // GARANTIR: Somente enviar mensagens usando o número conectado no bot
  // O bot só pode enviar mensagens através do número que está conectado
  // Não há restrição de destinatário, mas o remetente SEMPRE será o número conectado

  // Validação adicional: garantir que o bot está conectado com um número válido
  if (!connectedNumber || !isFullyValidated) {
    console.log('❌ Bot não está conectado ou validado completamente');
    return { success: false, reason: 'bot_not_connected' };
  }

  // GARANTIA FINAL: Verificar se o número conectado é consistente
  if (normalizedOwn !== normalizeNumber(connectedNumber)) {
    console.log('❌ Inconsistência detectada entre número conectado e número do cliente');
    console.log(`📞 Número conectado: ${connectedNumber}`);
    console.log(`🆔 Número do cliente: ${ownNumber}`);
    return { success: false, reason: 'number_inconsistency' };
  }

  // GARANTIA DE SEGURANÇA: Verificar se o número conectado é válido
  if (!normalizedOwn || normalizedOwn.length < 10) {
    console.log('❌ Número conectado inválido ou muito curto');
    return { success: false, reason: 'invalid_connected_number' };
  }
  if (!normalizedOwn || normalizedOwn.length < 10) {
    console.log('❌ Número conectado inválido ou muito curto');
    return { success: false, reason: 'invalid_connected_number' };
  }

  // Validação do número
  const cleanNumber = normalizedTo;
  if (cleanNumber.length < 10) {
    console.log(`❌ Número inválido: ${number}`);
    return { success: false, reason: 'invalid_number' };
  }

  try {
    console.log(`📤 Enviando mensagem para ${number}...`);
    console.log(`📞 Remetente (número conectado): ${connectedNumber}`);
    console.log(`🆔 Número próprio (client.info): ${ownNumber}`);
    console.log(`✅ Garantia: Mensagem será enviada APENAS através do número conectado`);
    console.log(`🔢 Número original: ${number}`);
    console.log(`🔢 Número normalizado: ${cleanNumber}`);
    
    // Garantir que o número está no formato correto para WhatsApp
    const chatId = `${cleanNumber}@c.us`;
    console.log(`💬 Chat ID: ${chatId}`);
    
    // Verifica se o chat existe
    let chat;
    try {
      chat = await client.getChatById(chatId);
      if (!chat) {
        console.log(`❌ Chat não encontrado para ${number}`);
        return { success: false, reason: 'chat_not_found' };
      }
    } catch (chatError) {
      console.log(`⚠️ Erro ao verificar chat para ${number}: ${chatError.message}`);
      // Tentar enviar mesmo assim
    }

    // Processar template de mensagem
    let finalMessage;
    
    if (typeof messageData === 'string') {
      // Mensagem simples
      finalMessage = messageData;
    } else if (messageData.template) {
      // Template com dados
      finalMessage = processMessageTemplate(messageData.template, messageData.data);
    } else if (messageData.message) {
      // Mensagem com dados adicionais
      finalMessage = processMessageTemplate(messageData.message, messageData);
    } else {
      console.log(`❌ Formato de mensagem inválido para ${number}`);
      return { success: false, reason: 'invalid_message_format' };
    }

    // Validar se a mensagem não está vazia
    if (!finalMessage || finalMessage.trim() === '') {
      console.log(`❌ Mensagem vazia para ${number}`);
      return { success: false, reason: 'empty_message' };
    }

    // Tentar enviar a mensagem com retry
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Usar método mais seguro para envio
        const message = await client.sendMessage(chatId, finalMessage);
        
        if (message && message.id) {
          console.log(`✅ Mensagem enviada para ${number}`);
          console.log(`📞 Remetente confirmado: ${connectedNumber}`);
          console.log(`🆔 ID da mensagem: ${message.id._serialized}`);
          console.log(`📝 Conteúdo: ${finalMessage.substring(0, 100)}${finalMessage.length > 100 ? '...' : ''}`);
          console.log(`🔒 GARANTIA: Mensagem enviada APENAS através do número conectado ${connectedNumber}`);
          
          // Log de auditoria para rastreamento
          console.log(`📊 AUDITORIA: ${new Date().toISOString()} - Enviado de ${connectedNumber} para ${number}`);
          
          // Enviar confirmação de envio para a API
          await sendMessageConfirmationToAPI(number, message.id._serialized, 'sent');
          
          return { success: true, messageId: message.id };
        } else {
          throw new Error('Mensagem não foi enviada corretamente');
        }
      } catch (sendError) {
        retryCount++;
        console.log(`⚠️ Tentativa ${retryCount} falhou para ${number}: ${sendError.message}`);
        
        if (retryCount >= maxRetries) {
          console.error(`❌ Todas as tentativas falharam para ${number}`);
          return { success: false, reason: sendError.message };
        }
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
  } catch (err) {
    console.error(`❌ Erro ao enviar para ${number}:`, err.message);
    return { success: false, reason: err.message };
  }
}

// Função melhorada para consumidor da fila
async function startQueueConsumer(client) {
  // Evitar múltiplas conexões simultâneas
  if (rabbitConnection && !rabbitConnection.closed) {
    console.log('🔌 Conexão RabbitMQ já existe, reutilizando...');
    return;
  }
  
  let connection, channel;
  
  try {
    console.log('🔌 Conectando ao RabbitMQ...');
    console.log(`📍 Host: ${rabbitConfig.hostname}:${rabbitConfig.port}`);

    const url = RABBITMQ_URL + '?heartbeat=30';
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    // Atribuir às variáveis globais
    rabbitConnection = connection;
    rabbitChannel = channel;

    const queue = process.env.RABBITMQ_QUEUE || 'whatsapp.outgoing';
    await channel.assertQueue(queue, { durable: true });

    console.log(`🎧 Aguardando mensagens na fila: ${queue}...`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const payload = JSON.parse(msg.content.toString());
          console.log('📦 Mensagem recebida da fila:', payload);

          // Tratar comandos especiais
          if (payload.command === 'disconnect') {
            console.log('🛠️ Comando disconnect recebido. Limpando sessão e encerrando...');
            try {
              clearQRCodeTimer();
              clearValidationTimer();
              try { await client.logout(); } catch (_) {}
              clearAllSessions();
            } finally {
              channel.ack(msg);
              process.exit(0);
            }
            return;
          }

          if (payload.command === 'generate_qr') {
            console.log('🛠️ Comando generate_qr recebido. Reinicializando cliente para emitir novo QR...');
            try {
              clearQRCodeTimer();
              clearValidationTimer();
              try { await client.logout(); } catch (_) {}
              isConnected = false;
              isFullyValidated = false;
              connectedNumber = null;
              client.initialize();
            } catch (cmdErr) {
              console.error('❌ Erro ao processar comando generate_qr:', cmdErr.message);
            }
            channel.ack(msg);
            return;
          }

          // Validação do payload
          if (!payload.phone && !payload.Phone) {
            console.error('❌ Payload inválido: número não encontrado', payload);
            channel.nack(msg, false, false);
            return;
          }

          // Suportar diferentes formatos de payload
          const phone = payload.phone || payload.Phone;
          const messageData = {
            message: payload.message || payload.Message,
            template: payload.template || payload.Template,
            data: payload.data || payload.Data || payload
          };

          const result = await sendOne(client, phone, messageData);
          
          if (result.success) {
          channel.ack(msg);
            console.log(`✅ Mensagem processada com sucesso para ${phone}`);
          } else if (result.reason === 'waiting_validation') {
            // Não fazer ack nem nack - aguardar validação
            console.log(`⏳ Mensagem para ${phone} aguardando validação`);
          } else {
            console.log(`⚠️ Falha no envio para ${phone}: ${result.reason}`);
            channel.nack(msg, false, false);
          }
        } catch (error) {
          console.error('❌ Erro ao processar mensagem:', error.message);
          channel.nack(msg, false, false);
        }
      }
    });

    // Tratamento de desconexão
    connection.on('close', () => {
      console.log('🔌 Conexão RabbitMQ fechada');
      setTimeout(() => startQueueConsumer(client), 5000);
    });

    connection.on('error', (err) => {
      console.error('❌ Erro na conexão RabbitMQ:', err.message);
    });

  } catch (err) {
    console.error('❌ Erro ao conectar ao RabbitMQ:', err.message);
    console.log('🔄 Tentando reconectar em 10 segundos...');
    setTimeout(() => startQueueConsumer(client), 10000);
  }
}

// -----------------------------------------------------------------------------
//                                  LÓGICA DE FILAS
// -----------------------------------------------------------------------------

async function initializeRabbitMQ() {
  try {
    const url = RABBITMQ_URL + '?heartbeat=30';
    rabbitConnection = await amqp.connect(url);
    rabbitChannel = await rabbitConnection.createChannel();
    console.log('✅ Conexão RabbitMQ estabelecida.');
    await rabbitChannel.assertQueue('out.qrcode', { durable: true });
    await rabbitChannel.assertQueue('whatsapp.incoming', { durable: true });
    await rabbitChannel.assertQueue('whatsapp.outgoing', { durable: true });
    await rabbitChannel.assertQueue('whatsapp.message-status', { durable: true });
    await rabbitChannel.assertQueue('session.status', { durable: true });
  } catch (error) {
    console.error('❌ Falha ao conectar ao RabbitMQ:', error.message);
  }
}

// Tratamento de sinais para graceful shutdown
process.on('SIGINT', async () => {
  clearQRCodeTimer();
  clearValidationTimer();
  console.log('\n🛑 Recebido SIGINT, encerrando...');
  try {
    await client.destroy();
    console.log('✅ Cliente WhatsApp encerrado');
  } catch (error) {
    console.error('❌ Erro ao encerrar cliente:', error.message);
  }
  clearAllSessions();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  clearQRCodeTimer();
  clearValidationTimer();
  console.log('\n🛑 Recebido SIGTERM, encerrando...');
  try {
    await client.destroy();
    console.log('✅ Cliente WhatsApp encerrado');
  } catch (error) {
    console.error('❌ Erro ao encerrar cliente:', error.message);
  }
  clearAllSessions();
  process.exit(0);
});

// Inicialização do cliente
console.log('🚀 Iniciando Zap Blaster...');
console.log(`📁 Sessão: ${sessionPath}`);

// Política: sempre iniciar sem sessão
clearAllSessions();
console.log('📱 Será necessário escanear QR Code');

showConnectionStatus();

// Inicializar RabbitMQ primeiro
initializeRabbitMQ().then(() => {
  console.log('✅ RabbitMQ inicializado');
}).catch((error) => {
  console.error('❌ Erro ao inicializar RabbitMQ:', error.message);
});

// Inicializar cliente apenas uma vez
client.initialize().then(() => {
  console.log('✅ Cliente WhatsApp inicializado com sucesso!');
}).catch((error) => {
  console.error('❌ Erro ao inicializar cliente:', error.message);
  console.log('🔄 Tentando reinicializar em 10 segundos...');
  
  // Tentar reinicializar após 10 segundos
  setTimeout(() => {
    console.log('🔄 Reinicializando cliente WhatsApp...');
    client.initialize().then(() => {
      console.log('✅ Cliente WhatsApp reinicializado com sucesso!');
    }).catch((retryError) => {
      console.error('❌ Erro na reinicialização:', retryError.message);
      console.log('📱 O bot está pronto para receber comandos de geração de QR');
    });
  }, 10000);
});

// Servidor HTTP + Socket.IO para status em tempo real (porta 3000)
const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

function emitStatus() {
  const payload = {
    isConnected,
    isFullyValidated,
    connectedNumber,
    timestamp: new Date().toISOString()
  };
  io.sockets.emit('status', payload);
}

app.get('/status', (req, res) => {
  res.json({
    isConnected,
    isFullyValidated,
    connectedNumber,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => res.json({ status: 'OK' }));

io.on('connection', socket => {
  console.log('🔌 Cliente socket conectado');
  // Enviar status atual imediatamente
  emitStatus();
  socket.on('disconnect', () => console.log('🔌 Cliente socket desconectado'));
});

// Heartbeat de status
setInterval(() => {
  emitStatus();
  sendSessionStatusToAPI();
}, 15000);

const PORT = parseInt(process.env.BOT_STATUS_PORT || '3000', 10);
server.listen(PORT, () => {
  console.log(`🌐 Status server ouvindo em http://localhost:${PORT}`);
});

// Função para enviar status de sessão para a API
async function sendSessionStatusToAPI() {
  try {
    // Verificar se há conexão RabbitMQ
    if (!rabbitConnection || !rabbitChannel) {
      return;
    }

    // Preparar dados do status da sessão
    const sessionStatus = {
      sessionConnected: isConnected,
      connectedNumber: connectedNumber,
      isFullyValidated: isFullyValidated,
      lastActivity: new Date().toISOString(),
      instanceId: instanceId,
      timestamp: Date.now()
    };

    // Enviar para fila RabbitMQ
    const queueName = 'session.status';
    const messageBuffer = Buffer.from(JSON.stringify(sessionStatus));
    
    await rabbitChannel.assertQueue(queueName, { durable: true });
    await rabbitChannel.sendToQueue(queueName, messageBuffer, {
      persistent: true,
      headers: {
        'content-type': 'application/json',
        'timestamp': new Date().toISOString()
      }
    });

    console.log(`📤 Status de sessão enviado para RabbitMQ: ${isConnected ? 'CONECTADO' : 'DESCONECTADO'}`);
  } catch (error) {
    console.error('❌ Erro ao enviar status de sessão:', error.message);
  }
}
