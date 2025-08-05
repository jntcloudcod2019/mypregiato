import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MessageSquare, Phone, QrCode, Wifi, WifiOff, User, ChevronDown, Zap, Coffee, Clock } from "lucide-react"
import { useUser } from "@clerk/clerk-react"
import { useWhatsAppConnection } from "@/hooks/useWhatsAppConnection"
import { TalentChat as TalentChatComponent } from "@/components/whatsapp/talent-chat"
import { QRCodeModal } from "@/components/whatsapp/qr-code-modal"
import { AttendanceDashboard } from "@/components/whatsapp/attendance-dashboard"
import { OperatorsCompactDashboard } from "@/components/whatsapp/operators-compact-dashboard"
import { useOperatorStatus } from "@/hooks/useOperatorStatus"
import { cn } from "@/lib/utils"
import { whatsAppApi } from '@/services/whatsapp-api'

export default function AtendimentoPage() {
  const { user } = useUser()
  const { status, qrCode, error, connect, disconnect, refresh } = useWhatsAppConnection()
  const { currentOperator, updateOperatorStatus } = useOperatorStatus()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])

  useEffect(() => {
    whatsAppApi.getContacts().then(res => setContacts(res.data)).catch(() => setContacts([]))
  }, [])

  const statusOptions = [
    {
      value: 'available' as const,
      label: 'Disponível',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      icon: Zap,
      description: 'Pronto para atender'
    },
    {
      value: 'busy' as const,
      label: 'Ocupado',
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      icon: Clock,
      description: 'Em atendimento'
    },
    {
      value: 'away' as const,
      label: 'Ausente',
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      icon: Coffee,
      description: 'Indisponível'
    }
  ]

  const currentStatus = statusOptions.find(opt => opt.value === currentOperator?.status)
  const StatusIcon = currentStatus?.icon || User

  const handleStatusChange = (status: 'available' | 'busy' | 'away') => {
    updateOperatorStatus(status)
    setIsStatusOpen(false)
  }

  const handleConnect = async () => {
    try {
      await connect()
      setShowQRModal(true)
    } catch (error) {
      console.error('Error connecting WhatsApp:', error)
    }
  }

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId)
  }

  const handleStartAttendance = (conversationId: string, operatorId: string) => {
    setSelectedConversation(conversationId)
    
    setTimeout(() => {
      const chatElement = document.getElementById('talent-chat')
      if (chatElement) {
        chatElement.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const selectedConversationData = selectedConversation ? contacts.find(c => c.id === selectedConversation) : null

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
          
          {/* User info com controle de status integrado */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-card via-card to-muted/30 border border-border/50 rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
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
                {currentOperator && (
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                    currentStatus?.color || 'bg-gray-500'
                  )} />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {user?.fullName || user?.firstName || 'Operador'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {user?.emailAddresses?.[0]?.emailAddress || 'online'}
                  </p>
                  {currentOperator && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <div className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">
                          {currentStatus?.label || 'Indefinido'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {currentOperator && (
              <Popover open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 px-3 border-border/50 hover:border-primary/30"
                  >
                    Alterar Status
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                  <div className="space-y-1">
                    {statusOptions.map((option) => {
                      const OptionIcon = option.icon
                      const isSelected = currentOperator.status === option.value
                      
                      return (
                        <Button
                          key={option.value}
                          variant="ghost"
                          onClick={() => handleStatusChange(option.value)}
                          className={cn(
                            "w-full justify-start gap-3 h-auto p-3 transition-all",
                            isSelected && "bg-primary/10 border border-primary/20"
                          )}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              option.color
                            )} />
                            <div className="text-left flex-1">
                              <div className="flex items-center gap-2">
                                <OptionIcon className="h-4 w-4" />
                                <span className="font-medium">{option.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <Badge variant="outline" className="text-xs">
                              Ativo
                            </Badge>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-500/50" title="Online" />
          </div>
        </div>

        {/* Layout reorganizado - Sidebar esquerda com operadores e controle WhatsApp */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Sidebar esquerda */}
          <div className="lg:col-span-1 space-y-4">
            {/* Operadores Online */}
            <OperatorsCompactDashboard />
            
            {/* Controle WhatsApp */}
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
                  status === 'connected'
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      status === 'connected' ? "bg-green-500/20" : "bg-red-500/20"
                    )}>
                      {status === 'connected' ? (
                        <Wifi className="h-5 w-5 text-green-600" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {status === 'connected' ? 'Conectado' : 'Desconectado'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {status === 'connected' && 'Em tempo real'}
                        {status === 'connecting' && 'Conectando...'}
                        {status === 'qr_ready' && 'QR Code ativo'}
                        {status === 'disconnected' && 'Offline'}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    className={cn(
                      "shadow-sm",
                      status === 'connected'
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    )}
                  >
                    {status === 'connected' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  {status !== 'connected' && (
                    <Button
                      onClick={handleConnect}
                      disabled={status === 'connecting'}
                      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {status === 'connecting' ? 'Gerando QR...' : 'Conectar WhatsApp'}
                    </Button>
                  )}

                  {status === 'connected' && (
                    <Button
                      onClick={disconnect}
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
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
                      {contacts.map((talent) => {
                        return (
                          <button
                            key={talent.id}
                            onClick={() => handleConversationSelect(talent.id)}
                            className={cn(
                              "w-full text-left p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border",
                              selectedConversation === talent.id 
                                ? 'border-primary bg-gradient-to-r from-primary/10 to-primary/5 shadow-lg' 
                                : 'bg-gradient-to-r from-card to-muted/30 border-border/50 hover:border-primary/30'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs">
                                    <User className="h-5 w-5" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground truncate">{talent.fullName}</p>
                                  <p className="text-sm text-muted-foreground">{talent.phone}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
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
          {selectedConversation && selectedConversationData ? (
            <TalentChatComponent 
              conversation={selectedConversationData} 
              onClose={() => setSelectedConversation(null)} 
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
          qrCode={qrCode || ''}
          status={status}
          onGenerateQR={handleConnect}
          onDisconnect={disconnect}
          isGeneratingQR={status === 'connecting'}
        />
      </div>
    </div>
  )
}
