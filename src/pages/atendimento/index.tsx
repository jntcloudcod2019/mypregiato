
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Phone, QrCode, Wifi, WifiOff, User } from "lucide-react"
import { useUser } from "@clerk/clerk-react"
import { useWhatsAppConnection } from "@/hooks/useWhatsAppConnection"
import { whatsAppService } from "@/services/whatsapp-service"
import { TalentChat as TalentChatComponent } from "@/components/whatsapp/talent-chat"
import { QRCodeModal } from "@/components/whatsapp/qr-code-modal"
import { AttendanceDashboard } from "@/components/whatsapp/attendance-dashboard"
import { OperatorsCompactDashboard } from "@/components/whatsapp/operators-compact-dashboard"
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
  const { user } = useUser()
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

  const handleStartAttendance = (talentId: string, talentName: string, talentPhone: string) => {
    // Inicializar conversa e abrir chat automaticamente
    whatsAppService.initializeConversation(talentId, talentName, talentPhone)
    setSelectedTalent(talentId)
    
    // Scroll para o chat
    setTimeout(() => {
      const chatElement = document.getElementById('talent-chat')
      if (chatElement) {
        chatElement.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const selectedTalentData = selectedTalent ? mockTalents.find(t => t.id === selectedTalent) : null

  return (
    <div className="p-6 max-w-7xl mx-auto bg-background min-h-screen">
      {/* Header com nome do usuário */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Central de Atendimento WhatsApp
          </h1>
          <p className="text-muted-foreground">
            Sistema inteligente de atendimento PREGIATO MANAGEMENT com controle de operadores
          </p>
        </div>
        
        {/* Exibição do usuário logado */}
        <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.fullName || 'Usuário'} 
                className="w-8 h-8 rounded-full border border-border"
              />
            ) : (
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {user?.fullName || user?.firstName || 'Operador'}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.emailAddresses?.[0]?.emailAddress || 'online'}
              </p>
            </div>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Online" />
        </div>
      </div>

      {/* Layout em Grid Responsivo */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        {/* Dashboard de Operadores - Compacto */}
        <div className="xl:col-span-1">
          <OperatorsCompactDashboard />
        </div>
        
        {/* Dashboard de Atendimento Unificado */}
        <div className="xl:col-span-3">
          <AttendanceDashboard onStartAttendance={handleStartAttendance} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Controle do WhatsApp */}
        <Card className="lg:col-span-1 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Phone className="h-5 w-5" />
              Controle WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status de Conexão */}
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                {connection.isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-destructive" />
                )}
                <span className="text-sm font-medium text-card-foreground">
                  {connection.isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <Badge
                variant={connection.isConnected ? 'default' : 'destructive'}
                className={connection.isConnected ? 'bg-green-500 text-green-50' : ''}
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
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
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
              <h3 className="font-semibold mb-3 text-card-foreground">Contatos dos Modelos</h3>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {mockTalents.map((talent) => {
                    const conversation = whatsAppService.getConversation(talent.id)
                    const hasUnread = conversation && conversation.unreadCount > 0

                    return (
                      <button
                        key={talent.id}
                        onClick={() => handleTalentSelect(talent.id, talent.fullName, talent.phone || '')}
                        className={`w-full text-left p-3 border border-border rounded-lg transition-colors hover:bg-muted/50 ${
                          selectedTalent === talent.id 
                            ? 'border-primary bg-primary/10' 
                            : 'bg-card'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-card-foreground">{talent.fullName}</p>
                            <p className="text-sm text-muted-foreground">{talent.phone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasUnread && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
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
        <div className="lg:col-span-2" id="talent-chat">
          {selectedTalent && selectedTalentData ? (
            <TalentChatComponent 
              talent={selectedTalentData} 
              onClose={() => setSelectedTalent(null)} 
            />
          ) : (
            <Card className="h-[600px] bg-card border-border">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-2">Selecione um contato ou inicie da fila</p>
                  <p className="text-sm">Escolha um modelo da lista ou clique em "Iniciar Atendimento" na fila</p>
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
