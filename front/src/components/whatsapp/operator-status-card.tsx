import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Circle } from 'lucide-react';
import { useOperatorStatus } from '@/hooks/useOperatorStatus';
import { useUserRole } from '@/services/user-role-service';

export const OperatorStatusCard = () => {
  const { currentOperator, updateOperatorStatus } = useOperatorStatus();
  const { isAdmin, loading: roleLoading } = useUserRole();

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Online';
      case 'busy': return 'Ocupado';
      case 'away': return 'Ausente';
      default: return 'Offline';
    }
  };

  const getDot = (status: string) => {
    const color = status === 'available' ? 'text-green-600' : status === 'busy' ? 'text-red-600' : status === 'away' ? 'text-orange-500' : 'text-gray-600';
    return <Circle className={`h-3 w-3 ${color}`} />;
  };

  const renderSegmented = () => {
    const options: Array<{ key: 'available' | 'busy' | 'away'; label: string; activeClass: string; baseClass: string }> = [
      { key: 'available', label: 'Online', activeClass: 'bg-green-500 text-white shadow', baseClass: 'text-green-700 hover:bg-green-100' },
      { key: 'busy', label: 'Ocupado', activeClass: 'bg-red-500 text-white shadow', baseClass: 'text-red-700 hover:bg-red-100' },
      { key: 'away', label: 'Ausente', activeClass: 'bg-orange-500 text-white shadow', baseClass: 'text-orange-700 hover:bg-orange-100' }
    ];
    const current = (currentOperator?.status as 'available' | 'busy' | 'away') || 'away';

    return (
      <div className="inline-flex items-center p-1 rounded-full bg-muted/60 backdrop-blur supports-[backdrop-filter]:bg-muted/40">
        {options.map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => updateOperatorStatus(opt.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${current === opt.key ? opt.activeClass : opt.baseClass}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  };

  if (roleLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Status do Operador</CardTitle>
      </CardHeader>
      <CardContent>
        {currentOperator ? (
          <div className="space-y-4">
            {/* Grid: avatar + info lado a lado, controle abaixo ocupando 2 colunas */}
            <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 items-center">
              <Avatar className="h-10 w-10 row-start-1 col-start-1">
                <AvatarImage src={currentOperator.avatar} />
                <AvatarFallback>
                  {currentOperator.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 row-start-1 col-start-2">
                <p className="text-sm font-medium truncate">{currentOperator.name}</p>
                <p className="text-xs text-muted-foreground truncate">{currentOperator.email}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  {getDot(currentOperator.status)}
                  <span className="whitespace-nowrap">{getStatusText(currentOperator.status)}</span>
                </div>
              </div>

              <div className="row-start-2 col-span-2">
                {renderSegmented()}
              </div>
            </div>

            {isAdmin && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
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
            <p className="text-sm">Operador não identificado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 