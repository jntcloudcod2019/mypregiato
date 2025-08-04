
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Clock, MessageSquare, Activity } from "lucide-react"
import { useOperatorStatus } from "@/hooks/useOperatorStatus"

export const OperatorsDashboard = () => {
  const { operators, currentOperator } = useOperatorStatus()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      case 'away': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível'
      case 'busy': return 'Ocupado'
      case 'away': return 'Ausente'
      default: return 'Desconhecido'
    }
  }

  const formatLastActivity = (lastActivity: string) => {
    const diff = Date.now() - new Date(lastActivity).getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}min atrás`
    
    const hours = Math.floor(minutes / 60)
    return `${hours}h atrás`
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Operadores Online ({operators.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {operators.map((operator) => (
            <div
              key={operator.id}
              className={`p-4 border rounded-lg transition-all ${
                operator.id === currentOperator?.id 
                  ? 'border-blue-500 bg-blue-50/50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={operator.avatar} />
                    <AvatarFallback>
                      {operator.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(operator.status)}`}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{operator.name}</p>
                  <p className="text-sm text-gray-500">{operator.email}</p>
                </div>
                {operator.id === currentOperator?.id && (
                  <Badge variant="outline" className="text-xs">
                    Você
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`text-white ${getStatusColor(operator.status)}`}
                  >
                    {getStatusText(operator.status)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatLastActivity(operator.lastActivity)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-sm font-semibold text-gray-900">
                      {operator.activeAttendances}
                    </div>
                    <div className="text-xs text-gray-600">Ativos</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-sm font-semibold text-gray-900">
                      {operator.totalAttendancesToday}
                    </div>
                    <div className="text-xs text-gray-600">Hoje</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-sm font-semibold text-gray-900">
                      {operator.averageResponseTime}s
                    </div>
                    <div className="text-xs text-gray-600">Resp.</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {operators.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Nenhum operador online no momento</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
