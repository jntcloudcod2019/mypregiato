import { toast } from '@/hooks/use-toast';

export interface ServerStatus {
  isOnline: boolean;
  lastCheck: Date | null;
  errorCount: number;
  isChecking: boolean;
}

type ServerStatusListener = (status: ServerStatus) => void;

import { API_BASE_URL } from '../config/api';

class ServerConnectionService {
  private status: ServerStatus = {
    isOnline: true,
    lastCheck: null,
    errorCount: 0,
    isChecking: false
  };

  private listeners: Set<ServerStatusListener> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  /**
   * Inicializar o serviço de monitoramento
   */
  initialize() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    this.startMonitoring();
  }

  /**
   * Parar o monitoramento
   */
  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.listeners.clear();
    this.isInitialized = false;
  }

  /**
   * Adicionar listener para mudanças de status
   */
  addListener(listener: ServerStatusListener) {
    this.listeners.add(listener);
    // Notificar imediatamente com o status atual
    listener(this.status);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Verificar se o servidor está online
   */
  async checkServerHealth(): Promise<boolean> {
    if (this.status.isChecking) return this.status.isOnline;

    this.status.isChecking = true;
    this.notifyListeners();

    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 segundos de timeout
      });
      
      if (response.ok) {
        this.updateStatus({
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
      
      const newErrorCount = this.status.errorCount + 1;
      const isOffline = newErrorCount >= 3; // Considerar offline após 3 tentativas
      
      this.updateStatus({
        isOnline: !isOffline,
        lastCheck: new Date(),
        errorCount: newErrorCount,
        isChecking: false
      });

      // Se ficou offline, mostrar notificação
      if (isOffline && this.status.errorCount < 3) {
        toast({
          title: "Servidor Desconectado",
          description: "A conexão com o servidor foi perdida. Verificando reconexão...",
          variant: "destructive"
        });
      }

      return false;
    }
  }

  /**
   * Iniciar monitoramento contínuo
   */
  private startMonitoring() {
    // Verificação inicial
    this.checkServerHealth();

    // Verificar a cada 30 segundos
    this.checkInterval = setInterval(() => {
      this.checkServerHealth();
    }, 30000);
  }

  /**
   * Atualizar status e notificar listeners
   */
  private updateStatus(newStatus: Partial<ServerStatus>) {
    this.status = { ...this.status, ...newStatus };
    this.notifyListeners();
  }

  /**
   * Notificar todos os listeners
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Erro ao notificar listener:', error);
      }
    });
  }

  /**
   * Obter status atual
   */
  getStatus(): ServerStatus {
    return { ...this.status };
  }

  /**
   * Verificar se o servidor está offline
   */
  isServerOffline(): boolean {
    return !this.status.isOnline && this.status.errorCount >= 3;
  }

  /**
   * Forçar verificação manual
   */
  async forceCheck(): Promise<boolean> {
    return this.checkServerHealth();
  }
}

// Instância singleton
export const serverConnectionService = new ServerConnectionService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  serverConnectionService.initialize();
}
