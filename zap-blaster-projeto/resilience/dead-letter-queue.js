// dead-letter-queue.js - Dead Letter Queue para mensagens falhadas
const fs = require('fs');
const path = require('path');

class SimpleDeadLetterQueue {
    constructor(logger) {
        this.logger = logger;
        this.dlqPath = path.join(process.cwd(), 'failed-messages.json');
        this.ensureFileExists();
    }

    ensureFileExists() {
        if (!fs.existsSync(this.dlqPath)) {
            fs.writeFileSync(this.dlqPath, JSON.stringify([], null, 2));
            this.logger.info('📁 Arquivo DLQ criado', { path: this.dlqPath });
        }
    }

    async addFailedMessage(messageData, error) {
        try {
            const failedMessages = JSON.parse(fs.readFileSync(this.dlqPath, 'utf8'));
            
            const failedEntry = {
                message: messageData,
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                },
                timestamp: new Date().toISOString(),
                attempts: messageData.attempts || 1,
                id: this.generateId()
            };

            failedMessages.push(failedEntry);

            // Manter apenas últimas 100 mensagens falhadas
            if (failedMessages.length > 100) {
                failedMessages.splice(0, failedMessages.length - 100);
            }

            fs.writeFileSync(this.dlqPath, JSON.stringify(failedMessages, null, 2));
            
            this.logger.error(`💀 Mensagem adicionada ao DLQ`, {
                to: messageData.to,
                error: error.message,
                id: failedEntry.id
            });

            return failedEntry.id;
        } catch (err) {
            this.logger.error('❌ Erro ao salvar no DLQ:', { error: err.message });
            return null;
        }
    }

    async getFailedMessages() {
        try {
            return JSON.parse(fs.readFileSync(this.dlqPath, 'utf8'));
        } catch (error) {
            this.logger.warn('⚠️ Erro ao ler DLQ:', { error: error.message });
            return [];
        }
    }

    async clearDLQ() {
        try {
            fs.writeFileSync(this.dlqPath, JSON.stringify([], null, 2));
            this.logger.info('🧹 DLQ limpo');
            return true;
        } catch (error) {
            this.logger.error('❌ Erro ao limpar DLQ:', { error: error.message });
            return false;
        }
    }

    async removeFailedMessage(id) {
        try {
            const failedMessages = JSON.parse(fs.readFileSync(this.dlqPath, 'utf8'));
            const filteredMessages = failedMessages.filter(msg => msg.id !== id);
            
            fs.writeFileSync(this.dlqPath, JSON.stringify(filteredMessages, null, 2));
            this.logger.info('🗑️ Mensagem removida do DLQ', { id });
            return true;
        } catch (error) {
            this.logger.error('❌ Erro ao remover mensagem do DLQ:', { error: error.message });
            return false;
        }
    }

    async getDLQStats() {
        try {
            const failedMessages = await this.getFailedMessages();
            const now = new Date();
            const last24h = failedMessages.filter(msg => {
                const msgTime = new Date(msg.timestamp);
                return (now - msgTime) < 24 * 60 * 60 * 1000; // 24 horas
            });

            return {
                total: failedMessages.length,
                last24h: last24h.length,
                oldestEntry: failedMessages.length > 0 ? failedMessages[0].timestamp : null,
                newestEntry: failedMessages.length > 0 ? failedMessages[failedMessages.length - 1].timestamp : null
            };
        } catch (error) {
            return {
                total: 0,
                last24h: 0,
                oldestEntry: null,
                newestEntry: null,
                error: error.message
            };
        }
    }

    generateId() {
        return `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = { SimpleDeadLetterQueue };
