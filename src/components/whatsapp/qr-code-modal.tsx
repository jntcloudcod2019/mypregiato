
import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Smartphone, Wifi, WifiOff, RotateCcw } from 'lucide-react'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  qrCode?: string
  status: 'disconnected' | 'qr_ready' | 'connecting' | 'connected'
  onGenerateQR: () => void
  onDisconnect: () => void
  isGeneratingQR: boolean
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  qrCode,
  status,
  onGenerateQR,
  onDisconnect,
  isGeneratingQR
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500 text-white"><Wifi className="w-3 h-3 mr-1" />Conectado</Badge>
      case 'connecting':
        return <Badge variant="secondary"><RotateCcw className="w-3 h-3 mr-1 animate-spin" />Conectando...</Badge>
      case 'qr_ready':
        return <Badge variant="outline"><Smartphone className="w-3 h-3 mr-1" />Escaneie o QR</Badge>
      default:
        return <Badge variant="destructive"><WifiOff className="w-3 h-3 mr-1" />Desconectado</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Conexão WhatsApp
            {getStatusBadge()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {status === 'connected' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">WhatsApp Conectado!</h3>
              <p className="text-muted-foreground mb-4">
                Você pode começar a enviar e receber mensagens.
              </p>
              <Button variant="outline" onClick={onDisconnect}>
                Desconectar
              </Button>
            </div>
          ) : (
            <div className="text-center">
              {qrCode && status === 'qr_ready' ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border inline-block">
                    <img 
                      src={qrCode} 
                      alt="QR Code WhatsApp" 
                      className="w-48 h-48"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Escaneie com o WhatsApp</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>1. Abra o WhatsApp no seu celular</p>
                      <p>2. Toque em "Mais opções" ou "Configurações"</p>
                      <p>3. Toque em "Dispositivos conectados"</p>
                      <p>4. Toque em "Conectar dispositivo"</p>
                      <p>5. Escaneie este código QR</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={onGenerateQR} disabled={isGeneratingQR}>
                    {isGeneratingQR ? 'Gerando...' : 'Gerar Novo QR'}
                  </Button>
                </div>
              ) : (
                <div className="py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Conectar WhatsApp</h3>
                  <p className="text-muted-foreground mb-4">
                    Clique no botão abaixo para gerar um QR Code e conectar sua conta WhatsApp.
                  </p>
                  <Button onClick={onGenerateQR} disabled={isGeneratingQR}>
                    {isGeneratingQR ? 'Gerando QR...' : 'Gerar QR Code'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
