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

      // Buscar usuário no banco de dados
      const response = await apiClient.get<UserData>(`/api/Users/by-email/${encodeURIComponent(email)}`);
      
      setUser(response);
      setError(null); // Limpar qualquer erro anterior
    } catch (err) {
      const error = err as { response?: { status?: number }; message?: string };
      console.warn('[AuthPermissions] Usuário não encontrado no banco de dados, permitindo acesso em modo degradado:', error);
      
      // NÃO bloquear o acesso - apenas logar o aviso
      // O usuário está autenticado no Clerk, então pode acessar
      setUser(null);
      setError(null); // NÃO definir erro para não acionar ErrorBoundary
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

