import React from 'react';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useUser, useClerk } from '@clerk/clerk-react';

// Interfaces
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR' | 'USER' | 'TALENT';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClerkUserInfo {
  id: string;
  emailAddresses: Array<{ emailAddress: string; id: string }>;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

import { API_BASE_URL } from '../config/api';

// Classe principal do serviço de autenticação
class AuthService {
  private static instance: AuthService;
  private api: AxiosInstance;

  private constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use(async (config) => {
      try {
        const token = await this.getClerkToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Erro ao obter token do Clerk:', error);
      }
      return config;
    });

    // Interceptor para tratamento de erros
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('Token inválido ou expirado');
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Obter token do Clerk
  private async getClerkToken(): Promise<string | null> {
    try {
      const clerk = (window as unknown as Record<string, unknown>).Clerk as {
        session?: {
          getToken(): Promise<string>;
          getToken(options?: { template?: string }): Promise<string>;
        };
      };
      if (clerk?.session) {
        // Tentar obter token com template específico para o backend
        try {
          return await clerk.session.getToken({ template: 'pregiato_backend' });
        } catch {
          // Fallback para token padrão
          return await clerk.session.getToken();
        }
      }
    } catch (error) {
      console.warn('Erro ao obter token do Clerk:', error);
    }
    return null;
  }

  // Obter usuário atual do backend
  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    try {
      const response: AxiosResponse<AuthenticatedUser> = await this.api.get('/api/users/me');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      
      // Fallback para desenvolvimento quando backend não está disponível
      if (import.meta.env.DEV) {
        return {
          id: 'dev-user-1',
          email: 'dev@example.com',
          name: 'Usuário de Desenvolvimento',
          role: 'ADMIN',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      
      return null;
    }
  }

  // Verificar se usuário é admin
  async isUserAdmin(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user?.role === 'ADMIN';
    } catch (error) {
      console.error('Erro ao verificar se usuário é admin:', error);
      
      // Fallback para desenvolvimento
      if (import.meta.env.DEV) {
        return true;
      }
      
      return false;
    }
  }

  // Obter usuário por email
  async getUserByEmail(email: string): Promise<AuthenticatedUser | null> {
    try {
      const response: AxiosResponse<AuthenticatedUser> = await this.api.get(`/api/users/email/${email}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter usuário por email:', error);
      return null;
    }
  }

  // Obter usuário por Clerk ID
  async getUserByClerkId(clerkId: string): Promise<AuthenticatedUser | null> {
    try {
      const response: AxiosResponse<AuthenticatedUser> = await this.api.get(`/api/users/clerk/${clerkId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter usuário por Clerk ID:', error);
      return null;
    }
  }

  // Criar ou atualizar usuário no backend
  async createOrUpdateUser(clerkUserInfo: ClerkUserInfo): Promise<AuthenticatedUser | null> {
    try {
      const userData = {
        clerkId: clerkUserInfo.id,
        email: clerkUserInfo.emailAddresses[0]?.emailAddress,
        name: `${clerkUserInfo.firstName || ''} ${clerkUserInfo.lastName || ''}`.trim(),
        imageUrl: clerkUserInfo.imageUrl,
      };

      const response: AxiosResponse<AuthenticatedUser> = await this.api.post('/api/users/sync', userData);
      return response.data;
    } catch (error) {
      console.error('Erro ao sincronizar usuário:', error);
      return null;
    }
  }

  // Sincronizar usuário do Clerk com o backend
  async syncClerkUser(): Promise<AuthenticatedUser | null> {
    try {
      const clerk = (window as unknown as Record<string, unknown>).Clerk as {
        user?: {
          id: string;
          emailAddresses?: Array<{ emailAddress: string; id: string }>;
          firstName?: string;
          lastName?: string;
          imageUrl?: string;
        };
      };
      if (!clerk?.user) {
        return null;
      }

      const clerkUserInfo: ClerkUserInfo = {
        id: clerk.user.id,
        emailAddresses: clerk.user.emailAddresses || [],
        firstName: clerk.user.firstName,
        lastName: clerk.user.lastName,
        imageUrl: clerk.user.imageUrl,
      };

      return await this.createOrUpdateUser(clerkUserInfo);
    } catch (error) {
      console.error('Erro ao sincronizar usuário do Clerk:', error);
      return null;
    }
  }
}

// Hook para obter instância do serviço
export const useAuthService = () => {
  return React.useMemo(() => AuthService.getInstance(), []);
};

// Hook para obter usuário atual
export const useCurrentUser = () => {
  const [user, setUser] = React.useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const authService = useAuthService();

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Erro ao obter usuário atual:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [authService]);

  return { user, loading };
};

// Hook para verificar se usuário é admin
export const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const authService = useAuthService();
  const { user } = useCurrentUser();

  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.email) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const adminStatus = await authService.isUserAdmin();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Erro ao verificar status de admin:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]); // authService é um singleton estável, não precisa estar nas dependências

  return { isAdmin, loading };
};

// Hook para obter informações do usuário do Clerk
export const useClerkUserInfo = () => {
  const { user: clerkUser } = useUser();
  const [clerkUserInfo, setClerkUserInfo] = React.useState<ClerkUserInfo | null>(null);

  React.useEffect(() => {
    if (clerkUser) {
      setClerkUserInfo({
        id: clerkUser.id,
        emailAddresses: clerkUser.emailAddresses || [],
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      });
    } else {
      setClerkUserInfo(null);
    }
  }, [clerkUser]);

  return { clerkUserInfo, loading: !clerkUser };
};

// Hook para sincronizar usuário do Clerk com o backend
export const useSyncClerkUser = () => {
  const [user, setUser] = React.useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const authService = useAuthService();
  const { clerkUserInfo } = useClerkUserInfo();

  const syncUser = React.useCallback(async () => {
    if (!clerkUserInfo) return;

    try {
      setLoading(true);
      setError(null);
      const syncedUser = await authService.syncClerkUser();
      setUser(syncedUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao sincronizar usuário:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkUserInfo]); // authService é um singleton estável, não precisa estar nas dependências

  React.useEffect(() => {
    if (clerkUserInfo) {
      syncUser();
    }
  }, [clerkUserInfo, syncUser]);

  return { user, loading, error, refetch: syncUser };
};

// Hook para obter informações do Clerk
export const useClerkInfo = () => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  return {
    clerkUser,
    isLoaded,
    isSignedIn,
    signOut,
  };
};

export default AuthService;
