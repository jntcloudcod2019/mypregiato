import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessageDto, ChatListItem, MessageDirection, MessageStatus, MessageType, mapBackendType } from '@/services/chat-service';
import { useChatDeduplication } from './useChatDeduplication';
import { useBatchUpdates } from './useBatchUpdates';

interface InboundMessageEvent {
  chatId: string;
  fromNormalized?: string; // Adicionar fromNormalized para consolidação
  message?: {
    id?: string;
    externalMessageId?: string;
    fromMe?: boolean;
    text?: string;
    body?: string;
    ts?: string;
    timestamp?: string;
    type?: string;
    attachment?: {
      dataUrl?: string;
      mimeType?: string;
      fileName?: string;
    };
  };
}

interface InboundMessageProcessorOptions {
  onMessageReceived?: (chatId: string, message: ChatMessageDto) => void;
  onChatUpdated?: (chatId: string, update: Partial<ChatListItem>) => void;
  selectedChatId?: string | null;
}

/**
 * Hook para processar mensagens recebidas de forma segura
 * Implementa deduplicação, atualizações em lote e logging
 * INCLUI VALIDAÇÃO PARA NÃO GERAR CHATS DUPLICADOS PARA O MESMO NÚMERO
 */
export function useInboundMessageProcessor({
  onMessageReceived,
  onChatUpdated,
  selectedChatId
}: InboundMessageProcessorOptions = {}) {
  // Referência para o chat selecionado atual
  const selectedChatIdRef = useRef<string | null>(selectedChatId || null);
  
  // Atualizar a referência quando o chat selecionado mudar
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId || null;
  }, [selectedChatId]);
  
  // Hook de deduplicação
  const { isMessageDuplicate } = useChatDeduplication();
  
  // Hook para atualizações em lote
  const { queueUpdate } = useBatchUpdates<Partial<ChatListItem>>((updates) => {
    // Para cada atualização no batch
    updates.forEach((update, chatId) => {
      if (onChatUpdated) {
        onChatUpdated(chatId, update);
      }
    });
  });

  // Cache para controlar chats por número de telefone - NOVA FUNCIONALIDADE
  const phoneToChatIdMap = useRef<Map<string, string>>(new Map());
  
  /**
   * Gera uma chave composta para deduplicação quando message.id não existe
   */
  const makeFallbackKey = useCallback((event: InboundMessageEvent): string => {
    const id = event?.message?.id || event?.message?.externalMessageId;
    if (id) return id;
    
    // Fallback: usar combinação de dados para criar chave única
    const chatId = event?.chatId || '';
    const fromNormalized = event?.fromNormalized || '';
    const text = event?.message?.text || event?.message?.body || '';
    const timestamp = event?.message?.ts || event?.message?.timestamp || '';
    
    return `${chatId}|${fromNormalized}|${text}|${timestamp}`;
  }, []);

  /**
   * Verifica se já existe um chat ativo para o número de telefone
   */
  const isPhoneAlreadyInChat = useCallback((phoneNumber: string, currentChatId: string): boolean => {
    const existingChatId = phoneToChatIdMap.current.get(phoneNumber);
    return existingChatId !== undefined && existingChatId !== currentChatId;
  }, []);

  /**
   * Registra ou atualiza o mapeamento de telefone para chatId
   */
  const registerPhoneChatMapping = useCallback((phoneNumber: string, chatId: string) => {
    phoneToChatIdMap.current.set(phoneNumber, chatId);
  }, []);

  /**
   * Processa uma mensagem recebida
   * @param event Evento de mensagem recebida
   * @returns true se a mensagem foi processada, false se foi ignorada
   */
  const processInboundMessage = useCallback(
    (event: InboundMessageEvent): boolean => {
      const isDebugEnabled = localStorage.getItem('debug.chat') === 'true';
      
      // Log de debug
      if (isDebugEnabled) {
        console.debug('[chat] message.inbound recebido:', JSON.stringify({
          chatId: event?.chatId,
          messageId: event?.message?.id || event?.message?.externalMessageId,
          fromMe: event?.message?.fromMe,
          type: event?.message?.type,
          fromNormalized: event?.fromNormalized
        }));
      }
      
      // Ignorar mensagens fromMe para evitar loops
      if (event?.message?.fromMe === true) {
        if (isDebugEnabled) {
          console.debug('[chat] Ignorando mensagem fromMe:', event?.message?.id);
        }
        return false;
      }
      
      // Extrair dados da mensagem
      const id: string | undefined = event?.message?.id || event?.message?.externalMessageId;
      const ts: string | undefined = event?.message?.ts || event?.message?.timestamp;
      const text: string | undefined = event?.message?.text || event?.message?.body;
      const chatId: string = event?.chatId;
      const fromNormalized: string | undefined = event?.fromNormalized;
      
      // Validar dados básicos
      if (!chatId) {
        if (isDebugEnabled) {
          console.debug('[chat] Mensagem sem chatId, ignorando');
        }
        return false;
      }
      
      // VALIDAÇÃO PARA NÃO GERAR CHATS DUPLICADOS - NOVA REGRA
      if (fromNormalized) {
        if (isPhoneAlreadyInChat(fromNormalized, chatId)) {
          if (isDebugEnabled) {
            console.debug('[chat] Número já possui chat ativo, ignorando nova mensagem:', fromNormalized);
          }
          return false;
        }
        
        // Registrar o mapeamento telefone -> chatId
        registerPhoneChatMapping(fromNormalized, chatId);
      }
      
      // Usar fromNormalized para consolidação se disponível
      const consolidationKey = fromNormalized || chatId;
      
      // Chave de fallback para deduplicação por conteúdo
      const fallbackKey = makeFallbackKey(event);
      
      // Verificar se é uma mensagem duplicada
      if (isMessageDuplicate(id, chatId, fallbackKey)) {
        if (isDebugEnabled) {
          console.debug('[chat] Mensagem duplicada detectada, ignorando:', fallbackKey);
        }
        return false;
      }
      
      // Se chegou até aqui, a mensagem é válida e deve ser processada
      if (onMessageReceived && id && text) {
        const message: ChatMessageDto = {
          id,
          direction: MessageDirection.In,
          text,
          status: MessageStatus.Sent,
          ts: ts || new Date().toISOString(),
          type: mapBackendType(event?.message?.type || 'text'),
          attachment: event?.message?.attachment ? {
            dataUrl: event.message.attachment.dataUrl || '',
            mimeType: event.message.attachment.mimeType || '',
            fileName: event.message.attachment.fileName || ''
          } : null
        } as ChatMessageDto;
        
        onMessageReceived(chatId, message);
        
        // Atualizar chat em lote
        queueUpdate(chatId, {
          lastMessageAt: ts || new Date().toISOString(),
          lastMessagePreview: text,
          unreadCount: selectedChatIdRef.current === chatId ? 0 : 1
        });
        
        if (isDebugEnabled) {
          console.debug('[chat] Mensagem processada com sucesso:', id);
        }
        
        return true;
      }
      
      return false;
    },
    [isMessageDuplicate, onMessageReceived, queueUpdate, makeFallbackKey, isPhoneAlreadyInChat, registerPhoneChatMapping]
  );

  return {
    processInboundMessage,
    isPhoneAlreadyInChat,
    registerPhoneChatMapping
  };
}
