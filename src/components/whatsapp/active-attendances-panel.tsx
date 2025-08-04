
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Clock, User, PhoneCall } from "lucide-react"
import { useActiveAttendance } from "@/hooks/useActiveAttendance"
import { useOperatorStatus } from "@/hooks/useOperatorStatus"

export const ActiveAttendancesPanel = () => {
  const { activeAttendances, endAttendance } = useActiveAttendance()
  const { currentOperator } = useOperatorStatus()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'waiting_client': return 'bg-yellow-500'
      case 'responding': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'waiting_client': return 'Aguardando'
      case 'responding': return 'Respondendo'
      default: return 'Desconhecido'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }

  const handleEndAttendance = (attendanceId: string) => {
    endAttendance(attendanceId)
  }

  const myAttendances = activeAttendances.filter(att => att.operatorId === currentOperator?.id)
  const otherAttendances = activeAttendances.filter(att => att.operatorId !== currentOperator?.id)

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Atendimentos Ativos ({activeAttendances.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeAttendances.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Nenhum atendimento ativo no momento</p>
            <p className="text-sm mt-1">Os atendimentos em andamento aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Meus Atendimentos */}
            {myAttendances.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Meus Atendimentos ({myAttendances.length})
                </h3>
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {myAttendances.map((attendance) => (
                      <div
                        key={attendance.id}
                        className="p-4 border rounded-lg bg-blue-50/50 border-blue-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-500 text-white text-xs">
                                {attendance.talentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{attendance.talentName}</p>
                              <p className="text-sm text-gray-500">{attendance.talentPhone}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEndAttendance(attendance.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Finalizar
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Badge
                              variant="outline"
                              className={`text-white ${getStatusColor(attendance.status)}`}
                            >
                              {getStatusText(attendance.status)}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              {formatDuration(attendance.duration)}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MessageSquare className="h-3 w-3" />
                              {attendance.messageCount} msgs
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Outros Atendimentos */}
            {otherAttendances.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Outros Operadores ({otherAttendances.length})
                </h3>
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {otherAttendances.map((attendance) => (
                      <div
                        key={attendance.id}
                        className="p-4 border rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gray-500 text-white text-xs">
                                {attendance.talentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{attendance.talentName}</p>
                              <p className="text-sm text-gray-500">{attendance.talentPhone}</p>
                              <p className="text-xs text-blue-600">Operador: {attendance.operatorName}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Badge
                            variant="outline"
                            className={`text-white ${getStatusColor(attendance.status)}`}
                          >
                            {getStatusText(attendance.status)}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="h-3 w-3" />
                            {formatDuration(attendance.duration)}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MessageSquare className="h-3 w-3" />
                            {attendance.messageCount} msgs
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
