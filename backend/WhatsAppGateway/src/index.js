const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const amqp = require('amqplib');

require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Logger
const logger = pino({ level: 'info' });

// Configurações
const PORT = process.env.PORT || 3001;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const SESSION_PATH = process.env.SESSION_PATH || './sessions';

// Estado da sessão WhatsApp
let sessionState = {
  isConnected: false,
  status: 'disconnected',
  qrCode: null,
  sessionId: null,
  lastActivity: null
};

let sock = null;
let connection = null;
let channel = null;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Função para conectar ao RabbitMQ
async function connectRabbitMQ() {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Declarar exchanges
    await channel.assertExchange('whatsapp.events', 'topic', { durable: true });
    await channel.assertExchange('whatsapp.messages', 'topic', { durable: true });
    
    // Declarar filas
    await channel.assertQueue('msg.outbound', { durable: true });
    await channel.assertQueue('msg.inbound', { durable: true });
    await channel.assertQueue('session.events', { durable: true });
    
    // Bind das filas
    await channel.bindQueue('msg.outbound', 'whatsapp.messages', 'outbound');
    await channel.bindQueue('msg.inbound', 'whatsapp.messages', 'inbound');
    await channel.bindQueue('session.events', 'whatsapp.events', 'session.*');
    
    logger.info('✅ Conectado ao RabbitMQ');
  } catch (error) {
    logger.error('❌ Erro ao conectar ao RabbitMQ:', error);
  }
}

// Função para publicar eventos
async function publishEvent(exchange, routingKey, data) {
  try {
    if (channel) {
      await channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)));
      logger.info(`📤 Evento publicado: ${routingKey}`);
    }
  } catch (error) {
    logger.error('❌ Erro ao publicar evento:', error);
  }
}

// Função para inicializar WhatsApp
async function initializeWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
    
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' })
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        // Gerar QR Code
        const qrCode = await QRCode.toDataURL(qr, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        sessionState = {
          isConnected: false,
          status: 'qr_ready',
          qrCode,
          sessionId: uuidv4(),
          lastActivity: new Date().toISOString()
        };
        
        // Emitir via Socket.IO
        io.emit('session:qr', { qrCode, sessionId: sessionState.sessionId });
        
        // Publicar no RabbitMQ
        await publishEvent('whatsapp.events', 'session.qr', {
          sessionId: sessionState.sessionId,
          qrCode,
          timestamp: new Date().toISOString()
        });
        
        logger.info('📱 QR Code gerado');
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        sessionState = {
          isConnected: false,
          status: 'disconnected',
          qrCode: null,
          sessionId: null,
          lastActivity: new Date().toISOString()
        };
        
        io.emit('session:disconnected', { reason: lastDisconnect?.error?.message });
        await publishEvent('whatsapp.events', 'session.disconnected', {
          reason: lastDisconnect?.error?.message,
          timestamp: new Date().toISOString()
        });
        
        if (shouldReconnect) {
          logger.info('🔄 Reconectando WhatsApp...');
          setTimeout(initializeWhatsApp, 5000);
        }
      } else if (connection === 'open') {
        sessionState = {
          isConnected: true,
          status: 'connected',
          qrCode: null,
          sessionId: uuidv4(),
          lastActivity: new Date().toISOString()
        };
        
        io.emit('session:connected', { sessionId: sessionState.sessionId });
        await publishEvent('whatsapp.events', 'session.connected', {
          sessionId: sessionState.sessionId,
          timestamp: new Date().toISOString()
        });
        
        logger.info('✅ WhatsApp conectado');
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0];
      if (!msg.key.fromMe && m.type === 'notify') {
        const messageData = {
          id: msg.key.id,
          from: msg.key.remoteJid,
          content: msg.message?.conversation || msg.message?.extendedTextMessage?.text || '',
          type: msg.message?.imageMessage ? 'image' : 
                msg.message?.audioMessage ? 'audio' : 
                msg.message?.documentMessage ? 'document' : 'text',
          timestamp: new Date().toISOString(),
          mediaUrl: msg.message?.imageMessage?.url || 
                   msg.message?.audioMessage?.url || 
                   msg.message?.documentMessage?.url
        };
        
        // Emitir via Socket.IO
        io.emit('message:in', messageData);
        
        // Publicar no RabbitMQ
        await publishEvent('whatsapp.messages', 'inbound', messageData);
        
        logger.info(`📨 Mensagem recebida de ${messageData.from}`);
      }
    });

    // Escutar mensagens de saída do RabbitMQ
    if (channel) {
      await channel.consume('msg.outbound', async (msg) => {
        if (msg) {
          try {
            const messageData = JSON.parse(msg.content.toString());
            await sendMessage(messageData);
            channel.ack(msg);
          } catch (error) {
            logger.error('❌ Erro ao processar mensagem de saída:', error);
            channel.nack(msg);
          }
        }
      });
    }
    
  } catch (error) {
    logger.error('❌ Erro ao inicializar WhatsApp:', error);
  }
}

