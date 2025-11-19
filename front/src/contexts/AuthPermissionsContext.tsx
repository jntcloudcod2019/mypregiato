import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { UserRole, Permission, hasPermission, hasAllPermissions, hasAnyPermission, canAccessRoute } from '@/config/permissions';
import apiClient from '@/services/api-client';

export interface UserData {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  role: string; // API retorna como string, não como enum
  createdAt: string;
  updatedAt: string;
}

export interface AuthPermissionsContextType {
  user: UserData | null;
  role: string | null; // Role é string, não enum
  isLoading: boolean;
  error: string | null;
  
  // Funções de verificação de permissão
  hasPermission: (permission: Permission) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
 
  
  // Helpers de role
  isAdmin: boolean;
  isInstructor: boolean;
  isOperator: boolean;
  isProducer: boolean;
  isModel: boolean;
  isStudent: boolean;
  
  // Função para recarregar dados do usuário
  refetch: () => Promise<void>;
}

const AuthPermissionsContext = createContext<AuthPermissionsContextType | undefined>(undefined);

interface AuthPermissionsProviderProps {
  children: React.ReactNode;
}

export const AuthPermissionsProvider: React.FC<AuthPermissionsProviderProps> = ({ children }) => {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!isSignedIn || !clerkUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const email = clerkUser.primaryEmailAddress?.emailAddress;
      
      if (!email) {
        console.warn('[AuthPermissions] Email não encontrado no Clerk - modo degradado');
        setUser(null);
        setIsLoading(false);
        return;
      }

      // 1️⃣ TENTAR buscar usuário no banco de dados
      try {
        const response = await apiClient.get<UserData>(`/api/Users/by-email/${encodeURIComponent(email)}`);
        setUser(response);
        setError(null);
        console.log('✅ [AuthPermissions] Usuário encontrado no banco:', response);
        return; // Sucesso!
      } catch (err) {
        const error = err as { response?: { status?: number }; message?: string };
        
        // 2️⃣ Se NÃO existir (404), criar automaticamente
        if (error.response?.status === 404) {
          console.log('🔧 [AuthPermissions] Usuário não existe no banco, criando automaticamente...');
          
          try {
            // Extrair dados do Clerk
            const firstName = clerkUser.firstName || clerkUser.fullName?.split(' ')[0] || 'Usuário';
            const lastName = clerkUser.lastName || clerkUser.fullName?.split(' ').slice(1).join(' ') || 'Modelo';
            
            // Buscar role do public_metadata do Clerk
            const clerkMetadata = clerkUser.publicMetadata as { systemRole?: string } | undefined;
            const role = clerkMetadata?.systemRole || 'MODEL'; // Default MODEL para migrados
            
            console.log('📝 [AuthPermissions] Criando usuário:', {
              email,
              firstName,
              lastName,
              role,
              clerkId: clerkUser.id
            });
            
            // 3️⃣ CRIAR usuário no banco via API
            const newUser = await apiClient.post<UserData>('/api/Users', {
              email,
              firstName,
              lastName,
              role,
              clerkId: clerkUser.id,
              imageUrl: clerkUser.imageUrl || null
            });
            
            console.log('✅ [AuthPermissions] Usuário criado com sucesso no banco:', newUser);
            setUser(newUser);
            setError(null);
            
          } catch (createError) {
            console.error('❌ [AuthPermissions] Erro ao criar usuário no banco:', createError);
            // Permitir acesso mesmo se falhar (modo degradado)
            setUser(null);
            setError(null);
          }
          
        } else {
          // Outro erro que não é 404
          console.error('[AuthPermissions] Erro ao buscar usuário:', error);
          setUser(null);
          setError(null);
        }
      }
      
    } catch (err) {
      console.error('[AuthPermissions] Erro inesperado:', err);
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, clerkUser]);

  useEffect(() => {
    if (isClerkLoaded) {
      fetchUserData();
    }
  }, [isClerkLoaded, fetchUserData]);

  // A role vem da API como string (ex: "ADMIN", "MODEL", "INSTRUCTOR")
  const role = user?.role || null;

  // Funções de verificação de permissão
  const checkPermission = useCallback((permission: Permission): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  }, [role]);

  const checkAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!role) return false;
    return hasAllPermissions(role, permissions);
  }, [role]);

  const checkAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!role) return false;
    return hasAnyPermission(role, permissions);
  }, [role]);

  // Helpers de role - comparação direta com enum
  const isAdmin = role === UserRole.ADMIN;
  const isInstructor = role === UserRole.INSTRUCTOR;
  const isOperator = role === UserRole.OPERATOR;
  const isProducer = role === UserRole.PRODUCER;
  const isModel = role === UserRole.MODEL;
  const isStudent = role === UserRole.STUDENT;

  const value: AuthPermissionsContextType = {
    user,
    role,
    isLoading,
    error,
    hasPermission: checkPermission,
    hasAllPermissions: checkAllPermissions,
    hasAnyPermission: checkAnyPermission,
    isAdmin,
    isInstructor,
    isOperator,
    isProducer,
    isModel,
    isStudent,
    refetch: fetchUserData,
  };

  return (
    <AuthPermissionsContext.Provider value={value}>
      {children}
    </AuthPermissionsContext.Provider>
  );
};

export default AuthPermissionsContext;

