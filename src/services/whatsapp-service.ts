import { WhatsAppConnection, WhatsAppMessage, TalentChat } from '@/types/whatsapp'

// WhatsApp connection state
let connectionState: WhatsAppConnection = {
  isConnected: false,
  status: 'disconnected'
}

// Conversations storage
const conversations = new Map<string, TalentChat>()

// Simulate WhatsApp Web client info
let clientInfo: { number?: string; name?: string } = {}

export class WhatsAppService {
  private static instance: WhatsAppService
  private eventListeners: Map<string, Function[]> = new Map()
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 3
  private qrRetryCount: number = 0

  private constructor() {
    this.initializeClientSimulation()
  }

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService()
    }
    return WhatsAppService.instance
  }

  // Event system
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

  // Initialize WhatsApp client simulation
  private initializeClientSimulation() {
    console.log('🚀 Inicializando cliente WhatsApp...')
    
    // Simulate client initialization
    setTimeout(() => {
      this.emit('client_ready', { message: 'Cliente WhatsApp inicializado' })
    }, 1000)
  }

  // Generate QR Code using external service (simulating real QR generation)
  async generateQRCode(): Promise<string> {
    try {
      console.log('📱 Gerando QR Code...')
      
      connectionState = {
        isConnected: false,
        status: 'qr_ready',
        qrCode: undefined
      }
      this.emit('connection_update', connectionState)

      await new Promise(resolve => setTimeout(resolve, 1500))

      // Simulate QR generation like the real whatsapp-web.js
      const qrContent = `2@${Date.now()},${Math.random().toString(36).substr(2, 9)},${Math.random().toString(36).substr(2, 9)}`
      
      // Generate QR code using a real service (simulated)
      const qrCodeDataURL = await this.generateQRImage(qrContent)
      
      connectionState = {
        isConnected: false,
        status: 'qr_ready',
        qrCode: qrCodeDataURL
      }

      this.emit('connection_update', connectionState)
      console.log('✅ QR Code gerado com sucesso')

      // Simulate QR expiration (like real WhatsApp)
      setTimeout(() => {
        if (connectionState.status === 'qr_ready' && !connectionState.isConnected) {
          this.qrRetryCount++
          if (this.qrRetryCount < 3) {
            console.log('⏰ QR Code expirou, gerando novo...')
            this.generateQRCode()
          } else {
            console.log('❌ Muitas tentativas de QR, resetando...')
            this.resetConnection()
          }
        }
      }, 60000) // QR expires in 60 seconds

      // Simulate scanning after random time (for demo)
      if (Math.random() > 0.3) { // 70% chance of auto-connection for demo
        setTimeout(() => {
          if (connectionState.status === 'qr_ready') {
            this.simulateQRScan()
          }
        }, Math.random() * 10000 + 3000) // 3-13 seconds
      }

      return qrCodeDataURL
    } catch (error) {
      console.error('❌ Erro ao gerar QR Code:', error)
      connectionState = {
        isConnected: false,
        status: 'disconnected'
      }
      this.emit('connection_update', connectionState)
      throw new Error('Falha ao gerar QR Code')
    }
  }

  // Generate QR image (simulating QR generation)
  private async generateQRImage(content: string): Promise<string> {
    // In a real implementation, this would use a QR library
    // For now, we'll generate a mock QR code image
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 256
    canvas.height = 256
    
    if (ctx) {
      // Generate a simple pattern representing a QR code
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 256, 256)
      ctx.fillStyle = '#000000'
      
      // Create QR-like pattern
      for (let i = 0; i < 256; i += 8) {
        for (let j = 0; j < 256; j += 8) {
          if (Math.random() > 0.5) {
            ctx.fillRect(i, j, 8, 8)
          }
        }
      }
    }
    
    return canvas.toDataURL()
  }

  // Simulate QR scan and connection
  private async simulateQRScan() {
    console.log('📱 QR Code escaneado! Conectando...')
    
    connectionState = {
      isConnected: false,
      status: 'connecting'
    }
    this.emit('connection_update', connectionState)

    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulate successful connection
    clientInfo = {
      number: '5511999999999',
      name: 'Operador WhatsApp'
    }

    connectionState = {
      isConnected: true,
      status: 'connected',
      sessionId: `session_${Date.now()}`
    }

    this.emit('connection_update', connectionState)
    console.log('✅ WhatsApp conectado com sucesso!')

    // Start message listeners
    this.startMessageHandling()
  }

  // Start handling incoming messages
  private startMessageHandling() {
    // Simulate incoming messages
    const receiveRandomMessage = () => {
      if (!connectionState.isConnected) return

      const conversationEntries = Array.from(conversations.entries())
      if (conversationEntries.length === 0) return

      // Random conversation
      const [talentId, conversation] = conversationEntries[Math.floor(Math.random() * conversationEntries.length)]
      
      const mockMessages = [
        'Olá! Tudo bem?',
        'Quando será o próximo trabalho?',
        'Obrigado pelo contato!',
        'Posso confirmar o horário?',
        'Estou disponível amanhã',
        'Muito obrigado!',
        '👍',
        'Perfeito!',
        'Entendi, obrigada!'
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

      // Schedule next message
      setTimeout(receiveRandomMessage, Math.random() * 30000 + 15000) // 15-45 seconds
    }

    // Start receiving messages after 5 seconds
    setTimeout(receiveRandomMessage, 5000)
  }

  // Send message to talent
  async sendMessage(talentId: string, content: string, type: 'text' | 'image' | 'audio' | 'file' = 'text', file?: any): Promise<WhatsAppMessage> {
    if (!connectionState.isConnected) {
      throw new Error('WhatsApp não está conectado')
    }

    console.log(`📤 Enviando mensagem para ${talentId}:`, content)

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

    // Get conversation
    let conversation = conversations.get(talentId)
    if (!conversation) {
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

    // Simulate WhatsApp message delivery process
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      message.status = 'sent'
      this.emit('message_status_update', { talentId, message })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.status = 'delivered'
      this.emit('message_status_update', { talentId, message })
      
      // Sometimes mark as read after a delay
      if (Math.random() > 0.3) {
        setTimeout(() => {
          message.status = 'read'
          this.emit('message_status_update', { talentId, message })
        }, Math.random() * 5000 + 2000)
      }

      console.log(`✅ Mensagem enviada com sucesso para ${talentId}`)
      
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem para ${talentId}:`, error)
      message.status = 'failed'
      this.emit('message_status_update', { talentId, message })
      throw error
    }

    return message
  }

  // Disconnect from WhatsApp
  async disconnect(): Promise<void> {
    console.log('🔌 Desconectando WhatsApp...')
    
    connectionState = {
      isConnected: false,
      status: 'disconnected'
    }
    
    clientInfo = {}
    this.reconnectAttempts = 0
    this.qrRetryCount = 0
    
    this.emit('connection_update', connectionState)
    console.log('❌ WhatsApp desconectado')
  }

  // Reset connection
  private resetConnection() {
    console.log('🔄 Resetando conexão...')
    this.disconnect()
  }

  // Get connection status
  getConnectionStatus(): WhatsAppConnection {
    return { ...connectionState }
  }

  // Get client info
  getClientInfo() {
    return { ...clientInfo }
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

  // Get conversation
  getConversation(talentId: string): TalentChat | null {
    return conversations.get(talentId) || null
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

  // Handle authentication failures
  private handleAuthFailure() {
    console.error('❌ Falha de autenticação WhatsApp')
    connectionState = {
      isConnected: false,
      status: 'disconnected'
    }
    this.emit('connection_update', connectionState)
    this.emit('auth_failure', { message: 'Falha de autenticação. Escaneie o QR novamente.' })
  }

  // Handle disconnection
  private handleDisconnection(reason: string) {
    console.log('🔌 WhatsApp desconectado:', reason)
    connectionState = {
      isConnected: false,
      status: 'disconnected'
    }
    this.emit('connection_update', connectionState)
    this.emit('disconnected', { reason })

    // Auto-reconnect attempt
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`)
      
      setTimeout(() => {
        this.generateQRCode()
      }, 5000)
    }
  }
}

export const whatsAppService = WhatsAppService.getInstance()
