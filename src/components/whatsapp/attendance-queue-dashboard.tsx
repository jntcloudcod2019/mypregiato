
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Clock, Users, UserCheck, AlertCircle, MessageCircle, Play } from "lucide-react"
import { useAttendanceQueue } from "@/hooks/useAttendanceQueue"
import { useWhatsAppConnection } from "@/hooks/useWhatsAppConnection"
import { useOperatorStatus } from "@/hooks/useOperatorStatus"
import { useActiveAttendance } from "@/hooks/useActiveAttendance"

export const AttendanceQueueDashboard = () => {
  const { queue, totalInQueue, averageWaitTime, takeFromQueue } = useAttendanceQueue()
  const { connection } = useWhatsAppConnection()
  const { currentOperator } = useOperatorStatus()
  const { totalActive } = useActiveAttendance()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Alta'
      default: return 'Normal'
    }
  }

  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }

  const handleTakeFromQueue = (item: any) => {
    const success = takeFromQueue(item.id, item.talentName, item.talentPhone)
    if (success) {
      console.log(`Atendimento iniciado para ${item.talentName}`)
    }
  }

  if (!connection.isConnected) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Sistema Desconectado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-red-600">
              Conecte o WhatsApp para iniciar o atendimento
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Na Fila
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalInQueue}</div>
            <p className="text-xs text-blue-600">pessoas aguardando</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Em Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{totalActive}</div>
            <p className="text-xs text-green-600">sendo atendidos agora</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {averageWaitTime > 0 ? formatWaitTime(averageWaitTime) : '-'}
            </div>
            <p className="text-xs text-orange-600">de espera na fila</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Operador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-purple-900">
                {currentOperator?.name.split(' ')[0] || 'Desconhecido'}
              </span>
            </div>
            <p className="text-xs text-purple-600">online e ativo</p>
          </CardContent>
        </Card>
      </div>

      {/* Fila de atendimento */}
      {totalInQueue > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Fila de Espera ({totalInQueue} aguardando)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {queue.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.talentName}</p>
                        <p className="text-sm text-gray-500">{item.talentPhone}</p>
                        {item.lastMessage && (
                          <p className="text-xs text-gray-400 mt-1 max-w-48 truncate">
                            "{item.lastMessage}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-white ${getPriorityColor(item.priority)} mb-2`}
                        >
                          {getPriorityText(item.priority)}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-700">
                            {formatWaitTime(item.waitingTime)}
                          </p>
                          <p className="text-xs text-gray-500">esperando</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleTakeFromQueue(item)}
                        disabled={!currentOperator}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Atender
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {totalInQueue === 0 && connection.isConnected && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">Nenhuma pessoa na fila</p>
              <p className="text-sm text-green-600">Todos os atendimentos estão em dia!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
