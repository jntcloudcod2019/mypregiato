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
  timeout: 30000,  // Aumentar timeout para 30 segundos para histórico
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

// Remover enum duplicado - usar o de @/types/message
import { MessageType } from '@/types/message';

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
    mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'voice' | 'sticker' | 'location' | 'contact' | 'system';
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

// Interface para mensagem do backend (formato MessageInfo do ChatLogService)
export interface BackendMessageInfoDto {
  Id: string;
  Content?: string;
  MediaUrl?: string;
  Direction: string;
  Ts: string | Date;
  IsRead?: boolean;
  Status?: string;
  Type?: string;
}

// Interface para mensagem do backend (formato original)
export interface BackendMessageDto {
  id?: string;
  conversationId?: string;
  direction?: string;
  type?: string;
  body?: string;
  text?: string;
  mediaUrl?: string;
  fileName?: string;
  clientMessageId?: string;
  whatsAppMessageId?: string;
  externalMessageId?: string;
  status?: string;
  internalNote?: string;
  createdAt?: string;
  ts?: string;
  updatedAt?: string;
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
    mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'voice' | 'sticker' | 'location' | 'contact' | 'system';
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
  console.log('🔍 mapBackendType chamado com:', type);
  
  switch (type?.toLowerCase()) {
    case 'text': return MessageType.Text;      // 0
    case 'image': return MessageType.Image;    // 1
    case 'audio': return MessageType.Audio;    // 2
    case 'document': return MessageType.Document; // 3
    case 'video': return MessageType.Video;    // 4
    case 'voice': return MessageType.Voice;    // 5
    case 'sticker': return MessageType.Sticker; // 6
    case 'location': return MessageType.Location; // 7
    case 'contact': return MessageType.Contact; // 8
    case 'system': return MessageType.System;  // 9
    default: 
      console.warn('⚠️ Tipo não reconhecido:', type, 'retornando Text');
      return MessageType.Text;
  }
};

