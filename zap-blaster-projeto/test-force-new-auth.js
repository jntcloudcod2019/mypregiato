const amqp = require('amqplib');

const RABBIT_URL = 'amqps://ewxcrhtv:DNcdH0NEeP4Fsgo2_w-vd47CqjelFk_S@mouse.rmq5.cloudamqp.com:5671/ewxcrhtv?heartbeat=30';

async function sendForceNewAuth() {
  try {
    console.log('🔗 Conectando ao RabbitMQ...');
    const connection = await amqp.connect(RABBIT_URL);
    const channel = await connection.createChannel();
    
    const queue = 'whatsapp.outgoing';
    await channel.assertQueue(queue, { durable: true });
    
    const payload = {
      command: 'force_new_auth',
      requestId: `force-auth-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Enviando comando force_new_auth:', payload);
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { 
      persistent: true, 
      contentType: 'application/json' 
    });
    
    console.log('✅ Comando enviado com sucesso!');
    console.log('📱 O Zap Bot deve limpar a sessão e gerar um novo QR Code');
    
    await channel.close();
    await connection.close();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

sendForceNewAuth();
