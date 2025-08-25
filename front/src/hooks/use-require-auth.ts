import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

// Hook para verificar se o usuário está autenticado
export const useRequireAuth = () => {
  const { isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return { isLoaded, isSignedIn };
};
