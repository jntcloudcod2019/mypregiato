
import { useState, useEffect, useCallback } from 'react';
import { rabbitMQService, WhatsAppStatus, QRCodeResponse } from '../services/whatsapp-api';
import { qrCodeQueueService } from '@/services/qr-code-queue-service';

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
      const isActuallyConnected = Boolean(status.sessionConnected) && Boolean(status.connectedNumber);

      console.log('📊 Status do WhatsApp:', {
        botUp: status.botUp,
        sessionConnected: status.sessionConnected,
        isConnected: status.isConnected,
        isFullyValidated: status.isFullyValidated,
        connectedNumber: status.connectedNumber,
        isActuallyConnected
      });

      const nextStatus = isActuallyConnected
        ? ConnectionStatus.connected
        : (status.botUp ? ConnectionStatus.connecting : ConnectionStatus.disconnected);

      setConnectionState(prev => ({
        ...prev,
        status: nextStatus,
        isConnected: isActuallyConnected,
        lastActivity: status.lastActivity,
        error: status.error,
        canGenerateQR: !isActuallyConnected,
        connectedNumber: status.connectedNumber
      }));
    } catch (error) {
      console.error('Erro ao verificar status do WhatsApp:', error);
      setConnectionState(prev => ({
        ...prev,
        status: ConnectionStatus.disconnected,
        isConnected: false,
        error: 'Erro ao conectar com o servidor',
        canGenerateQR: true
      }));
    }
  }, []);

  const getQRCode = useCallback(async () => {
    try {
      const qrResponse: QRCodeResponse = await rabbitMQService.getQRCode();
      console.log('QR Code recebido:', qrResponse.qrCode?.substring(0, 100) + '...');
      setConnectionState(prev => ({
        ...prev,
        qrCode: qrResponse.qrCode,
        hasQRCode: true
      }));
      return qrResponse.qrCode;
    } catch (error) {
      console.error('Erro ao obter QR code:', error);
      return null;
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      await checkStatus();
    } catch (error) {
      console.error('Erro ao conectar:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [checkStatus]);

  const disconnect = useCallback(async () => {
    try {
      console.log('🔄 Iniciando desconexão do WhatsApp...');
      await rabbitMQService.disconnect();
      console.log('✅ Comando de desconexão enviado com sucesso');
      setConnectionState({
        status: ConnectionStatus.disconnected,
        isConnected: false,
        canGenerateQR: true
      });
    } catch (error) {
      console.error('❌ Erro ao desconectar WhatsApp:', error);
      setConnectionState({
        status: ConnectionStatus.disconnected,
        isConnected: false,
        canGenerateQR: true
      });
    }
  }, []);

  const generateQR = useCallback(async () => {
    console.log('Iniciando geração de QR code...');
    if (isGeneratingQR) {
      console.log('⚠️ Geração de QR já em andamento, ignorando chamada');
      return;
    }

    setIsGeneratingQR(true);
    try {
      console.log('Iniciando processo de geração de QR code...');
      const result = await rabbitMQService.generateQR();
      console.log('Resposta da geração de QR code:', result);

      if (result.success) {
        if (result.qrCode) {
          console.log('QR code recebido diretamente da API');
          setConnectionState(prev => ({
            ...prev,
            status: ConnectionStatus.generating,
            qrCode: result.qrCode,
            hasQRCode: true,
            error: undefined
          }));
          return;
        }

        console.log('API iniciou processo de geração, aguardando QR code da fila...');
        setConnectionState(prev => ({
          ...prev,
          status: ConnectionStatus.generating,
          error: undefined
        }));
      } else {
        console.error('Falha ao iniciar geração:', result.message);
        setConnectionState(prev => ({
          ...prev,
          error: result.message || 'Erro ao gerar QR code'
        }));
      }
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      setConnectionState(prev => ({
        ...prev,
        error: 'Erro ao comunicar com o servidor'
      }));
    } finally {
      setIsGeneratingQR(false);
    }
  }, [connectionState.isConnected]);

  useEffect(() => {
    let isSubscribed = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const checkStatusWithTimeout = async () => {
      if (!isSubscribed) return;
      try {
        await checkStatus();
        const interval = connectionState.isConnected ? 60000 : 30000;
        if (isSubscribed) {
          timeoutId = setTimeout(checkStatusWithTimeout, interval);
        }
      } catch (error) {
        if (isSubscribed) {
          console.error('Erro ao verificar status:', error);
          timeoutId = setTimeout(checkStatusWithTimeout, 10000);
        }
      }
    };

    checkStatusWithTimeout();
    return () => {
      isSubscribed = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [connectionState.isConnected]);

  useEffect(() => {
    console.log('🔧 Configurando handler de QR code via SignalR...');
    const handleQRCode = (qrCode: string | null) => {
      console.log('🎯 Handler de QR code chamado com:', qrCode ? 'QR code válido' : 'null');
      if (qrCode === null) {
        console.log('❌ Erro recebido da fila de QR code');
        setConnectionState(prev => ({
          ...prev,
          error: 'Bot já está conectado. Não é possível gerar novo QR code.',
          status: ConnectionStatus.disconnected,
          hasQRCode: false,
          qrCode: undefined
        }));
        return;
      }
      console.log('📱 QR Code recebido da fila:', qrCode.substring(0, 50) + '...');
      console.log('📊 Tamanho do QR code:', qrCode.length);
      console.log('🔍 QR code começa com data:?', qrCode.startsWith('data:'));
      setConnectionState(prev => ({
        ...prev,
        qrCode,
        hasQRCode: true,
        status: ConnectionStatus.generating,
        error: undefined
      }));
    };

    qrCodeQueueService.onQRCode(handleQRCode);
    qrCodeQueueService.startQRCodeConsumer();
    return () => {
      qrCodeQueueService.removeHandler(handleQRCode);
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
    checkStatus
  };
};
