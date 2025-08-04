
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

export const useOperatorStatus = () => {
  const { user } = useUser()
  const [operators, setOperators] = useState<OperatorInfo[]>([])
  const [currentOperator, setCurrentOperator] = useState<OperatorInfo | null>(null)

  useEffect(() => {
    // Initialize current operator from Clerk user
    if (user) {
      const operator: OperatorInfo = {
        id: user.id,
        name: user.fullName || user.emailAddresses[0]?.emailAddress || 'Operador',
        email: user.emailAddresses[0]?.emailAddress || '',
        status: 'available',
        avatar: user.imageUrl,
        activeAttendances: 0,
        totalAttendancesToday: 0,
        averageResponseTime: 0,
        lastActivity: new Date().toISOString()
      }
      setCurrentOperator(operator)
    }
  }, [user])

  useEffect(() => {
    // Simulate other operators for demo
    const mockOperators: OperatorInfo[] = [
      {
        id: 'op_1',
        name: 'João Silva',
        email: 'joao@pregiato.com',
        status: 'available',
        activeAttendances: 2,
        totalAttendancesToday: 15,
        averageResponseTime: 45,
        lastActivity: new Date().toISOString()
      },
      {
        id: 'op_2',
        name: 'Maria Santos',
        email: 'maria@pregiato.com',
        status: 'busy',
        activeAttendances: 3,
        totalAttendancesToday: 22,
        averageResponseTime: 32,
        lastActivity: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
      },
      {
        id: 'op_3',
        name: 'Ana Costa',
        email: 'ana@pregiato.com',
        status: 'away',
        activeAttendances: 0,
        totalAttendancesToday: 8,
        averageResponseTime: 60,
        lastActivity: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
      }
    ]

    // Add current operator to the list if not already there
    if (currentOperator) {
      const updatedOperators = [...mockOperators]
      const existingIndex = updatedOperators.findIndex(op => op.id === currentOperator.id)
      if (existingIndex === -1) {
        updatedOperators.unshift(currentOperator)
      } else {
        updatedOperators[existingIndex] = currentOperator
      }
      setOperators(updatedOperators)
    } else {
      setOperators(mockOperators)
    }

    // Update operator status periodically
    const interval = setInterval(() => {
      setOperators(prev => prev.map(op => ({
        ...op,
        lastActivity: op.id === currentOperator?.id ? new Date().toISOString() : op.lastActivity
      })))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [currentOperator])

  const updateOperatorStatus = (status: 'available' | 'busy' | 'away') => {
    if (currentOperator) {
      const updated = { ...currentOperator, status, lastActivity: new Date().toISOString() }
      setCurrentOperator(updated)
    }
  }

  const incrementActiveAttendances = () => {
    if (currentOperator) {
      const updated = {
        ...currentOperator,
        activeAttendances: currentOperator.activeAttendances + 1,
        totalAttendancesToday: currentOperator.totalAttendancesToday + 1,
        status: 'busy' as const,
        lastActivity: new Date().toISOString()
      }
      setCurrentOperator(updated)
    }
  }

  const decrementActiveAttendances = () => {
    if (currentOperator) {
      const newCount = Math.max(0, currentOperator.activeAttendances - 1)
      const updated = {
        ...currentOperator,
        activeAttendances: newCount,
        status: newCount === 0 ? 'available' as const : 'busy' as const,
        lastActivity: new Date().toISOString()
      }
      setCurrentOperator(updated)
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
