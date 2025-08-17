import { useRef, useCallback } from 'react';

/**
 * Hook para debounce de funções
 * Evita execuções repetidas de uma função em um curto período de tempo
 * 
 * @param fn Função a ser executada com debounce
 * @param delay Tempo de espera após a última chamada (ms)
 * @returns Função com debounce aplicado
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
) {
  // Referência para o timer de debounce
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Referência para a última chamada
  const lastCallTimeRef = useRef<number>(0);
  
  // Função com debounce
  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTimeRef.current;
      const isDebugEnabled = localStorage.getItem('debug.chat') === 'true';
      
      // Limpa o timer anterior se existir
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Se já passou tempo suficiente, executa imediatamente
      if (timeSinceLastCall >= delay) {
        if (isDebugEnabled) {
          console.debug(`[debounce] Executando imediatamente (${timeSinceLastCall}ms desde última chamada)`);
        }
        lastCallTimeRef.current = now;
        return fn(...args);
      }
      
      // Caso contrário, agenda para depois
      if (isDebugEnabled) {
        console.debug(`[debounce] Agendando execução em ${delay}ms`);
      }
      
      return new Promise<ReturnType<T>>((resolve, reject) => {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          lastCallTimeRef.current = Date.now();
          
          try {
            const result = fn(...args);
            resolve(result as ReturnType<T>);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    },
    [fn, delay]
  );
  
  // Função para cancelar o debounce
  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  // Função para executar imediatamente, ignorando o debounce
  const flush = useCallback(
    (...args: Parameters<T>) => {
      cancel();
      lastCallTimeRef.current = Date.now();
      return fn(...args);
    },
    [fn, cancel]
  );
  
  return {
    debouncedFn,
    cancel,
    flush
  };
}
