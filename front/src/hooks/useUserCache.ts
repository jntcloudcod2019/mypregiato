import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { OperatorLead } from '@/types/operator-lead';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  // Adicione outros campos conforme necessário
}

interface UserCache {
  userInfo: UserInfo | null;
  leads: OperatorLead[];
  lastFetch: number;
  isLoading: boolean;
  error: string | null;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const userCache = new Map<string, UserCache>();

export const useUserCache = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [cache, setCache] = useState<UserCache>({
    userInfo: null,
    leads: [],
    lastFetch: 0,
    isLoading: false,
    error: null
  });

  // ✅ VERIFICAÇÃO DE SEGURANÇA: Só executar quando o usuário estiver completamente autenticado
  const isUserReady = isLoaded && isSignedIn && user?.emailAddresses?.[0]?.emailAddress;

  const getUserInfo = useCallback(async (email: string): Promise<UserInfo | null> => {
    try {
      const response = await fetch(`http://localhost:5656/api/users/by-email/${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar informações do usuário:', error);
      return null;
    }
  }, []);

  const getLeads = useCallback(async (email: string): Promise<OperatorLead[]> => {
    try {
      const response = await fetch(`http://localhost:5656/api/operator-leads/by-email/${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // PublicADS já é string, não precisa de conversão
          return data.data.map((lead: {
            nameLead: string;
            phoneLead: string;
            responsible?: string | null;
            age?: number | null;
            publicADS?: string | null;
          }) => ({
            ...lead
          }));
        }
        return [];
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      return [];
    }
  }, []);

  const fetchUserData = useCallback(async (forceRefresh = false) => {
    // ✅ VERIFICAÇÃO DE SEGURANÇA: Só executar quando o usuário estiver pronto
    if (!isUserReady) {
      console.log('🔄 [CACHE] Usuário não está pronto, aguardando...');
      return;
    }

    const email = user!.emailAddresses[0].emailAddress;
    const now = Date.now();
    const cached = userCache.get(email);

    // Verificar se o cache é válido e não forçar refresh
    if (!forceRefresh && cached && (now - cached.lastFetch) < CACHE_DURATION) {
      console.log('📦 [CACHE] Usando dados em cache para:', email);
      setCache(cached);
      return;
    }

    // Marcar como carregando
    setCache(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🔄 [CACHE] Buscando dados do usuário:', email);
      
      // Buscar informações do usuário e leads em paralelo
      const [userInfo, leads] = await Promise.all([
        getUserInfo(email),
        getLeads(email)
      ]);

      const newCache: UserCache = {
        userInfo,
        leads,
        lastFetch: now,
        isLoading: false,
        error: null
      };

      // Atualizar cache global
      userCache.set(email, newCache);
      
      // Atualizar estado local
      setCache(newCache);
      
      console.log('✅ [CACHE] Dados atualizados com sucesso:', {
        userInfo: !!userInfo,
        leadsCount: leads.length,
        cacheSize: userCache.size
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ [CACHE] Erro ao buscar dados:', errorMessage);
      
      setCache(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [isUserReady, user, getUserInfo, getLeads]);

  const refreshCache = useCallback(() => {
    fetchUserData(true);
  }, [fetchUserData]);

  const clearCache = useCallback(() => {
    if (isUserReady) {
      userCache.delete(user!.emailAddresses[0].emailAddress);
      setCache({
        userInfo: null,
        leads: [],
        lastFetch: 0,
        isLoading: false,
        error: null
      });
      console.log('🗑️ [CACHE] Cache limpo para usuário');
    }
  }, [isUserReady, user]);

  // ✅ Buscar dados quando o usuário estiver pronto
  useEffect(() => {
    if (isUserReady) {
      fetchUserData();
    }
  }, [isUserReady, fetchUserData]);

  // ✅ Limpar cache quando o usuário fizer logout
  useEffect(() => {
    if (!isUserReady) {
      clearCache();
    }
  }, [isUserReady, clearCache]);

  return {
    ...cache,
    refreshCache,
    clearCache,
    fetchUserData
  };
};
