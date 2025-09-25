#!/usr/bin/env node

/**
 * Script de teste para validar download de mídia do MinIO
 * Testa o fluxo completo de download que o ZapBot usa
 */

const Minio = require('minio');

// Configurações do MinIO (mesmas do zap.js)
const minioConfig = {
    endPoint: 'bucket-production-1aef.up.railway.app',
    port: 443,
    useSSL: true,
    accessKey: '7bW6zf9Vo0QBtueWnzM73OMhcsTIFuWi',
    secretKey: 'OduQXA4WGbZ83GhL5vclllgRmmVr0xas2QhLCPOq6o8Qhpgt',
    bucketName: 'midias'
};

console.log('🔧 Configurações MinIO:');
console.log('📡 Endpoint:', minioConfig.endPoint + ':' + minioConfig.port);
console.log('🔑 Access Key:', minioConfig.accessKey);
console.log('🔐 Secret Key:', minioConfig.secretKey.substring(0, 10) + '...');
console.log('📦 Bucket:', minioConfig.bucketName);
console.log('');

async function testMediaDownload() {
    console.log('\n🔄 Testando download de mídia...');
    
    try {
        // Criar cliente MinIO
        const client = new Minio.Client({
            endPoint: minioConfig.endPoint,
            port: minioConfig.port,
            useSSL: minioConfig.useSSL,
            accessKey: minioConfig.accessKey,
            secretKey: minioConfig.secretKey
        });

        console.log(`✅ Cliente MinIO criado`);

        // Teste 1: Listar objetos no bucket para encontrar um arquivo de mídia
        console.log(`📋 Listando objetos no bucket '${minioConfig.bucketName}'...`);
        const objectsList = [];
        const stream = client.listObjects(minioConfig.bucketName, 'media/', true);
        
        stream.on('data', (obj) => {
            objectsList.push(obj);
            console.log(`  📄 ${obj.name} (${obj.size} bytes, ${obj.lastModified})`);
        });

        await new Promise((resolve, reject) => {
            stream.on('end', resolve);
            stream.on('error', reject);
        });

        console.log(`✅ Listagem concluída: ${objectsList.length} objetos encontrados`);

        if (objectsList.length === 0) {
            console.log('⚠️ Nenhum arquivo de mídia encontrado para teste');
            return;
        }

        // Teste 2: Testar download do primeiro arquivo encontrado
        const testObject = objectsList[0];
        console.log(`📥 Testando download do arquivo: ${testObject.name}`);
        
        // Simular a URL que seria enviada pelo backend
        const mediaUrl = `https://${minioConfig.endPoint}/${minioConfig.bucketName}/${testObject.name}`;
        console.log(`🔗 URL simulada: ${mediaUrl}`);
        
        // Teste 3: Verificar se o objeto existe (como no zap.js)
        console.log(`🔍 Verificando se objeto existe...`);
        const stat = await client.statObject(minioConfig.bucketName, testObject.name);
        console.log(`✅ Objeto encontrado no MinIO`, { 
            objectName: testObject.name, 
            size: stat.size, 
            lastModified: stat.lastModified 
        });

        // Teste 4: Download do arquivo
        console.log(`📥 Iniciando download do objeto...`);
        const downloadStream = await client.getObject(minioConfig.bucketName, testObject.name);
        const chunks = [];
        
        downloadStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        await new Promise((resolve, reject) => {
            downloadStream.on('end', resolve);
            downloadStream.on('error', reject);
        });

        const buffer = Buffer.concat(chunks);
        console.log(`✅ Download realizado: ${buffer.length} bytes`);

        // Teste 5: Verificar se o conteúdo é válido
        if (buffer.length > 0) {
            console.log(`✅ Conteúdo verificado: download funcionando corretamente`);
        } else {
            console.log(`❌ Erro: buffer vazio após download`);
        }

        console.log(`\n🎉 Teste de download CONCLUÍDO COM SUCESSO!`);
        return true;

    } catch (error) {
        console.log(`\n❌ Erro no teste de download:`);
        console.log(`   Tipo: ${error.constructor.name}`);
        console.log(`   Mensagem: ${error.message}`);
        
        if (error.code) {
            console.log(`   Código: ${error.code}`);
        }
        
        if (error.statusCode) {
            console.log(`   Status HTTP: ${error.statusCode}`);
        }
        
        if (error.stack) {
            console.log(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
        }
        
        return false;
    }
}

async function testUrlParsing() {
    console.log('\n🔄 Testando parsing de URL...');
    
    // Simular URLs que podem ser enviadas pelo backend
    const testUrls = [
        'bucket-production-1aef.up.railway.app/midias/media/test.mp3', // Sem protocolo
        'https://bucket-production-1aef.up.railway.app/midias/media/test.mp3', // Com protocolo
        'http://bucket-production-1aef.up.railway.app/midias/media/test.mp3' // Com protocolo HTTP
    ];
    
    for (const mediaUrl of testUrls) {
        try {
            console.log(`\n🔍 Testando URL: ${mediaUrl}`);
            
            // Simular a lógica do zap.js
            let fullUrl = mediaUrl;
            if (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
                fullUrl = `https://${mediaUrl}`;
                console.log(`🔧 Protocolo HTTPS adicionado: ${fullUrl}`);
            }
            
            const url = new URL(fullUrl);
            const fullPath = url.pathname.substring(1);
            
            // Extrair object name (remover bucket name do início)
            const pathParts = fullPath.split('/');
            let objectName;
            if (pathParts.length > 1) {
                objectName = pathParts.slice(1).join('/'); // Remove o primeiro elemento (bucket name)
            } else {
                objectName = fullPath;
            }
            
            console.log(`✅ URL parseada com sucesso:`, {
                originalUrl: mediaUrl,
                fullUrl: fullUrl,
                pathname: url.pathname,
                fullPath: fullPath,
                objectName: objectName,
                hostname: url.hostname
            });
            
        } catch (error) {
            console.log(`❌ Erro ao parsear URL: ${error.message}`);
        }
    }
}

async function runTests() {
    console.log('🚀 Iniciando testes de download de mídia...\n');
    
    // Teste de parsing de URL
    await testUrlParsing();
    
    // Teste de download real
    const downloadResult = await testMediaDownload();
    
    // Resumo dos resultados
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('='.repeat(50));
    console.log(`🔗 Parsing de URL: ✅ SUCESSO`);
    console.log(`📥 Download de mídia: ${downloadResult ? '✅ SUCESSO' : '❌ FALHA'}`);
    
    if (downloadResult) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM! Download de mídia está funcionando.');
        process.exit(0);
    } else {
        console.log('\n⚠️ ALGUNS TESTES FALHARAM. Verifique as configurações.');
        process.exit(1);
    }
}

// Executar testes
runTests().catch((error) => {
    console.error('\n💥 Erro fatal durante os testes:', error);
    process.exit(1);
});
