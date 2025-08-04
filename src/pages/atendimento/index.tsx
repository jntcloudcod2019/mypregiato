
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Phone, QrCode, Wifi, WifiOff, User } from "lucide-react"
import { useUser } from "@clerk/clerk-react"
import { useWhatsAppConnection } from "@/hooks/useWhatsAppConnection"
import { whatsAppService } from "@/services/whatsapp-service"
import { TalentChat as TalentChatComponent } from "@/components/whatsapp/talent-chat"
import { QRCodeModal } from "@/components/whatsapp/qr-code-modal"
import { AttendanceDashboard } from "@/components/whatsapp/attendance-dashboard"
import { OperatorsCompactDashboard } from "@/components/whatsapp/operators-compact-dashboard"
import { TalentData } from "@/types/talent"
import { cn } from "@/lib/utils"

// Mock data para demonstração
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
      // Simular conexão real para demo
      setTimeout(() => {
        ;(whatsAppService as any).simulateRealConnection?.()
      }, 8000)
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
    whatsAppService.initializeConversation(talentId, talentName, talentPhone)
    setSelectedTalent(talentId)
    
    setTimeout(() => {
      const chatElement = document.getElementById('talent-chat')
      if (chatElement) {
        chatElement.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const selectedTalentData = selectedTalent ? mockTalents.find(t => t.id === selectedTalent) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Central de Atendimento
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Sistema inteligente de atendimento PREGIATO MANAGEMENT em tempo real
            </p>
          </div>
          
          {/* User info */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-card via-card to-muted/30 border border-border/50 rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {user?.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt={user.fullName || 'Usuário'} 
                  className="w-10 h-10 rounded-full border-2 border-primary/20 shadow-md"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
                  <User className="w-5 h-5 text-primary" />
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {user?.fullName || user?.firstName || 'Operador'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user?.emailAddresses?.[0]?.emailAddress || 'online'}
                </p>
              </div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-500/50" title="Online" />
          </div>
        </div>

        {/* Layout reorganizado - Sidebar esquerda com operadores e controle WhatsApp */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Sidebar esquerda */}
          <div className="lg:col-span-1 space-y-6">
            {/* Operadores Online */}
            <OperatorsCompactDashboard />
            
            {/* Controle WhatsApp alinhado */}
            <Card className="bg-gradient-to-b from-card to-card/80 border-border/50 shadow-lg backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  Controle WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Connection em tempo real */}
                <div className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                  connection.isConnected 
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      connection.isConnected ? "bg-green-500/20" : "bg-red-500/20"
                    )}>
                      {connection.isConnected ? (
                        <Wifi className="h-5 w-5 text-green-600" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {connection.isConnected ? 'Conectado' : 'Desconectado'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {connection.status === 'connected' && 'Em tempo real'}
                        {connection.status === 'connecting' && 'Conectando...'}
                        {connection.status === 'qr_ready' && 'QR Code ativo'}
                        {connection.status === 'disconnected' && 'Offline'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "shadow-sm",
                      connection.isConnected 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    )}
                  >
                    {connection.isConnected ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  {!connection.isConnected && (
                    <Button
                      onClick={handleGenerateQR}
                      disabled={isGeneratingQR}
                      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {isGeneratingQR ? 'Gerando QR...' : 'Conectar WhatsApp'}
                    </Button>
                  )}

                  {connection.isConnected && (
                    <Button
                      onClick={disconnect}
                      variant="destructive"
                      className="w-full shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <WifiOff className="h-4 w-4 mr-2" />
                      Desconectar
                    </Button>
                  )}
                </div>

                <Separator className="bg-border/50" />

                {/* Lista de contatos */}
                <div>
                  <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Contatos dos Modelos
                  </h3>
                  <ScrollArea className="h-80">
                    <div className="space-y-2">
                      {mockTalents.map((talent) => {
                        const conversation = whatsAppService.getConversation(talent.id)
                        const hasUnread = conversation && conversation.unreadCount > 0

                        return (
                          <button
                            key={talent.id}
                            onClick={() => handleTalentSelect(talent.id, talent.fullName, talent.phone || '')}
                            className={cn(
                              "w-full text-left p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border",
                              selectedTalent === talent.id 
                                ? 'border-primary bg-gradient-to-r from-primary/10 to-primary/5 shadow-lg' 
                                : 'bg-gradient-to-r from-card to-muted/30 border-border/50 hover:border-primary/30'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${talent.fullName}`} />
                                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs">
                                    {talent.fullName.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground truncate">{talent.fullName}</p>
                                  <p className="text-sm text-muted-foreground">{talent.phone}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {hasUnread && (
                                  <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 animate-pulse">
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
          </div>

          {/* Dashboard de Atendimentos - ocupa 3 colunas */}
          <div className="lg:col-span-3">
            <AttendanceDashboard onStartAttendance={handleStartAttendance} />
          </div>
        </div>

        {/* Chat area */}
        <div className="mt-8" id="talent-chat">
          {selectedTalent && selectedTalentData ? (
            <TalentChatComponent 
              talent={selectedTalentData} 
              onClose={() => setSelectedTalent(null)} 
            />
          ) : (
            <Card className="h-[600px] bg-gradient-to-br from-card via-muted/30 to-card shadow-2xl border-0 backdrop-blur-sm">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground max-w-md">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <MessageSquare className="h-16 w-16 text-primary/50" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-foreground">Selecione um contato</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Escolha um modelo da lista ao lado ou clique em <strong>"Iniciar Atendimento"</strong> na fila para começar uma conversa
                  </p>
                  <div className="mt-6 flex justify-center gap-2">
                    <div className="w-2 h-2 bg-primary/30 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* QR Modal */}
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
    </div>
  )
}
