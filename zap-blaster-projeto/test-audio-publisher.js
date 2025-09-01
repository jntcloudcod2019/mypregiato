#!/usr/bin/env node

const amqp = require('amqplib');
const crypto = require('crypto');
const fs = require('fs');

// Configuração RabbitMQ (mesma do zap.js)
const RABBIT_URL = 'amqps://ewxcrhtv:DNcdH0NEeP4Fsgo2_w-vd47CqjelFk_S@mouse.rmq5.cloudamqp.com:5671/ewxcrhtv?heartbeat=30';

// Ler base64 do áudio
function getAudioBase64() {
  try {
    // Tentar ler o arquivo base64.txt primeiro (se o usuário criar)
    if (fs.existsSync('./base64.txt')) {
      return fs.readFileSync('./base64.txt', 'utf8').trim();
    }
    // Fallback: usar a amostra criada
    if (fs.existsSync('./real_audio_base64.txt')) {
      return fs.readFileSync('./real_audio_base64.txt', 'utf8').trim();
    }
    throw new Error('Nenhum arquivo de áudio base64 encontrado');
  } catch (error) {
    console.error('❌ Erro ao ler arquivo de áudio:', error.message);
    process.exit(1);
  }
}

// Payload de teste simulando uma mensagem de áudio real do WhatsApp
function createTestAudioMessage() {
  const testPhone = '5511988770944'; // Número de teste diferente
  const instanceId = 'zap-prod';
  const audioBase64 = getAudioBase64();
  
  return {
    // === CAMPOS OBRIGATÓRIOS ===
    externalMessageId: crypto.randomUUID(),
    from: `${testPhone}@c.us`,
    fromNormalized: testPhone,
    to: '5511949907658', // Número do bot (simulado)
    type: 'audio', // TIPO: áudio
    timestamp: new Date().toISOString(),
    instanceId: instanceId,
    fromMe: false,
    isGroup: false,
    chatId: `chat_${testPhone}`,

    // === CAMPOS OPCIONAIS ===
    body: `data:audio/mpeg;base64,${audioBase64}`, // Para áudio, incluir base64 no body
    simulated: true, // Marcando como simulada para identificação

    // === MÍDIA DE ÁUDIO ===
    attachment: {
      dataUrl: `data:audio/mpeg;base64,${audioBase64}`, // Base64 do áudio com prefixo data:
      mediaUrl: null,
      mimeType: 'audio/mpeg', // MIME type para MP3
      fileName: `audio_${Date.now()}.mp3`,
      mediaType: 'audio',
      
      // Campos específicos para áudio
      fileSize: Buffer.byteLength(audioBase64, 'base64'),
      duration: 5, // Duração em segundos (simulada)
      width: null, // Não aplicável para áudio
      height: null, // Não aplicável para áudio
      thumbnail: null // Áudios não têm thumbnail
    },

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

async function publishTestAudioMessage() {
  let connection = null;
  let channel = null;
  
  try {
    console.log('🎵 === TESTE DE PUBLICAÇÃO DE ÁUDIO NA FILA whatsapp.incoming ===');
    console.log('🔌 Conectando ao RabbitMQ...');
    connection = await amqp.connect(RABBIT_URL);
    channel = await connection.createChannel();
    
    console.log('✅ Conectado ao RabbitMQ');
    
    // Garantir que a fila existe
    await channel.assertQueue('whatsapp.incoming', { durable: true });
    console.log('📋 Fila whatsapp.incoming verificada');
    
    // Criar mensagem de teste com áudio
    const testMessage = createTestAudioMessage();
    console.log('🎵 Mensagem de áudio de teste criada:');
    console.log('📱 Telefone:', testMessage.fromNormalized);
    console.log('🎧 Tipo:', testMessage.type);
    console.log('🗂️ MIME Type:', testMessage.attachment.mimeType);
    console.log('📏 Tamanho do arquivo:', testMessage.attachment.fileSize, 'bytes');
    console.log('⏱️ Duração:', testMessage.attachment.duration, 'segundos');
    console.log('🆔 ID da mensagem:', testMessage.externalMessageId);
    console.log('📊 Base64 (primeiros 100 chars):', testMessage.attachment.dataUrl.substring(0, 100) + '...');
    
    // Publicar na fila
    const messageBuffer = Buffer.from(JSON.stringify(testMessage));
    channel.sendToQueue('whatsapp.incoming', messageBuffer, { 
      persistent: true,
      contentType: 'application/json'
    });
    
    console.log('🚀 Mensagem de áudio publicada na fila whatsapp.incoming');
    
  } catch (error) {
    console.error('❌ Erro ao publicar mensagem de áudio:', error.message);
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
  publishTestAudioMessage()
    .then(() => {
      console.log('✅ Teste de áudio concluído com sucesso!');
      console.log('👀 Agora verifique os logs da API para ver se a mensagem de áudio foi processada.');
      console.log('🎵 Verifique se o áudio aparece no frontend com o player de áudio.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Teste de áudio falhou:', error);
      process.exit(1);
    });
}

module.exports = { createTestAudioMessage, publishTestAudioMessage };
