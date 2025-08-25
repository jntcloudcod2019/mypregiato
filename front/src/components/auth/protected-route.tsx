import React from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingFallback } from '../ui/loading-fallback';

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
    return <LoadingFallback />;
  }

  // Se não está autenticado, redirecionar para login
  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se está autenticado, mostrar o conteúdo
  return <>{children}</>;
};
