import { useEffect, useCallback, useRef } from 'react';
import { useChatStore } from '@/store/chat-store';
import { qrCodeQueueService } from '@/services/qr-code-queue-service';
import { MessageDto, MessageType, MessageStatus, MessageDirection } from '@/types/message';
import { convertBackendMessage } from '@/services/conversations-api';
import { toast } from '@/hooks/use-toast';

/**
 * ============================================================================
 * HOOK PARA PROCESSAMENTO DE CONVERSAS - SISTEMA ATUALIZADO
 * ============================================================================
 * 
 * Este hook processa eventos SignalR do novo sistema de conversas:
 * - message.inbound: Nova mensagem recebida
 * - message.outbound: Mensagem enviada
 * - bot.status.update: Status do bot atualizado
 * 
 * Suporta tanto conversas WhatsApp quanto conversas do sistema original
 * ============================================================================
 */

// Interface para eventos SignalR do novo sistema
export interface ConversationInboundEvent {
  conversationId: string;
  externalMessageId: string;
  fromNormalized: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface ConversationOutboundEvent {
  conversationId: string;
  messageId: string;
  text: string;
  timestamp: string;
}

export interface BotStatusEvent {
  online: boolean;
  validated: boolean;
  phone?: string;
  ts: string;
}

// Cache para evitar processamento duplicado - CORRIGIDO
const MESSAGE_CACHE_DURATION = 30_000; // 30 segundos
const processedMessages = new Map<string, number>();

// Função para limpar cache expirado
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [messageId, timestamp] of processedMessages) {
    if (now - timestamp > MESSAGE_CACHE_DURATION) {
      processedMessages.delete(messageId);
    }
  }
};

// Função para verificar se mensagem já foi processada - CORRIGIDA
const isMessageProcessed = (messageId: string): boolean => {
  if (!messageId) return false; // não bloquear mensagens sem id
  
  cleanExpiredCache();
  
  if (processedMessages.has(messageId)) {
    return true;
  }
  
  processedMessages.set(messageId, Date.now());
  return false;
};

