import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Download, RefreshCw, User, Phone, MessageCircle } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { MessageType, MessageStatus } from '@/types/message';
import { MessageDirection } from '@/services/chat-service';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  direction: MessageDirection;
  type: MessageType;
  body: string;
  status: MessageStatus;
  ts: string;
  fromMe: boolean;
}

interface ChatHistoryResponse {
  messages: ChatMessage[];
  nextCursor?: number;
}

interface ChatListItem {
  id: string;
  title: string;
  contactPhoneE164: string;
  lastMessagePreview: string;
  unreadCount: number;
  lastMessageAt: string;
}

export default function HistoricoPage() {
  const { user } = useUser();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchChats = useCallback(async () => {
    if (!user?.emailAddresses?.[0]?.emailAddress) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats?search=${searchTerm}`);
      const data = await response.json() as ChatHistoryResponse;
      
      if (data.messages) {
        // Converter mensagens para formato de chat
        const chatMap = new Map<string, ChatListItem>();
        
        data.messages.forEach((msg) => {
          const chatId = msg.id.split('_')[0]; // Extrair ID do chat
          if (!chatMap.has(chatId)) {
            chatMap.set(chatId, {
              id: chatId,
              title: `Chat ${chatId.slice(0, 8)}`,
              contactPhoneE164: '',
              lastMessagePreview: msg.body,
              unreadCount: 0,
              lastMessageAt: msg.ts
            });
          }
        });
        
        setChats(Array.from(chatMap.values()));
      }
    } catch (err) {
      setError('Erro ao carregar histórico');
      console.error('Erro ao buscar chats:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.emailAddresses, searchTerm]);

  const fetchMessages = useCallback(async (chatId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`);
      const data = await response.json() as ChatHistoryResponse;
      
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      setError('Erro ao carregar mensagens');
      console.error('Erro ao buscar mensagens:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChatSelect = useCallback((chatId: string) => {
    setSelectedChat(chatId);
    fetchMessages(chatId);
  }, [fetchMessages]);

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.contactPhoneE164.includes(searchTerm)
  );

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const getMessageDirectionIcon = (direction: MessageDirection) => {
    // ✅ CORREÇÃO: Usar enum MessageDirection em vez de string
    if (direction === MessageDirection.Out) {
      return <MessageCircle className="h-4 w-4 text-blue-500" />;
    }
    return <MessageCircle className="h-4 w-4 text-green-500" />;
  };

  const getMessageDirectionText = (direction: MessageDirection) => {
    // ✅ CORREÇÃO: Usar enum MessageDirection em vez de string
    return direction === MessageDirection.Out ? 'Enviada' : 'Recebida';
  };

  const getMessageTypeIcon = (type: MessageType) => {
    switch (type) {
      case MessageType.Text:
        return <MessageCircle className="h-4 w-4" />;
      case MessageType.Image:
        return <div className="h-4 w-4 bg-blue-500 rounded" />;
      case MessageType.Audio:
        return <div className="h-4 w-4 bg-green-500 rounded" />;
      case MessageType.Video:
        return <div className="h-4 w-4 bg-purple-500 rounded" />;
      case MessageType.Document:
        return <div className="h-4 w-4 bg-orange-500 rounded" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando histórico...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <div className="text-center">
          <div className="text-lg font-semibold">Erro ao carregar histórico</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <Button onClick={fetchChats} className="mt-4">Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Histórico de Conversas</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchChats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Chats */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversas</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  className={`p-3 border rounded-lg mb-2 cursor-pointer hover:bg-muted transition-colors ${
                    selectedChat === chat.id ? 'bg-muted border-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{chat.title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {chat.lastMessagePreview}
                      </div>
                    </div>
                    {chat.unreadCount > 0 && (
                      <Badge variant="secondary">{chat.unreadCount}</Badge>
                    )}
                  </div>
                  </div>
                ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Mensagens do Chat Selecionado */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedChat ? `Mensagens - ${chats.find(c => c.id === selectedChat)?.title}` : 'Selecione uma conversa'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedChat ? (
              <ScrollArea className="h-96">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 mb-4 ${
                      message.direction === MessageDirection.Out ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg ${
                        message.direction === MessageDirection.Out
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getMessageTypeIcon(message.type)}
                        <span className="text-xs opacity-75">
                          {getMessageDirectionText(message.direction)}
                        </span>
                      </div>
                      <div className="text-sm">{message.body}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(message.ts).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Selecione uma conversa para ver as mensagens
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


