/**
 * ============================================================================
 * CONTRATOS UNIFICADOS DE MENSAGENS - ALINHADO COM BACKEND .NET
 * ============================================================================
 * 
 * Esta interface está 100% alinhada com MessageDto do backend (.NET)
 * Suporta todos os tipos de mensagem: texto, mídia, localização, contatos, etc.
 * 
 * IMPORTANTE: Manter sincronização com back/Pregiato.Application/DTOs/MessageDto.cs
 * ============================================================================
 */

// === ENUMS ALINHADOS COM BACKEND ===

export enum MessageDirection {
  In = 0,
  Out = 1
}

export enum MessageType {
  Text = 0,
  Image = 1,
  Audio = 2,
  Document = 3,
  Video = 4,
  Voice = 5,       // Nota de voz
  Sticker = 6,     // Figurinha
  Location = 7,    // Localização
  Contact = 8,     // Contato compartilhado
  System = 9       // Mensagem do sistema
}

export enum MessageStatus {
  Queued = 0,
  Sending = 1,
  Sent = 2,
  Delivered = 3,
  Read = 4,
  Failed = 5
}

// === INTERFACE PRINCIPAL UNIFICADA ===

/**
 * Interface MessageDto unificada - 100% compatível com backend
 * Suporta todos os tipos de mensagem com campos opcionais flexíveis
 */
export interface MessageDto {
  // === CAMPOS OBRIGATÓRIOS ===
  id: string;
  conversationId: string;
  direction: MessageDirection;
  type: MessageType;
  createdAt: string;
  status: MessageStatus;
  fromMe: boolean;
  isGroup: boolean;

  // === IDENTIFICAÇÃO DO REMETENTE ===
  senderId?: string;
  fromNormalized?: string;
  fromOriginal?: string;

  // === CONTEÚDO (NULLABLE) ===
  text?: string;  // Renomeado de Body para Text

  // === MÍDIA (NULLABLE) ===
  mediaUrl?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  duration?: number;
  thumbnail?: string;

  // === LOCALIZAÇÃO (NULLABLE) ===
  latitude?: number;
  longitude?: number;
  locationAddress?: string;

  // === CONTATO (NULLABLE) ===
  contactName?: string;
  contactPhone?: string;

  // === METADADOS ===
  metadata?: Record<string, unknown>;  // JSON flexível
  chatId?: string;

  // === IDENTIFICADORES EXTERNOS ===
  externalMessageId?: string;
  clientMessageId?: string;
  whatsAppMessageId?: string;

  // === SISTEMA ===
  sessionId?: string;
  internalNote?: string;
  updatedAt?: string;

  // === CAMPOS COMPUTADOS ===
  hasMedia?: boolean;
  hasLocation?: boolean;
  hasContact?: boolean;
  typeDescription?: string;
  preview?: string;

  // === ANEXOS/ARQUIVOS ===
  attachment?: {
    dataUrl: string;
    mimeType: string;
    fileName?: string;
  } | null;

  // === COMPATIBILIDADE LEGADA (DEPRECATED) ===
  /** @deprecated Use text instead */
  body?: string;
  /** @deprecated Use text instead */
  content?: string;
  /** @deprecated Use createdAt instead */
  ts?: string;
}

// === DTOs ESPECIALIZADOS PARA CRIAÇÃO ===

/**
 * DTO para criação de mensagens de texto
 */
export interface CreateTextMessageDto {
  conversationId: string;
  text: string;
  chatId?: string;
  fromNormalized?: string;
  fromMe?: boolean;
  isGroup?: boolean;
}

/**
 * DTO para criação de mensagens com mídia
 */
export interface CreateMediaMessageDto {
  conversationId: string;
  type: MessageType;
  text?: string;  // Legenda
  mediaUrl: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  duration?: number;
  thumbnail?: string;
  chatId?: string;
  fromNormalized?: string;
  fromMe?: boolean;
  isGroup?: boolean;
}

/**
 * DTO para criação de mensagens de localização
 */
export interface CreateLocationMessageDto {
  conversationId: string;
  latitude: number;
  longitude: number;
  locationAddress?: string;
  chatId?: string;
  fromNormalized?: string;
  fromMe?: boolean;
  isGroup?: boolean;
}

/**
 * DTO para criação de mensagens de contato
 */
export interface CreateContactMessageDto {
  conversationId: string;
  contactName: string;
  contactPhone: string;
  chatId?: string;
  fromNormalized?: string;
  fromMe?: boolean;
  isGroup?: boolean;
}

/**
 * DTO para atualização de status de mensagem
 */
export interface UpdateMessageDto {
  status?: MessageStatus;
  whatsAppMessageId?: string;
  internalNote?: string;
}

// === DTOs PARA WHATSAPP INCOMING ===

/**
 * DTO para mensagens recebidas do WhatsApp via RabbitMQ
 */
export interface WhatsAppIncomingMessageDto {
  externalMessageId: string;
  from: string;
  fromNormalized: string;
  to: string;
  type: string;
  timestamp: string;
  instanceId: string;
  fromMe: boolean;
  isGroup: boolean;
  body?: string;
  chatId: string;
  attachment?: WhatsAppAttachmentDto;
  location?: WhatsAppLocationDto;
  contact?: WhatsAppContactDto;
  simulated?: boolean;
}

