import { useState, useEffect, useCallback } from 'react';
import { conversationsApi, rabbitMQService } from '../services/whatsapp-api';

export interface Message {
  id: string;
  conversationId: string;
  direction: 'incoming' | 'outgoing';
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  body: string;
  mediaUrl?: string;
  fileName?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
}

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  operatorId?: string;
  operatorName?: string;
  status: 'queued' | 'assigned' | 'closed';
  priority: 'normal' | 'high' | 'urgent';
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
  assignedAt?: string;
  closedAt?: string;
}

export const useTalentChat = (conversationId: string) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const fetchConversation = useCallback(async () => {
    try {
      setLoading(true);
      const response = await conversationsApi.getById(conversationId);
      setConversation(response);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar conversa:', err);
      setError('Erro ao carregar conversa');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const fetchMessages = useCallback(async () => {
    try {
      // Por enquanto, vamos simular mensagens já que não temos endpoint específico
      // TODO: Implementar endpoint de mensagens no backend
      setMessages([]);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    }
  }, []);

  const sendMessage = async (body: string, type: 'text' | 'image' | 'audio' | 'video' | 'document' = 'text', mediaUrl?: string, fileName?: string) => {
    try {
      setSending(true);
      const messageData = {
        body,
        type,
        mediaUrl,
        fileName
      };
      
      // Usar o rabbitMQService para enviar mensagem
      await rabbitMQService.sendMessage(conversationId, body);
      await fetchMessages();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      throw err;
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async () => {
    try {
      // TODO: Implementar endpoint para marcar como lido
      await fetchConversation();
    } catch (err) {
      console.error('Erro ao marcar como lido:', err);
    }
  };

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchMessages();
    }
  }, [conversationId, fetchConversation, fetchMessages]);

  return {
    conversation,
    messages,
    loading,
    error,
    sending,
    sendMessage,
    markAsRead,
    refresh: () => {
      fetchConversation();
      fetchMessages();
    }
  };
};
