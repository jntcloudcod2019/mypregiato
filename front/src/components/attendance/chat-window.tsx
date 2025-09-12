import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Phone, 
  Clock, 
  X,
  User,
  MessageSquare
} from 'lucide-react';
import { ActiveChat, WhatsAppMessage } from '@/types/attendance';
import { MessageDirection } from '@/services/chat-service';

interface ChatWindowProps {
  chat: ActiveChat;
  onClose: () => void;
  onSendMessage: (message: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  chat, 
  onClose, 
  onSendMessage 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0,2)}) ${clean.slice(2,7)}-${clean.slice(7)}`;
    }
    return phone;
  };

  const getCustomerInitials = (phone: string) => {
    const lastDigits = phone.slice(-2);
    return lastDigits;
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-green-100 text-green-600">
              {getCustomerInitials(chat.phone)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-sm font-medium">
              {chat.customerName || `Cliente ${formatPhone(chat.phone)}`}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Phone className="h-3 w-3" />
              {formatPhone(chat.phone)}
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                Ativo
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      {/* Mensagens */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
        {chat.messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
            <p>Nenhuma mensagem ainda</p>
            <p className="text-xs">Inicie a conversa enviando uma mensagem</p>
          </div>
        ) : (
          chat.messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.direction === MessageDirection.Out ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 ${
                  message.direction === MessageDirection.Out
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.body}</p>
                <p className={`text-xs mt-1 ${
                  message.direction === MessageDirection.Out ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input de mensagem */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}; 