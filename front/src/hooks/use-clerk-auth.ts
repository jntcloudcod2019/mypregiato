import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

export const useClerkAuth = () => {
  const { getToken } = useAuth();

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getToken();
      return token;
    } catch (error) {
      console.error('Erro ao obter token do Clerk:', error);
      return null;
    }
  }, [getToken]);

  return { getAuthToken };
};
