
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

// Interface para usuário do Clerk (simplificada)
interface ClerkUser {
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  imageUrl?: string;
  emailAddresses: Array<{ emailAddress: string }>;
}

// Sistema real de presença - armazena operadores online
const onlineOperators = new Map<string, OperatorInfo>()
const operatorListeners = new Set<() => void>()

// Broadcast de mudanças para todos os componentes
const notifyOperatorChange = () => {
  operatorListeners.forEach(listener => listener())
}

// Operador anônimo padrão para quando Clerk não está disponível
const createAnonymousOperator = (): OperatorInfo => ({
  id: 'anonymous-' + Math.random().toString(36).substring(2, 9),
  name: 'Operador Temporário',
  email: 'temp@pregiato.com',
  status: 'available',
  activeAttendances: 0,
  totalAttendancesToday: 0,
  averageResponseTime: 0,
  lastActivity: new Date().toISOString()
});

// Hook seguro que tenta usar Clerk, mas não falha se não estiver disponível
const useSafeClerkUser = (): { user: ClerkUser | null, isLoaded: boolean } => {
  try {
    // Tentar usar o hook do Clerk
    return useUser();
  } catch (error) {
    console.warn('Clerk não está disponível, usando modo anônimo', error);
    
    // Registrar falha no session storage para próximos carregamentos
    try {
      sessionStorage.setItem('clerk_failed', 'true');
    } catch (e) {
      console.error('Error saving clerk_failed:', e);
    }
    
    // Retornar valores padrão
    return { user: null, isLoaded: true };
  }
};

export const useOperatorStatus = () => {
  // Usar o hook seguro para Clerk
  const { user } = useSafeClerkUser();
  const [operators, setOperators] = useState<OperatorInfo[]>([]);
  const [currentOperator, setCurrentOperator] = useState<OperatorInfo | null>(null);
  
  // Verificar se estamos em modo anônimo (sem Clerk)
  const [isAnonymousMode] = useState(!user);

  // Registrar operador atual quando componente montar
  useEffect(() => {
    // Criar operador baseado no usuário do Clerk ou criar um anônimo
    const operator: OperatorInfo = user ? {
      id: user.id,
      name: user.fullName || user.firstName || 'Operador',
      email: user.emailAddresses[0]?.emailAddress || '',
      status: 'available',
      avatar: user.imageUrl,
      activeAttendances: 0,
      totalAttendancesToday: 0,
      averageResponseTime: 0,
      lastActivity: new Date().toISOString()
    } : createAnonymousOperator();

    // Adicionar/atualizar operador na lista global
    onlineOperators.set(operator.id, operator)
    setCurrentOperator(operator)
    
    console.log(`✅ Operador ${operator.name} conectado com status: ${operator.status}${!user ? ' (modo anônimo)' : ''}`)
    notifyOperatorChange()

    // Heartbeat para manter presença ativa
    const heartbeatInterval = setInterval(() => {
      const updatedOperator = onlineOperators.get(operator.id)
      if (updatedOperator) {
        updatedOperator.lastActivity = new Date().toISOString()
        onlineOperators.set(operator.id, updatedOperator)
        notifyOperatorChange()
      }
    }, 30000) // A cada 30 segundos

    // Cleanup ao desmontar
    return () => {
      clearInterval(heartbeatInterval)
      onlineOperators.delete(operator.id)
      console.log(`❌ Operador ${operator.name} desconectado`)
      notifyOperatorChange()
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
          // Operadores disponíveis primeiro
          if (a.status === 'available' && b.status !== 'available') return -1
          if (b.status === 'available' && a.status !== 'available') return 1
          
          // Operador atual primeiro entre os do mesmo status
          if (currentOperator && a.id === currentOperator.id) return -1
          if (currentOperator && b.id === currentOperator.id) return 1
          
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
  }, [currentOperator])

  const updateOperatorStatus = (status: 'available' | 'busy' | 'away') => {
    if (currentOperator) {
      const updated = { 
        ...currentOperator, 
        status, 
        lastActivity: new Date().toISOString() 
      }
      
      onlineOperators.set(currentOperator.id, updated)
      setCurrentOperator(updated)
      notifyOperatorChange()
      
      console.log(`🔄 Status do operador ${updated.name} atualizado para: ${status}`)
      
      // Emitir evento global para outros sistemas
      window.dispatchEvent(new CustomEvent('operatorStatusChanged', { 
        detail: { operatorId: currentOperator.id, status, operator: updated }
      }))
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
      
      onlineOperators.set(currentOperator.id, updated)
      setCurrentOperator(updated)
      notifyOperatorChange()
      
      // Emitir evento global
      window.dispatchEvent(new CustomEvent('operatorStatusChanged', { 
        detail: { operatorId: currentOperator.id, status: 'busy', operator: updated }
      }))
    }
  }

  const decrementActiveAttendances = () => {
    if (currentOperator) {
      const newCount = Math.max(0, currentOperator.activeAttendances - 1)
      const newStatus = newCount === 0 ? 'available' as const : 'busy' as const
      
      const updated = {
        ...currentOperator,
        activeAttendances: newCount,
        status: newStatus,
        lastActivity: new Date().toISOString()
      }
      
      onlineOperators.set(currentOperator.id, updated)
      setCurrentOperator(updated)
      notifyOperatorChange()
      
      // Emitir evento global
      window.dispatchEvent(new CustomEvent('operatorStatusChanged', { 
        detail: { operatorId: currentOperator.id, status: newStatus, operator: updated }
      }))
    }
  }

  const getAvailableOperators = () => {
    return operators.filter(op => op.status === 'available')
  }

  const getBusyOperators = () => {
    return operators.filter(op => op.status === 'busy')
  }

  const getAwayOperators = () => {
    return operators.filter(op => op.status === 'away')
  }

  return {
    operators,
    currentOperator,
    updateOperatorStatus,
    incrementActiveAttendances,
    decrementActiveAttendances,
    getAvailableOperators,
    getBusyOperators,
    getAwayOperators
  }
}
