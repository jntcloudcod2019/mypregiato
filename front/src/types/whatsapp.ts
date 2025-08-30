
// Importar da interface unificada
import { MessageDto, MessageType, MessageStatus } from './message';

// Interface legada mantida para compatibilidade
export interface WhatsAppMessage extends Partial<MessageDto> {
  /** @deprecated Use MessageDto instead */
  content?: string;
  /** @deprecated Use type from MessageDto enum */
  sender?: 'operator' | 'talent';
  /** @deprecated Use MessageDto file properties */
  file?: {
    name: string;
    url: string;
    type: string;
    size?: number;
  };
}

export interface WhatsAppConnection {
  isConnected: boolean
  qrCode?: string
  status: 'disconnected' | 'qr_ready' | 'connecting' | 'connected'
  sessionId?: string
  lastActivity?: string
}

export interface TalentChat {
  talentId: string
  talentName: string
  talentPhone: string
  messages: WhatsAppMessage[]
  lastMessage?: WhatsAppMessage
  unreadCount: number
  isOnline: boolean
}

export interface CurrentUser {
  id: string
  email: string
  fullName: string
  role: string
}
