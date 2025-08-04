
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronDown, User, Zap, Coffee, Clock } from "lucide-react"
import { useUser } from "@clerk/clerk-react"
import { useOperatorStatus } from "@/hooks/useOperatorStatus"
import { cn } from "@/lib/utils"

export const OperatorStatusControl = () => {
  const { user } = useUser()
  const { currentOperator, updateOperatorStatus } = useOperatorStatus()
  const [isOpen, setIsOpen] = useState(false)

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
    setIsOpen(false)
  }

  if (!user || !currentOperator) return null

  return (
    <Card className="bg-gradient-to-r from-card to-card/80 border-border/50 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4" />
          Meu Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto p-3 border-border/50 hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.imageUrl} />
                    <AvatarFallback className="text-xs bg-muted text-primary">
                      {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'OP'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                    currentStatus?.color || 'bg-gray-500'
                  )} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">
                    {user.fullName || user.firstName || 'Operador'}
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-3 w-3" />
                    <span className="text-xs text-muted-foreground">
                      {currentStatus?.label || 'Indefinido'}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
      </CardContent>
    </Card>
  )
}
