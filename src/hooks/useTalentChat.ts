
import { useState, useEffect } from 'react';
import { whatsAppApi } from '../services/whatsapp-api';

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

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await whatsAppApi.getConversation(conversationId);
      setConversation(response.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar conversa:', err);
      setError('Erro ao carregar conversa');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await whatsAppApi.getMessages(conversationId);
      setMessages(response.data);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    }
  };

  const sendMessage = async (body: string, type: 'text' | 'image' | 'audio' | 'video' | 'document' = 'text', mediaUrl?: string, fileName?: string) => {
    try {
      setSending(true);
      const messageData = {
        body,
        type,
        mediaUrl,
        fileName
      };
      
      await whatsAppApi.sendMessage(conversationId, messageData);
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
      await whatsAppApi.markAsRead(conversationId);
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
  }, [conversationId]);

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
