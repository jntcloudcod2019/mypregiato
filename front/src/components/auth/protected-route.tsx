import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import React from "react";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isSignedIn, isLoaded } = useUser();

  // Aguarda carregamento do Clerk
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    // 🔑 Preserva a rota de origem
    console.log('🔐 [ProtectedRoute] Usuário não autenticado, redirecionando para login');
    console.log('🔐 [ProtectedRoute] Rota de origem:', location.pathname);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
