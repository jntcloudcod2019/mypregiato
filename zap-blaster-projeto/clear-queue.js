const amqp = require('amqplib');

const url = 'amqps://ewxcrhtv:DNcdH0NEeP4Fsgo2_w-vd47CqjelFk_S@mouse.rmq5.cloudamqp.com:5671/ewxcrhtv?heartbeat=30';

async function clearQueue() {
  try {
    console.log('🔗 Conectando ao RabbitMQ...');
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    
    console.log('🔍 Verificando mensagens na fila whatsapp.outgoing...');
    
    // Tentar pegar todas as mensagens da fila
    let messageCount = 0;
    let msg;
    
    while ((msg = await channel.get('whatsapp.outgoing'))) {
      messageCount++;
      console.log(`📥 Mensagem ${messageCount}:`, JSON.parse(msg.content.toString()));
      channel.nack(msg, false, false); // descarta a mensagem
    }
    
    if (messageCount === 0) {
      console.log('✅ Nenhuma mensagem na fila');
    } else {
      console.log(`✅ ${messageCount} mensagens removidas da fila`);
    }
    
    await connection.close();
    console.log('🔌 Conexão fechada');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

clearQueue();

