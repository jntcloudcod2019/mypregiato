import React, { useEffect } from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import CustomLogin from '../components/auth/custom-login';

const LoginPage: React.FC = () => {
  const location = useLocation();
<<<<<<< HEAD
  
  // Recuperar a rota de origem
  const fromPath = location.state?.from?.pathname;
  const lastRoute = sessionStorage.getItem('lastRoute');
  
  // Determinar para onde redirecionar após login
  let redirectTo = '/treinamentos'; // Padrão
  
  // Se veio de uma rota específica, manter
  if (fromPath) {
    redirectTo = fromPath;
  } 
  // Se tem lastRoute salvo, usar
  else if (lastRoute) {
    redirectTo = lastRoute;
  }
  
  // IMPORTANTE: Preservar rotas de treinamento
  // Se o usuário estava em /treinamentos/criar ou /treinamentos/gerenciar, mantém
  const preservedRoutes = ['/treinamentos/criar', '/treinamentos/gerenciar'];
  if (preservedRoutes.includes(fromPath || '') || preservedRoutes.includes(lastRoute || '')) {
    redirectTo = fromPath || lastRoute || '/treinamentos';
  }
=======
  const [params] = useSearchParams();
>>>>>>> 8c4a7f1 (vai)

  // 1️⃣ Origem via ProtectedRoute
  const fromPath = (location.state as any)?.from?.pathname as string | undefined;

  // 2️⃣ Via query param (?return_to=/treinamentos/criar)
  const returnTo = params.get("return_to") || undefined;

  // 3️⃣ Última rota válida salva
  const lastRoute = sessionStorage.getItem("lastRoute") || undefined;

  // ✅ Ordem de prioridade (NUNCA usar /dashboard como padrão)
  const redirectTo = fromPath || returnTo || lastRoute || "/treinamentos";

  // Logs para debug
  useEffect(() => {
<<<<<<< HEAD
    if (fromPath) {
      sessionStorage.setItem('lastRoute', fromPath);
    }
  }, [fromPath]);

  console.log('🔐 [Login] Origem:', fromPath);
  console.log('🔐 [Login] Última rota salva:', lastRoute);
  console.log('🔐 [Login] Redirecionando para:', redirectTo);
=======
    console.log("🔐 [Login] fromPath:", fromPath);
    console.log("🔐 [Login] return_to:", returnTo);
    console.log("🔐 [Login] lastRoute:", lastRoute);
    console.log("🔐 [Login] redirectTo:", redirectTo);
  }, [fromPath, returnTo, lastRoute, redirectTo]);
>>>>>>> 8c4a7f1 (vai)

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
