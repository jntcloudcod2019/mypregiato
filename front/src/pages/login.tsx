import React, { useEffect } from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import CustomLogin from '../components/auth/custom-login';

const LoginPage: React.FC = () => {
  const location = useLocation();
  const [params] = useSearchParams();

  // 1️⃣ Origem via ProtectedRoute
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  // 2️⃣ Via query param (?return_to=/treinamentos/criar)
  const returnTo = params.get("return_to") || undefined;

  // 3️⃣ Última rota válida salva
  const lastRoute = sessionStorage.getItem("lastRoute") || undefined;

  // ✅ Ordem de prioridade (NUNCA usar /dashboard como padrão)
  const redirectTo = fromPath || returnTo ;

  // Salvar a rota de destino e logs para debug
  useEffect(() => {
    if (fromPath) {
      sessionStorage.setItem('lastRoute', fromPath);
    }
    
    console.log("🔐 [Login] fromPath:", fromPath);
    console.log("🔐 [Login] return_to:", returnTo);
    console.log("🔐 [Login] lastRoute:", lastRoute);
    console.log("🔐 [Login] redirectTo:", redirectTo);
  }, [fromPath, returnTo, lastRoute, redirectTo]);

  return (
    <>
      <SignedIn>
        <Navigate to={redirectTo} replace />
      </SignedIn>
      <SignedOut>
        <CustomLogin />
      </SignedOut>
    </>
  );
};

export default LoginPage;
