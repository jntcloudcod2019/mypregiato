
import { useState, useEffect, useCallback } from 'react';
import { rabbitMQService, WhatsAppStatus, QRCodeResponse } from '../services/whatsapp-api';
import { qrCodeQueueService } from '@/services/qr-code-queue-service';
import { toast } from '@/components/ui/sonner';

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
  }, [checkStatus]);

  const disconnect = useCallback(async () => {
    try { await rabbitMQService.disconnect(); } catch {}
    setConnectionState({ status: ConnectionStatus.disconnected, isConnected: false, canGenerateQR: true });
  }, []);

  const generateQR = useCallback(async () => {
    // Iniciar consumer antes de mandar o comando, garantindo assinatura do evento
    try { await qrCodeQueueService.startQRCodeConsumer(); } catch {}

    if (isGeneratingQR) return;
    setIsGeneratingQR(true);

    // Atualiza status preventivamente
    setConnectionState(prev => ({ ...prev, status: ConnectionStatus.generating, error: undefined }));

    try {
      console.log('[QR] Enviando comando generate-qr para API...');
      const result = await rabbitMQService.generateQR();
      console.log('[QR] Resposta da API (generate-qr):', result);
      if (!result.success) {
        toast?.(result.message || 'Falha ao gerar QR code');
        setConnectionState(prev => ({ ...prev, error: result.message || 'Falha ao gerar QR code', status: ConnectionStatus.disconnected }));
        return;
      }
      // sucesso: aguardar evento qr.update via SignalR
      toast?.('Comando enviado. Aguardando QR...');
    } catch (error: any) {
      console.error('[QR] Erro ao gerar QR:', error);
      setConnectionState(prev => ({ ...prev, error: 'Erro ao comunicar com o servidor', status: ConnectionStatus.disconnected }));
    } finally {
      setIsGeneratingQR(false);
    }
  }, [isGeneratingQR]);

  useEffect(() => {
    let isSubscribed = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const loop = async () => {
      if (!isSubscribed) return;
      try {
        await checkStatus();
        const interval = connectionState.isConnected ? 60000 : 30000;
        if (isSubscribed) timeoutId = setTimeout(loop, interval);
      } catch {
        if (isSubscribed) timeoutId = setTimeout(loop, 10000);
      }
    };

    loop();
    return () => { isSubscribed = false; if (timeoutId) clearTimeout(timeoutId); };
  }, [connectionState.isConnected]);

  useEffect(() => {
    const handleQRCode = (qrCode: string | null) => {
      if (!qrCode) {
        setConnectionState(prev => ({ ...prev, error: 'Bot já está conectado. Não é possível gerar novo QR code.', status: ConnectionStatus.disconnected, hasQRCode: false, qrCode: undefined }));
        return;
      }
      setConnectionState(prev => ({ ...prev, qrCode, hasQRCode: true, status: ConnectionStatus.generating, error: undefined }));
    };

    qrCodeQueueService.onQRCode(handleQRCode);
    qrCodeQueueService.startQRCodeConsumer();
    return () => {
      qrCodeQueueService.removeHandler(handleQRCode);
      qrCodeQueueService.stopQRCodeConsumer();
    };
  }, []);

  return { ...connectionState, isConnecting, isGeneratingQR, connect, disconnect, generateQR, getQRCode, checkStatus };
};
