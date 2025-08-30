/**
 * HotReloadManager.js
 * 
 * Sistema de hot reload para o Zap Bot sem perder conexão WhatsApp
 * Permite atualizações de código em tempo real durante testes de massa
 */

const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');

class HotReloadManager {
    constructor(options = {}) {
        this.watchPaths = options.watchPaths || ['./'];
        this.excludePaths = options.excludePaths || [
            'node_modules/**',
            'session/**',
            'whatsapp_data/**',
            '.git/**',
            'logs/**',
            '*.log'
        ];
        this.debounceDelay = options.debounceDelay || 2000; // 2 segundos
        this.isReloading = false;
        this.reloadTimer = null;
        this.moduleCache = new Map();
        this.watchers = [];
        this.reloadCallbacks = new Map();
        this.isEnabled = process.env.NODE_ENV !== 'production';
        
        console.log(`🔥 HotReloadManager ${this.isEnabled ? 'ATIVADO' : 'DESATIVADO'}`);
    }

    /**
     * Inicia o sistema de hot reload
     */
    async start() {
        if (!this.isEnabled) {
            console.log('⚠️ Hot reload desabilitado em produção');
            return;
        }

        try {
            console.log('🔥 Iniciando sistema de hot reload...');
            
            // Configurar watchers para diferentes tipos de arquivo
            await this.setupFileWatchers();
            
            // Cachear módulos importantes
            await this.cacheImportantModules();
            
            console.log('✅ Hot reload ativo! Monitorando mudanças...');
            
        } catch (error) {
            console.error('❌ Erro ao iniciar hot reload:', error);
        }
    }

    /**
     * Configura watchers para diferentes tipos de arquivo
     */
    async setupFileWatchers() {
        // Watcher principal para arquivos .js
        const jsWatcher = chokidar.watch('*.js', {
            ignored: this.excludePaths,
            persistent: true,
            ignoreInitial: true
        });

        jsWatcher.on('change', (filePath) => {
            this.scheduleReload('javascript', filePath);
        });

        // Watcher para arquivos de configuração
        const configWatcher = chokidar.watch(['package.json', '.env*'], {
            persistent: true,
            ignoreInitial: true
        });

        configWatcher.on('change', (filePath) => {
            this.scheduleReload('config', filePath);
        });

        // Watcher para novos módulos
        const moduleWatcher = chokidar.watch(['./modules/**/*.js', './services/**/*.js'], {
            persistent: true,
            ignoreInitial: true
        });

        moduleWatcher.on('add', (filePath) => {
            this.scheduleReload('new_module', filePath);
        });

        moduleWatcher.on('change', (filePath) => {
            this.scheduleReload('module', filePath);
        });

        this.watchers.push(jsWatcher, configWatcher, moduleWatcher);
    }

    /**
     * Agenda um reload com debounce
     */
    scheduleReload(type, filePath) {
        if (this.isReloading) {
            return;
        }

        console.log(`📝 Mudança detectada: ${type} - ${filePath}`);

        // Cancelar timer anterior
        if (this.reloadTimer) {
            clearTimeout(this.reloadTimer);
        }

        // Agendar novo reload
        this.reloadTimer = setTimeout(async () => {
            await this.performHotReload(type, filePath);
        }, this.debounceDelay);
    }

    /**
     * Executa o hot reload baseado no tipo de mudança
     */
    async performHotReload(type, filePath) {
        if (this.isReloading) {
            return;
        }

        try {
            this.isReloading = true;
            console.log(`🔥 Iniciando hot reload: ${type} - ${filePath}`);

            switch (type) {
                case 'javascript':
                    await this.reloadJavaScriptModule(filePath);
                    break;
                    
                case 'config':
                    await this.reloadConfiguration(filePath);
                    break;
                    
                case 'module':
                case 'new_module':
                    await this.reloadModule(filePath);
                    break;
                    
                default:
                    console.log(`⚠️ Tipo de reload não suportado: ${type}`);
            }

            console.log(`✅ Hot reload concluído: ${filePath}`);

        } catch (error) {
            console.error(`❌ Erro durante hot reload de ${filePath}:`, error);
        } finally {
            this.isReloading = false;
        }
    }

    /**
     * Recarrega um módulo JavaScript
     */
    async reloadJavaScriptModule(filePath) {
        try {
            const fullPath = path.resolve(filePath);
            
            // Limpar cache do módulo
            if (require.cache[fullPath]) {
                delete require.cache[fullPath];
                console.log(`🗑️ Cache limpo: ${filePath}`);
            }

            // Se for um módulo que conhecemos, tentar recarregar
            if (this.moduleCache.has(filePath)) {
                const moduleInfo = this.moduleCache.get(filePath);
                
                try {
                    const newModule = require(fullPath);
                    this.moduleCache.set(filePath, { 
                        module: newModule, 
                        lastReload: Date.now() 
                    });
                    
                    // Executar callbacks de reload se existirem
                    if (this.reloadCallbacks.has(filePath)) {
                        const callback = this.reloadCallbacks.get(filePath);
                        await callback(newModule, moduleInfo.module);
                    }
                    
                    console.log(`🔄 Módulo recarregado: ${filePath}`);
                    
                } catch (error) {
                    console.error(`❌ Erro ao recarregar módulo ${filePath}:`, error);
                }
            }

        } catch (error) {
            console.error(`❌ Erro durante reload de JavaScript: ${error}`);
        }
    }

