import axios from 'axios';

/**
 * ============================================================================
 * NOVO SERVIÇO DE CONVERSAS - INTEGRAÇÃO COM BACKEND REFATORADO
 * ============================================================================
 * 
 * Este serviço integra com as novas APIs:
 * - /api/conversations (ConversationsController)
 * - /api/chats (ChatsController - sistema legado)
 * 
 * Suporta tanto conversas WhatsApp quanto conversas do sistema original
 * ============================================================================
 */

import { API_URL } from '../config/api';

// API com interceptors para melhor tratamento de erros
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptar requisições para debug
api.interceptors.request.use(
  (config) => {
    console.log(`[ConversationsAPI] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('[ConversationsAPI] Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptar erros para melhor tratamento
api.interceptors.response.use(
  (response) => {
    console.log(`[ConversationsAPI] ✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`[ConversationsAPI] ❌ Erro na chamada ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// ============================================================================
// TIPOS E INTERFACES - UNIFICADOS
// ============================================================================

// Importar interfaces unificadas
import { 
  MessageDto, 
  MessageType, 
  MessageDirection, 
  MessageStatus,
  CreateTextMessageDto,
  CreateMediaMessageDto,
  CreateLocationMessageDto,
  CreateContactMessageDto,
  UpdateMessageDto,
  WhatsAppIncomingMessageDto,
  MessageUtils
} from '../types/message';

// Importar chatsApi para fallback
import { chatsApi } from './chat-service';

export enum ConversationStatus {
  Queued = 'Queued',
  Assigned = 'Assigned',
  Closed = 'Closed'
}

export enum ConversationPriority {
  Normal = 'Normal',
  High = 'High',
  Urgent = 'Urgent'
}

// Interface para conversa (nova estrutura)
export interface ConversationDto {
  id: string;
  contactId?: string;
  operatorId?: string;
  channel: string;
  status: ConversationStatus;
  priority: ConversationPriority;
  closeReason?: string;
  createdAt: string;
  assignedAt?: string;
  closedAt?: string;
  updatedAt?: string;
  
  // Novos campos para WhatsApp
  instanceId?: string;
  peerE164?: string;
  isGroup: boolean;
  title?: string;
  currentSessionId?: string;
  lastMessageAt?: string;
  
  // Propriedades de navegação
  contact?: {
    id: string;
    name: string;
    phoneE164: string;
  };
  operator?: {
    id: string;
    name: string;
  };
  messages: MessageDto[];
  sessions: ChatSessionDto[];
  unreadCount: number;
  lastMessage?: MessageDto;
}

// Interface para sessão de chat
export interface ChatSessionDto {
  id: string;
  conversationId: string;
  openedAt: string;
  closedAt?: string;
  openedBy?: string;
  closedBy?: string;
}

// MessageDto já importado do types/message.ts - interface unificada
// Removida duplicação - usar apenas a interface unificada importada

// Interface para item de lista de conversas
export interface ConversationListItemDto {
  conversationId: string;
  instanceId?: string;
  peerE164?: string;
  isGroup: boolean;
  title?: string;
  lastMessageAt?: string;
  lastMessagePayloadJson?: string;
  currentSessionId?: string;
}

// Interface para attachment
export interface MessageAttachment {
  dataUrl: string;
  mimeType: string;
  fileName?: string;
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'voice' | 'sticker' | 'location' | 'contact' | 'system';
}

// Usar DTOs especializados já importados
// CreateTextMessageDto, CreateMediaMessageDto já estão disponíveis

// Interface temporária para compatibilidade com método legacy
interface SendMessageRequest {
  text: string;
  clientMessageId?: string;
  attachment?: MessageAttachment;
}

// Interface para resposta de envio unificada
export interface SendMessageResponse {
  success: boolean;
  messageId: string;
  message?: MessageDto;
}

// Interface para histórico de mensagens
export interface MessagesResponse {
  messages: MessageDto[];
  total: number;
}

// ============================================================================
// FUNÇÕES DE CONVERSÃO
// ============================================================================

// Converter enum do backend para frontend
export const mapBackendDirection = (direction: string): MessageDirection => {
  return direction === 'In' ? MessageDirection.In : MessageDirection.Out;
};

export const mapBackendStatus = (status: string): MessageStatus => {
  switch (status) {
    case 'Sending': return MessageStatus.Sending;
    case 'Sent': return MessageStatus.Sent;
    case 'Delivered': return MessageStatus.Delivered;
    case 'Read': return MessageStatus.Read;
    case 'Failed': return MessageStatus.Failed;
    default: return MessageStatus.Sent;
  }
};

export const mapBackendType = (type: string): MessageType => {
  switch (type) {
    case 'Text': return MessageType.Text;
    case 'Image': return MessageType.Image;
    case 'Audio': return MessageType.Audio;
    case 'Document': return MessageType.Document;
    case 'Video': return MessageType.Video;
    default: return MessageType.Text;
  }
};

// Converter mensagem do backend para frontend
export const convertBackendMessage = (backendMessage: Record<string, unknown>): MessageDto => {
  return {
    id: String(backendMessage.id || backendMessage.externalMessageId || ''),
    conversationId: backendMessage.conversationId as string,
    sessionId: backendMessage.sessionId as string,
    externalMessageId: backendMessage.externalMessageId as string,
    direction: mapBackendDirection(String(backendMessage.direction || 'In')),
    type: mapBackendType(String(backendMessage.type || 'Text')),
    body: String(backendMessage.body || backendMessage.text || ''),
    mediaUrl: backendMessage.mediaUrl as string,
    fileName: backendMessage.fileName as string,
    clientMessageId: backendMessage.clientMessageId as string,
    whatsAppMessageId: backendMessage.whatsAppMessageId as string,
    status: mapBackendStatus(String(backendMessage.status || 'Sent')),
    internalNote: backendMessage.internalNote as string,
    createdAt: String(backendMessage.createdAt || backendMessage.timestamp || new Date().toISOString()),
    updatedAt: backendMessage.updatedAt as string,
    // payloadJson removido - não faz parte da interface unificada
    
    // Campos de compatibilidade
    text: String(backendMessage.body || backendMessage.text || ''),
    fromMe: String(backendMessage.direction) === 'Out',
    isGroup: Boolean(backendMessage.isGroup)
  };
};

// ============================================================================
// CACHE E OTIMIZAÇÕES
// ============================================================================

// Cache para evitar requisições duplicadas
const requestCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 segundos

// Função para limpar cache expirado
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      requestCache.delete(key);
    }
  }
};

// Função para gerar chave de cache
const getCacheKey = (method: string, url: string, params?: Record<string, unknown>) => {
  return `${method}:${url}:${JSON.stringify(params || {})}`;
};

// Função para verificar cache
const getFromCache = (key: string) => {
  cleanExpiredCache();
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`🔧 Cache hit: ${key}`);
    return cached.data;
  }
  return null;
};

// Função para salvar no cache
const saveToCache = (key: string, data: unknown) => {
  requestCache.set(key, { data, timestamp: Date.now() });
  console.log(`🔧 Cache saved: ${key}`);
};

// ============================================================================
// API DE CONVERSAS
// ============================================================================

export const conversationsApi = {
  // Listar conversas (nova API)
  list: async (search = '', page = 1, pageSize = 20) => {
    const cacheKey = getCacheKey('GET', '/conversations', { search, page, pageSize });
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached as { items: ConversationListItemDto[]; total: number };
    }
    
    const { data } = await api.get('/conversations', { params: { search, page, pageSize } });
    const result = { items: data.items || [], total: data.total || 0 };
    
    saveToCache(cacheKey, result);
    return result;
  },

  // Obter mensagens de uma conversa (nova API)
  getMessages: async (conversationId: string, page = 1, pageSize = 50) => {
    const cacheKey = getCacheKey('GET', `/conversations/${conversationId}/messages`, { page, pageSize });
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached as MessagesResponse;
    }
    
    const { data } = await api.get(`/conversations/${conversationId}/messages`, { 
      params: { page, pageSize } 
    });
    
    // Converter mensagens do backend para o formato do frontend
    const convertedMessages = data.messages?.map(convertBackendMessage) || [];
    const result = { 
      messages: convertedMessages, 
      total: data.total || 0 
    } as MessagesResponse;
    
    saveToCache(cacheKey, result);
    return result;
  },

  // Enviar mensagem (nova API)
  sendMessage: async (conversationId: string, request: SendMessageRequest) => {
    // Converter para o formato esperado pelo backend (PascalCase)
    const backendRequest = {
      Text: request.text,
      ClientMessageId: request.clientMessageId,
      Attachment: request.attachment ? {
        DataUrl: request.attachment.dataUrl,
        MimeType: request.attachment.mimeType,
        FileName: request.attachment.fileName,
        MediaType: request.attachment.mediaType
      } : null
    };
    
    const { data } = await api.post(`/conversations/${conversationId}/send`, backendRequest);
    return data as SendMessageResponse;
  },

  // === NOVOS MÉTODOS UNIFICADOS ===

  // Enviar mensagem de texto
  sendTextMessage: async (request: CreateTextMessageDto) => {
    const backendRequest = {
      ConversationId: request.conversationId,
      Text: request.text,
      ChatId: request.chatId,
      FromNormalized: request.fromNormalized,
      FromMe: request.fromMe || false,
      IsGroup: request.isGroup || false
    };
    
    const { data } = await api.post(`/messages/send/text`, backendRequest);
    return data as SendMessageResponse;
  },

  // Enviar mensagem com mídia
  sendMediaMessage: async (request: CreateMediaMessageDto) => {
    const backendRequest = {
      ConversationId: request.conversationId,
      Type: request.type,
      Text: request.text,
      MediaUrl: request.mediaUrl,
      FileName: request.fileName,
      MimeType: request.mimeType,
      Size: request.size,
      Duration: request.duration,
      Thumbnail: request.thumbnail,
      ChatId: request.chatId,
      FromNormalized: request.fromNormalized,
      FromMe: request.fromMe || false,
      IsGroup: request.isGroup || false
    };
    
    const { data } = await api.post(`/messages/send/media`, backendRequest);
    return data as SendMessageResponse;
  },

  // Enviar localização
  sendLocationMessage: async (request: CreateLocationMessageDto) => {
    const backendRequest = {
      ConversationId: request.conversationId,
      Latitude: request.latitude,
      Longitude: request.longitude,
      LocationAddress: request.locationAddress,
      ChatId: request.chatId,
      FromNormalized: request.fromNormalized,
      FromMe: request.fromMe || false,
      IsGroup: request.isGroup || false
    };
    
    const { data } = await api.post(`/messages/send/location`, backendRequest);
    return data as SendMessageResponse;
  },

  // Enviar contato
  sendContactMessage: async (request: CreateContactMessageDto) => {
    const backendRequest = {
      ConversationId: request.conversationId,
      ContactName: request.contactName,
      ContactPhone: request.contactPhone,
      ChatId: request.chatId,
      FromNormalized: request.fromNormalized,
      FromMe: request.fromMe || false,
      IsGroup: request.isGroup || false
    };
    
    const { data } = await api.post(`/messages/send/contact`, backendRequest);
    return data as SendMessageResponse;
  },

  // Atualizar status de mensagem
  updateMessageStatus: async (messageId: string, update: UpdateMessageDto) => {
    const { data } = await api.patch(`/messages/${messageId}/status`, update);
    return data;
  },

  // Obter conversa por ID
  getById: async (conversationId: string) => {
    const cacheKey = getCacheKey('GET', `/conversations/${conversationId}`);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached as ConversationDto;
    }
    
    const { data } = await api.get(`/conversations/${conversationId}`);
    const result = data as ConversationDto;
    
    saveToCache(cacheKey, result);
    return result;
  }
};

// ============================================================================
// API DE CHATS (SISTEMA LEGADO - COMPATIBILIDADE)
// ============================================================================

export const legacyChatsApi = {
  // Listar chats (sistema legado)
  list: async (search = '', page = 1, pageSize = 20) => {
    const cacheKey = getCacheKey('GET', '/chats', { search, page, pageSize });
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached as { items: Record<string, unknown>[]; total: number };
    }
    
    const { data } = await api.get('/chats', { params: { search, page, pageSize } });
    const result = { items: data.items || [], total: data.total || 0 };
    
    saveToCache(cacheKey, result);
    return result;
  },

  // Obter mensagens de um chat (sistema legado)
  getMessages: async (chatId: string, cursorTs?: number, limit = 50) => {
    const cacheKey = getCacheKey('GET', `/chats/${chatId}/messages`, { cursorTs, limit });
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached as { messages: Record<string, unknown>[]; nextCursor?: number };
    }
    
    const { data } = await api.get(`/chats/${chatId}/messages`, { 
      params: { cursorTs, limit } 
    });
    
    const result = { 
      messages: data.messages || [], 
      nextCursor: data.nextCursor 
    };
    
    saveToCache(cacheKey, result);
    return result;
  },

  // Função removida - usar chatsApi.send para evitar duplicação

  // Marcar como lido (sistema legado)
  markAsRead: async (chatId: string, readUpToTs: number) => {
    const { data } = await api.post(`/chats/${chatId}/read`, { readUpToTs });
    return data;
  },

  // Deletar chat (sistema legado)
  delete: async (chatId: string) => {
    const { data } = await api.delete(`/chats/${chatId}`);
    return data;
  }
};

// ============================================================================
// API UNIFICADA (INTELIGENTE)
// ============================================================================

export const unifiedChatApi = {
  // Listar conversas/chats (detecta automaticamente o tipo)
  list: async (search = '', page = 1, pageSize = 20) => {
    try {
      // Tentar primeiro a nova API de conversas
      const conversations = await conversationsApi.list(search, page, pageSize);
      console.log('📞 Usando nova API de conversas');
      return {
        items: conversations.items.map(item => ({
          id: item.conversationId,
          title: item.title || `Chat com ${item.peerE164}`,
          lastMessagePreview: item.lastMessagePayloadJson ? 
            JSON.parse(item.lastMessagePayloadJson).body?.substring(0, 100) : '',
          unreadCount: 0, // TODO: Implementar contagem de não lidas
          lastMessageAt: item.lastMessageAt,
          contactPhoneE164: item.peerE164 || '',
          isWhatsApp: true,
          conversationId: item.conversationId
        })),
        total: conversations.total,
        type: 'conversations'
      };
    } catch (error) {
      console.log('📞 Fallback para API de chats legada');
      // Fallback para API de chats legada
      const chats = await legacyChatsApi.list(search, page, pageSize);
      return {
        items: chats.items.map(item => ({
          id: item.chatId || item.id,
          title: item.title,
          lastMessagePreview: item.lastMessagePreview,
          unreadCount: item.unreadCount || 0,
          lastMessageAt: item.lastMessageAt,
          contactPhoneE164: item.contactPhoneE164,
          isWhatsApp: false,
          chatId: item.chatId || item.id
        })),
        total: chats.total,
        type: 'chats'
      };
    }
  },

  // Obter mensagens (detecta automaticamente o tipo)
  getMessages: async (id: string, page = 1, pageSize = 50, cursorTs?: number) => {
    try {
      // Tentar primeiro a nova API de conversas
      const messages = await conversationsApi.getMessages(id, page, pageSize);
      console.log('📞 Usando nova API de mensagens de conversas');
      return {
        messages: messages.messages,
        total: messages.total,
        type: 'conversations'
      };
    } catch (error) {
      console.log('📞 Fallback para API de mensagens de chats legada');
      // Fallback para API de chats legada
      const messages = await legacyChatsApi.getMessages(id, cursorTs, pageSize);
      return {
        messages: messages.messages.map(convertBackendMessage),
        total: messages.messages.length,
        nextCursor: messages.nextCursor,
        type: 'chats'
      };
    }
  },

  // Enviar mensagem (detecta automaticamente o tipo)
  sendMessage: async (id: string, text: string, clientMessageId: string, attachment?: MessageAttachment) => {
    try {
      // Tentar primeiro a nova API de conversas
      const request: SendMessageRequest = {
        text,
        clientMessageId,
        attachment
      };
      
      const response = await conversationsApi.sendMessage(id, request);
      console.log('📞 ✅ Usando nova API de envio de conversas');
      return {
        success: response.success,
        messageId: response.messageId,
        type: 'conversations'
      };
    } catch (error) {
      console.log('📞 ⚠️ Fallback para API de envio de chats legada:', error);
      
      // Fallback para API de chats legada
      try {
        const response = await chatsApi.send(id, text, clientMessageId, undefined, attachment);
        return {
          success: response.success,
          messageId: response.message?.id || clientMessageId,
          type: 'chats'
        };
      } catch (legacyError) {
        console.error('❌ Erro em ambas APIs de envio:', { newApi: error, legacyApi: legacyError });
        throw legacyError;
      }
    }
  }
};

export default unifiedChatApi;
