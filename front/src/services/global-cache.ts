/**
 * Serviço de cache global para armazenar dados da sessão WhatsApp
 */
class GlobalCacheService {
  private static instance: GlobalCacheService;
  private cache: Map<string, unknown> = new Map();

  private constructor() {}

  public static getInstance(): GlobalCacheService {
    if (!GlobalCacheService.instance) {
      GlobalCacheService.instance = new GlobalCacheService();
    }
    return GlobalCacheService.instance;
  }

  /**
   * Armazena o número conectado do WhatsApp
   */
  public setConnectedNumber(connectedNumber: string): void {
    this.cache.set('connectedNumber', connectedNumber);
    console.log('🔒 [GlobalCache] Número conectado armazenado:', connectedNumber);
  }

  /**
   * Obtém o número conectado do WhatsApp
   */
  public getConnectedNumber(): string | null {
    const connectedNumber = this.cache.get('connectedNumber') as string | undefined;
    console.log('🔍 [GlobalCache] Número conectado recuperado:', connectedNumber);
    return connectedNumber || null;
  }

  /**
   * Armazena o status da sessão
   */
  public setSessionStatus(status: {
    sessionConnected: boolean;
    isFullyValidated: boolean;
    connectedNumber?: string;
    lastActivity?: string;
  }): void {
    this.cache.set('sessionStatus', status);
    if (status.connectedNumber) {
      this.setConnectedNumber(status.connectedNumber);
    }
    console.log('🔒 [GlobalCache] Status da sessão armazenado:', status);
  }

  /**
   * Obtém o status da sessão
   */
  public getSessionStatus(): {
    sessionConnected: boolean;
    isFullyValidated: boolean;
    connectedNumber?: string;
    lastActivity?: string;
  } | null {
    const status = this.cache.get('sessionStatus') as {
      sessionConnected: boolean;
      isFullyValidated: boolean;
      connectedNumber?: string;
      lastActivity?: string;
    } | undefined;
    console.log('🔍 [GlobalCache] Status da sessão recuperado:', status);
    return status || null;
  }

  /**
   * Limpa o cache (útil para logout/desconexão)
   */
  public clear(): void {
    this.cache.clear();
    console.log('🗑️ [GlobalCache] Cache limpo');
  }

  /**
   * Verifica se há um número conectado válido
   */
  public hasValidConnectedNumber(): boolean {
    const connectedNumber = this.getConnectedNumber();
    return Boolean(connectedNumber && connectedNumber.trim().length > 0);
  }
}

// Exportar instância singleton
export const globalCache = GlobalCacheService.getInstance();
export default globalCache;
