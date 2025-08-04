
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
import { OperatorsDashboard } from "@/components/whatsapp/operators-dashboard"
import { ActiveAttendancesPanel } from "@/components/whatsapp/active-attendances-panel"
import { TalentData } from "@/types/talent"

// Mock data para demonstração - talentos cadastrados com todas as propriedades necessárias
const mockTalents: TalentData[] = [
  {
    id: '1',
    fullName: 'Ana Clara Silva',
    phone: '11999887766',
    email: 'ana.clara@email.com',
    age: 25,
    inviteSent: false,
    status: true,
    dnaStatus: 'UNDEFINED',
    updatedAt: new Date(),
    createdAt: new Date(),
    producer: null,
    dna: null,
    files: []
  },
  {
    id: '2',
    fullName: 'Maria Santos',
    phone: '11988776655',
    email: 'maria.santos@email.com',
    age: 28,
    inviteSent: false,
    status: true,
    dnaStatus: 'UNDEFINED',
    updatedAt: new Date(),
    createdAt: new Date(),
    producer: null,
    dna: null,
    files: []
  },
  {
    id: '3',
    fullName: 'João Oliveira',
    phone: '11977665544',
    email: 'joao.oliveira@email.com',
    age: 30,
    inviteSent: false,
    status: true,
    dnaStatus: 'UNDEFINED',
    updatedAt: new Date(),
    createdAt: new Date(),
    producer: null,
    dna: null,
    files: []
  },
  {
    id: '4',
    fullName: 'Beatriz Costa',
    phone: '11966554433',
    email: 'beatriz.costa@email.com',
    age: 26,
    inviteSent: false,
    status: true,
    dnaStatus: 'UNDEFINED',
    updatedAt: new Date(),
    createdAt: new Date(),
    producer: null,
    dna: null,
    files: []
  },
  {
    id: '5',
    fullName: 'Pedro Lima',
    phone: '11955443322',
    email: 'pedro.lima@email.com',
    age: 32,
    inviteSent: false,
    status: true,
    dnaStatus: 'UNDEFINED',
    updatedAt: new Date(),
    createdAt: new Date(),
    producer: null,
    dna: null,
    files: []
  },
  {
    id: '6',
    fullName: 'Camila Rodrigues',
    phone: '11944332211',
    email: 'camila.rodrigues@email.com',
    age: 29,
    inviteSent: false,
    status: true,
    dnaStatus: 'UNDEFINED',
    updatedAt: new Date(),
    createdAt: new Date(),
    producer: null,
    dna: null,
    files: []
  }
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
          Sistema inteligente de atendimento PREGIATO MANAGEMENT com controle de operadores
        </p>
      </div>

      {/* Dashboard de Operadores */}
      <OperatorsDashboard />

      {/* Dashboard de Atendimentos Ativos */}
      <ActiveAttendancesPanel />

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
                        onClick={() => handleTalentSelect(talent.id, talent.fullName, talent.phone || '')}
                        className={`w-full text-left p-3 border rounded-lg transition-colors hover:bg-gray-50 ${
                          selectedTalent === talent.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{talent.fullName}</p>
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
                  <p className="text-lg font-medium mb-2">Selecione um contato ou atenda da fila</p>
                  <p className="text-sm">Escolha um modelo da lista ou clique em "Atender" na fila de espera</p>
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
