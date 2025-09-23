const Minio = require('minio');

// Configurações do MinIO
const minioConfig = {
  endPoint: 'bucket-production-1aef.up.railway.app',
  port: 443,
  useSSL: true,
  accessKey: '7bW6zf9Vo0QBtueWnzM73OMhcsTIFuWi',
  secretKey: 'OduQXA4WGbZ83GhL5vclllgRmmVr0xas2QhLCPOq6o8Qhpgt'
};

async function testObjectExists() {
  try {
    console.log('🔍 Testando se objeto existe no MinIO...');
    
    // URL de exemplo da mensagem de áudio
    const mediaUrl = 'https://bucket-production-1aef.up.railway.app/midias/media/624e0593-9df8-44af-984d-3e02a9b5a041.bin';
    
    // Inicializar cliente MinIO
    const minioClient = new Minio.Client(minioConfig);
    
    // Extrair object name da URL (mesmo processo do ZapBot)
    const url = new URL(mediaUrl);
    const fullPath = url.pathname.substring(1); // Remove a barra inicial
    const objectName = fullPath.replace(/^midias\//, ''); // Remove o nome do bucket
    
    console.log('📋 Detalhes da URL:');
    console.log('  - URL completa:', mediaUrl);
    console.log('  - Path completo:', fullPath);
    console.log('  - Object name:', objectName);
    console.log('  - Bucket:', 'midias');
    
    // Verificar se o objeto existe
    try {
      const stat = await minioClient.statObject('midias', objectName);
      console.log('✅ Objeto encontrado no MinIO!');
      console.log('  - Tamanho:', stat.size, 'bytes');
      console.log('  - Última modificação:', stat.lastModified);
      console.log('  - Content-Type:', stat.metaData['content-type']);
      
      // Tentar baixar o objeto
      console.log('\n📥 Tentando baixar o objeto...');
      const stream = await minioClient.getObject('midias', objectName);
      
      let data = Buffer.alloc(0);
      stream.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });
      
      stream.on('end', () => {
        console.log('✅ Download concluído!');
        console.log('  - Tamanho baixado:', data.length, 'bytes');
        console.log('  - Primeiros 50 bytes (hex):', data.slice(0, 50).toString('hex'));
      });
      
      stream.on('error', (err) => {
        console.error('❌ Erro no download:', err.message);
      });
      
    } catch (statError) {
      console.error('❌ Objeto NÃO encontrado no MinIO:', statError.message);
      
      // Listar objetos no bucket para debug
      console.log('\n🔍 Listando objetos no bucket "midias"...');
      const objectsList = [];
      const stream = minioClient.listObjects('midias', 'media/', true);
      
      stream.on('data', (obj) => {
        objectsList.push(obj.name);
      });
      
      stream.on('end', () => {
        console.log('📋 Objetos encontrados no bucket:');
        objectsList.forEach(obj => console.log('  -', obj));
        console.log('  Total:', objectsList.length, 'objetos');
      });
      
      stream.on('error', (err) => {
        console.error('❌ Erro ao listar objetos:', err.message);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar teste
testObjectExists();
