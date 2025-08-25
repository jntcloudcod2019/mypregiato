import React, { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { LoadingFallback } from '../ui/loading-fallback';


interface AuthInitializerProps {
  children: React.ReactNode;
}

/**
 * Componente que garante que o processo de autenticação seja executado corretamente
 * na inicialização da aplicação
 */
export const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const { isLoaded, isSignedIn } = useUser();
  const { session } = useClerk();
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);
  


  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Aguardar o Clerk carregar completamente
        if (!isLoaded) {
          return;
        }

        // Se o usuário está autenticado, verificar se tem sessão válida
        if (isSignedIn) {
          console.log('✅ Usuário autenticado, verificando sessão...');
          
          // Aguardar a sessão estar disponível
          if (session) {
            console.log('✅ Sessão válida encontrada');
            setIsInitialized(true);
            return;
          }
        } else {
          console.log('ℹ️ Usuário não autenticado, redirecionando para login...');
          // Redirecionar para login se não estiver autenticado
          navigate('/login', { replace: true });
          setIsInitialized(true);
          return;
        }
      } catch (error) {
        console.error('❌ Erro durante inicialização da autenticação:', error);
        // Em caso de erro, redirecionar para login
        navigate('/login', { replace: true });
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [isLoaded, isSignedIn, session, navigate]);

  // Mostrar loading enquanto inicializa
  if (!isLoaded || !isInitialized) {
    return <LoadingFallback />;
  }

  return <>{children}</>;
};
