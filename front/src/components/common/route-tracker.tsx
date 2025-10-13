import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

/**
 * RouteTracker - Salva a última rota válida visitada
 * 
 * Usado para redirecionamento após login quando não há state.from
 * ⚠️ Só salva rotas quando o usuário está autenticado para evitar loop infinito
 */
export const RouteTracker: React.FC = () => {
  const location = useLocation();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    // ⚠️ CRÍTICO: Só salva rotas se o usuário está autenticado
    // Isso evita loop infinito ao tentar acessar rotas protegidas sem login
    if (isLoaded && isSignedIn && location.pathname !== "/login" && location.pathname !== "/") {
      const fullPath = location.pathname + location.search;
      sessionStorage.setItem("lastRoute", fullPath);
      console.log("📍 [RouteTracker] Última rota salva:", fullPath);
    }
  }, [location, isSignedIn, isLoaded]);

  return null;
};

