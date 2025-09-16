import React, { useEffect, useState } from 'react';
import { qrCodeQueueService } from '@/services/qr-code-queue-service';
import { WhatsAppContext, WhatsAppContextProps } from '@/contexts/whatsapp-context';

interface WhatsAppProviderProps {
  children: React.ReactNode;
}

export const WhatsAppProvider: React.FC<WhatsAppProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isServiceReady, setIsServiceReady] = useState(false);

  useEffect(() => {
    console.log('🚀 [WhatsAppProvider] Inicializando provider global...');
    
    const initializeService = async () => {
      try {
        console.log('🔌 [WhatsAppProvider] Iniciando QR Code Queue Service...');
        
        // Inicializar o serviço globalmente
        await qrCodeQueueService.startQRCodeConsumer();
        
        console.log('✅ [WhatsAppProvider] Serviço inicializado com sucesso');
        setIsServiceReady(true);
        setIsConnected(true);
        setConnectionError(null);
        
      } catch (error) {
        console.error('❌ [WhatsAppProvider] Erro ao inicializar serviço:', error);
        setConnectionError(error instanceof Error ? error.message : 'Erro desconhecido');
        setIsServiceReady(false);
        setIsConnected(false);
      }
    };

    initializeService();

    // Cleanup na desmontagem
    return () => {
      console.log('🧹 [WhatsAppProvider] Limpando provider global...');
      qrCodeQueueService.stopQRCodeConsumer();
    };
  }, []);

  const value: WhatsAppContextProps = {
    isConnected,
    connectionError,
    isServiceReady,
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
};
