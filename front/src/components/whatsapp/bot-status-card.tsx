import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, QrCode, Wifi, WifiOff, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { useWhatsAppConnection, ConnectionStatus } from '@/hooks/useWhatsAppConnection';
import { QRCodeModal } from '@/components/whatsapp/qr-code-modal';
import { useUser } from '@clerk/clerk-react';
import { UserService } from '@/services/user-service';
import { CurrentUser } from '@/types/whatsapp';

export const BotStatusCard = () => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
  const { user, isLoaded } = useUser();
  
  const {
    status,
    isConnected,
    lastActivity,
    error,
    isConnecting,
    isGeneratingQR,
    canGenerateQR,
    qrCode,
    hasQRCode,
    connectedNumber,
    connectedUserName,
    isFullyValidated,
    connect,
    disconnect,
    generateQR,
    checkStatus
  } = useWhatsAppConnection();

  // Buscar dados do usuário para verificar role
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !isLoaded) {
        setCurrentUser(null);
        setIsLoadingUser(false);
        return;
      }

      try {
        const userEmail = user.emailAddresses[0]?.emailAddress;
        if (!userEmail) {
          setCurrentUser(null);
          setIsLoadingUser(false);
          return;
        }

        const userData = await UserService.getUserByEmail(userEmail);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        setCurrentUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, [user, isLoaded]);

  // 🎉 AUTO-FECHAR MODAL: Fechar automaticamente quando WhatsApp for autenticado
  useEffect(() => {
    if (isConnected && status === ConnectionStatus.connected && showQRModal && connectedNumber) {
      console.log('🎉 WhatsApp autenticado');
      
      // Aguardar 2 segundos para mostrar sucesso antes de fechar
      setTimeout(() => {
        setShowQRModal(false);
      }, 2000);
    }
  }, [isConnected, status, showQRModal, connectedNumber]);

  // Verificar se o usuário é ADMIN
  const isAdmin = currentUser?.role === 'ADMIN';

  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.connected:
        return 'bg-green-100 text-green-800 border-green-200';
      case ConnectionStatus.disconnected:
        return 'bg-red-100 text-red-800 border-red-200';
      case ConnectionStatus.connecting:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ConnectionStatus.generating:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.connected:
        return 'Bot Conectado';
      case ConnectionStatus.disconnected:
        return 'Bot Inativo';
      case ConnectionStatus.connecting:
        return 'Conectando...';
      case ConnectionStatus.generating:
        return 'Gerando QR Code...';
      default:
        return 'Status Desconhecido';
    }
  };

  const getStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.connected:
        return <Wifi className="h-5 w-5 text-green-600" />;
      case ConnectionStatus.disconnected:
        return <WifiOff className="h-5 w-5 text-red-600" />;
      case ConnectionStatus.connecting:
        return <Wifi className="h-5 w-5 text-yellow-600 animate-pulse" />;
      case ConnectionStatus.generating:
        return <QrCode className="h-5 w-5 text-blue-600 animate-pulse" />;
      default:
        return <Bot className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status do Chat Bot</CardTitle>
          {getStatusIcon(status)}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Status do Bot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(status)}>
                  {getStatusText(status)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {lastActivity ? `Última atividade: ${new Date(lastActivity).toLocaleString()}` : 'Nenhuma atividade'}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-2">
              {!isConnected ? (
                <Button 
                  onClick={() => setShowQRModal(true)}
                  disabled={isGeneratingQR}
                  className="w-full"
                  variant="outline"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {isGeneratingQR ? 'Gerando...' : 'Conectar WhatsApp'}
                </Button>
              ) : (
                // ✅ Só mostrar botão Desconectar para usuários ADMIN
                isAdmin ? (
                  <Button 
                    onClick={disconnect}
                    className="w-full"
                    variant="destructive"
                  >
                    <WifiOff className="h-4 w-4 mr-2" />
                    Desconectar
                  </Button>
                ) : (
                  <div className="w-full p-2 text-center text-sm text-muted-foreground bg-muted/50 rounded-md">
                    Apenas administradores podem desconectar o bot
                  </div>
                )
              )}
              
              {/* Botão de Teste para Debug */}
              <Button 
                onClick={checkStatus}
                disabled={isConnecting}
                className="w-full"
                variant="ghost"
                size="sm"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isConnecting ? 'animate-spin' : ''}`} />
                {isConnecting ? 'Verificando...' : 'Verificar Status'}
              </Button>
            </div>

            {/* Connected WhatsApp Status */}
            {isConnected && connectedNumber && (
              <div className="text-center p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <p className="text-sm font-medium text-green-700">WhatsApp Conectado</p>
                <p className="text-xs text-green-600">📱 {connectedNumber}</p>
                {connectedUserName && (
                  <p className="text-xs text-green-600 mt-1">👤 {connectedUserName}</p>
                )}
                {isFullyValidated && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">Totalmente Validado</span>
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        status={status}
        isConnected={isConnected}
        lastActivity={lastActivity}
        error={error}
        isConnecting={isConnecting}
        isGeneratingQR={isGeneratingQR}
        canGenerateQR={canGenerateQR}
        qrCode={qrCode}
        hasQRCode={hasQRCode}
        onConnect={connect}
        onDisconnect={disconnect}
        onGenerateQR={generateQR}
      />
    </>
  );
}; 