// Função para converter ChatMessageDto do backend para formato do frontend
export const convertBackendMessage = (backendMessage: BackendMessageDto | BackendMessageInfoDto): ChatMessageDto => {
  // CORREÇÃO: Verificar se é o novo formato híbrido do ChatsController
  if ('text' in backendMessage && 'attachment' in backendMessage && 'timestamp' in backendMessage) {
    // Novo formato híbrido do ChatsController (PayloadJson convertido)
    const hybridMessage = backendMessage as BackendMessageDto & { 
      attachment?: { dataUrl?: string; mimeType?: string; fileName?: string };
      timestamp?: string;
      fromMe?: boolean;
      isFromMe?: boolean;
    };
    const direction = hybridMessage.direction === 'Out' ? MessageDirection.Out : MessageDirection.In;
    
    return {
      id: hybridMessage.id || hybridMessage.externalMessageId || '',
      conversationId: hybridMessage.conversationId || '',
      direction: direction,
      type: mapBackendType(hybridMessage.type || 'text'),
      body: hybridMessage.body || hybridMessage.text || '', // body contém base64 para áudio
      mediaUrl: hybridMessage.mediaUrl || '',
      fileName: hybridMessage.fileName || hybridMessage.attachment?.fileName || '',
      clientMessageId: hybridMessage.clientMessageId || hybridMessage.id || '',
      whatsAppMessageId: hybridMessage.whatsAppMessageId || '',
      status: mapBackendStatus(hybridMessage.status || 'Delivered'),
      internalNote: hybridMessage.internalNote || '',
      createdAt: hybridMessage.createdAt || hybridMessage.timestamp || new Date().toISOString(),
      updatedAt: hybridMessage.updatedAt || '',
      
      // Campos de compatibilidade
      externalMessageId: hybridMessage.externalMessageId || hybridMessage.id || '',
      text: hybridMessage.text || hybridMessage.body || '', // IMPORTANTE: Para áudio, text pode ser ocultado pelo isMediaOnlyContent
      ts: hybridMessage.ts || hybridMessage.timestamp || hybridMessage.createdAt || new Date().toISOString(),
      fromMe: hybridMessage.fromMe || hybridMessage.isFromMe || direction === MessageDirection.Out,
      
      // CRÍTICO: Preservar attachment com base64 para áudio
      attachment: hybridMessage.attachment ? {
        dataUrl: hybridMessage.attachment.dataUrl || '', // Base64 completo com prefixo data:
        mimeType: hybridMessage.attachment.mimeType || 'application/octet-stream',
        fileName: hybridMessage.attachment.fileName || ''
      } : null
    };
  }
  
  // Verificar se é o formato MessageInfo do ChatLogService (legacy)
  if ('Id' in backendMessage && 'Content' in backendMessage) {
    // Formato MessageInfo do ChatLogService
    const messageInfo = backendMessage as BackendMessageInfoDto;
    const direction = messageInfo.Direction === 'outbound' ? MessageDirection.Out : MessageDirection.In;
    
    return {
      id: messageInfo.Id || '',
      conversationId: '', // Será preenchido pelo contexto
      direction: direction,
      type: mapBackendType(messageInfo.Type || 'Text'),
      body: messageInfo.Content || '',
      mediaUrl: messageInfo.MediaUrl,
      fileName: undefined,
      clientMessageId: messageInfo.Id || '',
      whatsAppMessageId: undefined,
      status: mapBackendStatus(messageInfo.Status || 'Delivered'),
      internalNote: undefined,
      createdAt: messageInfo.Ts ? new Date(messageInfo.Ts).toISOString() : new Date().toISOString(),
      updatedAt: undefined,
      
      // Campos de compatibilidade
      externalMessageId: messageInfo.Id || '',
      text: messageInfo.Content || '',
      ts: messageInfo.Ts ? new Date(messageInfo.Ts).toISOString() : new Date().toISOString(),
      fromMe: direction === MessageDirection.Out,
      attachment: messageInfo.MediaUrl ? {
        dataUrl: messageInfo.MediaUrl,
        mimeType: 'application/octet-stream',
        fileName: undefined
      } : null
    };
  }
  
  // Formato original BackendMessageDto
  const messageDto = backendMessage as BackendMessageDto;
  const direction = mapBackendDirection(messageDto.direction || 'In');
  
  return {
    id: messageDto.id || messageDto.clientMessageId || '',
    conversationId: messageDto.conversationId || '',
    direction: direction,
    type: mapBackendType(messageDto.type || 'Text'),
    body: messageDto.body || messageDto.text || '',
    mediaUrl: messageDto.mediaUrl,
    fileName: messageDto.fileName,
    clientMessageId: messageDto.clientMessageId || '',
    whatsAppMessageId: messageDto.whatsAppMessageId,
    status: mapBackendStatus(messageDto.status || 'Delivered'),
    internalNote: messageDto.internalNote,
    createdAt: messageDto.createdAt || messageDto.ts || new Date().toISOString(),
    updatedAt: messageDto.updatedAt,
    
    // Campos de compatibilidade
    externalMessageId: messageDto.externalMessageId,
    text: messageDto.body || messageDto.text || '',
    ts: messageDto.createdAt || messageDto.ts || new Date().toISOString(),
    fromMe: direction === MessageDirection.Out,
    attachment: messageDto.mediaUrl ? {
      dataUrl: messageDto.mediaUrl,
      mimeType: messageDto.mimeType || 'application/octet-stream',
      fileName: messageDto.fileName
    } : null
  };
};

