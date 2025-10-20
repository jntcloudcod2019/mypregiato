import React, { useEffect, useState } from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import CustomLogin from '../components/auth/custom-login';
import { userManagementService } from '../services/user-management-service';

const LoginPage: React.FC = () => {
  const location = useLocation();
  const [params] = useSearchParams();
  const { user } = useUser();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  // 1️⃣ Origem via ProtectedRoute
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  // 2️⃣ Via query param (?return_to=/treinamentos/criar)
  const returnTo = params.get("return_to") || undefined;

  // 3️⃣ Última rota válida salva
  const lastRoute = sessionStorage.getItem("lastRoute") || undefined;

  // ✅ Verificar role do usuário e definir redirecionamento
  useEffect(() => {
    const checkUserRoleAndRedirect = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        setIsCheckingUser(false);
        return;
      }

      try {
        console.log("🔐 [Login] Buscando dados do usuário:", user.primaryEmailAddress.emailAddress);
        
        // Buscar dados do usuário no banco
        const dbUser = await userManagementService.getUserByEmail(user.primaryEmailAddress.emailAddress);
        console.log("👤 [Login] Usuário encontrado:", dbUser);
        
        // Se for MODEL, redirecionar para o perfil
        if (dbUser.role === 'MODEL') {
          console.log("🎭 [Login] Usuário é MODEL, redirecionando para perfil");
          setRedirectTo(`/talentos/perfil/${dbUser.id}`);
        } else {
          // Para outros roles, usar a ordem de prioridade normal
          const defaultRedirect = fromPath || returnTo || lastRoute || "/dashboard";
          console.log("🔐 [Login] Usuário não é MODEL, usando redirecionamento padrão:", defaultRedirect);
          setRedirectTo(defaultRedirect);
        }
      } catch (error) {
        console.error("❌ [Login] Erro ao buscar usuário:", error);
        // Em caso de erro, usar redirecionamento padrão
        const defaultRedirect = fromPath || returnTo || lastRoute || "/dashboard";
        setRedirectTo(defaultRedirect);
      } finally {
        setIsCheckingUser(false);
      }
    };

    if (user) {
      checkUserRoleAndRedirect();
    } else {
      setIsCheckingUser(false);
    }
  }, [user, fromPath, returnTo, lastRoute]);

  // Salvar a rota de destino e logs para debug
  useEffect(() => {
    if (fromPath) {
      sessionStorage.setItem('lastRoute', fromPath);
    }
    
    console.log("🔐 [Login] fromPath:", fromPath);
    console.log("🔐 [Login] return_to:", returnTo);
    console.log("🔐 [Login] lastRoute:", lastRoute);
    console.log("🔐 [Login] redirectTo final:", redirectTo);
  }, [fromPath, returnTo, lastRoute, redirectTo]);

  return (
    <>
      <SignedIn>
        {isCheckingUser ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          </div>
        ) : redirectTo ? (
          <Navigate to={redirectTo} replace />
        ) : null}
      </SignedIn>
      <SignedOut>
        <CustomLogin />
      </SignedOut>
    </>
  );
};

export default LoginPage;
