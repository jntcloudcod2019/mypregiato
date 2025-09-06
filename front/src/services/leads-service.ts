import axios from 'axios';

// API com interceptors para melhor tratamento de erros
const api = axios.create({
  baseURL: 'http://localhost:5656/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptar requisições para debug
api.interceptors.request.use(
  (config) => {
    console.log(`[LeadsAPI] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('[LeadsAPI] Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptar erros para melhor tratamento
api.interceptors.response.use(
  (response) => {
    console.log(`[LeadsAPI] ✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`[LeadsAPI] ❌ Erro na chamada ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export interface OperatorLead {
  nameLead: string;
  phoneLead: string;
}

export interface LeadsResponse {
  success: boolean;
  data: OperatorLead[];
  count: number;
  message: string;
}

export interface CreateConversationRequest {
  contactPhoneE164: string;
  title: string;
  operatorId?: string;
  operatorEmail?: string;
}

export interface CreateConversationResponse {
  success: boolean;
  conversationId: string;
  chatId: string;
  message: string;
  source?: string; // Identifica a origem: 'frontend', 'frontend_fallback', 'zapbot'
}

export const leadsApi = {
  // Buscar leads alocados para um operador por email
  getLeadsByEmail: async (emailOperator: string): Promise<LeadsResponse> => {
    const { data } = await api.get(`/operator-leads/by-email/${encodeURIComponent(emailOperator)}`);
    return data;
  },

  // ✅ CRIAR CHAT VAZIO USANDO FLUXO EXISTENTE
  // Em vez de criar conversa, vamos criar um chat vazio que pode receber mensagens
  createConversationFromLead: async (request: CreateConversationRequest): Promise<CreateConversationResponse> => {
    try {
      console.log('🆕 [FLUXO X] Criando chat vazio para lead via fluxo existente');
      
      // ✅ USAR FLUXO EXISTENTE: Criar chat vazio e depois enviar primeira mensagem
      // 1. Criar chat vazio (sem conversa)
      const emptyChat = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: request.title,
        contactPhoneE164: request.contactPhoneE164,
        lastMessagePreview: '',
        unreadCount: 0,
        lastMessageAt: new Date().toISOString()
      };
      
      // 2. Retornar chat criado (será adicionado ao store)
      return {
        success: true,
        conversationId: emptyChat.id,
        chatId: emptyChat.id,
        message: 'Chat vazio criado com sucesso',
        source: 'frontend_empty_chat'
      };
    } catch (error: any) {
      console.error('❌ [FLUXO X] Erro ao criar chat vazio:', error);
      throw new Error(`Falha ao criar chat: ${error.response?.data?.message || error.message}`);
    }
  },

  // Alocar um lead para um operador
  allocateLead: async (operatorEmail: string, nameLead: string, phoneLead: string): Promise<boolean> => {
    const { data } = await api.post('/operator-leads/allocate-single', {
      operatorId: 'temp-id', // Será substituído pelo email
      emailOperator: operatorEmail,
      nameLead,
      phoneLead
    });
    return data.success;
  },

  // Atualizar rastreamento de lead
  updateLeadTracking: async (updateData: {
    emailOperator: string;
    phoneLead: string;
    statusContact: boolean;
    dateContact?: string;
    statusSeletiva: boolean;
    seletivaInfo?: {
      dateSeletiva?: string;
      localSeletiva?: string;
      horarioAgendadoLead?: string;
      nomeLead?: string;
      codOperator?: string;
    };
  }): Promise<{ success: boolean; message: string; data?: any }> => {
    const { data } = await api.put('/operator-leads/update-tracking', updateData);
    return data;
  }
};

export default leadsApi;