    /**
     * Recarrega configuração
     */
    async reloadConfiguration(filePath) {
        try {
            if (filePath.includes('package.json')) {
                console.log('📦 package.json alterado - recarregamento automático não suportado');
                console.log('💡 Considere reiniciar o processo para mudanças em dependências');
            }
            
            if (filePath.includes('.env')) {
                console.log('🔧 Arquivo .env alterado - recarregando variáveis...');
                
                // Recarregar variáveis de ambiente
                require('dotenv').config({ override: true });
                
                console.log('✅ Variáveis de ambiente recarregadas');
            }

        } catch (error) {
            console.error(`❌ Erro ao recarregar configuração: ${error}`);
        }
    }

    /**
     * Recarrega um módulo específico
     */
    async reloadModule(filePath) {
        try {
            // Implementação específica para módulos customizados
            await this.reloadJavaScriptModule(filePath);
            
        } catch (error) {
            console.error(`❌ Erro ao recarregar módulo: ${error}`);
        }
    }

    /**
     * Cacheia módulos importantes para reload
     */
    async cacheImportantModules() {
        const importantModules = [
            './WhatsAppDataExtractor.js',
            './emoji-resilience-processor.js'
        ];

        for (const modulePath of importantModules) {
            try {
                const fullPath = path.resolve(modulePath);
                
                if (await this.fileExists(fullPath)) {
                    const module = require(fullPath);
                    this.moduleCache.set(modulePath, { 
                        module, 
                        lastReload: Date.now() 
                    });
                    console.log(`📋 Módulo cacheado: ${modulePath}`);
                }
                
            } catch (error) {
                console.log(`⚠️ Não foi possível cachear ${modulePath}:`, error.message);
            }
        }
    }

    /**
     * Registra callback para reload de módulo específico
     */
    onModuleReload(modulePath, callback) {
        this.reloadCallbacks.set(modulePath, callback);
        console.log(`🔗 Callback registrado para: ${modulePath}`);
    }

    /**
     * Remove callback de reload
     */
    removeModuleReload(modulePath) {
        this.reloadCallbacks.delete(modulePath);
        console.log(`🗑️ Callback removido para: ${modulePath}`);
    }

    /**
     * Força reload de um módulo específico
     */
    async forceReload(modulePath) {
        console.log(`🔨 Forçando reload: ${modulePath}`);
        await this.performHotReload('javascript', modulePath);
    }

    /**
     * Obtém estatísticas do hot reload
     */
    getStats() {
        return {
            isEnabled: this.isEnabled,
            isReloading: this.isReloading,
            cachedModules: this.moduleCache.size,
            activeWatchers: this.watchers.length,
            registeredCallbacks: this.reloadCallbacks.size,
            lastReload: this.lastReloadTime
        };
    }

    /**
     * Para o sistema de hot reload
     */
    async stop() {
        try {
            console.log('🛑 Parando hot reload...');
            
            // Parar todos os watchers
            for (const watcher of this.watchers) {
                await watcher.close();
            }
            
            // Limpar timers
            if (this.reloadTimer) {
                clearTimeout(this.reloadTimer);
            }
            
            // Limpar caches
            this.moduleCache.clear();
            this.reloadCallbacks.clear();
            
            console.log('✅ Hot reload parado');
            
        } catch (error) {
            console.error('❌ Erro ao parar hot reload:', error);
        }
    }

    // ==================== MÉTODOS AUXILIARES ====================

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Cria interface de comando para hot reload
     */
    createCommandInterface() {
        return {
            // Comando para forçar reload
            reload: async (modulePath) => {
                if (modulePath) {
                    await this.forceReload(modulePath);
                } else {
                    console.log('📋 Módulos disponíveis para reload:');
                    for (const [path, info] of this.moduleCache.entries()) {
                        const lastReload = new Date(info.lastReload).toLocaleString('pt-BR');
                        console.log(`  • ${path} (último reload: ${lastReload})`);
                    }
                }
            },
            
            // Comando para ver estatísticas
            stats: () => {
                const stats = this.getStats();
                console.log('📊 Estatísticas do Hot Reload:');
                console.log(`  • Status: ${stats.isEnabled ? '✅ Ativo' : '❌ Inativo'}`);
                console.log(`  • Reloading: ${stats.isReloading ? 'Sim' : 'Não'}`);
                console.log(`  • Módulos cacheados: ${stats.cachedModules}`);
                console.log(`  • Watchers ativos: ${stats.activeWatchers}`);
                console.log(`  • Callbacks registrados: ${stats.registeredCallbacks}`);
            },
            
            // Comando para parar hot reload
            stop: async () => {
                await this.stop();
            }
        };
    }
}

module.exports = HotReloadManager;
