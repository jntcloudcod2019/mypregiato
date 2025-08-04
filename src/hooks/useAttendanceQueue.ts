
import { useState, useEffect } from 'react'
import { whatsAppService } from '@/services/whatsapp-service'
import { useOperatorStatus } from './useOperatorStatus'
import { useActiveAttendance } from './useActiveAttendance'

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
  
  const { currentOperator, incrementActiveAttendances } = useOperatorStatus()
  const { activeAttendances, startAttendance, getAttendanceByTalent } = useActiveAttendance()

  useEffect(() => {
    const updateQueueMetrics = () => {
      const conversations = whatsAppService.getAllConversations()
      
      // Filter out conversations that are already being attended
      const unattendedConversations = conversations.filter(conv => {
        const hasActiveAttendance = getAttendanceByTalent(conv.talentId)
        return conv.unreadCount > 0 && !hasActiveAttendance
      })
      
      // Create queue items from unattended conversations
      const queueItems = unattendedConversations
        .map(conv => {
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
    }

    // Initial load
    updateQueueMetrics()

    // Update when messages are received or sent
    const handleMessageUpdate = () => {
      updateQueueMetrics()
    }

    const handleAttendanceChange = () => {
      updateQueueMetrics()
    }

    whatsAppService.on('message_received', handleMessageUpdate)
    whatsAppService.on('message_sent', handleMessageUpdate)
    whatsAppService.on('conversation_read', handleMessageUpdate)
    whatsAppService.on('attendance_started', handleAttendanceChange)
    whatsAppService.on('attendance_ended', handleAttendanceChange)

    // Update every 30 seconds
    const interval = setInterval(updateQueueMetrics, 30000)

    return () => {
      whatsAppService.off('message_received', handleMessageUpdate)
      whatsAppService.off('message_sent', handleMessageUpdate)
      whatsAppService.off('conversation_read', handleMessageUpdate)
      whatsAppService.off('attendance_started', handleAttendanceChange)
      whatsAppService.off('attendance_ended', handleAttendanceChange)
      clearInterval(interval)
    }
  }, [getAttendanceByTalent])

  const takeFromQueue = (talentId: string, talentName: string, talentPhone: string) => {
    if (!currentOperator) {
      console.error('Nenhum operador logado')
      return false
    }

    // Check if already in attendance
    const existingAttendance = getAttendanceByTalent(talentId)
    if (existingAttendance) {
      console.error('Cliente já está sendo atendido')
      return false
    }

    // Start attendance
    startAttendance(talentId, talentName, talentPhone, currentOperator.id, currentOperator.name)
    
    // Update operator status
    incrementActiveAttendances()

    // Mark conversation as read to remove from queue
    whatsAppService.markAsRead(talentId)

    console.log(`Operador ${currentOperator.name} assumiu atendimento de ${talentName}`)
    
    return true
  }

  return {
    queue,
    totalInQueue,
    averageWaitTime,
    attendingCount: activeAttendances.length,
    takeFromQueue
  }
}
