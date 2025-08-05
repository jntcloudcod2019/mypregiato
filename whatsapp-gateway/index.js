const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode');
const amqp = require('amqplib');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const pino = require('pino');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:8083"],
    methods: ["GET", "POST"]
  }
});

const logger = pino({ level: 'info' });

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// WhatsApp connection state
let sock = null;
let qrCode = null;
let connectionStatus = 'disconnected';

// RabbitMQ connection
let channel = null;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    channel = await connection.createChannel();
    
    // Declare queues
    await channel.assertQueue('whatsapp.messages', { durable: true });
    await channel.assertQueue('whatsapp.events', { durable: true });
    
    logger.info('Connected to RabbitMQ');
  } catch (error) {
    logger.error('RabbitMQ connection failed:', error);
  }
}

async function startWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    sock = makeWASocket({
      printQRInTerminal: true,
      auth: state,
      logger: pino({ level: 'silent' })
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        qrCode = await qrcode.toDataURL(qr);
        connectionStatus = 'qr_ready';
        io.emit('session:qr', { qrCode });
        logger.info('QR Code generated');
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        logger.info('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
        
        if (shouldReconnect) {
          startWhatsApp();
        } else {
          connectionStatus = 'disconnected';
          io.emit('session:disconnected');
        }
      } else if (connection === 'open') {
        connectionStatus = 'connected';
        qrCode = null;
        io.emit('session:connected');
        logger.info('WhatsApp connected');
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0];
      if (!msg.key.fromMe && msg.message) {
        const messageData = {
          id: uuidv4(),
          conversationId: msg.key.remoteJid,
          direction: 'in',
          type: getMessageType(msg.message),
          body: getMessageBody(msg.message),
          whatsAppMessageId: msg.key.id,
          status: 'received',
          createdAt: new Date().toISOString()
        };

        // Send to RabbitMQ
        if (channel) {
          channel.sendToQueue('whatsapp.messages', Buffer.from(JSON.stringify(messageData)));
        }

        // Emit to Socket.IO
        io.emit('message:received', messageData);
        logger.info('Message received:', messageData.body);
      }
    });

  } catch (error) {
    logger.error('WhatsApp connection error:', error);
  }
}

function getMessageType(message) {
  if (message.conversation) return 'text';
  if (message.imageMessage) return 'image';
  if (message.audioMessage) return 'audio';
  if (message.documentMessage) return 'document';
  if (message.videoMessage) return 'video';
  return 'text';
}

function getMessageBody(message) {
  if (message.conversation) return message.conversation;
  if (message.imageMessage?.caption) return message.imageMessage.caption;
  if (message.documentMessage?.caption) return message.documentMessage.caption;
  if (message.videoMessage?.caption) return message.videoMessage.caption;
  return '';
}

// API Routes
app.post('/session/connect', async (req, res) => {
  try {
    if (connectionStatus === 'disconnected') {
      await startWhatsApp();
      res.json({ success: true, message: 'Starting WhatsApp connection' });
    } else {
      res.json({ success: true, message: 'WhatsApp already connected or connecting' });
    }
  } catch (error) {
    logger.error('Error starting WhatsApp:', error);
    res.status(500).json({ error: 'Failed to start WhatsApp connection' });
  }
});

app.post('/session/disconnect', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
      connectionStatus = 'disconnected';
      io.emit('session:disconnected');
      res.json({ success: true, message: 'WhatsApp disconnected' });
    } else {
      res.json({ success: true, message: 'WhatsApp not connected' });
    }
  } catch (error) {
    logger.error('Error disconnecting WhatsApp:', error);
    res.status(500).json({ error: 'Failed to disconnect WhatsApp' });
  }
});

app.get('/session/status', (req, res) => {
  res.json({
    isConnected: connectionStatus === 'connected',
    status: connectionStatus,
    qrCode
  });
});

app.post('/messages/send', async (req, res) => {
  try {
    const { conversationId, body, type = 'text' } = req.body;
    
    if (!sock || connectionStatus !== 'connected') {
      return res.status(400).json({ error: 'WhatsApp not connected' });
    }

    const messageData = {
      id: uuidv4(),
      conversationId,
      direction: 'out',
      type,
      body,
      status: 'sending',
      createdAt: new Date().toISOString()
    };

    // Send message via WhatsApp
    await sock.sendMessage(conversationId, { text: body });
    
    messageData.status = 'sent';
    messageData.updatedAt = new Date().toISOString();

    // Send to RabbitMQ
    if (channel) {
      channel.sendToQueue('whatsapp.messages', Buffer.from(JSON.stringify(messageData)));
    }

    // Emit to Socket.IO
    io.emit('message:sent', messageData);

    res.json(messageData);
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  logger.info('Client connected:', socket.id);
  
  // Send current status
  socket.emit('session:status', {
    isConnected: connectionStatus === 'connected',
    status: connectionStatus,
    qrCode
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectRabbitMQ();
    server.listen(PORT, () => {
      logger.info(`WhatsApp Gateway running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
  }
}

startServer(); 