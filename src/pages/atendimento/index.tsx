
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Phone, QrCode, Wifi, WifiOff } from "lucide-react"
import { useWhatsAppConnection } from "@/hooks/useWhatsAppConnection"
import { whatsAppService } from "@/services/whatsapp-service"
import { TalentChat as TalentChatComponent } from "@/components/whatsapp/talent-chat"
import { QRCodeModal } from "@/components/whatsapp/qr-code-modal"
import { AttendanceQueueDashboard } from "@/components/whatsapp/attendance-queue-dashboard"

// Mock data para demonstração - talentos cadastrados
const mockTalents = [
  { id: '1', name: 'Ana Clara Silva', phone: '11999887766', fullName: 'Ana Clara Silva' },
  { id: '2', name: 'Maria Santos', phone: '11988776655', fullName: 'Maria Santos' },
  { id: '3', name: 'João Oliveira', phone: '11977665544', fullName: 'João Oliveira' },
  { id: '4', name: 'Beatriz Costa', phone: '11966554433', fullName: 'Beatriz Costa' },
  { id: '5', name: 'Pedro Lima', phone: '11955443322', fullName: 'Pedro Lima' },
  { id: '6', name: 'Camila Rodrigues', phone: '11944332211', fullName: 'Camila Rodrigues' },
]

export default function AtendimentoPage() {
  const { connection, generateQR, disconnect, isGeneratingQR } = useWhatsAppConnection()
  const [selectedTalent, setSelectedTalent] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)

  const handleGenerateQR = async () => {
    try {
      await generateQR()
      setShowQRModal(true)
    } catch (error) {
      console.error('Error generating QR:', error)
    }
  }

  const handleTalentSelect = (talentId: string, talentName: string, talentPhone: string) => {
    // Initialize conversation if it doesn't exist
    whatsAppService.initializeConversation(talentId, talentName, talentPhone)
    setSelectedTalent(talentId)
  }

  const selectedTalentData = selectedTalent ? mockTalents.find(t => t.id === selectedTalent) : null

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Central de Atendimento WhatsApp
        </h1>
        <p className="text-gray-600">
          Sistema inteligente de atendimento PREGIATO MANAGEMENT
        </p>
      </div>

      {/* Dashboard de Fila de Atendimento */}
      <AttendanceQueueDashboard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Controle do WhatsApp */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Controle WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status de Conexão */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {connection.isConnected ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {connection.isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <Badge
                variant={connection.isConnected ? 'default' : 'destructive'}
                className={connection.isConnected ? 'bg-green-600' : ''}
              >
                {connection.status === 'connected' && 'Ativo'}
                {connection.status === 'connecting' && 'Conectando'}
                {connection.status === 'qr_ready' && 'QR Pronto'}
                {connection.status === 'disconnected' && 'Inativo'}
              </Badge>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-2">
              {!connection.isConnected && (
                <Button
                  onClick={handleGenerateQR}
                  disabled={isGeneratingQR}
                  className="w-full"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {isGeneratingQR ? 'Gerando...' : 'Conectar WhatsApp'}
                </Button>
              )}

              {connection.isConnected && (
                <Button
                  onClick={disconnect}
                  variant="destructive"
                  className="w-full"
                >
                  <WifiOff className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              )}
            </div>

            <Separator />

            {/* Lista de Contatos */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900">Contatos dos Modelos</h3>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {mockTalents.map((talent) => {
                    const conversation = whatsAppService.getConversation(talent.id)
                    const hasUnread = conversation && conversation.unreadCount > 0

                    return (
                      <button
                        key={talent.id}
                        onClick={() => handleTalentSelect(talent.id, talent.name, talent.phone)}
                        className={`w-full text-left p-3 border rounded-lg transition-colors hover:bg-gray-50 ${
                          selectedTalent === talent.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{talent.name}</p>
                            <p className="text-sm text-gray-500">{talent.phone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasUnread && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            <MessageSquare className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Área de Chat */}
        <div className="lg:col-span-2">
          {selectedTalent && selectedTalentData ? (
            <TalentChatComponent 
              talent={selectedTalentData} 
              onClose={() => setSelectedTalent(null)} 
            />
          ) : (
            <Card className="h-[600px]">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Selecione um contato</p>
                  <p className="text-sm">Escolha um modelo da lista para iniciar o atendimento</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal do QR Code */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrCode={connection.qrCode || ''}
        status={connection.status}
        onGenerateQR={handleGenerateQR}
        onDisconnect={disconnect}
        isGeneratingQR={isGeneratingQR}
      />
    </div>
  )
}
