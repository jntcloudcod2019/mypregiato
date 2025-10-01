
import { useState, useEffect, useCallback } from 'react';
import { rabbitMQService, WhatsAppStatus, QRCodeResponse } from '../services/whatsapp-api';
import { qrCodeQueueService } from '@/services/qr-code-queue-service';
import { toast } from '@/components/ui/sonner';
import { globalCache } from '@/services/global-cache';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pregiato-api-production.up.railway.app/api';

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

  // ✅ CORREÇÃO: Verificação inicial simplificada - sempre do servidor
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        console.log('🔍 [useWhatsAppConnection] Verificando status inicial (sempre do servidor)...');
        const response = await fetch(`${API_BASE_URL}/api/whatsapp/status`);
        if (response.ok) {
          const statusData = await response.json();
          console.log('📊 [useWhatsAppConnection] Status recebido do servidor:', statusData);
          const isActuallyConnected = Boolean(statusData.sessionConnected);
          const nextStatus = isActuallyConnected ? ConnectionStatus.connected : ConnectionStatus.disconnected;
          if (statusData.connectedNumber) {
            globalCache.setConnectedNumber(statusData.connectedNumber);
          }
          globalCache.setSessionStatus({
            sessionConnected: statusData.sessionConnected,
            isFullyValidated: statusData.isFullyValidated,
            connectedNumber: statusData.connectedNumber,
            lastActivity: statusData.lastActivity
          });
          setConnectionState(prev => ({
            ...prev,
            status: nextStatus,
            isConnected: isActuallyConnected,
            lastActivity: statusData.lastActivity,
            error: undefined,
            canGenerateQR: !isActuallyConnected,
            connectedNumber: statusData.connectedNumber,
            isFullyValidated: statusData.isFullyValidated
          }));
          console.log('✅ [useWhatsAppConnection] Status inicial configurado:', {
            status: nextStatus,
            isConnected: isActuallyConnected,
            connectedNumber: statusData.connectedNumber
          });
        } else {
          console.error('❌ [useWhatsAppConnection] Erro ao obter status do servidor:', response.status);
          setConnectionState(prev => ({
            ...prev,
            status: ConnectionStatus.disconnected,
            isConnected: false,
            error: 'Erro ao conectar com o servidor'
          }));
        }
      } catch (error) {
        console.error('❌ [useWhatsAppConnection] Erro na verificação inicial:', error);
        setConnectionState(prev => ({
          ...prev,
          status: ConnectionStatus.disconnected,
          isConnected: false,
          error: 'Erro de conexão'
        }));
      }
    };

    checkInitialStatus();
  }, []);

  // Listener para atualizações de status via SignalR
  useEffect(() => {
    const handleStatusUpdate = (statusData: BotStatusUpdate) => {
      console.log('📡 [useWhatsAppConnection] Status recebido via SignalR:', statusData);
      
      const isActuallyConnected = Boolean(statusData.sessionConnected);
      
      // Lógica de status corrigida: se não está conectado, deve ser 'disconnected'
      const nextStatus = isActuallyConnected
        ? ConnectionStatus.connected
        : ConnectionStatus.disconnected;

      console.log('🔄 [useWhatsAppConnection] Atualizando estado:', {
        isActuallyConnected,
        nextStatus,
        connectedNumber: statusData.connectedNumber
      });

      // ✅ NOVO: Armazenar no cache global quando receber via SignalR
      if (statusData.connectedNumber) {
        globalCache.setConnectedNumber(statusData.connectedNumber);
      }
      globalCache.setSessionStatus({
        sessionConnected: statusData.sessionConnected,
        isFullyValidated: statusData.isFullyValidated,
        connectedNumber: statusData.connectedNumber,
        lastActivity: statusData.lastActivity
      });

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
    const handleSessionAuthenticated = (data: { connectedNumber?: string; connectedUserName?: string; isFullyValidated?: boolean; timestamp?: string }) => {
      console.log('🎉 [useWhatsAppConnection] Evento session.authenticated recebido:', data);
      
      // ✅ NOVO: Armazenar no cache global quando autenticado
      if (data.connectedNumber) {
        globalCache.setConnectedNumber(data.connectedNumber);
      }
      globalCache.setSessionStatus({
        sessionConnected: true,
        isFullyValidated: data.isFullyValidated || false,
        connectedNumber: data.connectedNumber,
        lastActivity: data.timestamp || new Date().toISOString()
      });
      
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
      toast.success(`✅ WhatsApp conectado com sucesso! Número: ${data.connectedNumber}`);
    };

    // Handler para eventos de serviço (deploy/reinicialização)
    const handleServiceStatus = (data: { service: string; status: string }) => {
      console.log('🔄 [useWhatsAppConnection] Evento de serviço recebido:', data);
      
      if (data.service === 'rabbit' && data.status === 'connected') {
        console.log('🚀 [useWhatsAppConnection] RabbitMQ reconectado após deploy - verificando status do bot...');
        
        // ✅ CORREÇÃO: Usar método específico para limpeza em deploy
        globalCache.clearOnDeploy();
        
        // Resetar estado para desconectado até verificar o status real
        setConnectionState(prev => ({
          ...prev,
          status: ConnectionStatus.disconnected,
          isConnected: false,
          error: undefined,
          canGenerateQR: true,
          connectedNumber: undefined,
          isFullyValidated: false
        }));
        
        // Verificar status do bot após reconexão
        setTimeout(async () => {
          try {
            console.log('🔄 [useWhatsAppConnection] Verificando status após reconexão do serviço...');
            const response = await fetch(`${API_BASE_URL}/api/whatsapp/status`);
            if (response.ok) {
              const statusData = await response.json();
              console.log('📊 [useWhatsAppConnection] Status após reconexão:', statusData);
              
              // Atualizar estado com os dados mais recentes
              setConnectionState(prev => ({
                ...prev,
                status: statusData.sessionConnected ? ConnectionStatus.connected : ConnectionStatus.disconnected,
                isConnected: statusData.sessionConnected,
                lastActivity: statusData.lastActivity,
                error: undefined,
                canGenerateQR: !statusData.sessionConnected,
                connectedNumber: statusData.connectedNumber || prev.connectedNumber,
                isFullyValidated: statusData.isFullyValidated
              }));
              
              // Notificar usuário sobre reconexão
              if (statusData.sessionConnected) {
                toast.success('🔄 Serviços reconectados! WhatsApp está online.');
              } else {
                toast.info('🔄 Serviços reconectados. Aguardando conexão do WhatsApp...');
              }
            }
          } catch (error) {
            console.warn('⚠️ [useWhatsAppConnection] Erro ao verificar status após reconexão:', error);
          }
        }, 2000); // Aguardar 2 segundos para o serviço estabilizar
      }
    };

    // Registrar listeners
    console.log('🎧 [useWhatsAppConnection] Registrando listeners...');
    qrCodeQueueService.addListener('bot.status.update', handleStatusUpdate);
    qrCodeQueueService.addListener('session.authenticated', handleSessionAuthenticated);
    qrCodeQueueService.addListener('service.status', handleServiceStatus);
    console.log('✅ [useWhatsAppConnection] Listeners registrados com sucesso');
    
    return () => {
      qrCodeQueueService.removeListener('bot.status.update', handleStatusUpdate);
      qrCodeQueueService.removeListener('session.authenticated', handleSessionAuthenticated);
      qrCodeQueueService.removeListener('service.status', handleServiceStatus);
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
    try { 
      // ✅ REMOVIDO: checkStatus não é mais necessário
      // Status será atualizado automaticamente via SignalR
    } finally { setIsConnecting(false); }
  }, []);

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

  // ✅ REMOVIDO: Verificação inicial não é mais necessária
  // Status será atualizado automaticamente via SignalR quando o componente montar

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
    // ✅ REMOVIDO: startQRCodeConsumer() - já é inicializado globalmente pelo WhatsAppProvider
    
    console.log('🎧 [QR] Handlers registrados');
    
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
    // ✅ REMOVIDO: checkStatus não é mais necessário
    // Exportar novas propriedades para uso nos componentes
    connectedUserName: connectionState.connectedUserName,
    isFullyValidated: connectionState.isFullyValidated
  };
};
