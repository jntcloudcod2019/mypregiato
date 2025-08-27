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
          
          // Aguardar a sessão estar disponível (com timeout)
          if (session) {
            console.log('✅ Sessão válida encontrada');
            setIsInitialized(true);
            return;
          } else {
            // Se não tem sessão mas está autenticado, aguardar um pouco
            setTimeout(() => {
              if (session) {
                console.log('✅ Sessão válida encontrada (timeout)');
                setIsInitialized(true);
              } else {
                console.log('⚠️ Usuário autenticado mas sem sessão - permitindo acesso');
                setIsInitialized(true);
              }
            }, 1000);
            return;
          }
        } else {
          console.log('ℹ️ Usuário não autenticado, permitindo acesso à página de login...');
          // Não redirecionar automaticamente, permitir que o usuário acesse a página de login
          setIsInitialized(true);
          return;
        }
      } catch (error) {
        console.error('❌ Erro durante inicialização da autenticação:', error);
        // Em caso de erro, permitir acesso à página de login
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [isLoaded, isSignedIn]); // Removido session e navigate das dependências

  // Mostrar loading enquanto inicializa
  if (!isLoaded || !isInitialized) {
    return <LoadingFallback />;
  }

  return <>{children}</>;
};
