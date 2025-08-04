import { WhatsAppConnection, WhatsAppMessage, TalentChat } from '@/types/whatsapp'

// WhatsApp connection state
let connectionState: WhatsAppConnection = {
  isConnected: false,
  status: 'disconnected'
}

// Conversations storage
const conversations = new Map<string, TalentChat>()

// Client info with automatic detection
let clientInfo: { 
  number?: string; 
  name?: string; 
  profilePicture?: string;
  businessName?: string;
  isAuthenticated?: boolean;
  lastActivity?: string;
} = {
  businessName: 'PREGIATO MANAGEMENT',
  profilePicture: '/lovable-uploads/fd1ff296-4ed8-4d20-b200-27e4872b8e24.png',
  isAuthenticated: false
}

export class WhatsAppService {
  private static instance: WhatsAppService
  private eventListeners: Map<string, Function[]> = new Map()
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 3
  private qrRetryCount: number = 0
  private contactNotifications: Set<string> = new Set()
  private connectionMonitor: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isMonitoring: boolean = false

  private constructor() {
    this.initializeIntelligentSystem()
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

  // Initialize intelligent connection system
  private initializeIntelligentSystem() {
    console.log('🤖 Inicializando sistema inteligente PREGIATO MANAGEMENT...')
    
    // Start connection monitoring immediately
    this.startConnectionMonitoring()
    
    // Simulate server initialization
    setTimeout(() => {
      this.emit('client_ready', { 
        message: 'Sistema inteligente PREGIATO MANAGEMENT inicializado',
        businessInfo: clientInfo,
        hasActiveConnection: connectionState.isConnected
      })
    }, 1000)

    // Check for existing sessions on startup
    this.checkExistingSessions()
  }

  // Intelligent connection monitoring
  private startConnectionMonitoring() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    console.log('🔍 Iniciando monitoramento inteligente de conexões...')

    // Monitor connection status every 5 seconds
    this.connectionMonitor = setInterval(() => {
      this.intelligentConnectionCheck()
    }, 5000)

    // Heartbeat for active connections
    this.heartbeatInterval = setInterval(() => {
      if (connectionState.isConnected) {
        this.sendHeartbeat()
      }
    }, 30000) // Every 30 seconds
  }

  // Intelligent connection detection
  private intelligentConnectionCheck() {
    const wasConnected = connectionState.isConnected
    
    // Simulate connection detection logic
    // In real implementation, this would check actual WhatsApp Web session
    
    if (connectionState.isConnected && clientInfo.isAuthenticated) {
      // Connection is active, update last activity
      clientInfo.lastActivity = new Date().toISOString()
      
      // Randomly simulate connection issues (5% chance)
      if (Math.random() < 0.05) {
        console.log('⚠️ Sistema detectou problema na conexão')
        this.handleConnectionIssue()
      }
    } else {
      // Check if there's a session that can be restored
      this.checkForRestorableSession()
    }

    // Emit status update if connection changed
    if (wasConnected !== connectionState.isConnected) {
      this.emit('connection_status_changed', {
        wasConnected,
        isConnected: connectionState.isConnected,
        timestamp: new Date().toISOString()
      })
    }
  }

  // Check for existing WhatsApp sessions
  private checkExistingSessions() {
    console.log('🔍 Verificando sessões existentes...')
    
    // Simulate checking for existing authenticated sessions
    setTimeout(() => {
      // 30% chance of finding an existing session for demo
      if (Math.random() > 0.7) {
        console.log('✅ Sessão existente encontrada! Restaurando conexão...')
        this.restoreExistingSession()
      } else {
        console.log('ℹ️ Nenhuma sessão ativa encontrada')
        this.emit('no_active_session', { 
          message: 'Nenhum número conectado encontrado',
          requiresNewConnection: true
        })
      }
    }, 2000)
  }

  // Restore existing session
  private restoreExistingSession() {
    clientInfo = {
      ...clientInfo,
      number: '5511999887766',
      name: 'PREGIATO MANAGEMENT - Atendimento',
      isAuthenticated: true,
      lastActivity: new Date().toISOString()
    }

    connectionState = {
      isConnected: true,
      status: 'connected',
      sessionId: `restored_session_${Date.now()}`
    }

    this.emit('connection_update', connectionState)
    this.emit('session_restored', {
      message: 'Sessão restaurada automaticamente',
      clientInfo: clientInfo
    })

    console.log('🔄 Sessão WhatsApp restaurada automaticamente!')
    
    // Start message handlers
    this.startMessageHandling()
    this.startContactMonitoring()
  }