// ✅ MAPEADOR COMPLETO DE TIPOS DE MÍDIA (Frontend ↔ Backend)
export const MediaTypeMapper = {
  // Mapeamento Frontend → Backend
  frontendToBackend: {
    'text': 'text',
    'image': 'image',
    'video': 'video',
    'audio': 'audio',
    'document': 'document',
    'voice': 'voice',
    'sticker': 'sticker',
    'location': 'location',
    'contact': 'contact',
    'system': 'system'
  },
  
  // Mapeamento Backend → Frontend
  backendToFrontend: {
    'text': 'text',
    'image': 'image',
    'video': 'video',
    'audio': 'audio',
    'document': 'document',
    'voice': 'voice',
    'sticker': 'sticker',
    'location': 'location',
    'contact': 'contact',
    'system': 'system'
  },
  
  // Validar tipo de mídia
  isValid: (mediaType: string): boolean => {
    const validTypes = ['text', 'image', 'video', 'audio', 'document', 'voice', 'sticker', 'location', 'contact', 'system'];
    return validTypes.includes(mediaType.toLowerCase());
  },
  
  // Obter MIME type padrão baseado no tipo
  getDefaultMimeType: (mediaType: string): string => {
    const type = mediaType.toLowerCase();
    switch (type) {
      case 'image':
        return 'image/jpeg';
      case 'video':
        return 'video/mp4';
      case 'audio':
        return 'audio/mpeg';
      case 'voice':
        return 'audio/ogg';
      case 'document':
        return 'application/pdf';
      case 'sticker':
        return 'image/webp';
      case 'location':
        return 'application/json';
      case 'contact':
        return 'application/json';
      case 'system':
        return 'text/plain';
      default:
        return 'text/plain';
    }
  }
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
  send: async (id: string, text: string, clientMessageId: string, attachment?: { dataUrl: string; mimeType: string; fileName?: string; mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'voice' | 'sticker' | 'location' | 'contact' | 'system' }) => {
    // ✅ VALIDAÇÃO E NORMALIZAÇÃO DE TIPOS DE MÍDIA
    let normalizedAttachment = attachment;
    
    if (attachment) {
      // Validar tipo de mídia
      if (!MediaTypeMapper.isValid(attachment.mediaType || 'text')) {
        console.warn(`⚠️ Tipo de mídia inválido: ${attachment.mediaType}, usando 'text' como padrão`);
        attachment.mediaType = 'text';
      }
      
      // Normalizar MIME type se não fornecido
      if (!attachment.mimeType) {
        attachment.mimeType = MediaTypeMapper.getDefaultMimeType(attachment.mediaType || 'text');
        console.log(`🔧 MIME type normalizado para ${attachment.mediaType}: ${attachment.mimeType}`);
      }
      
      // Validar dataUrl para tipos de mídia
      if (attachment.mediaType !== 'text' && !attachment.dataUrl) {
        throw new Error(`DataUrl é obrigatório para tipo de mídia: ${attachment.mediaType}`);
      }
      
      normalizedAttachment = {
        ...attachment,
        mediaType: attachment.mediaType || 'text',
        mimeType: attachment.mimeType || MediaTypeMapper.getDefaultMimeType(attachment.mediaType || 'text')
      };
    }
    
    const request: SendMessageRequestDto = { 
      text, 
      clientMessageId, 
      attachment: normalizedAttachment 
    };
    
    console.log(`📤 [FLUXO X] Enviando mensagem via frontend:`, {
      chatId: id,
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      mediaType: normalizedAttachment?.mediaType || 'text',
      mimeType: normalizedAttachment?.mimeType,
      hasAttachment: !!normalizedAttachment
    });
    
    try {
      // Usar o endpoint correto que salva no PayloadJson do ChatLogs
      const { data } = await api.post(`/chats/${id}/send`, request);
      
      // Tornar resiliente a diferentes formatos de resposta
      let response: SendMessageResponseDto;
      
      if (data.success !== undefined) {
        // Formato padrão: { success: boolean, message: BackendMessageDto }
        response = {
          success: data.success,
          message: data.message ? convertBackendMessage(data.message) : {
            id: clientMessageId,
            direction: MessageDirection.Out,
            type: MessageType.Text,
            body: text,
            status: MessageStatus.Sent,
            createdAt: new Date().toISOString(),
            text: text,
            ts: new Date().toISOString(),
            fromMe: true
          } as ChatMessageDto
        };
      } else if (data.messageId) {
        // Formato alternativo: { messageId: string }
        response = {
          success: true,
          message: {
            id: data.messageId || clientMessageId,
            direction: MessageDirection.Out,
            type: MessageType.Text,
            body: text,
            status: MessageStatus.Sent,
            createdAt: new Date().toISOString(),
            text: text,
            ts: new Date().toISOString(),
            fromMe: true
          } as ChatMessageDto
        };
      } else {
        // Formato genérico - assumir sucesso
        response = {
          success: true,
          message: {
            id: clientMessageId,
            direction: MessageDirection.Out,
            type: MessageType.Text,
            body: text,
            status: MessageStatus.Sent,
            createdAt: new Date().toISOString(),
            text: text,
            ts: new Date().toISOString(),
            fromMe: true
          } as ChatMessageDto
        };
      }
      
      return response;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Retornar resposta de erro resiliente
      return {
        success: false,
        message: {
          id: clientMessageId,
          direction: MessageDirection.Out,
          type: MessageType.Text,
          body: text,
          status: MessageStatus.Failed,
          createdAt: new Date().toISOString(),
          text: text,
          ts: new Date().toISOString(),
          fromMe: true
        } as ChatMessageDto
      };
    }
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
