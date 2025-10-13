import React, { useEffect } from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import CustomLogin from '../components/auth/custom-login';

const LoginPage: React.FC = () => {
  const location = useLocation();
  
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

  // Salvar a rota de destino
  useEffect(() => {
    if (fromPath) {
      sessionStorage.setItem('lastRoute', fromPath);
    }
  }, [fromPath]);

  console.log('🔐 [Login] Origem:', fromPath);
  console.log('🔐 [Login] Última rota salva:', lastRoute);
  console.log('🔐 [Login] Redirecionando para:', redirectTo);

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
