import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Phone, 
  Clock, 
  User,
  Play
} from 'lucide-react';
import { ChatRequest } from '@/types/attendance';

interface QueueListProps {
  queue: ChatRequest[];
  onAttendRequest: (requestId: string, operatorId: string) => void;
  currentOperatorId: string;
}

export const QueueList: React.FC<QueueListProps> = ({ 
  queue, 
  onAttendRequest, 
  currentOperatorId 
}) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatPhone = (phone: string) => {
    // Formatar número brasileiro
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0,2)}) ${clean.slice(2,7)}-${clean.slice(7)}`;
    }
    return phone;
  };

  const getCustomerInitials = (phone: string) => {
    // Usar os últimos 2 dígitos do telefone como iniciais
    const lastDigits = phone.slice(-2);
    return lastDigits;
  };

  if (queue.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Fila vazia</h3>
          <p className="text-gray-500">Nenhum cliente aguardando</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {queue.map((request) => (
        <Card key={request.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              {/* Informações do cliente */}
              <div className="flex items-start gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {getCustomerInitials(request.phone)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {request.customerName || `Cliente ${formatPhone(request.phone)}`}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {request.messageCount} msg
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {request.lastMessage}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {formatPhone(request.phone)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(request.timestamp)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de atender */}
              <div className="flex flex-col items-end gap-2">
                <Button
                  size="sm"
                  onClick={() => onAttendRequest(request.id, currentOperatorId)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Atender
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 