export interface WhatsAppAttachmentDto {
  dataUrl?: string;
  mediaUrl?: string;
  mimeType?: string;
  fileName?: string;
  mediaType?: string;
  fileSize?: number;
  duration?: number;
  width?: number;
  height?: number;
  thumbnail?: string;
}

export interface WhatsAppLocationDto {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface WhatsAppContactDto {
  name: string;
  phone?: string;
}

// === UTILITÁRIOS ===

/**
 * Utilitários para trabalhar com mensagens
 */
export class MessageUtils {
  /**
   * Converte MessageType enum para string legível
   */
  static getTypeDescription(type: MessageType): string {
    switch (type) {
      case MessageType.Text: return 'Texto';
      case MessageType.Image: return 'Imagem';
      case MessageType.Video: return 'Vídeo';
      case MessageType.Audio: return 'Áudio';
      case MessageType.Voice: return 'Nota de Voz';
      case MessageType.Document: return 'Documento';
      case MessageType.Sticker: return 'Figurinha';
      case MessageType.Location: return 'Localização';
      case MessageType.Contact: return 'Contato';
      case MessageType.System: return 'Sistema';
      default: return 'Desconhecido';
    }
  }

  /**
   * Gera preview da mensagem baseado no tipo
   */
  static getPreview(message: MessageDto): string {
    switch (message.type) {
      case MessageType.Text:
        return message.text?.substring(0, 100) || '';
      case MessageType.Image:
        return '📷 Imagem';
      case MessageType.Video:
        return '🎬 Vídeo';
      case MessageType.Audio:
        return '🎵 Áudio';
      case MessageType.Voice:
        return '🎤 Nota de Voz';
      case MessageType.Document:
        return `📄 ${message.fileName || 'Documento'}`;
      case MessageType.Sticker:
        return '😀 Figurinha';
      case MessageType.Location:
        return `📍 ${message.locationAddress || 'Localização'}`;
      case MessageType.Contact:
        return `👤 ${message.contactName || 'Contato'}`;
      case MessageType.System:
        return '⚙️ Sistema';
      default:
        return '❓ Desconhecido';
    }
  }

  /**
   * Verifica se a mensagem tem mídia
   */
  static hasMedia(message: MessageDto): boolean {
    return !!(message.mediaUrl && message.mediaUrl.trim());
  }

  /**
   * Verifica se a mensagem tem localização
   */
  static hasLocation(message: MessageDto): boolean {
    return !!(message.latitude && message.longitude);
  }

  /**
   * Verifica se a mensagem tem contato
   */
  static hasContact(message: MessageDto): boolean {
    return !!(message.contactName && message.contactName.trim());
  }

  /**
   * Mapeia mensagem legada para nova interface (compatibilidade)
   */
  static fromLegacyMessage(legacy: LegacyMessage): MessageDto {
    return {
      id: legacy.id || '',
      conversationId: legacy.conversationId || legacy.chatId || '',
      direction: legacy.isFromMe ? MessageDirection.Out : MessageDirection.In,
      type: this.mapLegacyType(legacy.type),
      createdAt: legacy.timestamp || legacy.createdAt || new Date().toISOString(),
      status: MessageStatus.Sent,
      fromMe: legacy.isFromMe || legacy.fromMe || false,
      isGroup: legacy.isGroup || false,
      text: legacy.body || legacy.content || legacy.text,
      mediaUrl: legacy.mediaUrl || legacy.file?.url,
      fileName: legacy.fileName || legacy.file?.name,
      mimeType: legacy.mimeType || legacy.file?.type,
      size: legacy.size || legacy.file?.size,
      fromNormalized: legacy.from || legacy.fromNormalized,
      chatId: legacy.chatId
    };
  }

  /**
   * Mapeia tipo legado para novo enum
   */
  private static mapLegacyType(type: string): MessageType {
    switch (type?.toLowerCase()) {
      case 'text':
      case 'chat':
        return MessageType.Text;
      case 'image':
        return MessageType.Image;
      case 'video':
        return MessageType.Video;
      case 'audio':
        return MessageType.Audio;
      case 'voice':
      case 'ptt':
        return MessageType.Voice;
      case 'document':
      case 'file':
        return MessageType.Document;
      case 'sticker':
        return MessageType.Sticker;
      case 'location':
        return MessageType.Location;
      case 'contact':
        return MessageType.Contact;
      case 'system':
        return MessageType.System;
      default:
        return MessageType.Text;
    }
  }
}

// === COMPATIBILIDADE LEGADA ===

/**
 * Interface para mensagens legadas durante conversão
 */
export interface LegacyMessage {
  id?: string;
  conversationId?: string;
  chatId?: string;
  isFromMe?: boolean;
  fromMe?: boolean;
  isGroup?: boolean;
  body?: string;
  content?: string;
  text?: string;
  timestamp?: string;
  createdAt?: string;
  type?: string;
  mediaUrl?: string;
  file?: {
    url?: string;
    name?: string;
    type?: string;
    size?: number;
  };
  fileName?: string;
  mimeType?: string;
  size?: number;
  from?: string;
  fromNormalized?: string;
}

/**
 * @deprecated Use MessageDto instead
 */
export interface WhatsAppMessage extends Partial<MessageDto> {
  content?: string;
}

/**
 * @deprecated Use MessageDto instead
 */
export interface ChatMessageDto extends Partial<MessageDto> {
  body?: string;
}
