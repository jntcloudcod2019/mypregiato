
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import axios from 'axios'

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

// Interface para usuário da API
interface ApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  imageUrl?: string;
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

export const useOperatorStatus = () => {
  // Usar o hook do Clerk diretamente
  const { user, isLoaded } = useUser();
  const [operators, setOperators] = useState<OperatorInfo[]>([]);
  const [currentOperator, setCurrentOperator] = useState<OperatorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Buscar dados do usuário na API
  const fetchUserFromApi = async (email: string): Promise<ApiUser | null> => {
    try {
      const response = await axios.get(`http://localhost:5656/api/users/by-email/${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuário na API:', error);
      return null;
    }
  };
  
  // Registrar operador atual quando componente montar
  useEffect(() => {
    // Só criar operador se o usuário estiver autenticado
    if (!user || !isLoaded) {
      setCurrentOperator(null);
      return;
    }

    let heartbeatInterval: NodeJS.Timeout | null = null;
    let currentOperatorId: string | null = null;

    const setupOperator = async () => {
      setLoading(true);
      try {
        const userEmail = user.emailAddresses[0]?.emailAddress;
        if (!userEmail) {
          console.error('Email do usuário não encontrado');
          setCurrentOperator(null);
          return;
        }

        // Buscar dados do usuário na API
        const apiUser = await fetchUserFromApi(userEmail);
        
        // Criar operador baseado nos dados da API ou fallback para dados do Clerk
        const operator: OperatorInfo = {
          id: user.id, // Sempre usar o ClerkId como ID do operador
          name: apiUser ? `${apiUser.firstName} ${apiUser.lastName}`.trim() : (user.fullName || user.firstName || 'Operador'),
          email: apiUser?.email || userEmail,
          status: 'available',
          avatar: apiUser?.imageUrl || user.imageUrl,
          activeAttendances: 0,
          totalAttendancesToday: 0,
          averageResponseTime: 0,
          lastActivity: new Date().toISOString()
        };

        // Adicionar/atualizar operador na lista global
        onlineOperators.set(operator.id, operator)
        setCurrentOperator(operator)
        currentOperatorId = operator.id;
        
        console.log(`✅ Operador ${operator.name} conectado com status: ${operator.status}`)
        notifyOperatorChange()

        // Heartbeat para manter presença ativa
        heartbeatInterval = setInterval(() => {
          const updatedOperator = onlineOperators.get(operator.id)
          if (updatedOperator) {
            updatedOperator.lastActivity = new Date().toISOString()
            onlineOperators.set(operator.id, updatedOperator)
            notifyOperatorChange()
          }
        }, 30000) // A cada 30 segundos
      } catch (error) {
        console.error('Erro ao configurar operador:', error);
        setCurrentOperator(null);
      } finally {
        setLoading(false);
      }
    };

    setupOperator();

    // Cleanup ao desmontar
    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      if (currentOperatorId) {
        onlineOperators.delete(currentOperatorId);
        console.log(`❌ Operador desconectado`)
        notifyOperatorChange();
      }
    };
  }, [user, isLoaded])

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
    loading,
    updateOperatorStatus,
    incrementActiveAttendances,
    decrementActiveAttendances,
    getAvailableOperators,
    getBusyOperators,
    getAwayOperators
  }
}
