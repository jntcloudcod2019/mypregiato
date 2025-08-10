import { useState, useEffect, useCallback } from 'react';
import { 
  ChatRequest, 
  ActiveChat, 
  Operator, 
  AttendanceMetrics, 
  WhatsAppMessage 
} from '@/types/attendance';

export const useAttendanceCenter = () => {
  const [queue, setQueue] = useState<ChatRequest[]>([]);
  const [activeChats, setActiveChats] = useState<Map<string, ActiveChat[]>>(new Map());
  const [operators, setOperators] = useState<Map<string, Operator>>(new Map());
  const [metrics, setMetrics] = useState<AttendanceMetrics>({
    queueCount: 0,
    attendingCount: 0,
    averageResponseTime: 0,
    totalRequests: 0
  });
  const [selectedTab, setSelectedTab] = useState<'queue' | 'active'>('queue');

  // Adicionar nova mensagem à fila ou atualizar chat existente
  const handleNewMessage = useCallback((message: WhatsAppMessage) => {
    const phone = message.isFromMe ? message.to : message.from;
    
    // Verificar se já existe um chat ativo para este número
    const existingChat = findActiveChatByPhone(phone);
    
    if (existingChat) {
      // Atualizar chat existente
      updateActiveChat(phone, message);
    } else {
      // Verificar se já está na fila
      const existingInQueue = queue.find(req => req.phone === phone);
      
      if (!existingInQueue) {
        // Adicionar nova solicitação à fila
        const newRequest: ChatRequest = {
          id: `req_${Date.now()}_${phone}`,
          phone,
          lastMessage: message.body,
          timestamp: message.timestamp,
          messageCount: 1,
          status: 'queued'
        };
        
        setQueue(prev => [newRequest, ...prev]);
        updateMetrics();
      } else {
        // Atualizar solicitação existente na fila
        setQueue(prev => prev.map(req => 
          req.phone === phone 
            ? { 
                ...req, 
                lastMessage: message.body,
                timestamp: message.timestamp,
                messageCount: req.messageCount + 1
              }
            : req
        ));
      }
    }
  }, [queue]);

  // Encontrar chat ativo por número de telefone
  const findActiveChatByPhone = useCallback((phone: string): ActiveChat | null => {
    for (const [operatorId, chats] of activeChats.entries()) {
      const chat = chats.find(c => c.phone === phone);
      if (chat) return chat;
    }
    return null;
  }, [activeChats]);

  // Atualizar chat ativo
  const updateActiveChat = useCallback((phone: string, message: WhatsAppMessage) => {
    setActiveChats(prev => {
      const newMap = new Map(prev);
      
      for (const [operatorId, chats] of newMap.entries()) {
        const chatIndex = chats.findIndex(c => c.phone === phone);
        if (chatIndex !== -1) {
          const updatedChats = [...chats];
          const chat = updatedChats[chatIndex];
          
          updatedChats[chatIndex] = {
            ...chat,
            lastActivity: message.timestamp,
            messageCount: chat.messageCount + 1,
            messages: [...chat.messages, message]
          };
          
          newMap.set(operatorId, updatedChats);
          break;
        }
      }
      
      return newMap;
    });
  }, []);

  // Atender solicitação da fila
  const attendRequest = useCallback((requestId: string, operatorId: string) => {
    const request = queue.find(req => req.id === requestId);
    if (!request) return;

    // Remover da fila
    setQueue(prev => prev.filter(req => req.id !== requestId));

    // Criar chat ativo
    const newChat: ActiveChat = {
      id: `chat_${Date.now()}_${request.phone}`,
      phone: request.phone,
      customerName: request.customerName,
      operatorId,
      startTime: new Date(),
      lastActivity: request.timestamp,
      messageCount: request.messageCount,
      messages: []
    };

    // Adicionar ao operador
    setActiveChats(prev => {
      const newMap = new Map(prev);
      const operatorChats = newMap.get(operatorId) || [];
      newMap.set(operatorId, [...operatorChats, newChat]);
      return newMap;
    });

    updateMetrics();
  }, [queue]);

  // Fechar chat ativo
  const closeChat = useCallback((chatId: string, operatorId: string) => {
    setActiveChats(prev => {
      const newMap = new Map(prev);
      const operatorChats = newMap.get(operatorId) || [];
      const filteredChats = operatorChats.filter(chat => chat.id !== chatId);
      newMap.set(operatorId, filteredChats);
      return newMap;
    });

    updateMetrics();
  }, []);

  // Atualizar métricas
  const updateMetrics = useCallback(() => {
    const queueCount = queue.length;
    const attendingCount = Array.from(activeChats.values())
      .reduce((total, chats) => total + chats.length, 0);
    
    // Calcular tempo médio de resposta (simplificado)
    const averageResponseTime = calculateAverageResponseTime();
    
    setMetrics({
      queueCount,
      attendingCount,
      averageResponseTime,
      totalRequests: queueCount + attendingCount
    });
  }, [queue, activeChats]);

  // Calcular tempo médio de resposta
  const calculateAverageResponseTime = useCallback(() => {
    // Implementação simplificada - pode ser melhorada
    const allChats = Array.from(activeChats.values()).flat();
    if (allChats.length === 0) return 0;
    
    const totalTime = allChats.reduce((total, chat) => {
      const responseTime = (chat.lastActivity.getTime() - chat.startTime.getTime()) / (1000 * 60);
      return total + responseTime;
    }, 0);
    
    return Math.round(totalTime / allChats.length);
  }, [activeChats]);

  // Efeito para atualizar métricas quando dados mudam
  useEffect(() => {
    updateMetrics();
  }, [queue, activeChats, updateMetrics]);

  return {
    queue,
    activeChats,
    operators,
    metrics,
    selectedTab,
    setSelectedTab,
    handleNewMessage,
    attendRequest,
    closeChat,
    findActiveChatByPhone
  };
}; 