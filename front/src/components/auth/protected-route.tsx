import React from 'react';
import { useUser, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useCurrentUser, useIsAdmin } from '@/services/auth-service';
import { LoadingFallback } from '@/components/ui/loading-fallback';
import CustomLogin from './custom-login';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireOperator?: boolean;
  fallback?: React.ReactNode;
}

// Componente base de proteção que funciona com Clerk
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireOperator = false,
  fallback
}) => {
  const { isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { user: backendUser, loading: userLoading } = useCurrentUser();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  // Se o Clerk ainda está carregando
  if (!clerkLoaded) {
    return <LoadingFallback />;
  }

  // Se não requer autenticação, mostrar conteúdo
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Se não está autenticado no Clerk
  if (!isSignedIn) {
    return fallback || <CustomLogin />;
  }

  // Se está carregando dados do backend
  if (userLoading || adminLoading) {
    return <LoadingFallback />;
  }

  // Verificar permissões específicas
  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Acesso Negado
          </h2>
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (requireOperator && !backendUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Usuário não encontrado
          </h2>
          <p className="text-gray-600">
            Seu usuário não foi encontrado no sistema.
          </p>
        </div>
      </div>
    );
  }

  // Se passou por todas as verificações, mostrar conteúdo
  return <>{children}</>;
};

// Componente wrapper para rotas que requerem autenticação
export const AuthenticatedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SignedIn>
      <ProtectedRoute requireAuth={true}>
        {children}
      </ProtectedRoute>
    </SignedIn>
  );
};

// Componente wrapper para rotas que requerem admin
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SignedIn>
      <ProtectedRoute requireAuth={true} requireAdmin={true}>
        {children}
      </ProtectedRoute>
    </SignedIn>
  );
};

// Componente wrapper para rotas que requerem operador
export const OperatorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SignedIn>
      <ProtectedRoute requireAuth={true} requireOperator={true}>
        {children}
      </ProtectedRoute>
    </SignedIn>
  );
};

// Componente wrapper para rotas públicas (não autenticadas)
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SignedOut>
      {children}
    </SignedOut>
  );
};
