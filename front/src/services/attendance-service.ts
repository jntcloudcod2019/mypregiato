import { WhatsAppMessage } from '@/types/attendance';
import { rabbitMQService } from './whatsapp-api';

class AttendanceService {
  private messageHandlers: ((message: WhatsAppMessage) => void)[] = [];

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
    try {
      // Fazer polling para verificar novas mensagens
      setInterval(async () => {
        try {
          const response = await fetch('http://localhost:5001/api/whatsapp/queue/messages');
          if (response.ok) {
            const messages = await response.json();
            
            messages.forEach((message: any) => {
              if (message.type === 'incoming_message') {
                const whatsappMessage: WhatsAppMessage = {
                  id: message.data.id,
                  from: message.data.from,
                  to: message.data.to,
                  body: message.data.body,
                  type: message.data.type,
                  timestamp: new Date(message.data.timestamp),
                  isFromMe: message.data.isFromMe
                };

                // Notificar handlers
                this.messageHandlers.forEach(handler => {
                  try {
                    handler(whatsappMessage);
                  } catch (error) {
                    console.error('Erro ao processar mensagem da fila:', error);
                  }
                });
              }
            });
          }
        } catch (error) {
          console.error('Erro ao consumir mensagens da fila:', error);
        }
      }, 5000); // Verificar a cada 5 segundos

      console.log('✅ Consumidor de mensagens iniciado');
    } catch (error) {
      console.error('❌ Erro ao iniciar consumidor de mensagens:', error);
    }
  }
}

export const attendanceService = new AttendanceService(); 