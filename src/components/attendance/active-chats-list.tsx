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
  X,
  MessageCircle
} from 'lucide-react';
import { ActiveChat } from '@/types/attendance';

interface ActiveChatsListProps {
  activeChats: Map<string, ActiveChat[]>;
  currentOperatorId: string;
}

export const ActiveChatsList: React.FC<ActiveChatsListProps> = ({ 
  activeChats, 
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

  const getCurrentOperatorChats = () => {
    return activeChats.get(currentOperatorId) || [];
  };

  const currentChats = getCurrentOperatorChats();

  if (currentChats.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum chat ativo</h3>
          <p className="text-gray-500">Você não está atendendo nenhum cliente no momento</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {currentChats.map((chat) => (
        <Card key={chat.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              {/* Informações do cliente */}
              <div className="flex items-start gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-green-100 text-green-600">
                    {getCustomerInitials(chat.phone)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {chat.customerName || `Cliente ${formatPhone(chat.phone)}`}
                    </h4>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      Ativo
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {chat.messageCount} msg
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {formatPhone(chat.phone)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Desde {formatTime(chat.startTime)}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Última atividade: {formatTime(chat.lastActivity)}
                  </p>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col items-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Abrir Chat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Encerrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 