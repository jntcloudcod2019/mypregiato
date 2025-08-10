
import { useState, useEffect, useCallback } from 'react';
import { rabbitMQService, WhatsAppStatus, QRCodeResponse } from '../services/whatsapp-api';

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
      
      setConnectionState({
        status: status.isConnected ? ConnectionStatus.connected : ConnectionStatus.disconnected,
        isConnected: status.isConnected,
        lastActivity: status.lastActivity,
        error: status.error,
        canGenerateQR: status.canGenerateQR ?? !status.isConnected,
        hasQRCode: status.hasQRCode
      });
    } catch (error) {
      console.error('Erro ao verificar status do WhatsApp:', error);
      setConnectionState({
        status: ConnectionStatus.disconnected,
        isConnected: false,
        error: 'Erro ao conectar com o servidor',
        canGenerateQR: true
      });
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
    setConnectionState({
      status: ConnectionStatus.disconnected,
      isConnected: false,
      canGenerateQR: true
    });
  }, []);

  const generateQR = useCallback(async () => {
    if (connectionState.isConnected) {
      console.log('Bot já está conectado');
      return;
    }

    setIsGeneratingQR(true);
    try {
      const result = await rabbitMQService.generateQR();
      console.log('QR Code gerado:', result);
      
      setConnectionState(prev => ({
        ...prev,
        status: ConnectionStatus.generating
      }));

      // Aguardar um pouco e verificar se o QR code foi gerado
      setTimeout(async () => {
        await checkStatus();
        // Tentar obter o QR code
        await getQRCode();
      }, 3000);

    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      setConnectionState(prev => ({
        ...prev,
        error: 'Erro ao gerar QR code'
      }));
    } finally {
      setIsGeneratingQR(false);
    }
  }, [connectionState.isConnected, checkStatus, getQRCode]);

  // Verificar status periodicamente
  useEffect(() => {
    checkStatus();

    const interval = setInterval(() => {
      checkStatus();
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, [checkStatus]);

  // Se tem QR code disponível, buscar automaticamente
  useEffect(() => {
    if (connectionState.hasQRCode && !connectionState.qrCode) {
      getQRCode();
    }
  }, [connectionState.hasQRCode, connectionState.qrCode, getQRCode]);

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
