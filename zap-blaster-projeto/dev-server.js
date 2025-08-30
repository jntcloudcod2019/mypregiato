/**
 * dev-server.js
 * 
 * Servidor de desenvolvimento com hot reload para testes de massa
 * Permite atualizações sem perder conexão WhatsApp
 */

const { spawn } = require('child_process');
const path = require('path');

class DevServer {
    constructor() {
        this.zapProcess = null;
        this.isRestarting = false;
        this.restartCount = 0;
        this.startTime = Date.now();
    }

    /**
     * Inicia o servidor de desenvolvimento
     */
    start() {
        console.log('🚀 === SERVIDOR DE DESENVOLVIMENTO ZAP BOT ===');
        console.log('🔥 Hot Reload ATIVO - Mudanças serão aplicadas automaticamente');
        console.log('📱 Sessão WhatsApp será PRESERVADA durante atualizações');
        console.log('===============================================\n');

        // Configurar variáveis de ambiente para desenvolvimento
        process.env.NODE_ENV = 'development';
        process.env.DISABLE_HOT_RELOAD = 'false';

        this.startZapBot();
        this.setupKeyboardHandlers();
    }

    /**
     * Inicia o processo do zap bot
     */
    startZapBot() {
        console.log('🔄 Iniciando Zap Bot...');
        
        this.zapProcess = spawn('node', ['zap.js'], {
            stdio: 'inherit',
            cwd: __dirname,
            env: {
                ...process.env,
                FORCE_COLOR: '1', // Manter cores no console
                NODE_ENV: 'development'
            }
        });

        this.zapProcess.on('close', (code) => {
            if (code !== 0 && !this.isRestarting) {
                console.log(`\n⚠️ Zap Bot encerrou com código: ${code}`);
                console.log('🔄 Reiniciando em 3 segundos...');
                
                setTimeout(() => {
                    this.restartCount++;
                    console.log(`🔄 Tentativa de restart #${this.restartCount}`);
                    this.startZapBot();
                }, 3000);
            }
        });

        this.zapProcess.on('error', (error) => {
            console.error('❌ Erro no processo Zap Bot:', error);
        });

        const uptime = Math.round((Date.now() - this.startTime) / 1000);
        console.log(`✅ Zap Bot iniciado (uptime: ${uptime}s, restarts: ${this.restartCount})`);
    }

    /**
     * Configura handlers para comandos de teclado
     */
    setupKeyboardHandlers() {
        console.log('\n💡 COMANDOS DISPONÍVEIS:');
        console.log('   r + Enter  - Reiniciar zap bot');
        console.log('   s + Enter  - Ver estatísticas');
        console.log('   q + Enter  - Sair');
        console.log('   h + Enter  - Ajuda\n');

        process.stdin.setRawMode(false);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');

        process.stdin.on('data', (key) => {
            const command = key.toString().trim().toLowerCase();
            
            switch (command) {
                case 'r':
                    this.restart();
                    break;
                    
                case 's':
                    this.showStats();
                    break;
                    
                case 'q':
                    this.shutdown();
                    break;
                    
                case 'h':
                    this.showHelp();
                    break;
                    
                default:
                    if (command.length > 0) {
                        console.log(`❓ Comando desconhecido: ${command}. Digite 'h' para ajuda.`);
                    }
            }
        });
    }

    /**
     * Reinicia o zap bot
     */
    restart() {
        if (this.isRestarting) {
            console.log('⚠️ Reinicialização já em andamento...');
            return;
        }

        console.log('🔄 Reiniciando Zap Bot...');
        this.isRestarting = true;
        
        if (this.zapProcess) {
            this.zapProcess.kill('SIGTERM');
            
            setTimeout(() => {
                this.restartCount++;
                this.startZapBot();
                this.isRestarting = false;
            }, 2000);
        }
    }

    /**
     * Mostra estatísticas do servidor
     */
    showStats() {
        const uptime = Math.round((Date.now() - this.startTime) / 1000);
        const uptimeMinutes = Math.round(uptime / 60);
        
        console.log('\n📊 === ESTATÍSTICAS DO SERVIDOR ===');
        console.log(`⏱️ Uptime: ${uptimeMinutes} minutos (${uptime}s)`);
        console.log(`🔄 Restarts: ${this.restartCount}`);
        console.log(`📱 Status: ${this.zapProcess ? '✅ Ativo' : '❌ Inativo'}`);
        console.log(`🔥 Hot Reload: ✅ Ativo`);
        console.log(`🌍 Ambiente: development`);
        console.log('===================================\n');
    }

    /**
     * Mostra ajuda
     */
    showHelp() {
        console.log('\n🆘 === AJUDA DO SERVIDOR DE DESENVOLVIMENTO ===');
        console.log('');
        console.log('🔥 HOT RELOAD:');
        console.log('   • Mudanças em arquivos .js são aplicadas automaticamente');
        console.log('   • Sessão WhatsApp é preservada durante atualizações');
        console.log('   • Delay de 3s entre mudanças para evitar reloads excessivos');
        console.log('');
        console.log('📱 SESSÃO WHATSAPP:');
        console.log('   • Arquivos de sessão são preservados em ./session/');
        console.log('   • Reconexão automática em caso de queda');
        console.log('   • Backup automático de sessão corrompida');
        console.log('');
        console.log('🔧 COMANDOS:');
        console.log('   r - Reiniciar zap bot (preserva sessão)');
        console.log('   s - Ver estatísticas do servidor');
        console.log('   q - Sair do servidor');
        console.log('   h - Esta ajuda');
        console.log('');
        console.log('🐛 DEBUG:');
        console.log('   • Logs são exibidos em tempo real');
        console.log('   • Códigos de erro são mostrados em caso de falha');
        console.log('   • Restart automático em caso de crash');
        console.log('');
        console.log('================================================\n');
    }

    /**
     * Encerra o servidor
     */
    shutdown() {
        console.log('\n🛑 Encerrando servidor de desenvolvimento...');
        
        if (this.zapProcess) {
            this.zapProcess.kill('SIGTERM');
        }
        
        console.log('✅ Servidor encerrado');
        process.exit(0);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const devServer = new DevServer();
    devServer.start();
    
    // Handler para Ctrl+C
    process.on('SIGINT', () => {
        devServer.shutdown();
    });
}

module.exports = DevServer;
