// Exemplo de como o zap-bot deve enviar o QR code para o backend
// Este arquivo é apenas um exemplo - o zap-bot real deve implementar isso

const axios = require('axios');
const qrcode = require('qrcode');

// Configuração do backend
const BACKEND_URL = 'http://localhost:5001/api';

// Função para enviar QR code para o backend
async function sendQRCodeToBackend(qrCodeData) {
  try {
    const response = await axios.post(`${BACKEND_URL}/whatsapp/webhook/qr-code`, {
      qrCode: qrCodeData,
      sessionId: 'zap-bot-session',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ QR code enviado para o backend:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao enviar QR code para o backend:', error.message);
    throw error;
  }
}

// Função para gerar QR code em base64
async function generateQRCodeBase64(data) {
  try {
    const qrCodeDataUrl = await qrcode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Extrair apenas os dados base64 (remover o prefixo data:image/png;base64,)
    const base64Data = qrCodeDataUrl.split(',')[1];
    return base64Data;
  } catch (error) {
    console.error('❌ Erro ao gerar QR code:', error.message);
    throw error;
  }
}

// Exemplo de uso no zap-bot
async function handleQRCodeGeneration(qrCodeString) {
  try {
    console.log('🔄 Gerando QR code...');
    
    // Gerar QR code em base64
    const qrCodeBase64 = await generateQRCodeBase64(qrCodeString);
    
    // Enviar para o backend
    await sendQRCodeToBackend(qrCodeBase64);
    
    console.log('✅ QR code processado e enviado para o frontend');
  } catch (error) {
    console.error('❌ Erro no processamento do QR code:', error.message);
  }
}

// Exemplo de integração com whatsapp-web.js
function setupWhatsAppWebJS(client) {
  client.on('qr', async (qr) => {
    console.log('📱 QR Code recebido do WhatsApp Web');
    await handleQRCodeGeneration(qr);
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp Web conectado!');
    // Limpar QR code quando conectado
    sendQRCodeToBackend(''); // Enviar string vazia para limpar
  });

  client.on('disconnected', () => {
    console.log('❌ WhatsApp Web desconectado');
  });
}

// Exemplo de como usar no zap.js principal
/*
const { Client, LocalAuth } = require('whatsapp-web.js');
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

setupWhatsAppWebJS(client);
client.initialize();
*/

module.exports = {
  sendQRCodeToBackend,
  generateQRCodeBase64,
  handleQRCodeGeneration,
  setupWhatsAppWebJS
}; 