export const useConversationProcessor = () => {
  const { 
    upsertConversation, 
    appendInbound, 
    markOutboundStatus,
    updateBotStatus 
  } = useChatStore();
  
  const connectionRef = useRef<boolean>(false);

  // Processar mensagem recebida
  const processInboundMessage = useCallback((event: ConversationInboundEvent) => {
    const { conversationId, externalMessageId, fromNormalized, timestamp, payload } = event;
    
    // Verificar se mensagem já foi processada
    if (isMessageProcessed(externalMessageId)) {
      console.log('📨 Mensagem já processada:', externalMessageId);
      return;
    }

    try {
      // Função para mapear tipos do backend para frontend
      const getMessageTypeFromString = (type: string): MessageType => {
        switch (type?.toLowerCase()) {
          case 'image': return MessageType.Image;
          case 'video': return MessageType.Video;
          case 'audio': return MessageType.Audio;
          case 'document': return MessageType.Document;
          default: return MessageType.Text;
        }
      };

      // Converter payload para MessageDto
      const message = {
        id: externalMessageId,
        conversationId,
        externalMessageId,
        direction: MessageDirection.In,
        type: getMessageTypeFromString(String(payload.type) || 'text'),
        body: String(payload.body || ''),
        status: MessageStatus.Sent,
        createdAt: timestamp,
        fromMe: false,
        isGroup: false, // ✅ CORREÇÃO: Adicionar propriedade isGroup obrigatória
        text: String(payload.body || ''),
        ts: timestamp,
        // Incluir attachment se presente
        attachment: payload.attachment ? {
          dataUrl: String((payload.attachment as Record<string, unknown>).dataUrl || ''),
          mimeType: String((payload.attachment as Record<string, unknown>).mimeType || ''),
          fileName: String((payload.attachment as Record<string, unknown>).fileName || '')
        } : null
      } as MessageDto;

      // Atualizar conversa
      upsertConversation({
        conversationId,
        peerE164: fromNormalized,
        lastMessageAt: timestamp,
        isWhatsApp: true
      });

      // Adicionar mensagem
      appendInbound(conversationId, message);

      console.log('📨 ✅ Mensagem processada:', externalMessageId);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar mensagem recebida",
        variant: "destructive"
      });
    }
  }, [upsertConversation, appendInbound]);

  // Processar mensagem enviada
  const processOutboundMessage = useCallback((event: ConversationOutboundEvent) => {
    const { conversationId, messageId, text, timestamp } = event;
    
    try {
      // Marcar mensagem como enviada
      markOutboundStatus(conversationId, messageId, 'sent');
      
      console.log('📤 ✅ Mensagem enviada processada:', messageId);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem enviada:', error);
    }
  }, [markOutboundStatus]);

  // Processar status do bot
  const processBotStatus = useCallback((event: BotStatusEvent) => {
    try {
      updateBotStatus({
        online: event.online,
        validated: event.validated,
        phone: event.phone,
        lastUpdate: event.ts
      });
      
      console.log('🤖 Status do bot atualizado:', event);
    } catch (error) {
      console.error('❌ Erro ao processar status do bot:', error);
    }
  }, [updateBotStatus]);

  // Configurar listeners SignalR com referências estáveis
  useEffect(() => {
    const connection = qrCodeQueueService.getConnection();
    
    if (!connection || connectionRef.current) {
      return;
    }

    connectionRef.current = true;

    // Listener para mensagens recebidas (novo sistema)
    connection.on('message.inbound', processInboundMessage);
    
    // Listener para mensagens enviadas (novo sistema)
    connection.on('message.outbound', processOutboundMessage);
    
    // Listener para status do bot
    connection.on('bot.status.update', processBotStatus);

    // Listener para mensagens do sistema legado (compatibilidade)
    connection.on('message.inbound.legacy', (event: Record<string, unknown>) => {
      console.log('📨 Mensagem do sistema legado:', event);
      // Converter para novo formato se necessário
    });

    console.log('🔗 Listeners SignalR configurados para conversas');

    return () => {
      connection.off('message.inbound', processInboundMessage);
      connection.off('message.outbound', processOutboundMessage);
      connection.off('bot.status.update', processBotStatus);
      connection.off('message.inbound.legacy');
      connectionRef.current = false;
    };
  }, [processInboundMessage, processOutboundMessage, processBotStatus]);

  // Função para enviar mensagem
  const sendMessage = useCallback(async (
    conversationId: string, 
    text: string, 
    clientMessageId: string,
    attachment?: {
      dataUrl: string;
      mimeType: string;
      fileName?: string;
      mediaType?: 'image' | 'document' | 'audio';
    }
  ) => {
    try {
      // Adicionar mensagem localmente primeiro (otimisticamente)
      const message = {
        id: clientMessageId,
        conversationId,
        direction: MessageDirection.Out,
        type: MessageType.Text,
        body: text,
        status: MessageStatus.Sending,
        createdAt: new Date().toISOString(),
        fromMe: true,
        isGroup: false, // ✅ CORREÇÃO: Adicionar propriedade isGroup obrigatória
        text,
        ts: new Date().toISOString(),
        attachment: attachment ? {
          dataUrl: attachment.dataUrl,
          mimeType: attachment.mimeType,
          fileName: attachment.fileName
        } : null
      } as MessageDto;

      appendInbound(conversationId, message);

      // IMPLEMENTAÇÃO REAL: Enviar mensagem via API unificada
      const { unifiedChatApi } = await import('@/services/conversations-api');
      const response = await unifiedChatApi.sendMessage(conversationId, text, clientMessageId, attachment);

      if (response.success) {
        console.log('📤 ✅ Mensagem enviada com sucesso:', clientMessageId);
        return { success: true, messageId: clientMessageId };
      } else {
        console.error('❌ Falha ao enviar mensagem:', response);
        toast({
          title: "Erro",
          description: "Falha ao enviar mensagem",
          variant: "destructive"
        });
        return { success: false, error: 'Falha no envio' };
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive"
      });
      return { success: false, error };
    }
  }, [appendInbound]);

  return {
    processInboundMessage,
    processOutboundMessage,
    processBotStatus,
    sendMessage
  };
};
