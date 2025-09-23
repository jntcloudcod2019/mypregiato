#!/usr/bin/env node

/**
 * Script de teste para validar conexão com MinIO
 * Testa conectividade, autenticação e operações básicas
 */

const Minio = require('minio');

// Configurações do MinIO
const minioConfig = {
    endPoint: 'bucket.railway.internal', // MINIO_PRIVATE_HOST
    port: 9000, // MINIO_PRIVATE_PORT
    useSSL: false, // Railway MinIO usa HTTP internamente
    accessKey: '7bW6zf9Vo0QBtueWnzM73OMhcsTIFuWi', // MINIO_ROOT_USER
    secretKey: 'OduQXA4WGbZ83GhL5vclllgRmmVr0xas2QhLCPOq6o8Qhpgt', // MINIO_ROOT_PASSWORD
    bucketName: 'midias'
};

// Configurações alternativas (públicas)
const minioConfigPublic = {
    endPoint: 'bucket-production-1aef.up.railway.app', // MINIO_PUBLIC_HOST
    port: 443, // MINIO_PUBLIC_PORT
    useSSL: true, // HTTPS para endpoint público
    accessKey: '7bW6zf9Vo0QBtueWnzM73OMhcsTIFuWi',
    secretKey: 'OduQXA4WGbZ83GhL5vclllgRmmVr0xas2QhLCPOq6o8Qhpgt',
    bucketName: 'midias'
};

console.log('🔧 Configurações MinIO:');
console.log('📡 Endpoint Privado:', minioConfig.endPoint + ':' + minioConfig.port);
console.log('📡 Endpoint Público:', minioConfigPublic.endPoint + ':' + minioConfigPublic.port);
console.log('🔑 Access Key:', minioConfig.accessKey);
console.log('🔐 Secret Key:', minioConfig.secretKey.substring(0, 10) + '...');
console.log('📦 Bucket:', minioConfig.bucketName);
console.log('');

async function testMinioConnection(config, configName) {
    console.log(`\n🔄 Testando conexão ${configName}...`);
    
    try {
        // Criar cliente MinIO
        const client = new Minio.Client({
            endPoint: config.endPoint,
            port: config.port,
            useSSL: config.useSSL,
            accessKey: config.accessKey,
            secretKey: config.secretKey
        });

        console.log(`✅ Cliente MinIO criado para ${configName}`);

        // Teste 1: Verificar se o bucket existe
        console.log(`📦 Verificando se o bucket '${config.bucketName}' existe...`);
        const bucketExists = await client.bucketExists(config.bucketName);
        
        if (bucketExists) {
            console.log(`✅ Bucket '${config.bucketName}' encontrado`);
        } else {
            console.log(`⚠️ Bucket '${config.bucketName}' não existe, tentando criar...`);
            await client.makeBucket(config.bucketName);
            console.log(`✅ Bucket '${config.bucketName}' criado com sucesso`);
        }

        // Teste 2: Listar objetos no bucket
        console.log(`📋 Listando objetos no bucket '${config.bucketName}'...`);
        const objectsList = [];
        const stream = client.listObjects(config.bucketName, '', true);
        
        stream.on('data', (obj) => {
            objectsList.push(obj);
            console.log(`  📄 ${obj.name} (${obj.size} bytes, ${obj.lastModified})`);
        });

        await new Promise((resolve, reject) => {
            stream.on('end', resolve);
            stream.on('error', reject);
        });

        console.log(`✅ Listagem concluída: ${objectsList.length} objetos encontrados`);

        // Teste 3: Upload de arquivo de teste
        console.log(`📤 Testando upload de arquivo...`);
        const testFileName = `test-connection-${Date.now()}.txt`;
        const testContent = `Teste de conexão MinIO - ${new Date().toISOString()}`;
        const testBuffer = Buffer.from(testContent, 'utf8');

        await client.putObject(
            config.bucketName,
            testFileName,
            testBuffer,
            testBuffer.length,
            {
                'Content-Type': 'text/plain',
                'X-Test-Upload': 'true'
            }
        );

        console.log(`✅ Upload realizado: ${testFileName}`);

        // Teste 4: Download do arquivo de teste
        console.log(`📥 Testando download do arquivo...`);
        const downloadStream = await client.getObject(config.bucketName, testFileName);
        const chunks = [];
        
        downloadStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        await new Promise((resolve, reject) => {
            downloadStream.on('end', resolve);
            downloadStream.on('error', reject);
        });

        const downloadedContent = Buffer.concat(chunks).toString('utf8');
        console.log(`✅ Download realizado: ${downloadedContent.substring(0, 50)}...`);

        // Teste 5: Verificar se o conteúdo é igual
        if (downloadedContent === testContent) {
            console.log(`✅ Conteúdo verificado: upload/download funcionando corretamente`);
        } else {
            console.log(`❌ Erro: conteúdo diferente após download`);
        }

        // Teste 6: Remover arquivo de teste
        console.log(`🗑️ Removendo arquivo de teste...`);
        await client.removeObject(config.bucketName, testFileName);
        console.log(`✅ Arquivo de teste removido`);

        // Teste 7: Obter informações do bucket
        console.log(`ℹ️ Obtendo informações do bucket...`);
        try {
            const bucketInfo = await client.getBucketVersioning(config.bucketName);
            console.log(`✅ Informações do bucket obtidas`);
        } catch (error) {
            console.log(`⚠️ Não foi possível obter informações de versionamento (normal para alguns buckets)`);
        }

        console.log(`\n🎉 Teste ${configName} CONCLUÍDO COM SUCESSO!`);
        return true;

    } catch (error) {
        console.log(`\n❌ Erro no teste ${configName}:`);
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

async function runTests() {
    console.log('🚀 Iniciando testes de conectividade MinIO...\n');
    
    // Teste com endpoint privado (interno)
    const privateResult = await testMinioConnection(minioConfig, 'PRIVADO (Railway Internal)');
    
    // Teste com endpoint público (externo)
    const publicResult = await testMinioConnection(minioConfigPublic, 'PÚBLICO (Railway External)');
    
    // Resumo dos resultados
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('='.repeat(50));
    console.log(`🔒 Endpoint Privado: ${privateResult ? '✅ SUCESSO' : '❌ FALHA'}`);
    console.log(`🌐 Endpoint Público: ${publicResult ? '✅ SUCESSO' : '❌ FALHA'}`);
    
    if (privateResult && publicResult) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM! MinIO está funcionando perfeitamente.');
        process.exit(0);
    } else if (privateResult || publicResult) {
        console.log('\n⚠️ ALGUNS TESTES FALHARAM. Verifique as configurações de rede.');
        process.exit(1);
    } else {
        console.log('\n❌ TODOS OS TESTES FALHARAM. Verifique as credenciais e conectividade.');
        process.exit(1);
    }
}

// Executar testes
runTests().catch((error) => {
    console.error('\n💥 Erro fatal durante os testes:', error);
    process.exit(1);
});
