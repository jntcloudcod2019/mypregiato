
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, MessageSquare, AlertTriangle, Phone, PlayCircle } from "lucide-react"
import { useAttendanceQueue } from "@/hooks/useAttendanceQueue"

interface AttendanceQueueDashboardProps {
  onStartAttendance?: (talentId: string, talentName: string, talentPhone: string) => void
}

export const AttendanceQueueDashboard = ({ onStartAttendance }: AttendanceQueueDashboardProps) => {
  const { queue, totalInQueue, averageWaitTime, attendingCount, takeFromQueue } = useAttendanceQueue()

  const getPriorityColor = (priority: 'normal' | 'high' | 'urgent') => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-red-50'
      case 'high': return 'bg-orange-500 text-orange-50'
      default: return 'bg-blue-500 text-blue-50'
    }
  }

  const getPriorityText = (priority: 'normal' | 'high' | 'urgent') => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Alta'
      default: return 'Normal'
    }
  }

  const formatWaitTime = (minutes: number) => {
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

  return (
    <Card className="bg-card border-border mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <MessageSquare className="h-5 w-5" />
          Fila de Atendimento
        </CardTitle>
        
        {/* Métricas da Fila */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-card-foreground">{totalInQueue}</div>
            <div className="text-sm text-muted-foreground">Na Fila</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-card-foreground">{attendingCount}</div>
            <div className="text-sm text-muted-foreground">Atendendo</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-card-foreground">{averageWaitTime}</div>
            <div className="text-sm text-muted-foreground">Min Médio</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {totalInQueue > 0 ? (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <Badge className={getPriorityColor(item.priority)}>
                        {getPriorityText(item.priority)}
                      </Badge>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatWaitTime(item.waitingTime)}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-card-foreground">{item.talentName}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {item.talentPhone}
                      </div>
                      {item.lastMessage && (
                        <p className="text-sm text-muted-foreground mt-1 truncate max-w-xs">
                          "{item.lastMessage}"
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleStartAttendance(item.id, item.talentName, item.talentPhone)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="sm"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Iniciar Atendimento
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-2">Fila vazia</p>
            <p className="text-sm">Nenhum cliente aguardando atendimento no momento</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