// Função para enviar mensagem
async function sendMessage(messageData) {
  if (!sock || !sessionState.isConnected) {
    throw new Error('WhatsApp não está conectado');
  }
  
  try {
    const { to, content, type, clientMessageId } = messageData;
    
    let messageOptions = {};
    
    if (type === 'image' && messageData.mediaUrl) {
      messageOptions = {
        image: { url: messageData.mediaUrl }
      };
    } else if (type === 'audio' && messageData.mediaUrl) {
      messageOptions = {
        audio: { url: messageData.mediaUrl }
      };
    } else if (type === 'document' && messageData.mediaUrl) {
      messageOptions = {
        document: { url: messageData.mediaUrl, fileName: messageData.fileName }
      };
    } else {
      messageOptions = {
        text: content
      };
    }
    
    const result = await sock.sendMessage(to, messageOptions);
    
    // Emitir confirmação
    const statusData = {
      clientMessageId,
      waMessageId: result.key.id,
      status: 'sent',
      timestamp: new Date().toISOString()
    };
    
    io.emit('message:status', statusData);
    await publishEvent('whatsapp.messages', 'status', statusData);
    
    logger.info(`📤 Mensagem enviada para ${to}`);
    
  } catch (error) {
    logger.error('❌ Erro ao enviar mensagem:', error);
    throw error;
  }
}

// Rotas da API
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    whatsapp: sessionState.status,
    timestamp: new Date().toISOString()
  });
});

app.get('/session/status', (req, res) => {
  res.json(sessionState);
});

app.post('/session/connect', async (req, res) => {
  try {
    if (sessionState.isConnected) {
      return res.json({ 
        success: true, 
        message: 'WhatsApp já está conectado',
        sessionId: sessionState.sessionId 
      });
    }
    
    await initializeWhatsApp();
    res.json({ 
      success: true, 
      message: 'Iniciando conexão WhatsApp',
      sessionId: sessionState.sessionId 
    });
  } catch (error) {
    logger.error('❌ Erro ao conectar:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/session/disconnect', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
    
    sessionState = {
      isConnected: false,
      status: 'disconnected',
      qrCode: null,
      sessionId: null,
      lastActivity: new Date().toISOString()
    };
    
    io.emit('session:disconnected', { reason: 'Manual disconnect' });
    await publishEvent('whatsapp.events', 'session.disconnected', {
      reason: 'Manual disconnect',
      timestamp: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'WhatsApp desconectado' });
  } catch (error) {
    logger.error('❌ Erro ao desconectar:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/messages/send', async (req, res) => {
  try {
    const { to, content, type, clientMessageId } = req.body;
    
    if (!to || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Destinatário e conteúdo são obrigatórios' 
      });
    }
    
    await sendMessage({ to, content, type, clientMessageId });
    
    res.json({ 
      success: true, 
      message: 'Mensagem enviada com sucesso' 
    });
  } catch (error) {
    logger.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  logger.info(`🔌 Cliente conectado: ${socket.id}`);
  
  // Enviar estado atual
  socket.emit('session:status', sessionState);
  
  socket.on('disconnect', () => {
    logger.info(`🔌 Cliente desconectado: ${socket.id}`);
  });
});

// Inicialização
async function start() {
  try {
    await connectRabbitMQ();
    
    server.listen(PORT, () => {
      logger.info(`🚀 WhatsApp Gateway rodando na porta ${PORT}`);
    });
    
    // Inicializar WhatsApp se houver sessão salva
    if (require('fs').existsSync(`${SESSION_PATH}/creds.json`)) {
      logger.info('📱 Tentando restaurar sessão WhatsApp...');
      await initializeWhatsApp();
    }
    
  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

start(); 