
import { useState, useEffect } from 'react'
import { api, connectSignalR } from '@/services/whatsapp-api'

export interface Message {
  id: string
  conversationId: string
  direction: 'in' | 'out'
  type: 'text' | 'image' | 'audio' | 'document' | 'video'
  body: string
  mediaUrl?: string
  fileName?: string
  clientMessageId?: string
  whatsAppMessageId?: string
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  internalNote?: string
  createdAt: string
  updatedAt?: string
}

export interface Conversation {
  id: string
  contactId: string
  operatorId?: string
  channel: string
  status: 'queued' | 'assigned' | 'closed'
  priority: 'normal' | 'high' | 'urgent'
  closeReason?: string
  createdAt: string
  assignedAt?: string
  closedAt?: string
  updatedAt?: string
  contact?: {
    id: string
    name: string
    phone: string
    email?: string
    originCRM?: string
    tags?: string
    businessName?: string
    isActive: boolean
    createdAt: string
    updatedAt?: string
  }
  operator?: {
    id: string
    name: string
    email: string
    role: string
    status: string
    skills?: string
    maxConcurrentConversations: number
    createdAt: string
    updatedAt?: string
    lastActivityAt?: string
  }
  messages: Message[]
  unreadCount: number
  lastMessage?: Message
}

export const useTalentChat = (contactId?: string) => {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!contactId) {
      setConversation(null)
      return
    }

    const loadConversation = async () => {
      try {
        // Buscar conversa existente ou criar nova
        const res = await api.get(`/conversations?contactId=${contactId}`)
        if (res.data.length > 0) {
          setConversation(res.data[0])
        } else {
          // Criar nova conversa
          const createRes = await api.post('/conversations', {
            contactId,
            channel: 'whatsapp',
            priority: 'normal'
          })
          setConversation(createRes.data)
        }
      } catch (error) {
        console.error('Error loading conversation:', error)
      }
    }

    loadConversation()

    const socket = connectSignalR()
    
    const handleMessageReceived = (data: any) => {
      if (data.conversationId === conversation?.id) {
        // Recarregar conversa quando nova mensagem chegar
        loadConversation()
      }
    }

    const handleMessageStatusUpdate = (data: any) => {
      if (conversation) {
        // Atualizar status da mensagem
        setConversation(prev => {
          if (!prev) return prev
          return {
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === data.messageId 
                ? { ...msg, status: data.status }
                : msg
            )
          }
        })
      }
    }

    socket.on('message:received', handleMessageReceived)
    socket.on('message:status', handleMessageStatusUpdate)

    return () => {
      socket.off('message:received', handleMessageReceived)
      socket.off('message:status', handleMessageStatusUpdate)
    }
  }, [contactId, conversation?.id])

  const sendMessage = async (content: string, type: 'text' | 'image' | 'audio' | 'file' = 'text', file?: File) => {
    if (!conversation) return

    try {
      setIsLoading(true)
      
      const messageData = {
        conversationId: conversation.id,
        direction: 'out' as const,
        type,
        body: content,
        clientMessageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      const res = await api.post('/messages', messageData)
      
      // Atualizar conversa com nova mensagem
      setConversation(prev => {
        if (!prev) return prev
        return {
          ...prev,
          messages: [...prev.messages, res.data],
          lastMessage: res.data
        }
      })
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async () => {
    if (!conversation) return

    try {
      await api.put(`/conversations/${conversation.id}/mark-read`)
      setConversation(prev => {
        if (!prev) return prev
        return {
          ...prev,
          unreadCount: 0,
          messages: prev.messages.map(msg => 
            msg.direction === 'in' ? { ...msg, status: 'read' as const } : msg
          )
        }
      })
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  return {
    conversation,
    sendMessage,
    markAsRead,
    isLoading
  }
}
