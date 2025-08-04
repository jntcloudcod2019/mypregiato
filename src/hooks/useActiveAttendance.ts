
import { useState, useEffect } from 'react'
import { whatsAppService } from '@/services/whatsapp-service'

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
    // Get active attendances from WhatsApp service
    const updateActiveAttendances = () => {
      const attendances = whatsAppService.getActiveAttendances()
      setActiveAttendances(attendances)
      setTotalActive(attendances.length)
    }

    // Initial load
    updateActiveAttendances()

    // Listen for attendance events
    const handleAttendanceStarted = (data: any) => {
      updateActiveAttendances()
    }

    const handleAttendanceEnded = (data: any) => {
      updateActiveAttendances()
    }

    const handleMessageActivity = (data: any) => {
      updateActiveAttendances()
    }

    whatsAppService.on('attendance_started', handleAttendanceStarted)
    whatsAppService.on('attendance_ended', handleAttendanceEnded)
    whatsAppService.on('message_sent', handleMessageActivity)
    whatsAppService.on('message_received', handleMessageActivity)

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
      whatsAppService.off('attendance_started', handleAttendanceStarted)
      whatsAppService.off('attendance_ended', handleAttendanceEnded)
      whatsAppService.off('message_sent', handleMessageActivity)
      whatsAppService.off('message_received', handleMessageActivity)
      clearInterval(interval)
    }
  }, [])

  const startAttendance = (talentId: string, talentName: string, talentPhone: string, operatorId: string, operatorName: string) => {
    const attendance: ActiveAttendance = {
      id: `attendance_${Date.now()}`,
      talentId,
      talentName,
      talentPhone,
      operatorId,
      operatorName,
      startTime: new Date().toISOString(),
      status: 'active',
      messageCount: 0,
      duration: 0
    }

    whatsAppService.startAttendance(attendance)
  }

  const endAttendance = (attendanceId: string) => {
    whatsAppService.endAttendance(attendanceId)
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
