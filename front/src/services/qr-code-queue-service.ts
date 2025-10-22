import axios from 'axios';
import type { HubConnection } from '@microsoft/signalr';
import { SIGNALR_URL } from '../config/api';

interface QRCodeMessage {
  qrCode: string;
  timestamp: string;
  instanceId: string;
  type: string;
}

type QRCodeHandler = (qrCode: string) => void;

class QRCodeQueueService {
  private handlers: QRCodeHandler[] = [];
  private isConnected = false;
  private connection: HubConnection | null = null;
  private qrUpdateHandler: ((qrCodeMessage: QRCodeMessage) => void) | null = null;

  // Adicionar handler para receber QR codes
  onQRCode(handler: QRCodeHandler) {
    this.handlers.push(handler);
  }

  // Remover handler
  removeHandler(handler: QRCodeHandler) {
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
  }

  // Método público para acessar a conexão
  getConnection(): HubConnection | null {
    return this.connection;
  }

  // Método público para adicionar listeners
  addListener(eventName: string, handler: (...args: unknown[]) => void): void {
    this.connection?.on(eventName, handler);
  }

  // Método público para remover listeners
  removeListener(eventName: string, handler: (...args: unknown[]) => void): void {
    this.connection?.off(eventName, handler);
  }

  // Iniciar conexão SignalR
  async startQRCodeConsumer() {
    if (this.isConnected) {
      console.log('⚠️ Conexão SignalR já está ativa');
      return;
    }

    try {
      console.log('🔌 Conectando ao SignalR...');
      
      // Importar SignalR dinamicamente
      const { HubConnectionBuilder, LogLevel, HttpTransportType } = await import('@microsoft/signalr');
      
      console.log('🌐 URL SignalR:', SIGNALR_URL);
      console.log('🏭 Ambiente:', import.meta.env.PROD ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
      
      this.connection = new HubConnectionBuilder()
        .withUrl(SIGNALR_URL, {
          // ✅ ADICIONADO: Configurações para produção no Railway
          transport: import.meta.env.PROD ? 
            HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents :
            HttpTransportType.WebSockets,
          skipNegotiation: false,
          withCredentials: false
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000]) // Reconexão automática
        .configureLogging(import.meta.env.PROD ? LogLevel.Warning : LogLevel.Information)
        .build();

      // Configurar handlers de eventos
      console.log('🎧 Registrando handler para evento qr.update...');
      this.qrUpdateHandler = (qrCodeMessage: QRCodeMessage) => {
        console.log('📱 QR Code recebido via SignalR (qr.update):', {
          qrCodeLength: qrCodeMessage.qrCode?.length,
          qrPreview: qrCodeMessage.qrCode?.substring(0, 50) + '...',
          timestamp: qrCodeMessage.timestamp,
          instanceId: qrCodeMessage.instanceId,
          type: qrCodeMessage.type
        });
        console.log('📊 Total de handlers registrados:', this.handlers.length);
        
        // ✅ VALIDAÇÃO: Verificar se o QR Code é válido
        if (!qrCodeMessage.qrCode || qrCodeMessage.qrCode.trim() === '') {
          console.warn('⚠️ QR Code vazio ou inválido recebido via SignalR');
          return;
        }
        
        // ✅ VALIDAÇÃO: Verificar se é um QR Code válido (deve começar com data: ou ser base64)
        const isValidQR = qrCodeMessage.qrCode.startsWith('data:') || 
                         (qrCodeMessage.qrCode.length > 100 && /^[A-Za-z0-9+/=]+$/.test(qrCodeMessage.qrCode));
        
        if (!isValidQR) {
          console.warn('⚠️ QR Code com formato inválido:', qrCodeMessage.qrCode.substring(0, 100));
          return;
        }
        
        // Notificar todos os handlers
        this.handlers.forEach((handler, index) => {
          try {
            console.log(`🔄 Executando handler ${index + 1}/${this.handlers.length}`);
            handler(qrCodeMessage.qrCode);
            console.log(`✅ Handler ${index + 1} executado com sucesso`);
          } catch (error) {
            console.error(`❌ Erro no handler ${index + 1}:`, error);
          }
        });
      };
      
      this.connection.on('qr.update', this.qrUpdateHandler);
      console.log('✅ Handler qr.update registrado com sucesso');

      this.connection.on('JoinedWhatsAppGroup', (message: string) => {
        console.log('✅ Conectado ao grupo WhatsApp:', message);
      });

      this.connection.on('LeftWhatsAppGroup', (message: string) => {
        console.log('❌ Desconectado do grupo WhatsApp:', message);
      });

      // Handler de reconexão
      this.connection.onreconnecting(() => {
        console.log('🔄 Reconectando ao SignalR...');
        this.isConnected = false;
      });

      this.connection.onreconnected(async (connectionId) => {
        console.log('✅ Reconectado ao SignalR com ID:', connectionId);
        this.isConnected = true;
        
        // Reentrar no grupo WhatsApp após reconexão
        try {
          await this.connection.invoke('JoinWhatsAppGroup');
          console.log('🎧 Reentrou no grupo WhatsApp após reconexão');
        } catch (error) {
          console.error('❌ Erro ao reentrar no grupo WhatsApp:', error);
        }
      });

      // Handler de erro de conexão
      this.connection.onclose((error) => {
        console.log('🔌 Conexão SignalR fechada:', error);
        this.isConnected = false;
      });

      // Iniciar conexão
      await this.connection.start();
      this.isConnected = true;
      console.log('✅ Conexão SignalR estabelecida');
      console.log('🔗 Connection ID:', this.connection.connectionId);
      console.log('📡 Estado da conexão:', this.connection.state);

      // Entrar no grupo WhatsApp
      await this.connection.invoke('JoinWhatsAppGroup');
      console.log('🎧 Entrou no grupo WhatsApp');

    } catch (error) {
      console.error('❌ Erro ao conectar SignalR:', error);
      this.isConnected = false;
    }
  }

  // Parar conexão SignalR
  async stopQRCodeConsumer() {
    if (this.connection) {
      try {
        console.log('🛑 [SIGNALR] Parando conexão WhatsApp Hub...');
        
        // Remover handler específico
        if (this.qrUpdateHandler) {
          this.connection.off('qr.update', this.qrUpdateHandler);
          this.qrUpdateHandler = null;
        }
        
        // Sair do grupo antes de fechar conexão
        try {
          await this.connection.invoke('LeaveWhatsAppGroup');
          console.log('🚪 [SIGNALR] Saiu do grupo WhatsApp');
        } catch (e) {
          // Ignorar erro se já desconectado
        }
        
        // Parar conexão
        await this.connection.stop();
        console.log('✅ [SIGNALR] Conexão WhatsApp Hub encerrada');
      } catch (error) {
        console.error('❌ [SIGNALR] Erro ao parar conexão:', error);
      } finally {
        this.connection = null;
        this.isConnected = false;
      }
    }
  }

  // Limpar todos os handlers
  clearHandlers() {
    this.handlers = [];
  }
}

// Instância singleton
export const qrCodeQueueService = new QRCodeQueueService();
