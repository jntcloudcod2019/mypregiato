
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
  onStartAttendance?: (talentId: string, talentName: string, talentPhone: string) => void
}

export const AttendanceDashboard = ({ onStartAttendance }: AttendanceDashboardProps) => {
  const { queue, totalInQueue, averageWaitTime, attendingCount, takeFromQueue } = useAttendanceQueue()
  const { activeAttendances, endAttendance } = useActiveAttendance()
  const { currentOperator } = useOperatorStatus()

  const getPriorityColor = (priority: 'normal' | 'high' | 'urgent') => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 hover:bg-red-600'
      case 'high': return 'bg-orange-500 hover:bg-orange-600'
      default: return 'bg-blue-500 hover:bg-blue-600'
    }
  }

  const getPriorityText = (priority: 'normal' | 'high' | 'urgent') => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Alta'
      default: return 'Normal'
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
  }

  const handleStartAttendance = (talentId: string, talentName: string, talentPhone: string) => {
    const success = takeFromQueue(talentId, talentName, talentPhone)
    if (success && onStartAttendance) {
      onStartAttendance(talentId, talentName, talentPhone)
    }
  }

  const handleEndAttendance = (attendanceId: string) => {
    endAttendance(attendanceId)
  }

  const myAttendances = activeAttendances.filter(att => att.operatorId === currentOperator?.id)

  // Criar items para a lista animada da fila
  const queueItems = queue.map((item) => ({
    id: item.id,
    content: (
      <div className="group relative overflow-hidden bg-gradient-to-r from-card via-card to-muted/10 border border-border rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className={cn(
                "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
                getPriorityColor(item.priority)
              )}>
                <AlertCircle className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground truncate">{item.talentName}</h4>
                <Badge 
                  className={cn("text-xs px-2 py-0.5", getPriorityColor(item.priority))}
                  variant="secondary"
                >
                  {getPriorityText(item.priority)}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{item.talentPhone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(item.waitingTime)}</span>
                </div>
              </div>
              {item.lastMessage && (
                <p className="text-xs text-muted-foreground mt-1 truncate bg-muted/50 px-2 py-1 rounded">
                  "{item.lastMessage}"
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={() => handleStartAttendance(item.id, item.talentName, item.talentPhone)}
            size="sm"
            className="ml-4 bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <PlayCircle className="h-4 w-4 mr-1" />
            Iniciar
          </Button>
        </div>
      </div>
    )
  }))

  // Criar items para a lista animada de atendimentos ativos
  const activeItems = myAttendances.map((attendance) => ({
    id: attendance.id,
    content: (
      <div className="relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground mb-1 truncate">{attendance.talentName}</h4>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{attendance.talentPhone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(attendance.duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{attendance.messageCount} msgs</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleEndAttendance(attendance.id)}
            size="sm"
            variant="outline"
            className="ml-4 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
          >
            <StopCircle className="h-4 w-4 mr-1" />
            Finalizar
          </Button>
        </div>
      </div>
    )
  }))

  return (
    <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          Central de Atendimento
        </CardTitle>
        
        {/* Métricas em coluna vertical - mais compactas */}
        <div className="flex flex-col gap-2 mt-3">
          {/* Azul - Na Fila */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-blue-600">{totalInQueue}</div>
                <div className="text-xs text-blue-600/80 font-medium">Na Fila</div>
              </div>
              <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Verde - Atendendo */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-green-600">{attendingCount}</div>
                <div className="text-xs text-green-600/80 font-medium">Atendendo</div>
              </div>
              <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                <Phone className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </div>

          {/* Vermelha - Tempo Médio */}
          <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-red-600">{averageWaitTime}</div>
                <div className="text-xs text-red-600/80 font-medium">Min Médio</div>
              </div>
              <div className="w-8 h-8 bg-red-500/10 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="queue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <div className="flex items-center gap-2">
                Fila
                {totalInQueue > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 animate-pulse">
                    {totalInQueue}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <div className="flex items-center gap-2">
                Ativos
                {myAttendances.length > 0 && (
                  <Badge className="bg-green-500 text-white text-xs px-1.5 py-0.5">
                    {myAttendances.length}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="queue" className="mt-4">
            {totalInQueue > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                <AnimatedList items={queueItems} delay={150} />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-8 w-8 opacity-50" />
                </div>
                <p className="text-sm font-medium mb-1">Fila vazia</p>
                <p className="text-xs">Nenhum cliente aguardando</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="mt-4">
            {myAttendances.length > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                <AnimatedList items={activeItems} delay={150} />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-8 w-8 opacity-50" />
                </div>
                <p className="text-sm font-medium mb-1">Nenhum atendimento ativo</p>
                <p className="text-xs">Seus atendimentos aparecerão aqui</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
