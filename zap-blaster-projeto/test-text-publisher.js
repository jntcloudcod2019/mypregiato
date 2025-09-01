#!/usr/bin/env node

// Script para testar mensagem de TEXTO na fila whatsapp.incoming
// Para validar se o incremento no PayloadJson está funcionando

const amqp = require('amqplib');
const crypto = require('crypto');

// Configuração do RabbitMQ (same as zap.js)
const rabbitCfg = {
  protocol: 'amqps',
  hostname: process.env.RABBIT_HOST || 'mouse.rmq5.cloudamqp.com',
  port: Number(process.env.RABBIT_PORT || 5671),
  username: process.env.RABBIT_USER || 'ewxcrhtv',
  password: process.env.RABBIT_PASS || 'DNcdH0NEeP4Fsgo2_w-vd47CqjelFk_S',
  vhost: process.env.RABBIT_VHOST || 'ewxcrhtv',
};
const RABBIT_URL = `amqps://${encodeURIComponent(rabbitCfg.username)}:${encodeURIComponent(rabbitCfg.password)}@${rabbitCfg.hostname}:${rabbitCfg.port}/${encodeURIComponent(rabbitCfg.vhost)}?heartbeat=30`;

function createTestTextMessage() {
  const testPhone = '5511988776655'; // MESMO NÚMERO dos testes de áudio
  const messageId = crypto.randomUUID();
  
  return {
    // === CAMPOS OBRIGATÓRIOS ===
    from: `${testPhone}@c.us`,
    to: '5511888776655@c.us',
    body: 'Esta é uma mensagem de TEXTO para testar o incremento no PayloadJson! 📝',
    type: 'text', // TIPO TEXTO
    fromMe: false,
    timestamp: new Date().toISOString(),
    externalMessageId: messageId,
    fromNormalized: testPhone,
    isGroup: false,
    instanceId: 'zap-bot',
    
    // === ATTACHMENT NULL para texto ===
    attachment: null,

    // === LOCALIZAÇÃO DA SESSÃO ===
    location: {
      latitude: -23.5505,  // São Paulo
      longitude: -46.6333,
      address: "São Paulo, Brasil"
    },

    // === CONTATO DO REMETENTE ===
    contact: {
      name: testPhone,
      phone: testPhone
    }
  };
}

async function publishTestTextMessage() {
  let connection = null;
  let channel = null;
  
  try {
    console.log('📝 === TESTE DE PUBLICAÇÃO DE TEXTO NA FILA whatsapp.incoming ===');
    console.log('🔌 Conectando ao RabbitMQ...');
    connection = await amqp.connect(RABBIT_URL);
    channel = await connection.createChannel();
    
    console.log('✅ Conectado ao RabbitMQ');
    
    // Garantir que a fila existe
    await channel.assertQueue('whatsapp.incoming', { durable: true });
    console.log('📋 Fila whatsapp.incoming verificada');
    
    // Criar mensagem de teste com texto
    const testMessage = createTestTextMessage();
    
    console.log('📝 Mensagem de texto de teste criada:');
    console.log(`📱 Telefone: ${testMessage.fromNormalized}`);
    console.log(`💬 Tipo: ${testMessage.type}`);
    console.log(`📄 Texto: ${testMessage.body}`);
    console.log(`🆔 ID da mensagem: ${testMessage.externalMessageId}`);
    console.log(`📅 Timestamp: ${testMessage.timestamp}`);
    console.log('');
    
    // Publicar mensagem na fila
    const messageBuffer = Buffer.from(JSON.stringify(testMessage));
    channel.sendToQueue('whatsapp.incoming', messageBuffer, { 
      persistent: true,
      contentType: 'application/json'
    });
    
    console.log('🚀 Mensagem de texto publicada na fila whatsapp.incoming');
    
  } catch (error) {
    console.error('❌ Erro ao publicar mensagem de texto:', error.message);
    process.exit(1);
  } finally {
    if (channel) {
      try {
        await channel.close();
        console.log('📪 Canal fechado');
      } catch (e) {
        console.error('❌ Erro ao fechar canal:', e.message);
      }
    }
    
    if (connection) {
      try {
        await connection.close();
        console.log('🔌 Conexão fechada');
      } catch (e) {
        console.error('❌ Erro ao fechar conexão:', e.message);
      }
    }
    
    console.log('✅ Teste de texto concluído com sucesso!');
    console.log('👀 Agora verifique os logs da API para ver se a mensagem de texto foi processada.');
    console.log('📝 Verifique se o texto aparece no frontend e se foi INCREMENTADO no PayloadJson.');
  }
}

// Executar o teste
publishTestTextMessage();
