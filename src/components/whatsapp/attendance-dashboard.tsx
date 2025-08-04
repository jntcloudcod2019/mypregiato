
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, MessageSquare, PlayCircle, StopCircle, Phone, User } from "lucide-react"
import { useAttendanceQueue } from "@/hooks/useAttendanceQueue"
import { useActiveAttendance } from "@/hooks/useActiveAttendance"
import { useOperatorStatus } from "@/hooks/useOperatorStatus"

interface AttendanceDashboardProps {
  onStartAttendance?: (talentId: string, talentName: string, talentPhone: string) => void
}

export const AttendanceDashboard = ({ onStartAttendance }: AttendanceDashboardProps) => {
  const { queue, totalInQueue, averageWaitTime, attendingCount, takeFromQueue } = useAttendanceQueue()
  const { activeAttendances, endAttendance } = useActiveAttendance()
  const { currentOperator } = useOperatorStatus()

  const getPriorityColor = (priority: 'normal' | 'high' | 'urgent') => {
    switch (priority) {
      case 'urgent': return 'bg-destructive'
      case 'high': return 'bg-orange-500'
      default: return 'bg-primary'
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

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Central de Atendimento
        </CardTitle>
        
        {/* Métricas Resumidas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-foreground">{totalInQueue}</div>
            <div className="text-xs text-muted-foreground">Na Fila</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-foreground">{attendingCount}</div>
            <div className="text-xs text-muted-foreground">Atendendo</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-foreground">{averageWaitTime}</div>
            <div className="text-xs text-muted-foreground">Min Médio</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="queue" className="text-xs">
              Fila ({totalInQueue})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs">
              Meus Atendimentos ({myAttendances.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="queue" className="mt-4">
            {totalInQueue > 0 ? (
              <ScrollArea className="h-60">
                <div className="space-y-2">
                  {queue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Badge className={`${getPriorityColor(item.priority)} text-xs px-2`}>
                          {getPriorityText(item.priority)}
                        </Badge>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.talentName}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{item.talentPhone}</span>
                            <Clock className="h-3 w-3 ml-2" />
                            <span>{formatTime(item.waitingTime)}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleStartAttendance(item.id, item.talentName, item.talentPhone)}
                        size="sm"
                        className="ml-2"
                      >
                        <PlayCircle className="h-3 w-3 mr-1" />
                        Iniciar
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Fila vazia</p>
                <p className="text-xs">Nenhum cliente aguardando atendimento</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="mt-4">
            {myAttendances.length > 0 ? (
              <ScrollArea className="h-60">
                <div className="space-y-2">
                  {myAttendances.map((attendance) => (
                    <div
                      key={attendance.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-primary/5 border-primary/20"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-primary">
                          <User className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{attendance.talentName}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{attendance.talentPhone}</span>
                            <Clock className="h-3 w-3 ml-2" />
                            <span>{formatTime(attendance.duration)}</span>
                            <MessageSquare className="h-3 w-3 ml-1" />
                            <span>{attendance.messageCount}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleEndAttendance(attendance.id)}
                        size="sm"
                        variant="outline"
                        className="ml-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                      >
                        <StopCircle className="h-3 w-3 mr-1" />
                        Finalizar
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum atendimento ativo</p>
                <p className="text-xs">Seus atendimentos aparecerão aqui</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
