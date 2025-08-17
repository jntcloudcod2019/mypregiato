import { useRef, useCallback } from 'react';

/**
 * Hook para limitar a frequência de atualizações de dados
 * Evita chamadas excessivas a APIs e re-renders desnecessários
 * 
 * @template TArgs - Tipo dos argumentos da função
 * @template TReturn - Tipo do retorno da função
 * @param refreshFn Função a ser executada com throttle
 * @param defaultDelay Tempo mínimo entre execuções em ms
 * @returns Função throttled que respeita o intervalo mínimo
 */
export function useThrottledRefresh<
  TArgs extends Array<unknown> = Array<unknown>,
  TReturn = unknown
>(
  refreshFn: (...args: TArgs) => Promise<TReturn>,
  defaultDelay: number = 5000
) {
  // Referência para controle de tempo e timer
  const throttleRef = useRef<{
    lastTime: number;
    timer: NodeJS.Timeout | null;
  }>({
    lastTime: 0,
    timer: null
  });
  
  // Função throttled que controla a execução
  const throttledRefresh = useCallback(
    async (delay: number = defaultDelay, ...args: TArgs): Promise<TReturn> => {
      const isDebugEnabled = localStorage.getItem('debug.chat') === 'true';
      const now = Date.now();
      const timeSinceLastRefresh = now - throttleRef.current.lastTime;
      
      // Se o tempo desde a última execução for menor que o delay, agendar para depois
      if (timeSinceLastRefresh < delay) {
        // Limpar timer anterior se existir
        if (throttleRef.current.timer) {
          clearTimeout(throttleRef.current.timer);
        }
        
        if (isDebugEnabled) {
          console.debug(`[chat] Throttling refresh (${timeSinceLastRefresh}ms / ${delay}ms)`);
        }
        
        // Agendar nova execução para o tempo restante
        return new Promise<TReturn>((resolve, reject) => {
          throttleRef.current.timer = setTimeout(async () => {
            throttleRef.current.timer = null;
            throttleRef.current.lastTime = Date.now();
            
            if (isDebugEnabled) {
              console.debug('[chat] Executando refresh após throttle');
            }
            
            try {
              const result = await refreshFn(...args);
              resolve(result);
            } catch (error) {
              if (isDebugEnabled) {
                console.error('[chat] Erro em refresh throttled:', error);
              }
              reject(error);
            }
          }, delay - timeSinceLastRefresh);
        });
      }
      
      // Executar imediatamente se já passou tempo suficiente
      throttleRef.current.lastTime = now;
      
      if (isDebugEnabled) {
        console.debug('[chat] Executando refresh imediatamente');
      }
      
      return refreshFn(...args);
    },
    [refreshFn, defaultDelay]
  );
  
  return throttledRefresh;
}
