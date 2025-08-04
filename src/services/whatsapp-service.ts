
import { WhatsAppConnection, WhatsAppMessage, TalentChat } from '@/types/whatsapp'

// Mock WhatsApp connection state
let connectionState: WhatsAppConnection = {
  isConnected: false,
  status: 'disconnected'
}

// Mock conversations storage
const conversations = new Map<string, TalentChat>()

// Mock QR codes for testing
const mockQRCodes = [
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA4849JgAAAABJRU5ErkJggg=='
]

export class WhatsAppService {
  private static instance: WhatsAppService
  private eventListeners: Map<string, Function[]> = new Map()

  private constructor() {}

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService()
    }
    return WhatsAppService.instance
  }

  // Event system for real-time updates
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  // Generate mock QR code
  async generateQRCode(): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    const randomQR = mockQRCodes[Math.floor(Math.random() * mockQRCodes.length)]
    
    connectionState = {
      isConnected: false,
      status: 'qr_ready',
      qrCode: randomQR
    }
    
    this.emit('connection_update', connectionState)
    
    // Auto-connect after 5 seconds for demo
    setTimeout(() => {
      this.simulateConnection()
    }, 5000)
    
    return randomQR
  }

  // Simulate WhatsApp connection
  private simulateConnection() {
    connectionState = {
      isConnected: true,
      status: 'connected',
      sessionId: `session_${Date.now()}`
    }
    
    this.emit('connection_update', connectionState)
    
    // Start receiving random messages
    this.startReceivingMessages()
  }

  // Disconnect from WhatsApp
  async disconnect(): Promise<void> {
    connectionState = {
      isConnected: false,
      status: 'disconnected'
    }
    
    this.emit('connection_update', connectionState)
  }

  // Get current connection status
  getConnectionStatus(): WhatsAppConnection {
    return { ...connectionState }
  }

  // Send message to talent
  async sendMessage(talentId: string, content: string, type: 'text' | 'image' | 'audio' | 'file' = 'text', file?: any): Promise<WhatsAppMessage> {
    if (!connectionState.isConnected) {
      throw new Error('WhatsApp not connected')
    }

    const message: WhatsAppMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      type,
      sender: 'operator',
      timestamp: new Date().toISOString(),
      status: 'sending',
      file: file ? {
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size
      } : undefined
    }

    // Get or create conversation
    let conversation = conversations.get(talentId)
    if (!conversation) {
      // This should not happen, but create a basic conversation
      conversation = {
        talentId,
        talentName: 'Talent',
        talentPhone: '11999999999',
        messages: [],
        unreadCount: 0,
        isOnline: true
      }
      conversations.set(talentId, conversation)
    }

    conversation.messages.push(message)
    conversation.lastMessage = message

    this.emit('message_sent', { talentId, message })

    // Simulate message status updates
    setTimeout(() => {
      message.status = 'sent'
      this.emit('message_status_update', { talentId, message })
    }, 500)

    setTimeout(() => {
      message.status = 'delivered'
      this.emit('message_status_update', { talentId, message })
    }, 1000)

    setTimeout(() => {
      message.status = 'read'
      this.emit('message_status_update', { talentId, message })
    }, 2000)

    return message
  }

  // Get conversation with talent
  getConversation(talentId: string): TalentChat | null {
    return conversations.get(talentId) || null
  }

  // Initialize conversation for talent
  initializeConversation(talentId: string, talentName: string, talentPhone: string): TalentChat {
    let conversation = conversations.get(talentId)
    
    if (!conversation) {
      conversation = {
        talentId,
        talentName,
        talentPhone,
        messages: [],
        unreadCount: 0,
        isOnline: Math.random() > 0.3 // 70% chance of being online
      }
      conversations.set(talentId, conversation)
    }

    return conversation
  }

  // Start receiving random messages for demo
  private startReceivingMessages() {
    const receiveMessage = () => {
      if (!connectionState.isConnected) return

      const conversationEntries = Array.from(conversations.entries())
      if (conversationEntries.length === 0) return

      // Random conversation
      const [talentId, conversation] = conversationEntries[Math.floor(Math.random() * conversationEntries.length)]
      
      // Random message content
      const mockMessages = [
        'Olá! Tudo bem?',
        'Quando será o próximo trabalho?',
        'Obrigado pelo contato!',
        'Posso confirmar o horário?',
        'Estou disponível amanhã',
        'Muito obrigado!'
      ]

      const message: WhatsAppMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: mockMessages[Math.floor(Math.random() * mockMessages.length)],
        type: 'text',
        sender: 'talent',
        timestamp: new Date().toISOString(),
        status: 'delivered'
      }

      conversation.messages.push(message)
      conversation.lastMessage = message
      conversation.unreadCount++

      this.emit('message_received', { talentId, message })

      // Schedule next random message (10-30 seconds)
      setTimeout(receiveMessage, Math.random() * 20000 + 10000)
    }

    // Start receiving messages after 5 seconds
    setTimeout(receiveMessage, 5000)
  }

  // Mark conversation as read
  markAsRead(talentId: string) {
    const conversation = conversations.get(talentId)
    if (conversation) {
      conversation.unreadCount = 0
      this.emit('conversation_read', { talentId })
    }
  }

  // Get all conversations
  getAllConversations(): TalentChat[] {
    return Array.from(conversations.values()).sort((a, b) => {
      const aTime = a.lastMessage?.timestamp || '0'
      const bTime = b.lastMessage?.timestamp || '0'
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
  }
}

export const whatsAppService = WhatsAppService.getInstance()
