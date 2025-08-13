import { WhatsAppMessage } from '@/types/attendance';
import { rabbitMQService } from './whatsapp-api';

class AttendanceService {
  private messageHandlers: Array<(m: WhatsAppMessage) => void> = [];
  // Registrar handler para novas mensagens
  onNewMessage(handler: (message: WhatsAppMessage) => void) {
    this.messageHandlers.push(handler);
  }

  // Remover handler
  removeHandler(handler: (message: WhatsAppMessage) => void) {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  // Processar nova mensagem do WhatsApp
  async processIncomingMessage(rawMessage: any) {
    try {
      const message: WhatsAppMessage = {
        id: rawMessage.id,
        from: rawMessage.from,
        to: rawMessage.to,
        body: rawMessage.body ?? rawMessage.message ?? '',
        timestamp: new Date(rawMessage.timestamp ?? Date.now()),
        type: rawMessage.type ?? 'text',
        isFromMe: false // Mensagens recebidas não são do operador
      };

      // Notificar todos os handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      });

      return message;
    } catch (error) {
      console.error('Erro ao processar mensagem recebida:', error);
      throw error;
    }
  }

  // Enviar mensagem via WhatsApp
  async sendMessage(phone: string, message: string) {
    try {
      const response = await rabbitMQService.sendMessage(phone, message);
      return response;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Obter conversas ativas
  async getActiveConversations() {
    try {
      const response = await rabbitMQService.getQueueConversations();
      return response;
    } catch (error) {
      console.error('Erro ao obter conversas ativas:', error);
      return [];
    }
  }

  // Atribuir conversa a um operador
  async assignConversation(conversationId: string, operatorId: string) {
    try {
      const response = await rabbitMQService.assignConversation(conversationId, operatorId);
      return response;
    } catch (error) {
      console.error('Erro ao atribuir conversa:', error);
      throw error;
    }
  }

  // Fechar conversa
  async closeConversation(conversationId: string, reason?: string) {
    try {
      const response = await rabbitMQService.closeConversation(conversationId, reason);
      return response;
    } catch (error) {
      console.error('Erro ao fechar conversa:', error);
      throw error;
    }
  }

  // Simuladores/consumidores desativados para evitar loops no front

  onMessage(handler: (m: WhatsAppMessage) => void) {
    this.messageHandlers.push(handler);
  }
}

export const attendanceService = new AttendanceService();