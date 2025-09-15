// resilient-sender.js - Sender resiliente que integra todas as funcionalidades
const { WhatsAppCircuitBreaker } = require('./circuit-breaker');
const { ResilientRetryManager } = require('./retry-manager');
const { SimpleDeadLetterQueue } = require('./dead-letter-queue');

class ResilientMessageSender {
    constructor(client, logger, sendMessageConfirmationFunction) {
        this.client = client;
        this.logger = logger;
        this.sendMessageConfirmationToAPI = sendMessageConfirmationFunction;
        
        // Inicializar componentes de resiliência
        this.circuitBreaker = new WhatsAppCircuitBreaker(
            this.sendMessageDirect.bind(this), 
            logger
        );
        this.retryManager = new ResilientRetryManager(logger);
        this.dlq = new SimpleDeadLetterQueue(logger);
    }

    // Método direto de envio (usado pelo circuit breaker)
    async sendMessageDirect(chatId, message, options = {}) {
        if (options.media) {
            return await this.client.sendMessage(chatId, options.media, { caption: message || undefined });
        } else {
            return await this.client.sendMessage(chatId, message);
        }
    }

    // Método principal resiliente
    async sendMessage(messageData) {
        const { to, body, attachment, clientMessageId } = messageData;
        
        try {
            // Formatar chat ID
            const chatId = this.formatChatId(to);
            
            // Preparar opções de mensagem
            const messageOptions = {};
            if (attachment) {
                const base64Data = String(attachment.dataUrl || '').split(',')[1];
                const mimeType = attachment.mimeType || 'application/octet-stream';
                const { MessageMedia } = require('whatsapp-web.js');
                messageOptions.media = new MessageMedia(mimeType, base64Data || '', attachment.fileName || undefined);
            }

            // Primeiro tentar com circuit breaker
            try {
                const result = await this.circuitBreaker.sendMessage(chatId, body, messageOptions);
                
                this.logger.info(`✅ Mensagem enviada via circuit breaker`, {
                    to,
                    messageId: result.id._serialized
                });
                
                // Confirmar entrega
                await this.sendMessageConfirmationToAPI(to, result.id._serialized, 'sent');
                
                return { success: true, messageId: result.id._serialized };

            } catch (circuitError) {
                this.logger.warn(`🔄 Circuit breaker falhou, tentando retry`, {
                    to,
                    error: circuitError.message
                });
                
                // Se circuit breaker falhar, usar retry manager
                try {
                    const result = await this.retryManager.sendWithRetry(
                        this.sendMessageDirect.bind(this),
                        messageData,
                        chatId,
                        body,
                        messageOptions
                    );

                    this.logger.info(`✅ Mensagem enviada via retry manager`, {
                        to,
                        messageId: result.id._serialized
                    });
                    
                    await this.sendMessageConfirmationToAPI(to, result.id._serialized, 'sent');
                    return { success: true, messageId: result.id._serialized };

                } catch (retryError) {
                    this.logger.error(`💀 Falha total no envio`, {
                        to,
                        error: retryError.message
                    });
                    
                    // Se tudo falhar, adicionar ao DLQ
                    const dlqId = await this.dlq.addFailedMessage(messageData, retryError);
                    await this.sendMessageConfirmationToAPI(to, clientMessageId, 'failed');
                    
                    return { 
                        success: false, 
                        error: retryError.message,
                        dlqId 
                    };
                }
            }

        } catch (error) {
            this.logger.error(`❌ Erro crítico no envio`, {
                to,
                error: error.message
            });
            
            // Erro crítico - adicionar ao DLQ
            const dlqId = await this.dlq.addFailedMessage(messageData, error);
            await this.sendMessageConfirmationToAPI(to, clientMessageId, 'failed');
            
            return { 
                success: false, 
                error: error.message,
                dlqId 
            };
        }
    }

    formatChatId(phoneNumber) {
        const clean = phoneNumber.replace(/\D/g, '');
        
        // Grupo (IDs de grupo começam com 120 e são longos)
        if (clean.startsWith('120') && clean.length >= 18) {
            return `${clean}@g.us`;
        }
        
        // Individual
        return `${clean}@c.us`;
    }

    // Métodos para obter estatísticas
    getStats() {
        return {
            circuitBreaker: this.circuitBreaker.getStats(),
            retryManager: this.retryManager.getQueueStats(),
            dlq: this.dlq.getDLQStats()
        };
    }

    // Método para retry manual de mensagens do DLQ
    async retryFailedMessage(dlqId) {
        try {
            const failedMessages = await this.dlq.getFailedMessages();
            const messageToRetry = failedMessages.find(msg => msg.id === dlqId);
            
            if (!messageToRetry) {
                this.logger.warn('⚠️ Mensagem não encontrada no DLQ', { dlqId });
                return { success: false, error: 'Message not found in DLQ' };
            }

            // Tentar reenviar
            const result = await this.sendMessage({
                ...messageToRetry.message,
                attempts: (messageToRetry.attempts || 0) + 1
            });

            if (result.success) {
                // Se sucesso, remover do DLQ
                await this.dlq.removeFailedMessage(dlqId);
                this.logger.info('🔄 Mensagem reenviada com sucesso do DLQ', { dlqId });
            }

            return result;
        } catch (error) {
            this.logger.error('❌ Erro ao reenviar mensagem do DLQ', {
                dlqId,
                error: error.message
            });
            return { success: false, error: error.message };
        }
    }
}

module.exports = { ResilientMessageSender };
