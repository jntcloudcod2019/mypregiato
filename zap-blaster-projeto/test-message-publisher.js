#!/usr/bin/env node

const amqp = require('amqplib');
const crypto = require('crypto');

// Configuração RabbitMQ (mesma do zap.js)
const RABBIT_URL = 'amqps://ewxcrhtv:DNcdH0NEeP4Fsgo2_w-vd47CqjelFk_S@mouse.rmq5.cloudamqp.com:5671/ewxcrhtv?heartbeat=30';

// Payload de teste simulando uma mensagem real do WhatsApp
function createTestMessage() {
  const testPhone = '5511999887766'; // Número de teste
  const instanceId = 'zap-prod';
  
  return {
    // === CAMPOS OBRIGATÓRIOS ===
    externalMessageId: crypto.randomUUID(),
    from: `${testPhone}@c.us`,
    fromNormalized: testPhone,
    to: '5511989908389', // Número do bot (simulado)
    type: 'text',
    timestamp: new Date().toISOString(),
    instanceId: instanceId,
    fromMe: false,
    isGroup: false,
    chatId: `chat_${testPhone}`,

    // === CAMPOS OPCIONAIS ===
    body: 'Olá! Esta é uma mensagem de teste para validar o fluxo da API. 🚀',
    simulated: true, // Marcando como simulada para identificação

    // === MÍDIA UNIFICADA ===
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

async function publishTestMessage() {
  let connection = null;
  let channel = null;
  
  try {
    console.log('🔌 Conectando ao RabbitMQ...');
    connection = await amqp.connect(RABBIT_URL);
    channel = await connection.createChannel();
    
    console.log('✅ Conectado ao RabbitMQ');
    
    // Garantir que a fila existe
    await channel.assertQueue('whatsapp.incoming', { durable: true });
    console.log('📋 Fila whatsapp.incoming verificada');
    
    // Criar mensagem de teste
    const testMessage = createTestMessage();
    console.log('📝 Mensagem de teste criada:');
    console.log(JSON.stringify(testMessage, null, 2));
    
    // Publicar na fila
    const messageBuffer = Buffer.from(JSON.stringify(testMessage));
    channel.sendToQueue('whatsapp.incoming', messageBuffer, { 
      persistent: true,
      contentType: 'application/json'
    });
    
    console.log('🚀 Mensagem publicada na fila whatsapp.incoming');
    console.log(`📱 Telefone de teste: ${testMessage.fromNormalized}`);
    console.log(`💬 Conteúdo: ${testMessage.body}`);
    console.log(`🆔 ID da mensagem: ${testMessage.externalMessageId}`);
    
  } catch (error) {
    console.error('❌ Erro ao publicar mensagem:', error.message);
    process.exit(1);
  } finally {
    if (channel) {
      try {
        await channel.close();
        console.log('📪 Canal fechado');
      } catch (e) {}
    }
    if (connection) {
      try {
        await connection.close();
        console.log('🔌 Conexão fechada');
      } catch (e) {}
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  console.log('🧪 === TESTE DE PUBLICAÇÃO NA FILA whatsapp.incoming ===');
  publishTestMessage()
    .then(() => {
      console.log('✅ Teste concluído com sucesso!');
      console.log('👀 Agora verifique os logs da API para ver se a mensagem foi processada.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Teste falhou:', error);
      process.exit(1);
    });
}

module.exports = { createTestMessage, publishTestMessage };
