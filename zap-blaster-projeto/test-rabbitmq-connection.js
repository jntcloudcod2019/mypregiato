#!/usr/bin/env node

/**
 * Script de teste para validar conexão com RabbitMQ
 * Testa conectividade, autenticação e operações básicas
 */

const amqp = require('amqplib');

// Configurações do RabbitMQ
const rabbitConfigs = {
    // Configuração 1: URL privada (Railway Internal)
    private: {
        name: 'PRIVADO (Railway Internal)',
        url: 'amqp://maqItSI6EBLd3Nmy:faLY4tAuA93tNFysRsigQ6VtBkmf2WoF@rabbitmq.railway.internal:5672',
        hostname: 'rabbitmq.railway.internal',
        port: 5672,
        username: 'maqItSI6EBLd3Nmy',
        password: 'faLY4tAuA93tNFysRsigQ6VtBkmf2WoF',
        vhost: '/'
    },
    
    // Configuração 2: URL pública (Railway Proxy)
    public: {
        name: 'PÚBLICO (Railway Proxy)',
        url: 'amqp://maqItSI6EBLd3Nmy:faLY4tAuA93tNFysRsigQ6VtBkmf2WoF@trolley.proxy.rlwy.net:57530',
        hostname: 'trolley.proxy.rlwy.net',
        port: 57530,
        username: 'maqItSI6EBLd3Nmy',
        password: 'faLY4tAuA93tNFysRsigQ6VtBkmf2WoF',
        vhost: '/'
    },
    
    // Configuração 3: URL simples (sem vhost)
    simple: {
        name: 'SIMPLES (Sem vhost)',
        url: 'amqp://maqItSI6EBLd3Nmy:faLY4tAuA93tNFysRsigQ6VtBkmf2WoF@trolley.proxy.rlwy.net:57530/',
        hostname: 'trolley.proxy.rlwy.net',
        port: 57530,
        username: 'maqItSI6EBLd3Nmy',
        password: 'faLY4tAuA93tNFysRsigQ6VtBkmf2WoF',
        vhost: '/'
    }
};

console.log('🐰 Configurações RabbitMQ:');
console.log('📡 URL Privada:', rabbitConfigs.private.url);
console.log('📡 URL Pública:', rabbitConfigs.public.url);
console.log('📡 URL Simples:', rabbitConfigs.simple.url);
console.log('🔑 Username:', rabbitConfigs.private.username);
console.log('🔐 Password:', rabbitConfigs.private.password.substring(0, 10) + '...');
console.log('');

async function testRabbitMQConnection(config) {
    console.log(`\n🔄 Testando conexão ${config.name}...`);
    
    let connection = null;
    let channel = null;
    
    try {
        // Teste 1: Conectar usando URL completa
        console.log(`🔌 Conectando via URL: ${config.url}`);
        connection = await amqp.connect(config.url, {
            heartbeat: 30,
            connection_timeout: 10000,
            socket_timeout: 10000
        });
        
        console.log(`✅ Conexão estabelecida com ${config.name}`);
        
        // Teste 2: Criar canal
        console.log(`📺 Criando canal...`);
        channel = await connection.createChannel();
        console.log(`✅ Canal criado com sucesso`);
        
        // Teste 3: Declarar filas (as mesmas usadas pelo sistema)
        console.log(`📋 Declarando filas do sistema...`);
        const queues = [
            'whatsapp.outgoing',
            'whatsapp.incoming', 
            'out.qrcode',
            'session.status',
            'chat.assign',
            'notification.agent',
            'report.update'
        ];
        
        for (const queueName of queues) {
            await channel.assertQueue(queueName, { 
                durable: true, 
                exclusive: false, 
                autoDelete: false 
            });
            console.log(`  ✅ Fila '${queueName}' declarada`);
        }
        
        // Teste 4: Publicar mensagem de teste
        console.log(`📤 Publicando mensagem de teste...`);
        const testMessage = {
            command: 'test_connection',
            timestamp: new Date().toISOString(),
            testId: `test-${Date.now()}`
        };
        
        await channel.sendToQueue('whatsapp.outgoing', Buffer.from(JSON.stringify(testMessage)), {
            persistent: true,
            messageId: `test-${Date.now()}`
        });
        
        console.log(`✅ Mensagem de teste publicada na fila 'whatsapp.outgoing'`);
        
        // Teste 5: Consumir mensagem de teste
        console.log(`📥 Consumindo mensagem de teste...`);
        const consumeResult = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout ao consumir mensagem'));
            }, 5000);
            
            channel.consume('whatsapp.outgoing', (msg) => {
                if (msg) {
                    clearTimeout(timeout);
                    const content = JSON.parse(msg.content.toString());
                    console.log(`✅ Mensagem consumida: ${JSON.stringify(content)}`);
                    channel.ack(msg);
                    resolve(content);
                }
            }, { noAck: false });
        });
        
        // Teste 6: Verificar propriedades da conexão
        console.log(`ℹ️ Verificando propriedades da conexão...`);
        console.log(`  📡 Host: ${connection.connection.stream.remoteAddress}`);
        console.log(`  🔌 Port: ${connection.connection.stream.remotePort}`);
        console.log(`  🏷️ VHost: ${connection.connection.vhost}`);
        
        // Teste 7: Verificar estatísticas das filas
        console.log(`📊 Verificando estatísticas das filas...`);
        for (const queueName of queues) {
            try {
                const queueInfo = await channel.checkQueue(queueName);
                console.log(`  📋 ${queueName}: ${queueInfo.messageCount} mensagens, ${queueInfo.consumerCount} consumidores`);
            } catch (error) {
                console.log(`  ⚠️ ${queueName}: Erro ao verificar estatísticas`);
            }
        }
        
        console.log(`\n🎉 Teste ${config.name} CONCLUÍDO COM SUCESSO!`);
        return true;
        
    } catch (error) {
        console.log(`\n❌ Erro no teste ${config.name}:`);
        console.log(`   Tipo: ${error.constructor.name}`);
        console.log(`   Mensagem: ${error.message}`);
        
        if (error.code) {
            console.log(`   Código: ${error.code}`);
        }
        
        if (error.errno) {
            console.log(`   Errno: ${error.errno}`);
        }
        
        if (error.syscall) {
            console.log(`   Syscall: ${error.syscall}`);
        }
        
        if (error.hostname) {
            console.log(`   Hostname: ${error.hostname}`);
        }
        
        if (error.port) {
            console.log(`   Port: ${error.port}`);
        }
        
        if (error.stack) {
            console.log(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
        }
        
        return false;
        
    } finally {
        // Limpeza
        try {
            if (channel) {
                await channel.close();
                console.log(`🧹 Canal fechado`);
            }
            if (connection) {
                await connection.close();
                console.log(`🧹 Conexão fechada`);
            }
        } catch (cleanupError) {
            console.log(`⚠️ Erro durante limpeza: ${cleanupError.message}`);
        }
    }
}

