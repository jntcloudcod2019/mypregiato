
import { useState, useEffect } from 'react'
import { api, connectSignalR } from '@/services/whatsapp-api'

export interface QueueItem {
  conversationId: string
  contactName: string
  contactPhone: string
  priority: 'normal' | 'high' | 'urgent'
  queuedAt: string
  waitTimeMinutes: number
}

export const useAttendanceQueue = () => {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [totalInQueue, setTotalInQueue] = useState(0)
  const [averageWaitTime, setAverageWaitTime] = useState(0)
  const [attendingCount, setAttendingCount] = useState(0)

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await api.get('/queue/metrics')
        setQueue(res.data.queueItems)
        setTotalInQueue(res.data.totalInQueue)
        setAverageWaitTime(Math.round(res.data.averageWaitTimeMinutes))
        setAttendingCount(res.data.attendingCount)
      } catch {
        setQueue([])
        setTotalInQueue(0)
        setAverageWaitTime(0)
        setAttendingCount(0)
      }
    }
    fetchQueue()
    const socket = connectSignalR()
    socket.on('queue:updated', (metrics: any) => {
      setQueue(metrics.queueItems)
      setTotalInQueue(metrics.totalInQueue)
      setAverageWaitTime(Math.round(metrics.averageWaitTimeMinutes))
      setAttendingCount(metrics.attendingCount)
    })
    return () => {
      socket.off('queue:updated')
    }
  }, [])

  // Para MVP, takeFromQueue pode apenas retornar true (a lógica real será via API)
  const takeFromQueue = () => true

  return {
    queue,
    totalInQueue,
    averageWaitTime,
    attendingCount,
    takeFromQueue
  }
}
