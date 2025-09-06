// Teste de validação do payload que a API espera
const { connectDatabase, isNumberInLeads } = require('./database');

// Simular mensagem recebida do WhatsApp
const mockMessage = {
  id: { _serialized: 'msg_123456789' },
  from: '5511999999999@c.us',
  type: 'text',
  body: 'Olá, gostaria de mais informações',
  fromMe: false,
  hasMedia: false,
  isGroupMsg: false
};

// Simular mensagem com mídia
const mockMessageWithMedia = {
  id: { _serialized: 'msg_987654321' },
  from: '5511888888888@c.us',
  type: 'image',
  body: 'Imagem do produto',
  fromMe: false,
  hasMedia: true,
  isGroupMsg: false
};

// Função para normalizar número (copiada do zap.js)
function normalizeNumber(number) {
  if (!number) return '';
  return String(number).replace(/[^0-9]/g, '');
}

// Função para mapear tipo WhatsApp (copiada do zap.js)
function mapWppType(t) {
  const map = { 
    chat: 'text', 
    text: 'text', 
    image: 'image', 
    video: 'video', 
    audio: 'audio', 
    ptt: 'audio', 
    document: 'document', 
    sticker: 'image' 
  };
  return map[t] || 'text';
}

// Função para construir payload (copiada do zap.js)
function buildInboundPayload(message) {
  const fromBare = (message.from || '').split('@')[0];
  const fromNorm = normalizeNumber(fromBare);
  
  return {
    // === CAMPOS OBRIGATÓRIOS ===
    externalMessageId: message.id?._serialized || 'test_id',
    from: message.from || '',
    fromNormalized: fromNorm,
    to: '5511777777777', // Número do bot
    type: mapWppType(message.type),
    timestamp: new Date().toISOString(),
    instanceId: 'test-instance',
    fromMe: false,
    isGroup: Boolean(message.isGroupMsg || message.isGroup),
    chatId: `chat_${fromNorm}`,

    // === CAMPOS OPCIONAIS ===
    body: message.body || '',
    simulated: false,

    // === MÍDIA UNIFICADA ===
    attachment: null, // Será preenchido se hasMedia

    // === LOCALIZAÇÃO DA SESSÃO ===
    location: {
      latitude: -23.5505,  // São Paulo
      longitude: -46.6333,
      address: "São Paulo, Brasil"
    },

    // === CONTATO DO REMETENTE ===
    contact: {
      name: fromNorm,
      phone: fromNorm
    }
  };
}

// Função para simular processamento de mídia
async function processMedia(message, payload) {
  if (message.hasMedia) {
    // Simular mídia baixada
    const mockMedia = {
      mimetype: 'image/jpeg',
      data: 'base64_encoded_image_data_here',
      filename: 'test_image.jpg'
    };
    
    const messageType = mapWppType(message.type);
    
    payload.attachment = {
      dataUrl: `data:${mockMedia.mimetype};base64,${mockMedia.data}`,
      mediaUrl: null,
      mimeType: mockMedia.mimetype,
      fileName: mockMedia.filename,
      mediaType: messageType,
      fileSize: Buffer.byteLength(mockMedia.data, 'base64'),
      duration: null,
      width: null,
      height: null,
      thumbnail: null
    };
  }
  
  return payload;
}

// Função principal de teste
async function testPayloadValidation() {
  console.log('🧪 INICIANDO TESTE DE VALIDAÇÃO DE PAYLOAD\n');
  
  try {
    // Conectar ao banco
    console.log('1️⃣ Conectando ao banco...');
    await connectDatabase();
    console.log('✅ Banco conectado\n');
    
    // Teste 1: Mensagem de texto simples
    console.log('2️⃣ TESTE 1: Mensagem de texto simples');
    console.log('📱 Número:', mockMessage.from);
    
    const leadInfo = await isNumberInLeads(mockMessage.from.split('@')[0]);
    if (leadInfo) {
      console.log('✅ Número validado - Lead encontrado:', leadInfo.NameLead);
      
      const payload = buildInboundPayload(mockMessage);
      console.log('📦 Payload gerado:');
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log('❌ Número não validado - Lead não encontrado');
    }
    console.log('');
    
    // Teste 2: Mensagem com mídia
    console.log('3️⃣ TESTE 2: Mensagem com mídia');
    console.log('📱 Número:', mockMessageWithMedia.from);
    
    const leadInfo2 = await isNumberInLeads(mockMessageWithMedia.from.split('@')[0]);
    if (leadInfo2) {
      console.log('✅ Número validado - Lead encontrado:', leadInfo2.NameLead);
      
      const payload = buildInboundPayload(mockMessageWithMedia);
      const payloadWithMedia = await processMedia(mockMessageWithMedia, payload);
      
      console.log('📦 Payload com mídia gerado:');
      console.log(JSON.stringify(payloadWithMedia, null, 2));
    } else {
      console.log('❌ Número não validado - Lead não encontrado');
    }
    console.log('');
    
    // Teste 3: Verificar estrutura do payload
    console.log('4️⃣ TESTE 3: Validação da estrutura do payload');
    const testPayload = buildInboundPayload(mockMessage);
    
    const requiredFields = [
      'externalMessageId', 'from', 'fromNormalized', 'to', 'type', 
      'timestamp', 'instanceId', 'fromMe', 'isGroup', 'chatId'
    ];
    
    const missingFields = requiredFields.filter(field => !testPayload.hasOwnProperty(field));
    
    if (missingFields.length === 0) {
      console.log('✅ Todos os campos obrigatórios estão presentes');
    } else {
      console.log('❌ Campos obrigatórios faltando:', missingFields);
    }
    
    console.log('📊 Total de campos no payload:', Object.keys(testPayload).length);
    console.log('');
    
    console.log('🎯 TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
if (require.main === module) {
  testPayloadValidation();
}

module.exports = { testPayloadValidation };
