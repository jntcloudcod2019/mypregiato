import axios from 'axios';

// Configuração do axios para o backend .NET
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') + '/api' || 'http://localhost:5656/api',
  timeout: 0,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configuração do axios para o RabbitMQ via backend
const rabbitMQService = {
  // Enviar mensagem
  sendMessage: async (phone: string, message: string, template?: string, data?: any) => {
    const response = await api.post('/whatsapp/messages/send', {
      phone,
      message,
      template,
      data
    });
    return response.data;
  },

  // Obter status do bot
  getStatus: async () => {
    const response = await api.get('/whatsapp/status');
    return response.data;
  },

  // Desconectar WhatsApp
  disconnect: async () => {
    try {
      console.log('Iniciando desconexão do WhatsApp...');
      const response = await api.post('/whatsapp/disconnect');
      console.log('Resposta da API (disconnect):', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao desconectar WhatsApp:', error);
      throw error;
    }
  },

  // Gerar QR code
  generateQR: async () => {
    try {
      console.log('Iniciando geração de QR code...');
      const response = await api.post('/whatsapp/generate-qr');
      console.log('Resposta da API (generate-qr):', response.data);
      const data = response.data;
      
      // Se a API retornou o QR code diretamente
      if (data.qrCode) {
        console.log('QR code recebido diretamente:', data.qrCode.substring(0, 50) + '...');
        return {
          success: true,
          qrCode: data.qrCode,
          status: 'generated'
        };
      }
      
      // Se a API apenas iniciou o processo
      console.log('API iniciou processo de geração:', data);
      return {
        success: data.success || false,
        status: data.status || 'command_sent',
        requestId: data.requestId,
        message: data.message || 'Comando enviado'
      };
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      if ((error as any).response) {
        console.error('Detalhes do erro:', {
          status: (error as any).response.status,
          data: (error as any).response.data
        });
      }
      return {
        success: false,
        status: 'error',
        message: 'Erro ao comunicar com o servidor'
      };
    }
  },

  // Obter QR code atual
  getQRCode: async () => {
    try {
      console.log('Solicitando QR code atual...');
      const response = await api.get('/whatsapp/qr-code');
      console.log('Resposta da API (get qr-code):', response.data);
      const data = response.data;
      
      if (!data.qrCode) {
        console.warn('QR code não disponível na resposta');
        throw new Error('QR code não disponível');
      }
      
      console.log('QR code obtido:', data.qrCode.substring(0, 50) + '...');
      return {
        qrCode: data.qrCode,
        timestamp: data.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao obter QR code:', error);
      if ((error as any).response) {
        console.error('Detalhes do erro:', {
          status: (error as any).response.status,
          data: (error as any).response.data
        });
      }
      throw error;
    }
  },

  // Obter métricas da fila
  getQueueMetrics: async () => {
    const response = await api.get('/whatsapp/queue/metrics');
    return response.data;
  },

  // Obter conversas na fila
  getQueueConversations: async () => {
    const response = await api.get('/whatsapp/queue/conversations');
    return response.data;
  },

  // Atribuir conversa
  assignConversation: async (conversationId: string, operatorId: string) => {
    const response = await api.post(`/whatsapp/conversations/${conversationId}/assign`, operatorId);
    return response.data;
  },

  // Fechar conversa
  closeConversation: async (conversationId: string, reason?: string) => {
    const response = await api.post(`/whatsapp/conversations/${conversationId}/close`, { reason });
    return response.data;
  }
};

// APIs para talentos
export const talentsApi = {
  getAll: async (page = 1, pageSize = 20) => {
    const response = await api.get(`/talents?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/talents/${id}`);
    return response.data;
  },

  create: async (talent: any) => {
    const response = await api.post('/talents', talent);
    return response.data;
  },

  update: async (id: string, talent: any) => {
    const response = await api.put(`/talents/${id}`, talent);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/talents/${id}`);
    return response.data;
  }
};

// APIs para contratos
export const contractsApi = {
  getAll: async () => {
    const response = await api.get('/contracts');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/contracts/${id}`);
    return response.data;
  },

  create: async (contract: any) => {
    const response = await api.post('/contracts', contract);
    return response.data;
  },

  update: async (id: string, contract: any) => {
    const response = await api.put(`/contracts/${id}`, contract);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/contracts/${id}`);
    return response.data;
  }
};

// APIs para conversas
export const conversationsApi = {
  getAll: async (status?: string) => {
    const url = status ? `/whatsapp/conversations?status=${status}` : '/whatsapp/conversations';
    const response = await api.get(url);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/whatsapp/conversations/${id}`);
    return response.data;
  },

  assign: async (conversationId: string, operatorId: string) => {
    const response = await api.post(`/whatsapp/conversations/${conversationId}/assign`, operatorId);
    return response.data;
  },

  close: async (conversationId: string, reason?: string) => {
    const response = await api.post(`/whatsapp/conversations/${conversationId}/close`, { reason });
    return response.data;
  }
};

// Interfaces
export interface SendMessageRequest {
  phone: string;
  message?: string;
  template?: string;
  data?: any;
}

export interface WhatsAppStatus {
  botUp: boolean;
  sessionConnected: boolean;
  isConnected: boolean;
  isFullyValidated?: boolean;
  connectedNumber?: string;
  status: 'connected' | 'disconnected' | 'connecting';
  lastActivity: string;
  queueMessageCount: number;
  canGenerateQR?: boolean;
  hasQRCode?: boolean;
  error?: string;
}

export interface QRCodeResponse {
  qrCode: string;
  timestamp: string;
}

export { rabbitMQService };
export default api; 