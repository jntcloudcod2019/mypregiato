import { useRef, useCallback } from 'react';

/**
 * Hook para agrupar múltiplas atualizações em um único batch
 * Evita re-renders excessivos ao acumular mudanças e aplicá-las de uma vez
 * 
 * @param commitFn Função que aplica as mudanças acumuladas
 * @param delay Tempo de espera para agrupar atualizações (ms)
 * @returns Funções para agendar e executar atualizações em batch
 */
export function useBatchUpdates<T>(
  commitFn: (updates: Map<string, T>) => void,
  delay: number = 120
) {
  // Referência para armazenar as atualizações pendentes
  const pendingUpdatesRef = useRef<Map<string, T>>(new Map());
  
  // Referência para o timer de commit
  const commitTimerRef = useRef<number | null>(null);
  
  /**
   * Agenda um commit das atualizações acumuladas
   */
  const scheduleCommit = useCallback(() => {
    // Se já existe um timer agendado, não faz nada
    if (commitTimerRef.current) return;
    
    // Agenda um novo commit
    commitTimerRef.current = window.setTimeout(() => {
      const updates = pendingUpdatesRef.current;
      pendingUpdatesRef.current = new Map();
      commitTimerRef.current = null;
      
      // Se não há atualizações, não faz nada
      if (updates.size === 0) return;
      
      // Aplica todas as atualizações de uma vez
      commitFn(updates);
    }, delay);
  }, [commitFn, delay]);
  
  /**
   * Adiciona uma atualização ao batch
   * @param id Identificador único do item
   * @param update Dados da atualização
   */
  const queueUpdate = useCallback(
    (id: string, update: T) => {
      // Mescla com atualizações existentes para o mesmo ID
      const existing = pendingUpdatesRef.current.get(id);
      const merged = existing 
        ? { ...existing, ...update } 
        : update;
      
      pendingUpdatesRef.current.set(id, merged);
      scheduleCommit();
    },
    [scheduleCommit]
  );
  
  /**
   * Força a execução imediata das atualizações pendentes
   */
  const flushUpdates = useCallback(() => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    
    const updates = pendingUpdatesRef.current;
    if (updates.size > 0) {
      pendingUpdatesRef.current = new Map();
      commitFn(updates);
    }
  }, [commitFn]);
  
  return {
    queueUpdate,
    flushUpdates,
    pendingUpdatesRef
  };
}
