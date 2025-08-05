
import { useState, useEffect } from 'react'
import { api, connectSignalR } from '@/services/whatsapp-api'

export interface ActiveAttendance {
  id: string
  talentId: string
  talentName: string
  talentPhone: string
  operatorId: string
  operatorName: string
  startTime: string
  lastMessageTime?: string
  status: 'active' | 'waiting_client' | 'responding'
  messageCount: number
  duration: number // in minutes
}

export const useActiveAttendance = () => {
  const [activeAttendances, setActiveAttendances] = useState<ActiveAttendance[]>([])
  const [totalActive, setTotalActive] = useState(0)

  useEffect(() => {
    const fetchActiveAttendances = async () => {
      try {
        // Buscar conversas ativas (status = assigned)
        const res = await api.get('/conversations?status=assigned')
        const attendances = res.data.map((conv: any) => ({
          id: conv.id,
          talentId: conv.contactId,
          talentName: conv.contact?.name || 'Contato',
          talentPhone: conv.contact?.phone || '',
          operatorId: conv.operatorId || '',
          operatorName: conv.operator?.name || 'Operador',
          startTime: conv.assignedAt || conv.createdAt,
          status: 'active' as const,
          messageCount: conv.messages?.length || 0,
          duration: conv.assignedAt 
            ? Math.floor((Date.now() - new Date(conv.assignedAt).getTime()) / 60000)
            : 0
        }))
        setActiveAttendances(attendances)
        setTotalActive(attendances.length)
      } catch (error) {
        console.error('Error fetching active attendances:', error)
        setActiveAttendances([])
        setTotalActive(0)
      }
    }

    fetchActiveAttendances()

    const socket = connectSignalR()
    
    const handleConversationAssigned = (data: any) => {
      // Recarregar atendimentos quando uma conversa for atribuída
      fetchActiveAttendances()
    }

    const handleConversationClosed = (data: any) => {
      // Recarregar atendimentos quando uma conversa for fechada
      fetchActiveAttendances()
    }

    socket.on('conversation:assigned', handleConversationAssigned)
    socket.on('conversation:closed', handleConversationClosed)

    // Update durations every minute
    const interval = setInterval(() => {
      setActiveAttendances(prev => 
        prev.map(attendance => ({
          ...attendance,
          duration: Math.floor((Date.now() - new Date(attendance.startTime).getTime()) / 60000)
        }))
      )
    }, 60000)

    return () => {
      socket.off('conversation:assigned', handleConversationAssigned)
      socket.off('conversation:closed', handleConversationClosed)
      clearInterval(interval)
    }
  }, [])

  const startAttendance = async (talentId: string, talentName: string, talentPhone: string, operatorId: string, operatorName: string) => {
    try {
      // Buscar conversa do talento
      const res = await api.get(`/conversations?contactId=${talentId}`)
      if (res.data.length > 0) {
        const conversation = res.data[0]
        // Atribuir conversa ao operador
        await api.post(`/conversations/${conversation.id}/assign`, operatorId)
      }
    } catch (error) {
      console.error('Error starting attendance:', error)
    }
  }

  const endAttendance = async (attendanceId: string) => {
    try {
      // Fechar conversa
      await api.put(`/conversations/${attendanceId}`, {
        status: 'closed',
        closeReason: 'Atendimento finalizado pelo operador'
      })
    } catch (error) {
      console.error('Error ending attendance:', error)
    }
  }

  const getAttendanceByTalent = (talentId: string): ActiveAttendance | null => {
    return activeAttendances.find(att => att.talentId === talentId) || null
  }

  const getAttendanceByOperator = (operatorId: string): ActiveAttendance[] => {
    return activeAttendances.filter(att => att.operatorId === operatorId)
  }

  return {
    activeAttendances,
    totalActive,
    startAttendance,
    endAttendance,
    getAttendanceByTalent,
    getAttendanceByOperator
  }
}
