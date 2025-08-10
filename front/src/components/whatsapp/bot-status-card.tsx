import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, QrCode, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useWhatsAppConnection, ConnectionStatus } from '@/hooks/useWhatsAppConnection';
import { QRCodeModal } from '@/components/whatsapp/qr-code-modal';

export const BotStatusCard = () => {
  const [showQRModal, setShowQRModal] = useState(false);
  
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
    connect,
    disconnect,
    generateQR
  } = useWhatsAppConnection();

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
              {!isConnected && canGenerateQR && (
                <Button 
                  onClick={() => setShowQRModal(true)}
                  disabled={isGeneratingQR}
                  className="w-full"
                  variant="outline"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {isGeneratingQR ? 'Gerando...' : 'Conectar WhatsApp'}
                </Button>
              )}
              
              {isConnected && (
                <Button 
                  onClick={disconnect}
                  className="w-full"
                  variant="destructive"
                >
                  <WifiOff className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              )}
            </div>

            {/* QR Code Status */}
            {hasQRCode && (
              <div className="text-center p-2 bg-blue-50 rounded-md">
                <QrCode className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <p className="text-xs text-blue-600">QR Code disponível</p>
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