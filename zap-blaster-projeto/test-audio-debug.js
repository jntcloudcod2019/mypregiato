const amqp = require('amqplib');

const RABBITMQ_URL = "amqps://ewxcrhtv:DNcdH0NEeP4Fsgo2_w-vd47CqjelFk_S@mouse.rmq5.cloudamqp.com:5671/ewxcrhtv?heartbeat=30";

async function testAudioMessage() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Simular payload de áudio como o Zap Bot envia
    const audioPayload = {
      externalMessageId: "test-audio-" + Date.now(),
      from: "5511988776655@c.us",
      fromNormalized: "5511988776655",
      to: "",
      type: "audio",
      timestamp: new Date().toISOString(),
      body: "data:audio/mpeg;base64,SUQzBAAAAAABVFRJVDIAAAAOAAABTEF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU5LjM3", // Base64 pequeno para teste
      attachment: {
        dataUrl: "data:audio/mpeg;base64,SUQzBAAAAAABVFRJVDIAAAAOAAABTEF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU5LjM3",
        mimeType: "audio/mpeg",
        fileName: "audio_test.mp3",
        mediaType: "audio",
        fileSize: 1024
      },
      location: {
        latitude: -23.5505,
        longitude: -46.6333,
        address: "São Paulo, Brasil"
      },
      contact: {
        name: "Cliente 5511988776655",
        phone: "5511988776655"
      }
    };

    // Publicar na fila
    await channel.assertQueue('whatsapp.incoming');
    
    const message = Buffer.from(JSON.stringify(audioPayload));
    
    console.log('📤 Enviando mensagem de áudio de teste...');
    console.log('📋 Payload:', {
      id: audioPayload.externalMessageId,
      type: audioPayload.type,
      hasBody: !!audioPayload.body,
      hasAttachment: !!audioPayload.attachment,
      mimeType: audioPayload.attachment?.mimeType
    });

    channel.sendToQueue('whatsapp.incoming', message);
    
    console.log('✅ Mensagem de áudio enviada!');
    
    await channel.close();
    await connection.close();
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testAudioMessage();
