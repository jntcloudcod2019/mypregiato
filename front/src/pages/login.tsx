import React, { useEffect } from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import CustomLogin from '../components/auth/custom-login';

const LoginPage: React.FC = () => {
  const location = useLocation();
  
  // Tentar recuperar a última rota salva, senão usar a from do state, senão dashboard
  const lastRoute = sessionStorage.getItem('lastRoute');
  const from = location.state?.from?.pathname || lastRoute || '/dashboard';

  // Salvar a rota de destino
  useEffect(() => {
    if (location.state?.from?.pathname) {
      sessionStorage.setItem('lastRoute', location.state.from.pathname);
    }
  }, [location.state]);

  return (
    <>
      <SignedIn>
        <Navigate to={from} replace />
      </SignedIn>
      <SignedOut>
        <CustomLogin />
      </SignedOut>
    </>
  );
};

export default LoginPage;
