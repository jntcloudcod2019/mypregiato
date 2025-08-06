import axios from 'axios';

async function testIncomingMessage() {
  try {
    const messageData = {
      id: `test_${Date.now()}`,
      from: '5511999999999@c.us',
      to: '5511949908369@c.us',
      body: 'Olá! Esta é uma mensagem de teste do sistema de atendimento.',
      type: 'text',
      timestamp: Date.now(),
      isFromMe: false
    };

    console.log('📤 Enviando mensagem de teste...');
    console.log('📝 Dados:', messageData);

    const response = await axios.post('http://localhost:5001/api/whatsapp/webhook/message', messageData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta do backend:', response.data);
    
    // Aguardar um pouco e verificar se a mensagem foi processada
    setTimeout(async () => {
      try {
        const queueResponse = await axios.get('http://localhost:5001/api/whatsapp/queue/messages');
        console.log('📋 Mensagens na fila:', queueResponse.data);
      } catch (error) {
        console.log('❌ Erro ao verificar fila:', error.message);
      }
    }, 2000);

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem de teste:', error.message);
  }
}

testIncomingMessage(); 