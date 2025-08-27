import React, { useEffect } from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingFallback } from '../ui/loading-fallback';
import { forceImmediateLogout } from '@/utils/auth-cleanup';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  requireAuth = true
}) => {
  const { isLoaded, isSignedIn } = useUser();
  const location = useLocation();

  // Se não requer autenticação, renderizar normalmente
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Se ainda está carregando, mostrar loading
  if (!isLoaded) {
    return fallback || <LoadingFallback />;
  }

  // Se não está autenticado, redirecionar para login SEMPRE
  if (!isSignedIn) {
    // Limpar qualquer status de falha do Clerk para forçar nova tentativa
    try {
      sessionStorage.removeItem('clerk_failed');
    } catch (e) {
      console.error('Erro ao limpar status de falha:', e);
    }
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se está autenticado, mostrar o conteúdo
  return <>{children}</>;
};
