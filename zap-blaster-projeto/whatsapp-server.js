// whatsapp-server.js - Servidor WhatsApp Local com Cache Otimizado
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

class WhatsAppServer {
    constructor() {
        this.app = express();
        this.instances = new Map();
        this.cacheDir = path.join(process.cwd(), '.wwebjs_cache');
        this.sessionDir = path.join(process.cwd(), 'session');
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Servir cache do WhatsApp
        this.app.use('/cache', express.static(this.cacheDir));
        this.app.use('/sessions', express.static(this.sessionDir));
    }

    setupRoutes() {
        // Dashboard principal
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboard());
        });

        // Criar nova instância
        this.app.post('/api/instances', async (req, res) => {
            try {
                const { instanceId, clientId } = req.body;
                const instance = await this.createInstance(instanceId, clientId);
                
                res.json({
                    success: true,
                    instanceId,
                    status: 'created',
                    cacheFiles: this.getCacheFiles(instanceId)
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Listar instâncias
        this.app.get('/api/instances', (req, res) => {
            const instances = Array.from(this.instances.keys()).map(id => ({
                instanceId: id,
                status: this.instances.get(id).info?.wid ? 'connected' : 'disconnected',
                cacheSize: this.getCacheSize(id),
                sessionSize: this.getSessionSize(id)
            }));

            res.json({ instances });
        });

        // Interface WhatsApp personalizada
        this.app.get('/whatsapp/:instanceId', (req, res) => {
            const { instanceId } = req.params;
            const interface = this.generateWhatsAppInterface(instanceId);
            res.send(interface);
        });

        // API para mensagens
        this.app.post('/api/:instanceId/send', async (req, res) => {
            try {
                const { instanceId } = req.params;
                const { to, message } = req.body;
                
                const client = this.instances.get(instanceId);
                if (!client) {
                    return res.status(404).json({ error: 'Instância não encontrada' });
                }

                await client.sendMessage(to, message);
                res.json({ success: true, sent: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Status da instância
        this.app.get('/api/:instanceId/status', (req, res) => {
            const { instanceId } = req.params;
            const client = this.instances.get(instanceId);
            
            if (!client) {
                return res.status(404).json({ error: 'Instância não encontrada' });
            }

            res.json({
                instanceId,
                connected: client.info?.wid ? true : false,
                phoneNumber: client.info?.wid?.user || null,
                cacheFiles: this.getCacheFiles(instanceId),
                sessionPath: path.join(this.sessionDir, instanceId)
            });
        });
    }

    async createInstance(instanceId, clientId = instanceId) {
        const sessionPath = path.join(this.sessionDir, instanceId);
        
        // Criar diretório se não existir
        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
        }

        const client = new Client({
            authStrategy: new LocalAuth({ 
                dataPath: sessionPath,
                clientId: clientId 
            }),
            puppeteer: {
                headless: true,
                // Usar cache compartilhado para otimização
                userDataDir: path.join(this.cacheDir, instanceId),
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            }
        });

        // Event listeners
        client.on('qr', (qr) => {
            console.log(`📱 QR Code para ${instanceId}:`, qr);
        });

        client.on('ready', () => {
            console.log(`✅ WhatsApp ${instanceId} está pronto!`);
        });

        client.on('disconnected', (reason) => {
            console.log(`❌ WhatsApp ${instanceId} desconectado:`, reason);
        });

        this.instances.set(instanceId, client);
        
        // Inicializar cliente
        await client.initialize();
        
        return client;
    }

    generateDashboard() {
        const instances = Array.from(this.instances.keys());
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>🌐 WhatsApp Server Dashboard</title>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                .header { background: #25d366; color: white; padding: 20px; border-radius: 8px; }
                .instance { background: white; margin: 10px 0; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .status { padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                .connected { background: #25d366; color: white; }
                .disconnected { background: #e74c3c; color: white; }
                .btn { background: #25d366; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
                .cache-info { background: #ecf0f1; padding: 10px; border-radius: 5px; margin: 10px 0; }
                pre { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🌐 Servidor WhatsApp Local</h1>
                <p>Múltiplas instâncias com cache compartilhado</p>
            </div>
            
            <div class="instance">
                <h3>💾 Informações do Cache</h3>
                <div class="cache-info">
                    <p><strong>Diretório de Cache:</strong> ${this.cacheDir}</p>
                    <p><strong>Arquivos em Cache:</strong> ${this.getCacheFileList().length}</p>
                    <p><strong>Tamanho Total:</strong> ${this.getTotalCacheSize()} MB</p>
                </div>
            </div>

            <div class="instance">
                <h3>🔌 Instâncias Ativas (${instances.length})</h3>
                ${instances.map(id => `
                    <div style="border-left: 4px solid #25d366; padding-left: 10px; margin: 10px 0;">
                        <strong>${id}</strong>
                        <span class="status connected">Ativa</span>
                        <br>
                        <a href="/whatsapp/${id}" target="_blank">📱 Abrir Interface</a> |
                        <a href="/api/${id}/status" target="_blank">📊 Status API</a>
                    </div>
                `).join('')}
            </div>

            <div class="instance">
                <h3>🚀 Criar Nova Instância</h3>
                <form onsubmit="createInstance(event)">
                    <input type="text" id="instanceId" placeholder="ID da Instância" required>
                    <button type="submit" class="btn">Criar Instância</button>
                </form>
            </div>

            <div class="instance">
                <h3>📋 Endpoints Disponíveis</h3>
                <pre>
GET  /                          # Dashboard principal
GET  /whatsapp/:instanceId      # Interface WhatsApp
POST /api/instances             # Criar nova instância
GET  /api/instances             # Listar instâncias
GET  /api/:instanceId/status    # Status da instância
POST /api/:instanceId/send      # Enviar mensagem
GET  /cache/*                   # Arquivos de cache
                </pre>
            </div>

            <script>
                async function createInstance(event) {
                    event.preventDefault();
                    const instanceId = document.getElementById('instanceId').value;
                    
                    try {
                        const response = await fetch('/api/instances', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ instanceId, clientId: instanceId })
                        });
                        
                        const result = await response.json();
                        if (result.success) {
                            alert('Instância criada com sucesso!');
                            location.reload();
                        } else {
                            alert('Erro: ' + result.error);
                        }
                    } catch (error) {
                        alert('Erro ao criar instância: ' + error.message);
                    }
                }
            </script>
        </body>
        </html>
        `;
    }

    generateWhatsAppInterface(instanceId) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>WhatsApp - ${instanceId}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="icon" href="/cache/favicon.ico">
            <style>
                body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; }
                .header { background: #25d366; color: white; padding: 15px; text-align: center; }
                .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                iframe { width: 100%; height: 80vh; border: none; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                .info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>📱 WhatsApp Web - ${instanceId}</h2>
            </div>
            
            <div class="container">
                <div class="info">
                    <p><strong>Instância:</strong> ${instanceId}</p>
                    <p><strong>Cache Local:</strong> Ativo</p>
                    <p><strong>Status:</strong> <span id="status">Verificando...</span></p>
                </div>
                
                <!-- Aqui seria carregada a interface real do WhatsApp -->
                <div style="text-align: center; padding: 50px; background: #f8f9fa; border-radius: 8px;">
                    <h3>🔄 Interface WhatsApp Carregando...</h3>
                    <p>Esta seria a interface real do WhatsApp Web usando o cache local.</p>
                    <p>Em produção, aqui seria carregado o arquivo HTML do cache.</p>
                </div>
            </div>

            <script>
                // Verificar status da instância
                async function checkStatus() {
                    try {
                        const response = await fetch('/api/${instanceId}/status');
                        const data = await response.json();
                        document.getElementById('status').textContent = 
                            data.connected ? 'Conectado ✅' : 'Desconectado ❌';
                    } catch (error) {
                        document.getElementById('status').textContent = 'Erro ❌';
                    }
                }
                
                checkStatus();
                setInterval(checkStatus, 5000); // Verificar a cada 5 segundos
            </script>
        </body>
        </html>
        `;
    }

    getCacheFiles(instanceId) {
        const instanceCacheDir = path.join(this.cacheDir, instanceId);
        if (fs.existsSync(instanceCacheDir)) {
            return fs.readdirSync(instanceCacheDir);
        }
        return [];
    }

    getCacheFileList() {
        if (fs.existsSync(this.cacheDir)) {
            return fs.readdirSync(this.cacheDir);
        }
        return [];
    }

    getCacheSize(instanceId) {
        // Implementar cálculo do tamanho do cache
        return '0';
    }

    getSessionSize(instanceId) {
        // Implementar cálculo do tamanho da sessão
        return '0';
    }

    getTotalCacheSize() {
        // Implementar cálculo do tamanho total
        return '0';
    }

    async start(port = 3000) {
        this.app.listen(port, () => {
            console.log(`🌐 Servidor WhatsApp rodando em http://localhost:${port}`);
            console.log(`📁 Cache: ${this.cacheDir}`);
            console.log(`📂 Sessões: ${this.sessionDir}`);
        });
    }
}

// Inicializar servidor se executado diretamente
if (require.main === module) {
    const server = new WhatsAppServer();
    server.start(3000);
}

module.exports = WhatsAppServer;
