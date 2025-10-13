import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * RouteTracker - Salva a última rota válida visitada
 * 
 * Usado para redirecionamento após login quando não há state.from
 */
export const RouteTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Evita salvar a página de login como última rota
    if (location.pathname !== "/login" && location.pathname !== "/") {
      const fullPath = location.pathname + location.search;
      sessionStorage.setItem("lastRoute", fullPath);
      console.log("📍 [RouteTracker] Última rota salva:", fullPath);
    }
  }, [location]);

  return null;
};

