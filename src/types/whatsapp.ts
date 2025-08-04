
export interface WhatsAppMessage {
  id: string
  content: string
  type: 'text' | 'image' | 'audio' | 'file'
  sender: 'operator' | 'talent'
  timestamp: string
  status: 'sending' | 'sent' | 'delivered' | 'read'
  file?: {
    name: string
    url: string
    type: string
    size?: number
  }
}

export interface WhatsAppConnection {
  isConnected: boolean
  qrCode?: string
  status: 'disconnected' | 'qr_ready' | 'connecting' | 'connected'
  sessionId?: string
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
