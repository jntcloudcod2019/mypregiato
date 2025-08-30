import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { useState, useEffect } from 'react';

export interface UserRole {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

// Interface para usuário do Clerk (simplificada)
interface ClerkUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
}

// Valores padrão para quando não temos acesso ao Clerk
const DEFAULT_ROLE: UserRole = {
  id: 'local-operator',
  email: 'operador@local.dev',
  role: 'OPERATOR',
  isActive: true
};

export class UserRoleService {
  static async getUserRoleByEmail(email: string): Promise<UserRole | null> {
    try {
      const response = await axios.get(`http://localhost:5656/api/users/by-email/${email}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar role do usuário:', error);
      return null;
    }
  }

  static async getUserRoleByClerkId(clerkId: string): Promise<UserRole | null> {
    try {
      const response = await axios.get(`http://localhost:5656/api/users/by-clerk-id/${clerkId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar role do usuário:', error);
      return null;
    }
  }

  static isAdmin(role: string): boolean {
    return role?.toUpperCase() === 'ADMIN';
  }

  static isOperator(role: string): boolean {
    return ['ADMIN', 'OPERATOR', 'SUPERVISOR'].includes(role?.toUpperCase() || '');
  }
}

// Hook seguro que tenta usar Clerk, mas não falha se não estiver disponível
const useSafeClerkUser = (): { user: ClerkUser | null } => {
  try {
    // Tentar usar o hook do Clerk
    return useUser();
  } catch (error) {
    console.warn('Clerk não está disponível no useUserRole, usando modo anônimo', error);
    
    // NÃO marcar clerk_failed aqui - pode ser um erro temporário
    // Apenas retornar valores padrão e deixar outros componentes decidirem
    
    // Retornar valores padrão
    return { user: null };
  }
};

export const useUserRole = () => {
  // Usar o hook seguro para Clerk
  const { user } = useSafeClerkUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Flag para indicar se estamos em modo anônimo
  const isAnonymousMode = !user;

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setLoading(true);
        
        // Se estamos em modo anônimo, usar role padrão
        if (isAnonymousMode) {
          console.log('Usando role padrão para modo anônimo');
          setUserRole(DEFAULT_ROLE);
          return;
        }
        
        // Se não temos usuário, não há role para buscar
        if (!user) {
          return;
        }

        const email = user.emailAddresses[0]?.emailAddress;
        const clerkId = user.id;

        if (email) {
          const role = await UserRoleService.getUserRoleByEmail(email);
          setUserRole(role);
        } else if (clerkId) {
          const role = await UserRoleService.getUserRoleByClerkId(clerkId);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Erro ao buscar role do usuário:', error);
        // Em caso de erro, usar role padrão
        setUserRole(DEFAULT_ROLE);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user, isAnonymousMode]);

  return {
    userRole,
    loading,
    isAdmin: userRole ? UserRoleService.isAdmin(userRole.role) : false,
    isOperator: userRole ? UserRoleService.isOperator(userRole.role) : isAnonymousMode // Em modo anônimo, consideramos como operador
  };
};