import { useAuth } from '@clerk/clerk-react';

export const useClerkAuth = () => {
  const { getToken, isSignedIn } = useAuth();

  const getClerkToken = async (): Promise<string | null> => {
    try {
      if (!isSignedIn) {
        return null;
      }
      const token = await getToken();
      return token;
    } catch (error) {
      console.error('Erro ao obter token do Clerk:', error);
      return null;
    }
  };

  return {
    getClerkToken,
    isSignedIn
  };
};
