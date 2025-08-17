import { useRef } from 'react';

/**
 * Hook para gerenciar a deduplicação de mensagens de chat
 * Evita processamento duplicado de mensagens com mesmo ID ou conteúdo similar
 */
export function useChatDeduplication() {
  // Conjunto para armazenar IDs de mensagens já processadas
  const processedIdsRef = useRef<Set<string>>(new Set());
  
  // Mapa para armazenar a última chave de mensagem por chat
  // Usado para deduplicação baseada em conteúdo quando o ID não é confiável
  const lastMessageKeyByChatRef = useRef<Record<string, string>>({});
  
  /**
   * Verifica se uma mensagem já foi processada
   * @param id ID da mensagem
   * @param chatId ID do chat
   * @param fallbackKey Chave alternativa para deduplicação (conteúdo + timestamp)
   * @returns true se a mensagem já foi processada, false caso contrário
   */
  const isMessageDuplicate = (id: string | undefined, chatId: string, fallbackKey: string): boolean => {
    const isDebugEnabled = localStorage.getItem('debug.chat') === 'true';
    
    // Verificar duplicação por ID exato
    if (id && processedIdsRef.current.has(id)) {
      if (isDebugEnabled) console.debug(`[chat] Mensagem já processada (ID duplicado): ${id}`);
      return true;
    }
    
    // Verificar duplicação por conteúdo + chat
    const lastKey = lastMessageKeyByChatRef.current[chatId];
    if (lastKey === fallbackKey) {
      if (isDebugEnabled) console.debug(`[chat] Mensagem com conteúdo duplicado: ${fallbackKey}`);
      return true;
    }
    
    // Não é duplicada, registrar para futuras verificações
    if (id) {
      processedIdsRef.current.add(id);
      
      // Limitar o tamanho do conjunto para evitar vazamento de memória
      if (processedIdsRef.current.size > 5000) {
        processedIdsRef.current = new Set(Array.from(processedIdsRef.current).slice(-1000));
      }
    }
    
    // Registrar a chave de conteúdo para este chat
    lastMessageKeyByChatRef.current[chatId] = fallbackKey;
    
    return false;
  };
  
  /**
   * Limpa o cache de deduplicação
   */
  const clearDeduplicationCache = () => {
    processedIdsRef.current.clear();
    lastMessageKeyByChatRef.current = {};
  };
  
  return {
    isMessageDuplicate,
    clearDeduplicationCache,
    processedIdsRef,
    lastMessageKeyByChatRef
  };
}
