import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Circle } from 'lucide-react';
import { useOperatorStatus } from '@/hooks/useOperatorStatus';
import { useUserRole } from '@/services/user-role-service';

export const OperatorStatusCard = () => {
  const { currentOperator, updateOperatorStatus } = useOperatorStatus();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [showStatusOptions, setShowStatusOptions] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'away': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'busy': return 'Ocupado';
      case 'away': return 'Ausente';
      default: return 'Offline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Circle className="h-3 w-3 text-green-600" />;
      case 'busy': return <Circle className="h-3 w-3 text-yellow-600" />;
      case 'away': return <Circle className="h-3 w-3 text-red-600" />;
      default: return <Circle className="h-3 w-3 text-gray-600" />;
    }
  };

  if (roleLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Status do Operador</CardTitle>
        <User className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {currentOperator ? (
          <div className="space-y-3">
            {/* Informações do Operador */}
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentOperator.avatar} />
                <AvatarFallback>
                  {currentOperator.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentOperator.name}</p>
                <p className="text-xs text-muted-foreground truncate">{currentOperator.email}</p>
              </div>
            </div>

            {/* Status Atual */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(currentOperator.status)}
                <span className="text-sm font-medium">{getStatusText(currentOperator.status)}</span>
              </div>
              <Badge className={getStatusColor(currentOperator.status)}>
                {currentOperator.activeAttendances} atendimentos
              </Badge>
            </div>

            {/* Opções de Status */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={currentOperator.status === 'available' ? 'default' : 'outline'}
                onClick={() => updateOperatorStatus('available')}
                className="flex-1 text-xs"
              >
                Disponível
              </Button>
              <Button
                size="sm"
                variant={currentOperator.status === 'busy' ? 'default' : 'outline'}
                onClick={() => updateOperatorStatus('busy')}
                className="flex-1 text-xs"
              >
                Ocupado
              </Button>
              <Button
                size="sm"
                variant={currentOperator.status === 'away' ? 'default' : 'outline'}
                onClick={() => updateOperatorStatus('away')}
                className="flex-1 text-xs"
              >
                Ausente
              </Button>
            </div>

            {/* Botão de Desconectar (apenas para admins) */}
            {isAdmin && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  // Implementar lógica de desconexão do bot
                  console.log('Desconectar bot (apenas admin)');
                }}
                className="w-full text-xs"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Desconectar Bot
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Operador não identificado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 