
import { useState, useEffect } from 'react'
import { TalentChat, WhatsAppMessage } from '@/types/whatsapp'
import { whatsAppService } from '@/services/whatsapp-service'

export const useTalentChat = (talentId?: string) => {
  const [conversation, setConversation] = useState<TalentChat | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!talentId) {
      setConversation(null)
      return
    }

    const loadConversation = () => {
      const conv = whatsAppService.getConversation(talentId)
      setConversation(conv)
    }

    loadConversation()

    const handleMessageSent = ({ talentId: msgTalentId, message }: { talentId: string, message: WhatsAppMessage }) => {
      if (msgTalentId === talentId) {
        loadConversation()
      }
    }

    const handleMessageReceived = ({ talentId: msgTalentId, message }: { talentId: string, message: WhatsAppMessage }) => {
      if (msgTalentId === talentId) {
        loadConversation()
      }
    }

    const handleMessageStatusUpdate = ({ talentId: msgTalentId }: { talentId: string, message: WhatsAppMessage }) => {
      if (msgTalentId === talentId) {
        loadConversation()
      }
    }

    whatsAppService.on('message_sent', handleMessageSent)
    whatsAppService.on('message_received', handleMessageReceived)
    whatsAppService.on('message_status_update', handleMessageStatusUpdate)

    return () => {
      whatsAppService.off('message_sent', handleMessageSent)
      whatsAppService.off('message_received', handleMessageReceived)
      whatsAppService.off('message_status_update', handleMessageStatusUpdate)
    }
  }, [talentId])

  const sendMessage = async (content: string, type: 'text' | 'image' | 'audio' | 'file' = 'text', file?: File) => {
    if (!talentId) return

    try {
      setIsLoading(true)
      await whatsAppService.sendMessage(talentId, content, type, file)
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = () => {
    if (talentId) {
      whatsAppService.markAsRead(talentId)
    }
  }

  return {
    conversation,
    sendMessage,
    markAsRead,
    isLoading
  }
}
