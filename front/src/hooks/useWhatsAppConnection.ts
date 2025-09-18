
import { useState, useEffect, useCallback } from 'react';
import { rabbitMQService, WhatsAppStatus, QRCodeResponse } from '../services/whatsapp-api';
import { qrCodeQueueService } from '@/services/qr-code-queue-service';
import { toast } from '@/components/ui/sonner';

// Interface para o status do bot
interface BotStatusUpdate {
  sessionConnected: boolean;
  connectedNumber?: string;
  isFullyValidated: boolean;
  lastActivity: string;
  instanceId: string;
  timestamp: number;
}

export enum ConnectionStatus {
  disconnected = 'disconnected',
  connecting = 'connecting',
  connected = 'connected',
  generating = 'generating'
}

export interface WhatsAppConnectionState {
  status: ConnectionStatus;
  isConnected: boolean;
  lastActivity?: string;
  error?: string;
  canGenerateQR?: boolean;
  hasQRCode?: boolean;
  qrCode?: string;
  connectedNumber?: string;
  connectedUserName?: string;
  isFullyValidated?: boolean;
}

export const useWhatsAppConnection = () => {
  const [connectionState, setConnectionState] = useState<WhatsAppConnectionState>({
    status: ConnectionStatus.disconnected,
    isConnected: false,
    canGenerateQR: true
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const status: WhatsAppStatus = await rabbitMQService.getStatus();
      // Considerar conectado quando a sessão está conectada, independente do número
      const isActuallyConnected = Boolean(status.sessionConnected);
      
      // Lógica de status corrigida: se não está conectado, deve ser 'disconnected'
      const nextStatus = isActuallyConnected
        ? ConnectionStatus.connected
        : ConnectionStatus.disconnected;

      setConnectionState(prev => ({
        ...prev,
        status: nextStatus,
        isConnected: isActuallyConnected,
        lastActivity: status.lastActivity,
        error: status.error,
        canGenerateQR: !isActuallyConnected,
        connectedNumber: status.connectedNumber || prev.connectedNumber
      }));
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        status: ConnectionStatus.disconnected,
        isConnected: false,
        error: 'Erro ao conectar com o servidor',
        canGenerateQR: true
      }));
    }
  }, []);

  // Listener para atualizações de status via SignalR
  useEffect(() => {
    const handleStatusUpdate = (statusData: BotStatusUpdate) => {
      const isActuallyConnected = Boolean(statusData.sessionConnected);
      
      // Lógica de status corrigida: se não está conectado, deve ser 'disconnected'
      const nextStatus = isActuallyConnected
        ? ConnectionStatus.connected
        : ConnectionStatus.disconnected;

      setConnectionState(prev => ({
        ...prev,
        status: nextStatus,
        isConnected: isActuallyConnected,
        lastActivity: statusData.lastActivity,
        error: undefined, // Limpar erro quando status for atualizado
        canGenerateQR: !isActuallyConnected,
        connectedNumber: statusData.connectedNumber || prev.connectedNumber
      }));
    };

    // 🎉 NOVO: Listener para evento específico de autenticação concluída
    const handleSessionAuthenticated = (data: any) => {
      console.log('🎉 WhatsApp autenticado!', data);
      
      setConnectionState(prev => ({
        ...prev,
        status: ConnectionStatus.connected,
        isConnected: true,
        connectedNumber: data.connectedNumber,
        connectedUserName: data.connectedUserName,
        isFullyValidated: data.isFullyValidated,
        lastActivity: data.timestamp,
        error: undefined,
        canGenerateQR: false,
        hasQRCode: false, // Limpar QR após autenticação
        qrCode: undefined
      }));

      // 🔔 Notificação para o usuário
      if (typeof window !== 'undefined' && window.toast) {
        window.toast(`✅ WhatsApp conectado com sucesso! Número: ${data.connectedNumber}`);
      }
    };

    // Registrar listeners
    qrCodeQueueService.addListener('bot.status.update', handleStatusUpdate);
    qrCodeQueueService.addListener('session.authenticated', handleSessionAuthenticated);
    
    return () => {
      qrCodeQueueService.removeListener('bot.status.update', handleStatusUpdate);
      qrCodeQueueService.removeListener('session.authenticated', handleSessionAuthenticated);
    };
  }, []);

  const getQRCode = useCallback(async () => {
    try {
      const qrResponse: QRCodeResponse = await rabbitMQService.getQRCode();
      setConnectionState(prev => ({
        ...prev,
        qrCode: qrResponse.qrCode,
        hasQRCode: true
      }));
      return qrResponse.qrCode;
    } catch (error) {
      return null;
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try { await checkStatus(); } finally { setIsConnecting(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removida dependência de checkStatus para evitar loops

  const disconnect = useCallback(async () => {
    try { 
      await rabbitMQService.disconnect(); 
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
    setConnectionState({ status: ConnectionStatus.disconnected, isConnected: false, canGenerateQR: true });
  }, []);

  const generateQR = useCallback(async () => {
    try { 
      await qrCodeQueueService.startQRCodeConsumer(); 
    } catch (error) {
      console.error('Erro ao iniciar consumidor QR:', error);
    }
    if (isGeneratingQR) return;
    setIsGeneratingQR(true);
    setConnectionState(prev => ({ ...prev, status: ConnectionStatus.generating, error: undefined }));
    try {
      const result = await rabbitMQService.generateQR();
      if (!result.success) {
        // Tratar especificamente o erro 409 (Conflict - pedido pendente)
        if (result.status === 'pending' || result.message?.includes('pendente')) {
          toast?.('Já há um pedido de QR code em andamento. Aguarde...');
          setConnectionState(prev => ({ 
            ...prev, 
            status: ConnectionStatus.generating, 
            error: 'QR code já está sendo gerado. Aguarde...' 
          }));
        } else {
          toast?.(result.message || 'Falha ao gerar QR code');
          setConnectionState(prev => ({ 
            ...prev, 
            error: result.message || 'Falha ao gerar QR code', 
            status: ConnectionStatus.disconnected 
          }));
        }
        return;
      }
      toast?.('Comando enviado. Aguardando QR...');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao comunicar com o servidor';
      setConnectionState(prev => ({ ...prev, error: errorMessage, status: ConnectionStatus.disconnected }));
    } finally {
      setIsGeneratingQR(false);
    }
  }, [isGeneratingQR]);

  // Removido polling automático: status só será verificado quando o usuário clicar no botão

  // Verificação inicial única (sem polling automático)
  useEffect(() => {
    // Apenas verificação inicial quando o componente monta
    checkStatus();
  }, [checkStatus]); // Incluir checkStatus na dependência

  useEffect(() => {
    const handleQRCode = (qrCode: string | null) => {
      console.log('🎯 [QR] handleQRCode chamado:', { qrCode: qrCode?.substring(0, 50) + '...', hasQR: !!qrCode });
      
      if (!qrCode) {
        console.log('❌ [QR] QR Code é null, bot provavelmente já conectado');
        setConnectionState(prev => ({ 
          ...prev, 
          error: 'Bot já está conectado. Não é possível gerar novo QR code.', 
          status: ConnectionStatus.connected, // ✅ CORREÇÃO: mudar para connected se QR é null
          hasQRCode: false, 
          qrCode: undefined 
        }));
        return;
      }
      
      console.log('✅ [QR] QR Code recebido, atualizando estado');
      setConnectionState(prev => ({ 
        ...prev, 
        qrCode, 
        hasQRCode: true, 
        status: ConnectionStatus.generating, 
        error: undefined 
      }));
    };

    // ✅ CORREÇÃO: Adicionar handler para qr.update via SignalR
    const handleQRUpdate = (data: { qrCode: string; timestamp: string; instanceId: string; requestId?: string }) => {
      console.log('📱 [QR] qr.update recebido via SignalR:', { 
        hasQR: !!data.qrCode, 
        qrLength: data.qrCode?.length,
        timestamp: data.timestamp,
        instanceId: data.instanceId 
      });
      
      handleQRCode(data.qrCode);
    };

    // Registrar handlers
    qrCodeQueueService.onQRCode(handleQRCode);
    qrCodeQueueService.addListener('qr.update', handleQRUpdate);
    qrCodeQueueService.startQRCodeConsumer();
    
    console.log('🎧 [QR] Handlers registrados e conexão SignalR iniciada');
    
    return () => {
      console.log('🧹 [QR] Limpando handlers e parando conexão');
      qrCodeQueueService.removeHandler(handleQRCode);
      qrCodeQueueService.removeListener('qr.update', handleQRUpdate);
      qrCodeQueueService.stopQRCodeConsumer();
    };
  }, []);

  return { 
    ...connectionState, 
    isConnecting, 
    isGeneratingQR, 
    connect, 
    disconnect, 
    generateQR, 
    getQRCode, 
    checkStatus,
    // Exportar novas propriedades para uso nos componentes
    connectedUserName: connectionState.connectedUserName,
    isFullyValidated: connectionState.isFullyValidated
  };
};
