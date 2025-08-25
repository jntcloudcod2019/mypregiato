import axios from 'axios';

/**
 * ============================================================================
 * FLUXOS DE CHAT E MENSAGENS - DOCUMENTAÇÃO
 * ============================================================================
 * 
 * 1. ENVIO DE MENSAGENS (Frontend → Backend)
 *    - Frontend: chatsApi.send() → POST /api/chats/{id}/messages
 *    - Request: SendMessageRequestDto { text, clientMessageId, attachment? }
 *    - Backend: ChatsController.Send() → ChatLogService.AddOutboundPendingAsync()
 *    - Response: SendMessageResponseDto { success, message: ChatMessageDto }
 * 
 * 2. RECEBIMENTO DE MENSAGENS (Backend → Frontend)
 *    - Backend: SignalR "message.inbound" → useInboundMessageProcessor
 *    - Event: InboundMessageEvent { chatId, message }
 *    - Frontend: processInboundMessage() → ChatMessageDto
 * 
 * 3. HISTÓRICO DE MENSAGENS (Frontend → Backend)
 *    - Frontend: chatsApi.history() → GET /api/chats/{id}/messages
 *    - Backend: ChatsController.GetMessages() → ChatLogService.Deserialize()
 *    - Response: ChatHistoryResponse { messages: ChatMessageDto[], nextCursor? }
 * 
 * 4. EVENTOS SIGNALR
 *    - message.inbound: Nova mensagem recebida
 *    - message.outbound: Mensagem enviada
 *    - message.status: Status da mensagem atualizado
 *    - chat.updated: Chat atualizado
 *    - chat.read: Mensagens marcadas como lidas
 * 
 * ============================================================================
 */

// API com interceptors para melhor tratamento de erros
const api = axios.create({
  baseURL: 'http://localhost:5656/api',
  timeout: 10000,  // Aumentar timeout para 10 segundos
  headers: { 'Content-Type': 'application/json' }
});

