const fs = require('fs');

// Ler o PayloadJson atual
const payloadJsonPath = './PlayloadJson.json';

if (!fs.existsSync(payloadJsonPath)) {
    console.log('❌ Arquivo PlayloadJson.json não encontrado');
    process.exit(1);
}

const rawData = fs.readFileSync(payloadJsonPath, 'utf8');
let data;

try {
    data = JSON.parse(rawData);
} catch (err) {
    console.log('❌ Erro ao fazer parse do JSON:', err.message);
    process.exit(1);
}

console.log('📋 Estrutura atual encontrada:');
console.log('- Contact:', !!data.Contact);
console.log('- Messages:', data.Messages?.length || 0);

if (!data.Messages || !Array.isArray(data.Messages)) {
    console.log('❌ Estrutura inválida - Messages não é um array');
    process.exit(1);
}

// Corrigir mensagens de áudio
let audioFixed = 0;
data.Messages.forEach((message, index) => {
    if (message.Type === 'audio' || message.Type === 'voice') {
        console.log(`\n🎵 Mensagem de áudio ${index + 1}:`);
        console.log('- ID:', message.Id);
        console.log('- Body atual:', message.body ? `${message.body.length} chars` : 'VAZIO');
        console.log('- MimeType atual:', message.mimeType || 'NULL');
        
        // Se o body está vazio, adicionar um exemplo base64 para teste
        if (!message.body || message.body === '') {
            message.body = "data:audio/mpeg;base64,SUQzBAAAAAAASFRMRU4AAAAHAAADMTgyMzMAVElUMgAAAAoAAANUZW1wbGF0ZQBUU1NFAAAADwAAA...[BASE64_TESTE]";
            console.log('✅ Body corrigido com base64 de teste');
            audioFixed++;
        }
        
        // Se o mimeType está null, definir como audio/mpeg
        if (!message.mimeType) {
            message.mimeType = "audio/mpeg";
            console.log('✅ MimeType corrigido para audio/mpeg');
        }
        
        // Garantir que fileName está preenchido
        if (!message.fileName) {
            message.fileName = `audio_${message.Id}.mp3`;
            console.log('✅ FileName corrigido');
        }
    }
});

if (audioFixed > 0) {
    // Fazer backup do arquivo original
    const backupPath = `${payloadJsonPath}.backup.${Date.now()}`;
    fs.writeFileSync(backupPath, rawData);
    console.log(`\n💾 Backup criado: ${backupPath}`);
    
    // Salvar versão corrigida
    const fixedJson = JSON.stringify(data, null, 2);
    fs.writeFileSync(payloadJsonPath, fixedJson);
    
    console.log(`\n✅ PayloadJson corrigido!`);
    console.log(`📊 ${audioFixed} mensagens de áudio foram corrigidas`);
    console.log(`📄 Arquivo salvo: ${payloadJsonPath}`);
} else {
    console.log('\n✅ Nenhuma correção necessária - todas as mensagens de áudio já estão corretas');
}
