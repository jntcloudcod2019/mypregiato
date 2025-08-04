
import { useState, useEffect } from 'react'
import { whatsAppService } from '@/services/whatsapp-service'

export interface QueueItem {
  id: string
  talentName: string
  talentPhone: string
  waitingTime: number
  priority: 'normal' | 'high' | 'urgent'
  lastMessage?: string
  timestamp: string
}

export const useAttendanceQueue = () => {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [totalInQueue, setTotalInQueue] = useState(0)
  const [averageWaitTime, setAverageWaitTime] = useState(0)
  const [attendingCount, setAttendingCount] = useState(0)

  useEffect(() => {
    // Simulate queue data based on conversations
    const updateQueueMetrics = () => {
      const conversations = whatsAppService.getAllConversations()
      
      // Create queue items from conversations with unread messages
      const queueItems = conversations
        .filter(conv => conv.unreadCount > 0)
        .map(conv => {
          // Determine priority based on unread count and ensure it's a valid type
          let priority: 'normal' | 'high' | 'urgent' = 'normal'
          if (conv.unreadCount > 5) {
            priority = 'urgent'
          } else if (conv.unreadCount > 2) {
            priority = 'high'
          }

          return {
            id: conv.talentId,
            talentName: conv.talentName,
            talentPhone: conv.talentPhone,
            waitingTime: conv.lastMessage ? 
              Math.floor((Date.now() - new Date(conv.lastMessage.timestamp).getTime()) / 60000) : 0,
            priority,
            lastMessage: conv.lastMessage?.content,
            timestamp: conv.lastMessage?.timestamp || new Date().toISOString()
          } as QueueItem
        })
        .sort((a, b) => {
          // Sort by priority first, then by waiting time
          const priorityOrder = { urgent: 3, high: 2, normal: 1 }
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority]
          }
          return b.waitingTime - a.waitingTime
        })

      setQueue(queueItems)
      setTotalInQueue(queueItems.length)
      
      // Calculate average wait time
      if (queueItems.length > 0) {
        const avgTime = queueItems.reduce((sum, item) => sum + item.waitingTime, 0) / queueItems.length
        setAverageWaitTime(Math.round(avgTime))
      } else {
        setAverageWaitTime(0)
      }
      
      // Count how many are currently being attended (conversations with recent operator messages)
      const attending = conversations.filter(conv => {
        const lastMsg = conv.lastMessage
        return lastMsg && 
               lastMsg.sender === 'operator' && 
               (Date.now() - new Date(lastMsg.timestamp).getTime()) < 300000 // 5 minutes
      }).length
      
      setAttendingCount(attending)
    }

    // Initial load
    updateQueueMetrics()

    // Update when messages are received or sent
    const handleMessageUpdate = () => {
      updateQueueMetrics()
    }

    whatsAppService.on('message_received', handleMessageUpdate)
    whatsAppService.on('message_sent', handleMessageUpdate)
    whatsAppService.on('conversation_read', handleMessageUpdate)

    // Update every 30 seconds
    const interval = setInterval(updateQueueMetrics, 30000)

    return () => {
      whatsAppService.off('message_received', handleMessageUpdate)
      whatsAppService.off('message_sent', handleMessageUpdate)
      whatsAppService.off('conversation_read', handleMessageUpdate)
      clearInterval(interval)
    }
  }, [])

  return {
    queue,
    totalInQueue,
    averageWaitTime,
    attendingCount
  }
}
