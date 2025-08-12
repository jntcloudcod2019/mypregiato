import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, MessageSquare, Users, Clock, User, Settings, LogOut, Circle, Wifi, WifiOff, QrCode } from 'lucide-react';
import { useWhatsAppConnection, ConnectionStatus } from '@/hooks/useWhatsAppConnection';
import { useOperatorStatus } from '@/hooks/useOperatorStatus';
import { QRCodeModal } from '@/components/whatsapp/qr-code-modal';
import { CentralDeAtendimento } from '@/components/attendance/central-de-atendimento';
import { ChatWindow } from '@/components/attendance/chat-window';

import { useAttendanceCenter } from '@/hooks/useAttendanceCenter';
import { attendanceService } from '@/services/attendance-service';
import { useUserRole } from '@/services/user-role-service';
import { ActiveChat } from '@/types/attendance';

export default function AttendancePage() {
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ActiveChat | null>(null);
  const [showChatWindow, setShowChatWindow] = useState(false);

  // WhatsApp Connection
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

  // Operator Status
  const { currentOperator, updateOperatorStatus } = useOperatorStatus();
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Attendance Center
  const {
    queue,
    activeChats,
    metrics,
    selectedTab,
    setSelectedTab,
    attendRequest,
    handleNewMessage,
    closeChat
  } = useAttendanceCenter();

  // Configurar handler para novas mensagens
  useEffect(() => {
    const messageHandler = (message: any) => {
      handleNewMessage(message);
    };

    attendanceService.onNewMessage(messageHandler);

    // Iniciar consumidor de mensagens da fila
    attendanceService.startMessageConsumer();

    // Removidas simulações para produção

    return () => {
      attendanceService.removeHandler(messageHandler);
    };
  }, [handleNewMessage]);

  const handleAttendRequest = (requestId: string, operatorId: string) => {
    attendRequest(requestId, operatorId);
    
    // Encontrar o chat recém-criad o
    const operatorChats = activeChats.get(operatorId) || [];
    const newChat = operatorChats[operatorChats.length - 1];
    
    if (newChat) {
      setSelectedChat(newChat);
      setShowChatWindow(true);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedChat) return;

    try {
      const responseMessage = await attendanceService.sendMessage(selectedChat.phone, message);
      console.log('Mensagem enviada:', responseMessage);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleCloseChat = (chatId: string, operatorId: string) => {
    closeChat(chatId, operatorId);
    
    if (selectedChat?.id === chatId) {
      setSelectedChat(null);
      setShowChatWindow(false);
    }
  };

  // Helper functions for status display
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

  const getOperatorStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'away': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getOperatorStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'busy': return 'Ocupado';
      case 'away': return 'Ausente';
      default: return 'Offline';
    }
  };

  const getOperatorStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Circle className="h-3 w-3 text-green-600" />;
      case 'busy': return <Circle className="h-3 w-3 text-yellow-600" />;
      case 'away': return <Circle className="h-3 w-3 text-red-600" />;
      default: return <Circle className="h-3 w-3 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">

            
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Status do Bot */}
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




              </div>
            </CardContent>
          </Card>

          {/* Status do Operador */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status do Operador</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {currentOperator ? (
                <div className="space-y-3">
                  {/* Informações do Operador */}
                              <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentOperator.avatar} />
                      <AvatarFallback>
                        {currentOperator.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{currentOperator.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{currentOperator.email}</p>
                                </div>
                              </div>

                  {/* Status Atual */}
                  <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                      {getOperatorStatusIcon(currentOperator.status)}
                      <span className="text-sm font-medium">{getOperatorStatusText(currentOperator.status)}</span>
                    </div>
                    <Badge className={getOperatorStatusColor(currentOperator.status)}>
                      {currentOperator.activeAttendances} atendimentos
                    </Badge>
                  </div>

                  {/* Opções de Status */}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={currentOperator.status === 'available' ? 'default' : 'outline'}
                      onClick={() => updateOperatorStatus('available')}
                      className="flex-1 text-xs"
                    >
                      Disponível
                    </Button>
                    <Button
                      size="sm"
                      variant={currentOperator.status === 'busy' ? 'default' : 'outline'}
                      onClick={() => updateOperatorStatus('busy')}
                      className="flex-1 text-xs"
                    >
                      Ocupado
                    </Button>
                    <Button
                      size="sm"
                      variant={currentOperator.status === 'away' ? 'default' : 'outline'}
                      onClick={() => updateOperatorStatus('away')}
                      className="flex-1 text-xs"
                    >
                      Ausente
                    </Button>
                  </div>

                  {/* Botão de Desconectar (apenas para admins) */}
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        // Implementar lógica de desconexão do bot
                        console.log('Desconectar bot (apenas admin)');
                      }}
                      className="w-full text-xs"
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Desconectar Bot
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Operador não identificado</p>
                </div>
              )}
              </CardContent>
            </Card>
          </div>

        {/* Central de Atendimento */}
        <div className="grid grid-cols-1 gap-6">
          {/* Central de Atendimento */}
          <div>
            <CentralDeAtendimento />
          </div>
        </div>

        {/* Chat Window Modal */}
        {showChatWindow && selectedChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-full max-w-4xl h-[80vh]">
              <ChatWindow
                chat={selectedChat}
                onClose={() => {
                  setShowChatWindow(false);
                  setSelectedChat(null);
                }}
                onSendMessage={handleSendMessage}
              />
                  </div>
                </div>
          )}

        {/* QR Code Modal */}
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          status={status}
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
      </div>
    </div>
  );
}
