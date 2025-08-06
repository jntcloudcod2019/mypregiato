import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Phone, 
  Clock, 
  Users, 
  User,
  AlertCircle
} from 'lucide-react';
import { useAttendanceCenter } from '@/hooks/useAttendanceCenter';
import { QueueList } from './queue-list';
import { ActiveChatsList } from './active-chats-list';

export const CentralDeAtendimento: React.FC = () => {
  const {
    queue,
    activeChats,
    metrics,
    selectedTab,
    setSelectedTab,
    attendRequest
  } = useAttendanceCenter();

  const currentOperatorId = 'current-operator'; // TODO: Pegar do contexto de autenticação

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Central de Atendimento</h1>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Na Fila */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Na Fila</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{metrics.queueCount}</div>
            <p className="text-xs text-blue-600">Aguardando atendimento</p>
          </CardContent>
        </Card>

        {/* Atendendo */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Atendendo</CardTitle>
            <Phone className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{metrics.attendingCount}</div>
            <p className="text-xs text-green-600">Em atendimento</p>
          </CardContent>
        </Card>

        {/* Tempo Médio */}
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Agora</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">{metrics.averageResponseTime}</div>
            <p className="text-xs text-red-600">Tempo Médio (min)</p>
          </CardContent>
        </Card>
      </div>

      {/* Navegação */}
      <div className="flex gap-2">
        <Button
          variant={selectedTab === 'queue' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('queue')}
          className="flex-1"
        >
          <Users className="h-4 w-4 mr-2" />
          Fila
        </Button>
        <Button
          variant={selectedTab === 'active' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('active')}
          className="flex-1"
        >
          <Phone className="h-4 w-4 mr-2" />
          Ativos
        </Button>
      </div>

      {/* Conteúdo */}
      <div className="min-h-[400px]">
        {selectedTab === 'queue' ? (
          <QueueList 
            queue={queue} 
            onAttendRequest={attendRequest}
            currentOperatorId={currentOperatorId}
          />
        ) : (
          <ActiveChatsList 
            activeChats={activeChats}
            currentOperatorId={currentOperatorId}
          />
        )}
      </div>
    </div>
  );
}; 