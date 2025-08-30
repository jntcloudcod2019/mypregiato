// retry-manager.js - Retry Manager com backoff exponencial
const pRetry = require('p-retry').default || require('p-retry');
const PQueue = require('p-queue').default;

class ResilientRetryManager {
    constructor(logger) {
        this.logger = logger;
        this.messageQueue = new PQueue({ 
            concurrency: 3,     // Max 3 mensagens simultâneas
            interval: 1000,     // Min 1s entre mensagens
            intervalCap: 5      // Max 5 por intervalo
        });
    }

    async sendWithRetry(sendFunction, messageData, chatId, message, options = {}) {
        const retryOptions = {
            retries: 3,               // 3 tentativas
            factor: 2,                // Backoff exponencial (2x)
            minTimeout: 1000,         // Min 1s
            maxTimeout: 10000,        // Max 10s
            onFailedAttempt: error => {
                this.logger.warn(`❌ Tentativa ${error.attemptNumber} falhou`, {
                    chatId,
                    retriesLeft: error.retriesLeft,
                    error: error.message
                });
            }
        };

        return this.messageQueue.add(() => 
            pRetry(() => sendFunction(chatId, message, options), retryOptions)
        );
    }

    // Método para verificar status da fila
    getQueueStats() {
        return {
            size: this.messageQueue.size,
            pending: this.messageQueue.pending,
            concurrency: this.messageQueue.concurrency
        };
    }

    // Método para limpar a fila
    clear() {
        this.messageQueue.clear();
        this.logger.info('🧹 Fila de retry limpa');
    }

    // Método para pausar/retomar a fila
    pause() {
        this.messageQueue.pause();
        this.logger.info('⏸️ Fila de retry pausada');
    }

    start() {
        this.messageQueue.start();
        this.logger.info('▶️ Fila de retry retomada');
    }
}

module.exports = { ResilientRetryManager };
