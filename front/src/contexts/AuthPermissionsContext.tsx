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
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

interface AuthPermissionsContextType {
  user: UserData | null;
  role: UserRole | null;
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
        throw new Error('Email não encontrado no Clerk');
      }

      console.log('[AuthPermissions] Buscando dados do usuário:', email);

      // Buscar usuário no banco de dados
      const response = await apiClient.get<UserData>(`/api/Users/by-email/${encodeURIComponent(email)}`);
      
      console.log('[AuthPermissions] Dados do usuário:', response);
      
      setUser(response);
    } catch (err) {
      const error = err as { response?: { status?: number }; message?: string };
      console.error('[AuthPermissions] Erro ao buscar usuário:', error);
      setError(error.message || 'Usuário não encontrado no sistema');
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, clerkUser]);

  useEffect(() => {
    if (isClerkLoaded) {
      fetchUserData();
    }
  }, [isClerkLoaded, fetchUserData]);

  const role = user?.role.toString() ? (user.role.toString() as UserRole) : null;

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


  // Helpers de role
  const isAdmin = role === UserRole.ADMIN.toString();
  const isInstructor = role === UserRole.INSTRUCTOR.toString();
  const isOperator = role === UserRole.OPERATOR;
  const isProducer = role === UserRole.PRODUCER.toString();
  const isModel = role === UserRole.MODEL.toString();
  const isStudent = role === UserRole.STUDENT.toString();

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

export const useAuthPermissions = (): AuthPermissionsContextType => {
  const context = useContext(AuthPermissionsContext);
  if (context === undefined) {
    throw new Error('useAuthPermissions must be used within an AuthPermissionsProvider');
  }
  return context;
};

export default AuthPermissionsContext;

