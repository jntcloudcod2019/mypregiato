
import { useState, useEffect } from 'react';
import { whatsAppGateway } from '../services/whatsapp-api';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'qr_ready';

export const useWhatsAppConnection = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    try {
      setStatus('connecting');
      setError(null);
      await whatsAppGateway.connect();
      setStatus('connected');
    } catch (err) {
      console.error('Erro ao conectar WhatsApp:', err);
      setError('Erro ao conectar WhatsApp');
      setStatus('disconnected');
    }
  };

  const disconnect = async () => {
    try {
      await whatsAppGateway.disconnect();
      setStatus('disconnected');
      setQrCode(null);
      setError(null);
    } catch (err) {
      console.error('Erro ao desconectar WhatsApp:', err);
      setError('Erro ao desconectar WhatsApp');
    }
  };

  const getStatus = async () => {
    try {
      const response = await whatsAppGateway.getStatus();
      const { status: currentStatus, qrCode: currentQrCode } = response.data;
      setStatus(currentStatus);
      setQrCode(currentQrCode);
    } catch (err) {
      console.error('Erro ao buscar status do WhatsApp:', err);
      setError('Erro ao buscar status do WhatsApp');
    }
  };

  useEffect(() => {
    getStatus();
    
    // Atualizar status a cada 10 segundos
    const interval = setInterval(getStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    status,
    qrCode,
    error,
    connect,
    disconnect,
    refresh: getStatus
  };
};