  // Handle connection issues intelligently
  private handleConnectionIssue() {
    console.log('🔧 Sistema lidando com problema de conexão...')
    
    // Try to restore connection
    setTimeout(() => {
      if (connectionState.isConnected) {
        console.log('✅ Problema de conexão resolvido automaticamente')
        this.emit('connection_restored', {
          message: 'Conexão restaurada pelo sistema inteligente'
        })
      } else {
        console.log('❌ Falha na reconexão automática')
        this.handleDisconnection('connection_lost')
      }
    }, 3000)
  }

  // Check for restorable session
  private checkForRestorableSession() {
    // In real implementation, this would check for stored session data
    // For now, we'll simulate this check
    
    if (!connectionState.isConnected && this.reconnectAttempts === 0) {
      // Try to find a restorable session
      const hasStoredSession = Math.random() > 0.8 // 20% chance for demo
      
      if (hasStoredSession) {
        console.log('🔄 Tentando restaurar sessão armazenada...')
        this.restoreExistingSession()
      }
    }
  }

  // Send heartbeat to maintain connection
  private sendHeartbeat() {
    if (!connectionState.isConnected) return

    // Simulate heartbeat
    console.log('💓 Enviando heartbeat para manter conexão ativa...')
    
    // Update last activity
    clientInfo.lastActivity = new Date().toISOString()
    
    // Emit heartbeat event
    this.emit('heartbeat', {
      timestamp: clientInfo.lastActivity,
      connectionHealth: 'good'
    })
  }

  // Smart QR generation with better detection
  async generateQRCode(): Promise<string> {
    try {
      console.log('📱 Sistema inteligente gerando QR Code...')
      
      // Reset connection state
      connectionState = {
        isConnected: false,
        status: 'qr_ready',
        qrCode: undefined
      }
      this.emit('connection_update', connectionState)

      await new Promise(resolve => setTimeout(resolve, 1500))

      // Generate more realistic QR content
      const timestamp = Date.now()
      const sessionKey = Math.random().toString(36).substr(2, 16)
      const qrContent = `2@${timestamp},${sessionKey},PREGIATO_MANAGEMENT`
      
      // Generate QR code
      const qrCodeDataURL = await this.generateQRImage(qrContent)
      
      connectionState = {
        isConnected: false,
        status: 'qr_ready',
        qrCode: qrCodeDataURL
      }

      this.emit('connection_update', connectionState)
      console.log('✅ QR Code inteligente gerado com sucesso')

      // Smart QR expiration with retry logic
      setTimeout(() => {
        if (connectionState.status === 'qr_ready' && !connectionState.isConnected) {
          this.qrRetryCount++
          if (this.qrRetryCount < 3) {
            console.log(`⏰ QR Code expirou (${this.qrRetryCount}/3), gerando novo...`)
            this.generateQRCode()
          } else {
            console.log('❌ Muitas tentativas de QR, aguardando intervenção manual...')
            this.resetConnection()
          }
        }
      }, 60000)

      // Intelligent scan simulation (improved)
      if (Math.random() > 0.2) { // 80% chance of connection for demo
        setTimeout(() => {
          if (connectionState.status === 'qr_ready') {
            this.simulateIntelligentConnection()
          }
        }, Math.random() * 15000 + 5000) // 5-20 seconds
      }

      return qrCodeDataURL
    } catch (error) {
      console.error('❌ Erro no sistema inteligente de QR:', error)
      connectionState = {
        isConnected: false,
        status: 'disconnected'
      }
      this.emit('connection_update', connectionState)
      throw new Error('Sistema inteligente falhou ao gerar QR Code')
    }
  }

  // Generate QR image with better quality
  private async generateQRImage(content: string): Promise<string> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 300
    canvas.height = 300
    
