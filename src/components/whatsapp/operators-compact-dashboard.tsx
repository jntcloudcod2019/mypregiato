
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Dot } from "lucide-react"
import { useOperatorStatus } from "@/hooks/useOperatorStatus"

export const OperatorsCompactDashboard = () => {
  const { operators, currentOperator } = useOperatorStatus()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      case 'away': return 'bg-red-500'
      default: return 'bg-muted-foreground'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Livre'
      case 'busy': return 'Ocupado'
      case 'away': return 'Ausente'
      default: return 'Offline'
    }
  }

  const formatLastActivity = (lastActivity: string) => {
    const diff = Date.now() - new Date(lastActivity).getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Agora'
    if (minutes < 5) return `${minutes}min`
    return 'Offline'
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Users className="h-4 w-4" />
          Operadores Online ({operators.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {operators.map((operator) => (
            <div
              key={operator.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                operator.id === currentOperator?.id 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={operator.avatar} />
                  <AvatarFallback className="text-xs bg-muted-foreground text-primary-foreground">
                    {operator.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Dot 
                  className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(operator.status)}`}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-card-foreground truncate">
                    {operator.name}
                  </p>
                  {operator.id === currentOperator?.id && (
                    <Badge variant="outline" className="text-xs px-1">
                      Você
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {getStatusText(operator.status)}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    • {formatLastActivity(operator.lastActivity)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold text-card-foreground">
                  {operator.activeAttendances}
                </div>
                <div className="text-xs text-muted-foreground">ativos</div>
              </div>
            </div>
          ))}
        </div>

        {operators.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum operador online</p>
            <p className="text-xs">Faça login para aparecer na lista</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
