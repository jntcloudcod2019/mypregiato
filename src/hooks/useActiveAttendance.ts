
import { useState, useEffect } from 'react';
import { conversationsApi } from '../services/whatsapp-api';

export interface ActiveConversation {
  id: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  lastMessageTime: string;
  status: 'active' | 'pending' | 'closed';
  operatorId?: string;
  operatorName?: string;
}

export const useActiveAttendance = () => {
  const [conversations, setConversations] = useState<ActiveConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveConversations = async () => {
    try {
      const response = await conversationsApi.getAll('assigned');
      setConversations(response);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar conversas ativas:', err);
      setError('Erro ao carregar conversas ativas');
    } finally {
      setLoading(false);
    }
  };

  const assignConversation = async (conversationId: string, operatorId: string) => {
    try {
      await conversationsApi.assign(conversationId, operatorId);
      await fetchActiveConversations(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao atribuir conversa:', err);
      throw err;
    }
  };

  const closeConversation = async (conversationId: string, reason?: string) => {
    try {
      await conversationsApi.close(conversationId, reason);
      await fetchActiveConversations(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao fechar conversa:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchActiveConversations();
    
    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchActiveConversations, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    conversations,
    loading,
    error,
    assignConversation,
    closeConversation,
    refresh: fetchActiveConversations
  };
};