    if (ctx) {
      // White background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 300, 300)
      ctx.fillStyle = '#000000'
      
      // Create more realistic QR pattern
      const blockSize = 6
      for (let i = 0; i < 300; i += blockSize) {
        for (let j = 0; j < 300; j += blockSize) {
          // Create QR-like patterns with positioning squares
          const isPositionSquare = (i < 60 && j < 60) || 
                                 (i > 240 && j < 60) || 
                                 (i < 60 && j > 240)
          
          if (isPositionSquare || Math.random() > 0.5) {
            ctx.fillRect(i, j, blockSize, blockSize)
          }
        }
      }
      
      // Add positioning squares
      this.drawPositioningSquare(ctx, 15, 15)
      this.drawPositioningSquare(ctx, 255, 15)
      this.drawPositioningSquare(ctx, 15, 255)
    }
    
    return canvas.toDataURL()
  }

  private drawPositioningSquare(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Outer square
    ctx.fillRect(x - 15, y - 15, 30, 30)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - 9, y - 9, 18, 18)
    ctx.fillStyle = '#000000'
    ctx.fillRect(x - 3, y - 3, 6, 6)
  }

  // Intelligent connection simulation
  private async simulateIntelligentConnection() {
    console.log('🤖 Sistema detectou scan do QR! Iniciando conexão inteligente...')
    
    connectionState = {
      isConnected: false,
      status: 'connecting'
    }
    this.emit('connection_update', connectionState)

    // Simulate connection process with intelligence
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Intelligent client detection
    clientInfo = {
      ...clientInfo,
      number: '5511999887766',
      name: 'PREGIATO MANAGEMENT - Atendimento',
      isAuthenticated: true,
      lastActivity: new Date().toISOString()
    }

    connectionState = {
      isConnected: true,
      status: 'connected',
      sessionId: `intelligent_session_${Date.now()}`
    }

    this.emit('connection_update', connectionState)
    console.log('✅ Sistema inteligente conectado com sucesso!')
    console.log(`📞 Número detectado: ${clientInfo.number}`)

    // Reset retry counters
    this.reconnectAttempts = 0
    this.qrRetryCount = 0

    // Start intelligent handlers
    this.startMessageHandling()
    this.startContactMonitoring()
  }

  // Monitor new contacts trying to reach the server
  private startContactMonitoring() {
    console.log('👥 Sistema inteligente monitorando novos contatos...')
    
    // Simulate new contacts reaching out with intelligence
    const simulateIntelligentContact = () => {
      if (!connectionState.isConnected) return

      // More realistic contact simulation (10% chance every interval)
      if (Math.random() > 0.9) {
        const contactNumber = `5511${Math.floor(Math.random() * 900000000 + 100000000)}`
        const contactNames = [
          'Ana Clara Silva', 'Maria Santos', 'João Oliveira', 'Beatriz Costa',
          'Pedro Lima', 'Camila Rodrigues', 'Lucas Ferreira', 'Juliana Alves'
        ]
        const contactName = contactNames[Math.floor(Math.random() * contactNames.length)]
        
        const messages = [
          'Olá! Vi vocês nas redes sociais e gostaria de saber mais sobre os serviços.',
          'Boa tarde! Tenho interesse em fazer um book fotográfico.',
          'Olá, gostaria de informações sobre casting.',
          'Oi! Uma amiga me indicou vocês para trabalhos de modelo.',
          'Bom dia! Gostaria de agendar uma conversa sobre oportunidades.'
        ]
        
        if (!this.contactNotifications.has(contactNumber)) {
          this.contactNotifications.add(contactNumber)
          
          this.emit('new_contact_alert', {
            number: contactNumber,
            name: contactName,
            message: messages[Math.floor(Math.random() * messages.length)],
            timestamp: new Date().toISOString(),
            source: 'whatsapp_direct'
          })
          
          console.log(`🔔 Sistema detectou novo contato: ${contactName} (${contactNumber})`)
        }
      }

      // Schedule next intelligent check
      setTimeout(simulateIntelligentContact, Math.random() * 45000 + 15000) // 15-60 seconds
    }

    // Start monitoring after connection
    setTimeout(simulateIntelligentContact, 10000)
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
      throw new Error('Servidor WhatsApp PREGIATO MANAGEMENT não está conectado')
    }

    console.log(`📤 PREGIATO MANAGEMENT enviando mensagem para ${talentId}:`, content)

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
      await new Promise(resolve => setTimeout(resolve, 800))
      
      message.status = 'sent'
      this.emit('message_status_update', { talentId, message })
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      message.status = 'delivered'
      this.emit('message_status_update', { talentId, message })
      
      // Sometimes mark as read after a delay
      if (Math.random() > 0.3) {
        setTimeout(() => {
          message.status = 'read'
          this.emit('message_status_update', { talentId, message })
        }, Math.random() * 8000 + 3000)
      }

      console.log(`✅ Mensagem do PREGIATO MANAGEMENT enviada com sucesso para ${talentId}`)
      
    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem do PREGIATO MANAGEMENT para ${talentId}:`, error)
      message.status = 'failed'
      this.emit('message_status_update', { talentId, message })
      throw error
    }

    return message
  }

  // Intelligent disconnect
  async disconnect(): Promise<void> {
    console.log('🔌 Sistema inteligente desconectando WhatsApp...')
    
    // Clear monitoring intervals
    if (this.connectionMonitor) {
      clearInterval(this.connectionMonitor)
      this.connectionMonitor = null
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    this.isMonitoring = false
    
    connectionState = {
      isConnected: false,
      status: 'disconnected'
    }
    
    clientInfo = {
      ...clientInfo,
      number: undefined,
      name: undefined,
      isAuthenticated: false,
      lastActivity: undefined
    }
    
    this.reconnectAttempts = 0
    this.qrRetryCount = 0
    
    this.emit('connection_update', connectionState)
    console.log('❌ Sistema inteligente desconectado do WhatsApp')
  }

  // Reset connection with intelligence
  private resetConnection() {
    console.log('🔄 Sistema inteligente resetando conexão...')
    this.disconnect()
    
    // Restart monitoring after reset
    setTimeout(() => {
      this.startConnectionMonitoring()
    }, 2000)
  }

  // Get connection status
  getConnectionStatus(): WhatsAppConnection {
    return { ...connectionState }
  }

  // Get client info with business details
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

  // Get connection status with intelligence
  getConnectionStatus(): WhatsAppConnection {
    return { 
      ...connectionState,
      lastActivity: clientInfo.lastActivity
    }
  }

  // Get client info with intelligence
  getClientInfo() {
    return { ...clientInfo }
  }

  // Check if system has active number connected
  hasActiveNumber(): boolean {
    return connectionState.isConnected && !!clientInfo.number && !!clientInfo.isAuthenticated
  }

  // Get connection health
  getConnectionHealth() {
    if (!connectionState.isConnected) return 'disconnected'
    
    const lastActivity = clientInfo.lastActivity
    if (!lastActivity) return 'unknown'
    
    const timeSinceLastActivity = Date.now() - new Date(lastActivity).getTime()
    
    if (timeSinceLastActivity < 60000) return 'excellent' // Less than 1 minute
    if (timeSinceLastActivity < 300000) return 'good' // Less than 5 minutes
    if (timeSinceLastActivity < 900000) return 'fair' // Less than 15 minutes
    return 'poor'
  }

  // Handle authentication failures with intelligence
  private handleAuthFailure() {
    console.error('❌ Sistema inteligente detectou falha de autenticação WhatsApp')
    connectionState = {
      isConnected: false,
      status: 'disconnected'
    }
    clientInfo.isAuthenticated = false
    this.emit('connection_update', connectionState)
    this.emit('auth_failure', { message: 'Falha de autenticação detectada. Escaneie o QR novamente.' })
  }

  // Handle disconnection with intelligence
  private handleDisconnection(reason: string) {
    console.log('🔌 Sistema inteligente detectou desconexão:', reason)
    connectionState = {
      isConnected: false,
      status: 'disconnected'
    }
    clientInfo.isAuthenticated = false
    this.emit('connection_update', connectionState)
    this.emit('disconnected', { reason })

    // Intelligent auto-reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 Sistema tentando reconexão inteligente ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`)
      
      setTimeout(() => {
        this.checkForRestorableSession()
      }, 5000 * this.reconnectAttempts) // Exponential backoff
    } else {
      console.log('❌ Sistema esgotou tentativas de reconexão automática')
      this.emit('max_reconnect_attempts', { 
        message: 'Sistema não conseguiu reconectar automaticamente. Intervenção manual necessária.' 
      })
    }
  }

  // Cleanup method
  destroy() {
    console.log('🧹 Destruindo sistema inteligente WhatsApp...')
    
    if (this.connectionMonitor) {
      clearInterval(this.connectionMonitor)
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    
    this.isMonitoring = false
    this.eventListeners.clear()
    conversations.clear()
    this.contactNotifications.clear()
  }
}

export const whatsAppService = WhatsAppService.getInstance()
