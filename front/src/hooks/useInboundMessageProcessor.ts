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
  onChatUpdated?: (chatId: string, updates: Partial<ChatListItem>) => void;
  selectedChatId?: string | null;
}

/**
 * Hook para processar mensagens recebidas de forma segura
 * Implementa deduplicação, atualizações em lote e logging
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
          type: event?.message?.type
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
      if (!id || !chatId) {
        if (isDebugEnabled) {
          console.debug('[chat] Mensagem sem ID ou chatId, ignorando');
        }
        return false;
      }
      
      // Usar fromNormalized para consolidação se disponível
      const consolidationKey = fromNormalized || chatId;
      
      // Chave de fallback para deduplicação por conteúdo
      const fallbackKey = `${consolidationKey}|${text || ''}|${ts || ''}`;
      
      // Verificar se é uma mensagem duplicada
      if (isMessageDuplicate(id, consolidationKey, fallbackKey)) {
        if (isDebugEnabled) {
          console.debug('[chat] Mensagem duplicada ignorada:', id);
        }
        return false;
      }
      
      // Processar a mensagem
      const currentSelected = selectedChatIdRef.current;
      
      // Notificar sobre nova mensagem se o chat estiver aberto
      if (consolidationKey === currentSelected && onMessageReceived && event.message) {
        // Converter para ChatMessageDto usando a estrutura correta
        const chatMessage: ChatMessageDto = {
          id: event.message.id || crypto.randomUUID(),
          externalMessageId: event.message.externalMessageId,
          direction: MessageDirection.In,
          type: mapBackendType(event.message.type || 'Text'),
          body: event.message.text || event.message.body || '',
          text: event.message.text || event.message.body || '',
          ts: event.message.ts || event.message.timestamp || new Date().toISOString(),
          status: MessageStatus.Delivered,
          createdAt: event.message.ts || event.message.timestamp || new Date().toISOString(),
          // Campos opcionais
          conversationId: undefined,
          mediaUrl: event.message.attachment?.dataUrl,
          fileName: event.message.attachment?.fileName,
          clientMessageId: undefined,
          whatsAppMessageId: event.message.externalMessageId,
          internalNote: undefined,
          updatedAt: undefined,
          attachment: event.message.attachment ? {
            dataUrl: event.message.attachment.dataUrl || '',
            mimeType: event.message.attachment.mimeType || 'application/octet-stream',
            fileName: event.message.attachment.fileName
          } : null
        };
        onMessageReceived(chatId, chatMessage);
      }
      
      // Atualizar preview do chat
      const preview = text 
        ? text 
        : (event?.message?.type === 'image' 
          ? 'Imagem' 
          : event?.message?.type === 'audio' 
            ? 'Áudio' 
            : event?.message?.type === 'file' 
              ? (event?.message?.attachment?.fileName || 'Arquivo') 
              : 'Mensagem');
      
      const tsVal = ts || new Date().toISOString();
      const isCurrentOpen = chatId === selectedChatIdRef.current;
      
      // Agendar atualização do chat
      queueUpdate(chatId, {
        lastMessageAt: tsVal,
        lastMessagePreview: preview,
        unreadCount: isCurrentOpen ? 0 : undefined
      } as Partial<ChatListItem>);
      
      if (isDebugEnabled) {
        console.debug('[chat] Mensagem processada com sucesso:', id);
      }
      
      return true;
    },
    [onMessageReceived, queueUpdate, isMessageDuplicate]
  );
  
  return {
    processInboundMessage
  };
}
