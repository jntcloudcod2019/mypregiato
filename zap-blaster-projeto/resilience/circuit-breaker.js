// circuit-breaker.js - Circuit Breaker para envio de mensagens WhatsApp
const CircuitBreaker = require('opossum');

class WhatsAppCircuitBreaker {
    constructor(sendMessageFunction, logger) {
        this.logger = logger;
        
        const options = {
            timeout: 15000,              // 15s timeout
            errorThresholdPercentage: 50, // 50% erro abre circuito
            resetTimeout: 30000,         // 30s para tentar fechar
            volumeThreshold: 5           // Mín 5 chamadas para avaliar
        };

        this.breaker = new CircuitBreaker(sendMessageFunction, options);
        
        // Logs dos eventos do circuit breaker
        this.breaker.on('open', () => 
            this.logger.warn('🔴 Circuit Breaker ABERTO - WhatsApp indisponível'));
        this.breaker.on('halfOpen', () => 
            this.logger.info('🟡 Circuit Breaker MEIO-ABERTO - Testando WhatsApp'));
        this.breaker.on('close', () => 
            this.logger.info('🟢 Circuit Breaker FECHADO - WhatsApp funcionando'));
    }

    async sendMessage(chatId, message, options = {}) {
        try {
            return await this.breaker.fire(chatId, message, options);
        } catch (error) {
            this.logger.error('🔄 Circuit Breaker rejeitou mensagem', {
                chatId, 
                error: error.message
            });
            throw error;
        }
    }

    // Método para verificar se o circuit breaker está aberto
    isOpen() {
        return this.breaker.opened;
    }

    // Método para obter estatísticas
    getStats() {
        return {
            opened: this.breaker.opened,
            halfOpen: this.breaker.halfOpen,
            closed: this.breaker.closed,
            pendingClose: this.breaker.pendingClose
        };
    }
}

module.exports = { WhatsAppCircuitBreaker };
