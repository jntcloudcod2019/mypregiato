import React, { useEffect } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface AutoLogoutProps {
  children: React.ReactNode;
}

/**
 * Componente que monitora a conectividade do frontend e faz logout automático
 * quando o site ficar offline por muito tempo
 */
export const AutoLogout: React.FC<AutoLogoutProps> = ({ children }) => {
  const { signOut } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    let logoutTimeout: NodeJS.Timeout | null = null;
    let offlineStartTime: number | null = null;

    const handleOnline = () => {
      console.log('🌐 Conexão com internet restaurada');
      
      if (logoutTimeout) {
        clearTimeout(logoutTimeout);
        logoutTimeout = null;
        offlineStartTime = null;
        
        toast({
          title: "Conexão Restaurada",
          description: "A conexão com a internet foi restaurada.",
          variant: "default"
        });
      }
    };

    const handleOffline = () => {
      console.log('❌ Conexão com internet perdida');
      
      if (!offlineStartTime) {
        offlineStartTime = Date.now();
        
        toast({
          title: "Conexão Perdida",
          description: "Você será desconectado automaticamente em 30 segundos se a conexão não for restaurada.",
          variant: "destructive"
        });

        // Aguardar 30 segundos antes de fazer logout
        logoutTimeout = setTimeout(async () => {
          try {
            console.log('🔄 Executando logout automático devido à perda de conexão...');
            
            // Fazer logout
            await signOut();
            
            // Redirecionar para login
            navigate('/login', { replace: true });
            
            console.log('✅ Logout automático concluído');
          } catch (error) {
            console.error('❌ Erro durante logout automático:', error);
            // Forçar recarregamento da página como fallback
            window.location.href = '/login';
          }
        }, 30000); // 30 segundos
      }
    };

    // Adicionar event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (logoutTimeout) {
        clearTimeout(logoutTimeout);
      }
    };
  }, [signOut, navigate]);

  return <>{children}</>;
};
