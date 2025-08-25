import React, { useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoadingFallback } from '../ui/loading-fallback';

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

  useEffect(() => {
    // Se o Clerk carregou e não está autenticado, redirecionar para login
    if (isLoaded && !isSignedIn && !isPublicRoute) {
      console.log('Usuário não autenticado, redirecionando para login');
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isLoaded, isSignedIn, isPublicRoute, navigate, location]);

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
