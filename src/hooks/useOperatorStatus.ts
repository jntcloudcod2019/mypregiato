
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'

export interface OperatorInfo {
  id: string
  name: string
  email: string
  status: 'available' | 'busy' | 'away'
  avatar?: string
  activeAttendances: number
  totalAttendancesToday: number
  averageResponseTime: number
  lastActivity: string
}

// Sistema real de presença - armazena operadores online
const onlineOperators = new Map<string, OperatorInfo>()
const operatorListeners = new Set<() => void>()

// Broadcast de mudanças para todos os componentes
const notifyOperatorChange = () => {
  operatorListeners.forEach(listener => listener())
}

export const useOperatorStatus = () => {
  const { user } = useUser()
  const [operators, setOperators] = useState<OperatorInfo[]>([])
  const [currentOperator, setCurrentOperator] = useState<OperatorInfo | null>(null)

  // Registrar operador atual quando user estiver disponível
  useEffect(() => {
    if (user) {
      const operator: OperatorInfo = {
        id: user.id,
        name: user.fullName || user.firstName || 'Operador',
        email: user.emailAddresses[0]?.emailAddress || '',
        status: 'available',
        avatar: user.imageUrl,
        activeAttendances: 0,
        totalAttendancesToday: 0,
        averageResponseTime: 0,
        lastActivity: new Date().toISOString()
      }

      // Adicionar/atualizar operador na lista global
      onlineOperators.set(user.id, operator)
      setCurrentOperator(operator)
      
      console.log(`✅ Operador ${operator.name} conectado`)
      notifyOperatorChange()

      // Heartbeat para manter presença ativa
      const heartbeatInterval = setInterval(() => {
        const updatedOperator = onlineOperators.get(user.id)
        if (updatedOperator) {
          updatedOperator.lastActivity = new Date().toISOString()
          onlineOperators.set(user.id, updatedOperator)
          notifyOperatorChange()
        }
      }, 30000) // A cada 30 segundos

      // Cleanup ao desmontar
      return () => {
        clearInterval(heartbeatInterval)
        onlineOperators.delete(user.id)
        console.log(`❌ Operador ${operator.name} desconectado`)
        notifyOperatorChange()
      }
    }
  }, [user])

  // Listener para mudanças na lista de operadores
  useEffect(() => {
    const updateOperatorList = () => {
      const now = Date.now()
      const activeOperators = Array.from(onlineOperators.values())
        .filter(operator => {
          const lastActivity = new Date(operator.lastActivity).getTime()
          const timeSinceActivity = now - lastActivity
          // Considerar offline após 5 minutos de inatividade
          return timeSinceActivity < 300000
        })
        .sort((a, b) => {
          // Operador atual primeiro
          if (a.id === user?.id) return -1
          if (b.id === user?.id) return 1
          return a.name.localeCompare(b.name)
        })

      setOperators(activeOperators)
    }

    // Atualização inicial
    updateOperatorList()

    // Registrar listener
    operatorListeners.add(updateOperatorList)

    // Atualizar a cada 10 segundos
    const interval = setInterval(updateOperatorList, 10000)

    return () => {
      operatorListeners.delete(updateOperatorList)
      clearInterval(interval)
    }
  }, [user])

  const updateOperatorStatus = (status: 'available' | 'busy' | 'away') => {
    if (currentOperator && user) {
      const updated = { 
        ...currentOperator, 
        status, 
        lastActivity: new Date().toISOString() 
      }
      
      onlineOperators.set(user.id, updated)
      setCurrentOperator(updated)
      notifyOperatorChange()
      
      console.log(`🔄 Status do operador ${updated.name} atualizado para: ${status}`)
    }
  }

  const incrementActiveAttendances = () => {
    if (currentOperator && user) {
      const updated = {
        ...currentOperator,
        activeAttendances: currentOperator.activeAttendances + 1,
        totalAttendancesToday: currentOperator.totalAttendancesToday + 1,
        status: 'busy' as const,
        lastActivity: new Date().toISOString()
      }
      
      onlineOperators.set(user.id, updated)
      setCurrentOperator(updated)
      notifyOperatorChange()
    }
  }

  const decrementActiveAttendances = () => {
    if (currentOperator && user) {
      const newCount = Math.max(0, currentOperator.activeAttendances - 1)
      const updated = {
        ...currentOperator,
        activeAttendances: newCount,
        status: newCount === 0 ? 'available' as const : 'busy' as const,
        lastActivity: new Date().toISOString()
      }
      
      onlineOperators.set(user.id, updated)
      setCurrentOperator(updated)
      notifyOperatorChange()
    }
  }

  return {
    operators,
    currentOperator,
    updateOperatorStatus,
    incrementActiveAttendances,
    decrementActiveAttendances
  }
}
