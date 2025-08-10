
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Smartphone, QrCode, RefreshCw, CheckCircle, XCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { ConnectionStatus } from '@/hooks/useWhatsAppConnection';
import { toast } from '@/hooks/use-toast';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ConnectionStatus;
  lastActivity?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onGenerateQR: () => void;
  isConnecting: boolean;
  isGeneratingQR: boolean;
  error?: string;
  canGenerateQR?: boolean;
  qrCode?: string;
  hasQRCode?: boolean;
}

const formatLastActivity = (lastActivity?: string) => {
  if (!lastActivity) return 'Nunca';
  
  try {
    const date = new Date(lastActivity);
    return date.toLocaleString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};

const getStatusIcon = (status: ConnectionStatus) => {
  switch (status) {
    case ConnectionStatus.connected:
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    case ConnectionStatus.disconnected:
      return <XCircle className="h-6 w-6 text-red-500" />;
    case ConnectionStatus.connecting:
      return <RefreshCw className="h-6 w-6 text-yellow-500 animate-spin" />;
    case ConnectionStatus.generating:
      return <QrCode className="h-6 w-6 text-blue-500 animate-pulse" />;
    default:
      return <AlertCircle className="h-6 w-6 text-gray-500" />;
  }
};

const getStatusText = (status: ConnectionStatus) => {
  switch (status) {
    case ConnectionStatus.connected:
      return 'Bot Conectado';
    case ConnectionStatus.disconnected:
      return 'Bot Desconectado';
    case ConnectionStatus.connecting:
      return 'Conectando...';
    case ConnectionStatus.generating:
      return 'Gerando QR Code...';
    default:
      return 'Status Desconhecido';
  }
};

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

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  status,
  lastActivity,
  onConnect,
  onDisconnect,
  onGenerateQR,
  isConnecting,
  isGeneratingQR,
  error,
  canGenerateQR = false,
  qrCode,
  hasQRCode = false
}) => {
  const [copied, setCopied] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  // Debug: Log do QR code quando chegar
  React.useEffect(() => {
    if (qrCode) {
      console.log('QR Code no componente:', qrCode.substring(0, 100) + '...');
      console.log('QR Code length:', qrCode.length);
    }
  }, [qrCode]);

  const handleCopyQRCode = async () => {
    if (!qrCode) return;

    try {
      // Copiar o QR code como base64 para clipboard
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast({
        title: "QR Code copiado!",
        description: "O QR code foi copiado para a área de transferência.",
      });
      
      // Reset do estado após 2 segundos
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar QR code:', error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o QR code.",
        variant: "destructive",
      });
    }
  };

  const handleImageError = () => {
    console.error('Erro ao carregar imagem do QR code');
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log('Imagem do QR code carregada com sucesso');
    setImageError(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Status do WhatsApp Bot
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Status da Conexão</CardTitle>
                {getStatusIcon(status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getStatusColor(status)}>
                    {getStatusText(status)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Última Atividade:</span>
                  <span className="text-sm text-gray-600">
                    {formatLastActivity(lastActivity)}
                  </span>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          {qrCode && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-blue-600" />
                  QR Code para Conectar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    {/* QR Code como imagem */}
                    <div className="relative">
                      <img
                        src={qrCode}
                        alt="QR Code para conectar WhatsApp"
                        className="w-48 h-48 mx-auto border border-gray-200 rounded-lg"
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        style={{
                          display: 'block',
                          maxWidth: '100%',
                          height: 'auto'
                        }}
                      />
                    </div>

                    {/* Botão de copiar centralizado abaixo da imagem */}
                    <div className="mt-3 text-center">
                      <Button
                        onClick={handleCopyQRCode}
                        size="sm"
                        variant="outline"
                        className="bg-white hover:bg-gray-50"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-2 text-green-600" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar QR Code
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Mensagem de erro se a imagem não carregar */}
                    {imageError && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        Erro ao carregar QR code. Tentando exibir como texto...
                      </div>
                    )}

                    {/* Fallback: QR code como texto se a imagem falhar */}
                    {imageError && (
                      <div className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded border max-w-xs overflow-auto">
                        <p className="font-bold mb-1">QR Code (Base64):</p>
                        <p className="break-all text-xs">{qrCode.substring(0, 100)}...</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-blue-800">
                      Abra o WhatsApp no seu celular e escaneie este QR code
                    </p>
                    <p className="text-xs text-gray-600">
                      Clique no botão de copiar para copiar o QR code
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {status === ConnectionStatus.disconnected && canGenerateQR && !qrCode && (
              <Button
                onClick={onGenerateQR}
                disabled={isGeneratingQR}
                className="w-full"
                variant="default"
              >
                {isGeneratingQR ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Gerar QR Code
                  </>
                )}
              </Button>
            )}

            {status === ConnectionStatus.connected ? (
              <Button
                onClick={onDisconnect}
                variant="destructive"
                className="w-full"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Desconectar Bot
              </Button>
            ) : (
              <Button
                onClick={onConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4 mr-2" />
                    Verificar Status
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Instructions */}
          {status === ConnectionStatus.generating && !qrCode && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <QrCode className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">QR Code sendo gerado...</p>
                    <p>Aguarde enquanto o bot gera o QR code para conexão.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {status === ConnectionStatus.disconnected && !qrCode && (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Bot Desconectado</p>
                    <p>Clique em "Gerar QR Code" para conectar o bot ao WhatsApp.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {qrCode && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">QR Code Disponível</p>
                    <p>Escaneie o QR code acima com o WhatsApp do seu celular para conectar.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
