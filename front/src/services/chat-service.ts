import axios from 'axios';

// API com interceptors para melhor tratamento de erros
const api = axios.create({
  baseURL: 'http://localhost:5656/api',
  timeout: 5000,  // Timeout de 5 segundos para evitar espera infinita
  headers: { 'Content-Type': 'application/json' }
});

// Interceptar erros para melhor tratamento
api.interceptors.response.use(
  response => response,
  error => {
    console.log("[API] Erro na chamada:", error?.message || "Erro desconhecido");
    
    // Em desenvolvimento, vamos retornar dados fictícios em vez de propagar o erro
    if (import.meta.env.DEV) {
      const url = error?.config?.url || '';
      
      // Para listagem de chats
      if (url.includes('/chats') && !url.includes('/messages')) {
        console.log("[API] Retornando dados fictícios para chats");
        return Promise.resolve({
          data: {
            items: [
              {
                id: "mock1",
                title: "Maria (Mock)",
                contactPhoneE164: "5511999887766",
                lastMessagePreview: "Dados de teste - Backend indisponível",
                unreadCount: 3,
                lastMessageAt: new Date().toISOString()
              }
            ],
            total: 1
          }
        });
      }
      
      // Para mensagens de um chat
      if (url.includes('/messages')) {
        console.log("[API] Retornando dados fictícios para mensagens");
        return Promise.resolve({
          data: {
            messages: [],
            nextCursor: null
          }
        });
      }
      
      // Para outras chamadas, retorna sucesso genérico
      return Promise.resolve({
        data: { success: true, message: "Modo de desenvolvimento - dados simulados" }
      });
    }
    
    return Promise.reject(error);
  }
);

export interface ChatListItem {
  id: string;
  title: string;
  lastMessagePreview?: string;
  unreadCount: number;
  lastMessageAt?: string;
  contactPhoneE164: string;
}

export interface ChatMessageDto {
  id: string;
  externalMessageId?: string;
  direction: 'in' | 'out';
  text: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  ts: string;
  type?: 'text' | 'image' | 'file' | 'audio';
  attachment?: {
    dataUrl: string;
    mimeType: string;
    fileName?: string;
  } | null;
}

export interface ChatHistoryResponse {
  messages: ChatMessageDto[];
  nextCursor?: number | null;
}

export const chatsApi = {
  list: async (search = '', page = 1, pageSize = 20) => {
    const { data } = await api.get('/chats', { params: { search, page, pageSize } });
    return data as { items: ChatListItem[]; total: number };
  },
  history: async (id: string, cursorTs?: number, limit = 50) => {
    const { data } = await api.get(`/chats/${id}/messages`, { params: { cursorTs, limit } });
    return data as ChatHistoryResponse;
  },
  send: async (id: string, text: string, clientMessageId: string, attachment?: { dataUrl: string; mimeType: string; fileName?: string; mediaType?: 'image' | 'file' | 'audio' }) => {
    const { data } = await api.post(`/chats/${id}/messages`, { text, clientMessageId, attachment });
    return data;
  },
  read: async (id: string, readUpToTs: number) => {
    const { data } = await api.post(`/chats/${id}/read`, { readUpToTs });
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/chats/${id}`);
    return data;
  }
};

export default chatsApi;
