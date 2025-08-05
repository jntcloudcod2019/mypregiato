
import { useState, useEffect } from 'react';
import { whatsAppApi } from '../services/whatsapp-api';

export interface ActiveConversation {
  id: string;
  contactName: string;
  contactPhone: string;
  status: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export const useActiveAttendance = () => {
  const [conversations, setConversations] = useState<ActiveConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveConversations = async () => {
    try {
      setLoading(true);
      const response = await whatsAppApi.getConversations('assigned');
      setConversations(response.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar conversas ativas:', err);
      setError('Erro ao carregar conversas ativas');
    } finally {
      setLoading(false);
    }
  };

  const startAttendance = async (conversationId: string, operatorId: string) => {
    try {
      await whatsAppApi.assignConversation(conversationId, operatorId);
      await fetchActiveConversations();
    } catch (err) {
      console.error('Erro ao iniciar atendimento:', err);
      throw err;
    }
  };

  const endAttendance = async (conversationId: string, reason?: string) => {
    try {
      await whatsAppApi.closeConversation(conversationId, reason);
      await fetchActiveConversations();
    } catch (err) {
      console.error('Erro ao encerrar atendimento:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchActiveConversations();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchActiveConversations, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    conversations,
    loading,
    error,
    startAttendance,
    endAttendance,
    refresh: fetchActiveConversations
  };
};
