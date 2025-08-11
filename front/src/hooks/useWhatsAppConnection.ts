
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
      console.log('Iniciando processo de geração de QR code...');
      const result = await rabbitMQService.generateQR();
      console.log('Resposta da geração de QR code:', result);
      
      if (result.success) {
        // Se a API retornou o QR code diretamente
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
        
        console.log('API iniciou processo de geração, aguardando QR code...');
        // Se a API apenas iniciou o processo, aguardar e tentar obter o QR code
        setConnectionState(prev => ({
          ...prev,
          status: ConnectionStatus.generating,
          error: undefined
        }));

        // Tentar obter o QR code algumas vezes
        let attempts = 0;
        const maxAttempts = 10;
        const interval = setInterval(async () => {
          try {
            if (attempts >= maxAttempts) {
              clearInterval(interval);
              console.error('Timeout ao aguardar QR code após', maxAttempts, 'tentativas');
              setConnectionState(prev => ({
                ...prev,
                error: 'Timeout ao aguardar QR code'
              }));
              return;
            }

            attempts++;
            console.log(`Tentativa ${attempts} de obter QR code...`);
            
            const qrResponse = await rabbitMQService.getQRCode();
            if (qrResponse.qrCode) {
              console.log('QR code obtido com sucesso na tentativa', attempts);
              clearInterval(interval);
              setConnectionState(prev => ({
                ...prev,
                qrCode: qrResponse.qrCode,
                hasQRCode: true,
                error: undefined
              }));
            } else {
              console.log('QR code ainda não disponível na tentativa', attempts);
            }
          } catch (error) {
            console.warn(`Erro na tentativa ${attempts}:`, error);
          }
        }, 2000); // Aumentado para 2 segundos entre tentativas

        // Limpar intervalo se o componente for desmontado
        return () => {
          console.log('Limpando intervalo de verificação de QR code');
          clearInterval(interval);
        };
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

  // Verificar status periodicamente
  useEffect(() => {
    let isSubscribed = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const checkStatusWithTimeout = async () => {
      if (!isSubscribed) return;

      try {
        await checkStatus();
        
        // Se não estiver conectado, verificar mais frequentemente
        const interval = connectionState.isConnected ? 30000 : 10000;
        
        if (isSubscribed) {
          timeoutId = setTimeout(checkStatusWithTimeout, interval);
        }
      } catch (error) {
        if (isSubscribed) {
          console.error('Erro ao verificar status:', error);
          // Em caso de erro, tentar novamente em 10 segundos
          timeoutId = setTimeout(checkStatusWithTimeout, 10000);
        }
      }
    };

    checkStatusWithTimeout();

    return () => {
      isSubscribed = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [connectionState.isConnected]);

  // Se tem QR code disponível, buscar automaticamente (com debounce)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (connectionState.hasQRCode && !connectionState.qrCode) {
      timeoutId = setTimeout(() => {
        getQRCode();
      }, 1000); // Esperar 1 segundo antes de buscar o QR code
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [connectionState.hasQRCode, connectionState.qrCode]);

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