// Interceptar requisições para debug
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('[API] Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptar erros para melhor tratamento
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`[API] ❌ Erro na chamada ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
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

// Enums alinhados com o backend
export enum MessageDirection {
  In = 'In',
  Out = 'Out'
}

export enum MessageType {
  Text = 'Text',
  Image = 'Image',
  Audio = 'Audio',
  Document = 'Document',
  Video = 'Video'
}

export enum MessageStatus {
  Sending = 'Sending',
  Sent = 'Sent',
  Delivered = 'Delivered',
  Read = 'Read',
  Failed = 'Failed'
}

// Interface principal alinhada com o backend
export interface ChatMessageDto {
  id: string;
  conversationId?: string;
  direction: MessageDirection;
  type: MessageType;
  body: string; // Alinhado com o backend
  mediaUrl?: string; // Alinhado com o backend
  fileName?: string; // Alinhado com o backend
  clientMessageId?: string; // Alinhado com o backend
  whatsAppMessageId?: string; // Alinhado com o backend
  status: MessageStatus;
  internalNote?: string; // Alinhado com o backend
  createdAt: string; // ISO string para compatibilidade com frontend
  updatedAt?: string; // ISO string para compatibilidade com frontend
  
  // Campos de compatibilidade para o frontend
  externalMessageId?: string;
  text?: string; // Alias para body
  ts?: string; // Alias para createdAt
  fromMe?: boolean; // Campo de compatibilidade para determinar se é mensagem do usuário
  attachment?: {
    dataUrl: string;
    mimeType: string;
    fileName?: string;
  } | null;
}

// Interface para envio de mensagens
export interface SendMessageRequest {
  text: string;
  clientMessageId: string;
  attachment?: {
    dataUrl: string;
    mimeType: string;
    fileName?: string;
    mediaType?: 'image' | 'file' | 'audio';
  };
}

// Interface para resposta de envio
export interface SendMessageResponse {
  success: boolean;
  message: ChatMessageDto;
}

// Interface para histórico de mensagens
export interface ChatHistoryResponse {
  messages: ChatMessageDto[];
  nextCursor?: number | null;
}

// Interface unificada para eventos SignalR
export interface SignalRMessageEvent {
  chatId: string;
  message: ChatMessageDto;
}

export interface SignalRChatEvent {
  chatId: string;
  chat: Partial<ChatListItem>;
}

export interface SignalRReadEvent {
  chatId: string;
  readUpToTs: number;
}

// Interface para mensagem do backend (baseada no MessageDto do backend)
export interface BackendMessageDto {
  id?: string;
  conversationId?: string;
  direction?: string;
  type?: string;
  body?: string;
  mediaUrl?: string;
  fileName?: string;
  clientMessageId?: string;
  whatsAppMessageId?: string;
  status?: string;
  internalNote?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Campos de compatibilidade do frontend
  externalMessageId?: string;
  text?: string;
  ts?: string;
  mimeType?: string;
}

// Interface para ChatLog do backend
export interface BackendChatLogDto {
  id: string;
  chatId: string;
  phoneNumber?: string;
  messageId?: string;
  direction?: string;
  content?: string;
  contentType?: string;
  timestamp: string;
  contactPhoneE164: string;
  title: string;
  payloadJson: string;
  unreadCount: number;
  lastMessageAt?: string;
  lastMessageUtc?: string;
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para request de envio (alinhada com o backend)
export interface SendMessageRequestDto {
  text: string;
  clientMessageId: string;
  attachment?: {
    dataUrl: string;
    mimeType: string;
    fileName?: string;
    mediaType?: 'image' | 'file' | 'audio';
  };
}

// Interface para response de envio (alinhada com o backend)
export interface SendMessageResponseDto {
  success: boolean;
  message: ChatMessageDto;
}

// Função para converter enum do backend para string do frontend
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
    default: return MessageStatus.Sending;
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

// Função para converter ChatMessageDto do backend para formato do frontend
export const convertBackendMessage = (backendMessage: BackendMessageDto): ChatMessageDto => {
  const direction = mapBackendDirection(backendMessage.direction || 'In');
  
  return {
    id: backendMessage.id || backendMessage.clientMessageId || '',
    conversationId: backendMessage.conversationId,
    direction: direction,
    type: mapBackendType(backendMessage.type || 'Text'),
    body: backendMessage.body || backendMessage.text || '',
    mediaUrl: backendMessage.mediaUrl,
    fileName: backendMessage.fileName,
    clientMessageId: backendMessage.clientMessageId,
    whatsAppMessageId: backendMessage.whatsAppMessageId,
    status: mapBackendStatus(backendMessage.status || 'Delivered'),
    internalNote: backendMessage.internalNote,
    createdAt: backendMessage.createdAt || backendMessage.ts || new Date().toISOString(),
    updatedAt: backendMessage.updatedAt,
    
    // Campos de compatibilidade
    externalMessageId: backendMessage.externalMessageId,
    text: backendMessage.body || backendMessage.text || '',
    ts: backendMessage.createdAt || backendMessage.ts || new Date().toISOString(),
    fromMe: direction === MessageDirection.Out, // Determinar se é mensagem do usuário
    attachment: backendMessage.mediaUrl ? {
      dataUrl: backendMessage.mediaUrl,
      mimeType: backendMessage.mimeType || 'application/octet-stream',
      fileName: backendMessage.fileName
    } : null
  };
};

// Função para converter ChatLog do backend para ChatListItem do frontend
export const convertBackendChatLog = (backendChatLog: BackendChatLogDto): ChatListItem => {
  return {
    id: backendChatLog.chatId, // Usar chatId como ID principal
    title: backendChatLog.title,
    lastMessagePreview: backendChatLog.lastMessagePreview,
    unreadCount: backendChatLog.unreadCount,
    lastMessageAt: backendChatLog.lastMessageAt || backendChatLog.updatedAt,
    contactPhoneE164: backendChatLog.contactPhoneE164
  };
};

// Cache para evitar requisições duplicadas e loops infinitos
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

export const chatsApi = {
  list: async (search = '', page = 1, pageSize = 20) => {
    const cacheKey = getCacheKey('GET', '/chats', { search, page, pageSize });
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    const { data } = await api.get('/chats', { params: { search, page, pageSize } });
    // Converter ChatLog do backend para ChatListItem do frontend
    const convertedItems = data.items?.map(convertBackendChatLog) || [];
    const result = { items: convertedItems, total: data.total } as { items: ChatListItem[]; total: number };
    
    saveToCache(cacheKey, result);
    return result;
  },
  history: async (id: string, cursorTs?: number, limit = 50) => {
    const cacheKey = getCacheKey('GET', `/chats/${id}/messages`, { cursorTs, limit });
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    const { data } = await api.get(`/chats/${id}/messages`, { params: { cursorTs, limit } });
    // Converter mensagens do backend para o formato do frontend
    const convertedMessages = data.messages?.map(convertBackendMessage) || [];
    const result = { messages: convertedMessages, nextCursor: data.nextCursor } as ChatHistoryResponse;
    
    saveToCache(cacheKey, result);
    return result;
  },
  send: async (id: string, text: string, clientMessageId: string, attachment?: { dataUrl: string; mimeType: string; fileName?: string; mediaType?: 'image' | 'file' | 'audio' }) => {
    const request: SendMessageRequestDto = { text, clientMessageId, attachment };
    const { data } = await api.post(`/chats/${id}/send`, request); // Corrigido para usar /send
    // Converter a resposta do backend para ChatMessageDto
    const response = data as { success: boolean; message: BackendMessageDto };
    return {
      success: response.success,
      message: convertBackendMessage(response.message)
    } as SendMessageResponseDto;
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