async function testConnectionWithOptions(config) {
    console.log(`\n🔄 Testando conexão ${config.name} com opções específicas...`);
    
    let connection = null;
    
    try {
        // Teste com opções de conexão específicas
        const connectionOptions = {
            hostname: config.hostname,
            port: config.port,
            username: config.username,
            password: config.password,
            vhost: config.vhost,
            heartbeat: 30,
            connection_timeout: 10000,
            socket_timeout: 10000
        };
        
        console.log(`🔌 Conectando com opções:`, connectionOptions);
        connection = await amqp.connect(connectionOptions);
        
        console.log(`✅ Conexão estabelecida com opções específicas`);
        
        // Teste básico de canal
        const channel = await connection.createChannel();
        await channel.assertQueue('test-queue', { durable: false, autoDelete: true });
        console.log(`✅ Canal e fila de teste criados`);
        
        await channel.close();
        await connection.close();
        
        console.log(`🎉 Teste com opções ${config.name} CONCLUÍDO COM SUCESSO!`);
        return true;
        
    } catch (error) {
        console.log(`\n❌ Erro no teste com opções ${config.name}:`);
        console.log(`   Mensagem: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Iniciando testes de conectividade RabbitMQ...\n');
    
    const results = {};
    
    // Testar cada configuração
    for (const [key, config] of Object.entries(rabbitConfigs)) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🧪 TESTANDO CONFIGURAÇÃO: ${config.name}`);
        console.log(`${'='.repeat(60)}`);
        
        // Teste 1: URL completa
        results[`${key}_url`] = await testRabbitMQConnection(config);
        
        // Teste 2: Opções específicas
        results[`${key}_options`] = await testConnectionWithOptions(config);
    }
    
    // Resumo dos resultados
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('='.repeat(80));
    
    for (const [key, config] of Object.entries(rabbitConfigs)) {
        const urlResult = results[`${key}_url`];
        const optionsResult = results[`${key}_options`];
        
        console.log(`\n🔧 ${config.name}:`);
        console.log(`   📡 URL Completa: ${urlResult ? '✅ SUCESSO' : '❌ FALHA'}`);
        console.log(`   ⚙️ Opções Específicas: ${optionsResult ? '✅ SUCESSO' : '❌ FALHA'}`);
        console.log(`   🌐 Endpoint: ${config.hostname}:${config.port}`);
    }
    
    // Determinar qual configuração usar
    const successfulConfigs = Object.entries(results).filter(([_, success]) => success);
    
    if (successfulConfigs.length > 0) {
        console.log('\n🎉 CONFIGURAÇÕES FUNCIONAIS ENCONTRADAS!');
        console.log('✅ Use uma das configurações que passou nos testes.');
        
        // Recomendar a melhor configuração
        const bestConfig = Object.entries(rabbitConfigs).find(([key, _]) => 
            results[`${key}_url`] || results[`${key}_options`]
        );
        
        if (bestConfig) {
            console.log(`\n🏆 RECOMENDAÇÃO: Use a configuração "${bestConfig[1].name}"`);
            console.log(`   URL: ${bestConfig[1].url}`);
        }
        
        process.exit(0);
    } else {
        console.log('\n❌ TODAS AS CONFIGURAÇÕES FALHARAM!');
        console.log('🔍 Verifique:');
        console.log('   - Credenciais estão corretas');
        console.log('   - Servidor RabbitMQ está online');
        console.log('   - Firewall/redes permitem conexão');
        console.log('   - URLs estão acessíveis');
        
        process.exit(1);
    }
}

// Executar testes
runTests().catch((error) => {
    console.error('\n💥 Erro fatal durante os testes:', error);
    process.exit(1);
});
