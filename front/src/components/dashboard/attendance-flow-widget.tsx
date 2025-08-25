
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { 
  Clock, 
  MessageSquare, 
  Users, 
  Phone, 
  User,
  Activity,
  ChevronRight,
  Eye
} from "lucide-react"
import { useAttendanceQueue } from "../../hooks/useAttendanceQueue"
import { useActiveAttendance } from "../../hooks/useActiveAttendance"
import { useOperatorStatus } from "../../hooks/useOperatorStatus"
import { AnimatedList } from "../ui/animated-list"
import { Link } from "react-router-dom"
import { cn } from "../../lib/utils"

export default function AttendanceFlowWidget() {
  const { queue, totalInQueue, averageWaitTime } = useAttendanceQueue()
  const { activeAttendances, totalActive } = useActiveAttendance()
  const { operators, getAvailableOperators, getBusyOperators } = useOperatorStatus()

  const availableOperators = getAvailableOperators()
  const busyOperators = getBusyOperators()

  // Criar lista de atividades recentes para animação
  const recentActivities = [
    ...activeAttendances.map(att => ({
      id: `active_${att.id}`,
      content: (
        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm font-medium text-green-800">{att.talentName}</p>
              <p className="text-xs text-green-600">Em atendimento com {att.operatorName}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-green-700 border-green-300">
            {att.duration}min
          </Badge>
        </div>
      )
    })),
    ...queue.slice(0, 3).map((item, index) => ({
      id: `queue_${item.id}`,
      content: (
        <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full",
              item.priority === 'urgent' ? 'bg-red-500 animate-pulse' :
              item.priority === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
            )}></div>
            <div>
              <p className="text-sm font-medium text-yellow-800">{item.talentName}</p>
              <p className="text-xs text-yellow-600">Aguardando há {item.waitingTime}min</p>
            </div>
          </div>
          <Badge variant="outline" className="text-yellow-700 border-yellow-300">
            {item.priority === 'urgent' ? 'Urgente' :
             item.priority === 'high' ? 'Alta' : 'Normal'}
          </Badge>
        </div>
      )
    }))
  ]

  return (
    <div className="space-y-6">
      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fila de Espera</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalInQueue}</div>
            <p className="text-xs text-muted-foreground">
              Tempo médio: {averageWaitTime}min
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos Ativos</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalActive}</div>
            <p className="text-xs text-muted-foreground">
              Em andamento agora
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operadores Online</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{operators.length}</div>
            <p className="text-xs text-muted-foreground">
              {availableOperators.length} disponíveis
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{averageWaitTime}min</div>
            <p className="text-xs text-muted-foreground">
              Resposta média
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fluxo em Tempo Real */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividades em Tempo Real */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Fluxo em Tempo Real
                </CardTitle>
                <CardDescription>
                  Atividades de atendimento acontecendo agora
                </CardDescription>
              </div>
              <Link to="/atendimento">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Tudo
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <AnimatedList 
                items={recentActivities}
                className="space-y-2 max-h-80 overflow-y-auto"
                delay={200}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma atividade no momento</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status dos Operadores */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Status dos Operadores
            </CardTitle>
            <CardDescription>
              Situação atual da equipe de atendimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {operators.length > 0 ? (
              <div className="space-y-3">
                {operators.map((operator) => (
                  <div 
                    key={operator.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{operator.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {operator.activeAttendances} atendimento{operator.activeAttendances !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        operator.status === 'available' ? 'default' :
                        operator.status === 'busy' ? 'secondary' : 'outline'
                      }
                      className={cn(
                        "text-xs",
                        operator.status === 'available' && "bg-green-100 text-green-800 border-green-300",
                        operator.status === 'busy' && "bg-yellow-100 text-yellow-800 border-yellow-300",
                        operator.status === 'away' && "bg-gray-100 text-gray-600 border-gray-300"
                      )}
                    >
                      {operator.status === 'available' && 'Disponível'}
                      {operator.status === 'busy' && 'Ocupado'}
                      {operator.status === 'away' && 'Ausente'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum operador online</p>
              </div>
            )}
            
            {/* Resumo dos Operadores */}
            <div className="pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Disponíveis:</span>
                <span className="font-medium text-green-600">{availableOperators.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ocupados:</span>
                <span className="font-medium text-yellow-600">{busyOperators.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ação Rápida */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Central de Atendimento</h3>
              <p className="text-sm text-muted-foreground">
                Acesse a central completa para gerenciar todos os atendimentos
              </p>
            </div>
            <Link to="/atendimento">
              <Button size="lg" className="gap-2">
                Acessar Central
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
