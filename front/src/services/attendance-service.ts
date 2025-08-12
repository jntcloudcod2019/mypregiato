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
        id: rawMessage.id || `msg_${Date.now()}`,
        from: rawMessage.from || rawMessage.phone,
        to: rawMessage.to || '5511949908369', // Verificar essa logica e por que esta definida dessa forma 
        body: rawMessage.body || rawMessage.message || '',
        timestamp: new Date(rawMessage.timestamp || Date.now()),
        type: rawMessage.type || 'text',
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
      
      // Criar mensagem de resposta
      const responseMessage: WhatsAppMessage = {
        id: `resp_${Date.now()}`,
        from: '5511949908369', // Número do bot
        to: phone,
        body: message,
        timestamp: new Date(),
        type: 'text',
        isFromMe: true // Mensagens enviadas são do operador
      };

      return responseMessage;
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

  // Simular mensagens para teste
  simulateIncomingMessage(phone: string, message: string) {
    const simulatedMessage: WhatsAppMessage = {
      id: `sim_${Date.now()}`,
      from: phone,
      to: '5511949908369',
      body: message,
      timestamp: new Date(),
      type: 'text',
      isFromMe: false
    };

    this.messageHandlers.forEach(handler => {
      try {
        handler(simulatedMessage);
      } catch (error) {
        console.error('Erro ao processar mensagem simulada:', error);
      }
    });

    return simulatedMessage;
  }

  // Consumir mensagens da fila RabbitMQ
  async startMessageConsumer() {
    // Evita iniciar de novo
    if ((globalThis as any).__attendanceConsumerStarted) {
      console.log('⚠️ Consumidor já iniciado. Ignorando.');
      return;
    }
    (globalThis as any).__attendanceConsumerStarted = true;

    try {
              const res = await fetch('http://localhost:5656/api/whatsapp/queue/messages');
      if (!res.ok) {
        console.log('Nenhuma mensagem disponível');
        return;
      }
      
      const data = await res.json();
      const messages = data.messages || [];

      for (const message of messages) {
        try {
          // Verificar se a mensagem tem a estrutura esperada
          const messageData = message.data || message;
          
          if (!messageData || !messageData.from) {
            console.warn('Mensagem inválida recebida:', message);
            continue;
          }

          const whatsappMessage: WhatsAppMessage = {
            id: messageData.id || `msg_${Date.now()}`,
            from: messageData.from,
            to: messageData.to || '5511949908369',
            body: messageData.body || '',
            type: messageData.type || 'text',
            timestamp: new Date(messageData.timestamp || Date.now()),
            isFromMe: messageData.isFromMe || false
          };

          // Notificar handlers
          for (const handler of this.messageHandlers) {
            try {
              handler(whatsappMessage);
            } catch (e) {
              console.error('Erro ao processar mensagem:', e);
            }
          }
        } catch (e) {
          console.error('Erro ao processar mensagem da fila:', e);
        }
      }

      console.log('✅ Mensagens processadas com sucesso');
    } catch (e) {
      console.error('Erro ao consumir mensagens da fila:', e);
    }
  }

  onMessage(handler: (m: WhatsAppMessage) => void) {
    this.messageHandlers.push(handler);
  }
}

export const attendanceService = new AttendanceService();