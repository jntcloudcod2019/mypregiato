import React, { useEffect } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { forceLogoutOnServerRestart, checkServerRestart } from '@/utils/auth-cleanup';

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
    // let serverCheckInterval: NodeJS.Timeout | null = null; // TEMPORARIAMENTE DESABILITADO

    // TEMPORARIAMENTE DESABILITADO: Verificação de servidor reiniciado
    // if (checkServerRestart()) {
    //   return; // A função já faz o logout automaticamente
    // }



    // TEMPORARIAMENTE DESABILITADO: Monitoramento de conectividade com o servidor
    // const checkServerConnection = async () => {
    //   try {
    //     const response = await fetch('/api/health', { 
    //       method: 'GET',
    //       cache: 'no-cache',
    //       signal: AbortSignal.timeout(5000) // 5 segundos timeout
    //   });
    //     
    //     if (!response.ok) {
    //       console.log('❌ Servidor não respondeu corretamente');
    //       forceLogoutOnServerRestart();
    //     }
    //   } catch (error) {
    //     console.log('❌ Erro ao conectar com servidor:', error);
    //       forceLogoutOnServerRestart();
    //   }
    // };

    // TEMPORARIAMENTE DESABILITADO: Verificar servidor a cada 30 segundos
    // serverCheckInterval = setInterval(checkServerConnection, 30000);

    // Detectar quando o usuário vai fechar/recarregar a página
    const handleBeforeUnload = () => {
      console.log('🔄 Página sendo fechada/recarregada - Marcando para logout');
      sessionStorage.setItem('page_closing', 'true');
      sessionStorage.setItem('page_close_time', Date.now().toString());
    };

    // Detectar quando a página volta a ficar visível
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const pageClosing = sessionStorage.getItem('page_closing') === 'true';
        const closeTime = sessionStorage.getItem('page_close_time');
        
        if (pageClosing && closeTime) {
          const timeSinceClose = Date.now() - parseInt(closeTime);
          // Se passou mais de 5 segundos, provavelmente o servidor foi parado
          if (timeSinceClose > 5000) {
            console.log('🔄 Página reaberta após fechamento - Verificação desabilitada temporariamente');
            // checkServerConnection(); // TEMPORARIAMENTE DESABILITADO
          }
          
          // Limpar flag
          sessionStorage.removeItem('page_closing');
          sessionStorage.removeItem('page_close_time');
        }
      }
    };

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
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (logoutTimeout) {
        clearTimeout(logoutTimeout);
      }
      
      // if (serverCheckInterval) {
      //   clearInterval(serverCheckInterval);
      // }
    };
  }, [signOut, navigate]);

  return <>{children}</>;
};
