import React, { useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoadingFallback } from '../ui/loading-fallback';
import { forceImmediateLogout } from '@/utils/auth-cleanup';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Componente de proteção global de autenticação
 * Garante que o usuário esteja autenticado antes de acessar qualquer rota protegida
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isLoaded, isSignedIn } = useUser();
  const { session } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();

  // Rotas públicas que não requerem autenticação
  const publicRoutes = ['/login', '/ficha'];
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));
  
  // Verificar se o Clerk está disponível
  const clerkFailed = sessionStorage.getItem('clerk_failed') === 'true';

  // TEMPORARIAMENTE DESABILITADO: Verificação de servidor reiniciado
  // useEffect(() => {
  //   const serverRestarted = sessionStorage.getItem('server_restarted') === 'true';
  //   if (serverRestarted) {
  //     console.log('🔄 Servidor reiniciado detectado no AuthGuard - Forçando logout');
  //     forceImmediateLogout();
  //     return;
  //   }
  // }, []); // Executar apenas uma vez na montagem

  // TEMPORARIAMENTE DESABILITADO: Verificação de servidor para evitar loop
  // useEffect(() => {
  //   if (isLoaded && isSignedIn) {
  //     const alreadyChecked = sessionStorage.getItem('server_checked') === 'true';
  //     if (!alreadyChecked) {
  //       console.log('🔄 Verificando servidor para usuário autenticado...');
  //       sessionStorage.setItem('server_checked', 'true');
  //     }
  //   }
  // }, [isLoaded, isSignedIn]);

  useEffect(() => {
    // Se o Clerk falhou, permitir acesso a todas as rotas (modo de emergência)
    if (clerkFailed) {
      console.log('Clerk falhou, permitindo acesso em modo de emergência');
      return;
    }
    
    // Se o Clerk carregou e não está autenticado, redirecionar para login
    if (isLoaded && !isSignedIn && !isPublicRoute) {
      console.log('Usuário não autenticado, redirecionando para login');
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isLoaded, isSignedIn, isPublicRoute, navigate, location, clerkFailed]);

  // Se o Clerk falhou, permitir acesso a todas as rotas (modo de emergência)
  if (clerkFailed) {
    return <>{children}</>;
  }

  // Se ainda está carregando, mostrar loading
  if (!isLoaded) {
    return <LoadingFallback />;
  }

  // Se não está autenticado e não é rota pública, não renderizar nada
  // (o useEffect vai redirecionar)
  if (!isSignedIn && !isPublicRoute) {
    return <LoadingFallback />;
  }

  // Se está autenticado ou é rota pública, renderizar normalmente
  return <>{children}</>;
};
