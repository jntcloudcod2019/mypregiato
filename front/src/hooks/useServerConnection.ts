import { useEffect, useState, useCallback } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface ServerStatus {
  isOnline: boolean;
  lastCheck: Date | null;
  errorCount: number;
  isChecking: boolean;
}

export const useServerConnection = () => {
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    isOnline: true,
    lastCheck: null,
    errorCount: 0,
    isChecking: false
  });
  
  const { signOut } = useClerk();
  const navigate = useNavigate();

  // Função para verificar se o servidor está online
  const checkServerHealth = useCallback(async () => {
    if (serverStatus.isChecking) return serverStatus.isOnline;

    setServerStatus(prev => ({ ...prev, isChecking: true }));

    try {
      const response = await fetch('http://localhost:5656/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 segundos de timeout
      });
      
      if (response.ok) {
        setServerStatus({
          isOnline: true,
          lastCheck: new Date(),
          errorCount: 0,
          isChecking: false
        });
        return true;
      } else {
        throw new Error(`Servidor respondeu com status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Servidor offline:', error);
      
      setServerStatus(prev => {
        const newErrorCount = prev.errorCount + 1;
        const isOffline = newErrorCount >= 3; // Considerar offline após 3 tentativas
        
        return {
          isOnline: !isOffline,
          lastCheck: new Date(),
          errorCount: newErrorCount,
          isChecking: false
        };
      });

      return false;
    }
  }, [serverStatus.isChecking]);

  // Função para fazer logout forçado
  const forceLogout = useCallback(async () => {
    try {
      console.log('🔄 Servidor desconectado, fazendo logout automático...');
      
      // Mostrar notificação ao usuário
      toast({
        title: "Servidor Desconectado",
        description: "Você será desconectado automaticamente devido à perda de conexão com o servidor.",
        variant: "destructive"
      });

      // Aguardar um pouco para o usuário ver a mensagem
      await new Promise(resolve => setTimeout(resolve, 2000));

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
  }, [signOut, navigate]);

  // Monitorar conexão com o servidor
  useEffect(() => {
    // Verificação inicial
    checkServerHealth();

    // Verificar a cada 30 segundos
    const interval = setInterval(checkServerHealth, 30000);

    return () => clearInterval(interval);
  }, [checkServerHealth]);

  // Detectar quando o servidor fica offline e fazer logout
  useEffect(() => {
    if (!serverStatus.isOnline && serverStatus.errorCount >= 3) {
      forceLogout();
    }
  }, [serverStatus.isOnline, serverStatus.errorCount, forceLogout]);

  // Detectar quando o navegador fica offline
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexão com internet restaurada');
      // Verificar servidor quando a conexão for restaurada
      setTimeout(checkServerHealth, 2000);
    };

    const handleOffline = () => {
      console.log('❌ Conexão com internet perdida');
      toast({
        title: "Conexão Perdida",
        description: "Verificando status do servidor...",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkServerHealth]);

  return {
    serverStatus,
    checkServerHealth,
    forceLogout
  };
};
