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
  canAccessRoute: (route: string) => boolean;
  
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

      // Buscar ou criar usuário no banco de dados
      const response = await apiClient.get<UserData>(`/api/Users/by-email/${encodeURIComponent(email)}`);
      
      console.log('[AuthPermissions] Dados do usuário:', response.data);
      
      setUser(response.data);
    } catch (err: any) {
      console.error('[AuthPermissions] Erro ao buscar usuário:', err);
      
      // Se o usuário não existe, tentar criar
      if (err.response?.status === 404 && clerkUser) {
        try {
          console.log('[AuthPermissions] Criando novo usuário no banco...');
          
          const email = clerkUser.primaryEmailAddress?.emailAddress;
          const firstName = clerkUser.firstName || 'Usuário';
          const lastName = clerkUser.lastName || '';
          
          const newUser = await apiClient.post<UserData>('/api/Users', {
            email,
            firstName,
            lastName,
            clerkId: clerkUser.id,
            role: 'USER', // Role padrão
            imageUrl: clerkUser.imageUrl
          });
          
          console.log('[AuthPermissions] Usuário criado:', newUser.data);
          setUser(newUser.data);
        } catch (createError) {
          console.error('[AuthPermissions] Erro ao criar usuário:', createError);
          setError('Erro ao sincronizar usuário com o banco de dados');
        }
      } else {
        setError(err.message || 'Erro ao carregar dados do usuário');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, clerkUser]);

  useEffect(() => {
    if (isClerkLoaded) {
      fetchUserData();
    }
  }, [isClerkLoaded, fetchUserData]);

  const role = user?.role ? (user.role as UserRole) : null;

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

  const checkCanAccessRoute = useCallback((route: string): boolean => {
    if (!role) return false;
    return canAccessRoute(role, route);
  }, [role]);

  // Helpers de role
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
    canAccessRoute: checkCanAccessRoute,
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

