import React, { useEffect, useState } from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import CustomLogin from '../components/auth/custom-login';
import { useAuthPermissions } from '../hooks/use-auth-permissions';

const LoginPage: React.FC = () => {
  const location = useLocation();
  const [params] = useSearchParams();
  const { user } = useUser();
  const { user: dbUser, isLoading: isLoadingUser, role } = useAuthPermissions();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  // 1️⃣ Origem via ProtectedRoute
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  // 2️⃣ Via query param (?return_to=/treinamentos/criar)
  const returnTo = params.get("return_to") || undefined;

  // 3️⃣ Última rota válida salva
  const lastRoute = sessionStorage.getItem("lastRoute") || undefined;

  // ✅ Definir redirecionamento baseado no role (usa o contexto que já faz auto-criação)
  useEffect(() => {
    // Aguardar o Clerk carregar e o contexto terminar de buscar/criar o usuário
    if (!user || isLoadingUser) {
      return;
    }

    console.log("🔐 [Login] Usuário Clerk carregado:", user.primaryEmailAddress?.emailAddress);
    console.log("👤 [Login] Usuário do banco:", dbUser);
    console.log("🎭 [Login] Role:", role);

    // Se for MODEL, redirecionar para o perfil
    if (role === 'MODEL' && dbUser?.id) {
      console.log("🎭 [Login] Usuário é MODEL, redirecionando para perfil");
      setRedirectTo(`/talentos/perfil/${dbUser.id}`);
    } else {
      // Para outros roles, usar a ordem de prioridade normal
      const defaultRedirect = fromPath || returnTo || lastRoute || "/dashboard";
      console.log("🔐 [Login] Redirecionando para:", defaultRedirect);
      setRedirectTo(defaultRedirect);
    }
  }, [user, isLoadingUser, dbUser, role, fromPath, returnTo, lastRoute]);

  // Salvar a rota de destino e logs para debug
  useEffect(() => {
    if (fromPath) {
      sessionStorage.setItem('lastRoute', fromPath);
    }
    

  }, [fromPath, returnTo, lastRoute, redirectTo]);

  return (
    <>
      <SignedIn>
        {isLoadingUser || !redirectTo ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {isLoadingUser ? 'Carregando perfil...' : 'Redirecionando...'}
              </p>
            </div>
          </div>
        ) : (
          <Navigate to={redirectTo} replace />
        )}
      </SignedIn>
      <SignedOut>
        <CustomLogin />
      </SignedOut>
    </>
  );
};

export default LoginPage;
