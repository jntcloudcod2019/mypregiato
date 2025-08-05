
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, MessageSquare, PlayCircle, StopCircle, Phone, User, AlertCircle } from "lucide-react"
import { useAttendanceQueue } from "@/hooks/useAttendanceQueue"
import { useActiveAttendance } from "@/hooks/useActiveAttendance"
import { useOperatorStatus } from "@/hooks/useOperatorStatus"
import { AnimatedList } from "@/components/ui/animated-list"
import { cn } from "@/lib/utils"

interface AttendanceDashboardProps {
  onStartAttendance?: (conversationId: string, operatorId: string) => void
}

export const AttendanceDashboard = ({ onStartAttendance }: AttendanceDashboardProps) => {
  const { metrics, loading: queueLoading, error: queueError } = useAttendanceQueue()
  const { conversations, loading: conversationsLoading, error: conversationsError, endAttendance } = useActiveAttendance()
  const { currentOperator } = useOperatorStatus()

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-500 hover:bg-red-600'
      case 'high': return 'bg-orange-500 hover:bg-orange-600'
      default: return 'bg-blue-500 hover:bg-blue-600'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Alta'
      default: return 'Normal'
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Agora'
    
    // Converter TimeSpan para minutos
    const timeSpan = timeString.split(':')
    if (timeSpan.length === 3) {
      const hours = parseInt(timeSpan[0])
      const minutes = parseInt(timeSpan[1])
      const totalMinutes = hours * 60 + minutes
      
      if (totalMinutes < 1) return 'Agora'
      if (totalMinutes < 60) return `${totalMinutes}min`
      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
    }
    
    return 'Agora'
  }

  const handleStartAttendance = (conversationId: string) => {
    if (currentOperator?.id && onStartAttendance) {
      onStartAttendance(conversationId, currentOperator.id)
    }
  }

  const handleEndAttendance = (conversationId: string) => {
    endAttendance(conversationId)
  }

  const myConversations = conversations.filter(conv => conv.operatorId === currentOperator?.id)

  // Criar items para a lista animada da fila
  const queueItems = (metrics.queueItems || []).map((item, index) => ({
    id: `queue-${item.conversationId}-${index}`,
    content: (
      <div className="group relative overflow-hidden bg-gradient-to-r from-card via-card to-muted/10 border border-border rounded-lg p-2 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className={cn(
                "absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center",
                getPriorityColor(item.priority)
              )}>
                <AlertCircle className="w-2 h-2 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <h4 className="font-medium text-sm text-foreground truncate">{item.contactName}</h4>
                <Badge 
                  className={cn("text-xs px-1 py-0", getPriorityColor(item.priority))}
                  variant="secondary"
                >
                  {getPriorityText(item.priority)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-0.5">
                  <Phone className="h-2.5 w-2.5" />
                  <span className="truncate">{item.contactPhone}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  <span>{formatTime(item.waitTime)}</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleStartAttendance(item.conversationId)}
            size="sm"
            className="ml-2 h-6 px-2 bg-green-500 hover:bg-green-600 text-white text-xs"
          >
            <PlayCircle className="h-3 w-3 mr-1" />
            Iniciar
          </Button>
        </div>
      </div>
    )
  }))

  // Criar items para a lista animada de conversas ativas
  const activeItems = myConversations.map((conversation, index) => ({
    id: `active-${conversation.id}-${index}`,
    content: (
      <div className="relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-foreground mb-0.5 truncate">{conversation.contactName}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-0.5">
                  <Phone className="h-2.5 w-2.5" />
                  <span className="truncate">{conversation.contactPhone}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  <span>{conversation.lastMessageAt ? formatTime(new Date(conversation.lastMessageAt).toISOString()) : 'Agora'}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <MessageSquare className="h-2.5 w-2.5" />
                  <span>{conversation.unreadCount} msgs</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleEndAttendance(conversation.id)}
            size="sm"
            className="ml-2 h-6 px-2 bg-red-500 hover:bg-red-600 text-white text-xs"
          >
            <StopCircle className="h-3 w-3 mr-1" />
            Encerrar
          </Button>
        </div>
      </div>
    )
  }))

  return (
    <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-xl max-w-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1 bg-gradient-to-br from-primary/20 to-primary/10 rounded-md">
            <MessageSquare className="h-3 w-3 text-primary" />
          </div>
          Central de Atendimento
        </CardTitle>
        
        {/* Métricas em coluna vertical - mais compactas */}
        <div className="flex flex-col gap-1 mt-2">
          {/* Azul - Na Fila */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-md p-2 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-blue-600">{metrics.totalQueued}</div>
                <div className="text-xs text-blue-600/80 font-medium">Na Fila</div>
              </div>
              <div className="w-6 h-6 bg-blue-500/10 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Verde - Atendendo */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-md p-2 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-green-600">{metrics.totalAssigned}</div>
                <div className="text-xs text-green-600/80 font-medium">Atendendo</div>
              </div>
              <div className="w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center">
                <Phone className="w-3 h-3 text-green-500" />
              </div>
            </div>
          </div>

          {/* Vermelha - Tempo Médio */}
          <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-md p-2 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-red-600">{formatTime(metrics.averageWaitTime)}</div>
                <div className="text-xs text-red-600/80 font-medium">Tempo Médio</div>
              </div>
              <div className="w-6 h-6 bg-red-500/10 rounded-full flex items-center justify-center">
                <Clock className="w-3 h-3 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 h-8">
            <TabsTrigger value="queue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
              <div className="flex items-center gap-1">
                Fila
                {metrics.totalQueued > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-1 py-0 animate-pulse">
                    {metrics.totalQueued}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
              <div className="flex items-center gap-1">
                Ativos
                {myConversations.length > 0 && (
                  <Badge className="bg-green-500 text-white text-xs px-1 py-0">
                    {myConversations.length}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="queue" className="mt-2">
            {metrics.totalQueued > 0 ? (
              <div className="max-h-40 overflow-y-auto">
                <AnimatedList items={queueItems} delay={150} />
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MessageSquare className="h-6 w-6 opacity-50" />
                </div>
                <p className="text-xs font-medium mb-1">Fila vazia</p>
                <p className="text-xs">Nenhum cliente aguardando</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="mt-2">
            {myConversations.length > 0 ? (
              <div className="max-h-40 overflow-y-auto">
                <AnimatedList items={activeItems} delay={150} />
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="h-6 w-6 opacity-50" />
                </div>
                <p className="text-xs font-medium mb-1">Nenhum atendimento ativo</p>
                <p className="text-xs">Seus atendimentos aparecerão aqui</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
