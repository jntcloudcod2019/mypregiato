import axios from 'axios';

async function testMessage() {
  try {
    const data = {
      id: 'test_' + Date.now(),
      from: '5511999999999@c.us',
      to: '5511949908369@c.us',
      body: 'Teste de mensagem do sistema',
      type: 'text',
      timestamp: Date.now(),
      isFromMe: false
    };

    console.log('Enviando mensagem:', data);

    const response = await axios.post('http://localhost:5001/api/whatsapp/incoming-message', data);
    console.log('Resposta:', response.data);

  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

testMessage(); 