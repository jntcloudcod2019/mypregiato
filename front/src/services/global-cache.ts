/**
 * Serviço de cache global para armazenar dados da sessão WhatsApp
 * ✅ ROBUSTO: Usa localStorage para persistir dados entre refreshes e fechamento do navegador
 */
class GlobalCacheService {
  private static instance: GlobalCacheService;
  private cache: Map<string, unknown> = new Map();
  private readonly STORAGE_KEY = 'whatsapp_session_cache';
  private readonly STORAGE_VERSION = '1.0';

  private constructor() {
    // ✅ NOVO: Carregar dados do localStorage na inicialização
    this.loadFromStorage();
  }

  public static getInstance(): GlobalCacheService {
    if (!GlobalCacheService.instance) {
      GlobalCacheService.instance = new GlobalCacheService();
    }
    return GlobalCacheService.instance;
  }

  /**
   * ✅ NOVO: Carrega dados do localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === this.STORAGE_VERSION && data.cache) {
          this.cache = new Map(Object.entries(data.cache));
          console.log('🔄 [GlobalCache] Dados carregados do localStorage:', this.cache.size, 'itens');
        }
      }
    } catch (error) {
      console.warn('⚠️ [GlobalCache] Erro ao carregar do localStorage:', error);
    }
  }

  /**
   * ✅ NOVO: Salva dados no localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        version: this.STORAGE_VERSION,
        timestamp: new Date().toISOString(),
        cache: Object.fromEntries(this.cache)
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('💾 [GlobalCache] Dados salvos no localStorage');
    } catch (error) {
      console.warn('⚠️ [GlobalCache] Erro ao salvar no localStorage:', error);
    }
  }

  /**
   * ✅ NOVO: Verifica se os dados em cache ainda são válidos
   */
  private isCacheValid(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;
      
      const data = JSON.parse(stored);
      const cacheTime = new Date(data.timestamp);
      const now = new Date();
      const diffMinutes = (now.getTime() - cacheTime.getTime()) / (1000 * 60);
      
      // Cache válido por 24 horas (localStorage persiste mais tempo)
      return diffMinutes < 1440; // 24 horas = 1440 minutos
    } catch {
      return false;
    }
  }

  /**
   * Armazena o número conectado do WhatsApp
   */
  public setConnectedNumber(connectedNumber: string): void {
    this.cache.set('connectedNumber', connectedNumber);
    this.saveToStorage();
    console.log('🔒 [GlobalCache] Número conectado armazenado:', connectedNumber);
  }

  /**
   * Obtém o número conectado do WhatsApp
   */
  public getConnectedNumber(): string | null {
    // ✅ NOVO: Verificar se cache é válido antes de usar
    if (!this.isCacheValid()) {
      console.log('⏰ [GlobalCache] Cache expirado, recarregando...');
      this.loadFromStorage();
    }
    
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
    this.saveToStorage();
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
    // ✅ NOVO: Verificar se cache é válido antes de usar
    if (!this.isCacheValid()) {
      console.log('⏰ [GlobalCache] Cache expirado, recarregando...');
      this.loadFromStorage();
    }
    
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
   * ✅ NOVO: Obtém status persistente (sempre do storage)
   */
  public getPersistentSessionStatus(): {
    sessionConnected: boolean;
    isFullyValidated: boolean;
    connectedNumber?: string;
    lastActivity?: string;
  } | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      if (data.version === this.STORAGE_VERSION && data.cache && data.cache.sessionStatus) {
        return data.cache.sessionStatus;
      }
    } catch (error) {
      console.warn('⚠️ [GlobalCache] Erro ao obter status persistente:', error);
    }
    return null;
  }

  /**
   * Limpa o cache (útil para logout/desconexão)
   */
  public clear(): void {
    this.cache.clear();
    sessionStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ [GlobalCache] Cache limpo');
  }

  /**
   * Verifica se há um número conectado válido
   */
  public hasValidConnectedNumber(): boolean {
    const connectedNumber = this.getConnectedNumber();
    return Boolean(connectedNumber && connectedNumber.trim().length > 0);
  }

  /**
   * ✅ NOVO: Força recarregamento do cache
   */
  public refresh(): void {
    this.loadFromStorage();
    console.log('🔄 [GlobalCache] Cache recarregado');
  }
}

// Exportar instância singleton
export const globalCache = GlobalCacheService.getInstance();
export default globalCache;
