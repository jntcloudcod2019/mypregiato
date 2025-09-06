import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Plus, 
  Download, 
  RefreshCw, 
  User, 
  Phone, 
  MessageCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { ChatListItem } from '@/components/chat/ChatListLayout';
import { useChatContext } from '@/contexts/ChatContext';
import { toast } from '@/hooks/use-toast';
import { useUserCache } from '@/hooks/useUserCache';

// ✅ INTERFACES LOCAIS
interface OperatorLead {
  nameLead: string;
  phoneLead: string;
}

interface LeadsResponse {
  success: boolean;
  data: OperatorLead[];
  count: number;
  message: string;
}

export const LeadsContainer: React.FC = () => {
  console.log('🔍 LeadsContainer renderizando...');
  
  const { user } = useUser();
  const { leads: cachedLeads, isLoading, error: cacheError, refreshCache } = useUserCache();
  console.log('👤 Usuário:', user);
  console.log('📦 Cache de leads:', { count: cachedLeads.length, isLoading, error: cacheError });
  
  // ✅ FALLBACK: Se o contexto falhar, usar funções vazias
  let addChat: (chat: ChatListItem) => void;
  let refreshChats: () => Promise<void>;
  let setSelectedChatId: (chatId: string | null) => void;
  
  try {
    const context = useChatContext();
    addChat = context.addChat;
    refreshChats = context.refreshChats;
    setSelectedChatId = context.setSelectedChatId;
    console.log('✅ ChatContext carregado com sucesso');
  } catch (error) {
    console.warn('⚠️ ChatContext não disponível, usando fallbacks:', error);
    addChat = () => console.log('addChat fallback');
    refreshChats = async () => console.log('refreshChats fallback');
    setSelectedChatId = () => console.log('setSelectedChatId fallback');
  }
  
  const [leads, setLeads] = useState<OperatorLead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [creatingChat, setCreatingChat] = useState<string | null>(null); // phoneLead sendo processado

  // ✅ USAR CACHE EM VEZ DE REQUISIÇÕES DIRETAS
  useEffect(() => {
    if (cachedLeads.length > 0) {
      setLeads(cachedLeads);
      console.log('📦 [LeadsContainer] Leads carregados do cache:', cachedLeads.length);
    }
  }, [cachedLeads]);

  // ✅ REMOVIDO: useEffect não é mais necessário, o cache é gerenciado pelo hook

  const filteredLeads = leads.filter(lead =>
    lead.nameLead.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phoneLead.includes(searchTerm)
  );

  // ✅ FUNÇÃO PARA VERIFICAR SE JÁ EXISTE CHAT COM O MESMO NÚMERO
  const checkExistingChat = async (phoneNumber: string): Promise<ChatListItem | null> => {
    try {
      // Buscar na lista de chats existentes por número de telefone
      const response = await fetch('http://localhost:5656/api/chats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Erro ao buscar chats existentes:', response.status);
        return null;
      }

      const data = await response.json();
      const chats = data.items || [];
      
      // Procurar por chat com o mesmo número de telefone
      const existingChat = chats.find((chat: ChatListItem) => 
        chat.contactPhoneE164 === phoneNumber
      );

      if (existingChat) {
        console.log('🔍 [LeadsContainer] Chat existente encontrado:', existingChat);
        return existingChat;
      }

      console.log('🔍 [LeadsContainer] Nenhum chat existente encontrado para:', phoneNumber);
      return null;
    } catch (error) {
      console.error('Erro ao verificar chat existente:', error);
      return null;
    }
  };

    const handleLeadClick = async (lead: OperatorLead) => {
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      toast({
        title: "Erro",
        description: "Email do usuário não encontrado",
        variant: "destructive"
      });
      return;
    }

    setCreatingChat(lead.phoneLead);

    try {
      // ✅ 1. VERIFICAR SE JÁ EXISTE CHAT COM O MESMO NÚMERO
      const existingChat = await checkExistingChat(lead.phoneLead);
      
      if (existingChat) {
        // ✅ 2. SE CHAT JÁ EXISTE, SELECIONAR O CHAT EXISTENTE
        console.log('🔍 [LeadsContainer] Chat já existe, selecionando:', existingChat);
        setSelectedChatId(existingChat.id);
        
        toast({
          title: "Chat existente",
          description: `Conversa já existe com ${lead.nameLead}`,
          variant: "default"
        });
        
        return;
      }

      // ✅ 3. SE NÃO EXISTE, CRIAR NOVO CHAT LOCALMENTE
      const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // ✅ 4. Criar ChatListItem usando a interface correta do ChatListLayout
      const newChat: ChatListItem = {
        id: chatId,
        title: `Bate-papo com ${lead.nameLead}`,
        contactPhoneE164: lead.phoneLead,
        lastMessagePreview: undefined,
        unreadCount: 0,
        lastMessageAt: new Date().toISOString()
      };

      // ✅ 5. Adicionar chat ao container de chats via contexto
      console.log('🔍 [LeadsContainer] Chamando addChat com:', newChat);
      addChat(newChat);
  
      // ✅ 6. Selecionar automaticamente o chat criado
      setSelectedChatId(chatId);
  
      // ✅ 7. Notificar sucesso
      toast({
        title: "Chat criado!",
        description: `Conversa iniciada com ${lead.nameLead}`,
        variant: "default"
      });
  
      // ✅ 8. Log de sucesso
      console.log('✅ ChatListItem criado e adicionado ao container de chats:', {
        chatId: chatId,
        lead: lead,
        chat: newChat
      });
  
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao criar chat com lead:', err);
      
      toast({
        title: "Erro ao criar chat",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setCreatingChat(null);
    }
  };

  const handleRefresh = () => {
    refreshCache();
  };

  const handleNewLead = () => {
    // TODO: Implementar lógica para adicionar novo lead
    console.log('Adicionando novo lead');
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Adicionar novo lead será implementado em breve",
      variant: "default"
    });
  };

  const handleExport = () => {
    // TODO: Implementar exportação dos leads
    console.log('Exportando leads');
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Exportação de leads será implementada em breve",
      variant: "default"
    });
  };

  return (
    <Card className="w-full soft-border shadow-smooth bg-card/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Leads Alocados
            {leads.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {leads.length}
              </Badge>
            )}
          </CardTitle>
          
          {/* Barra de ferramentas */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border rounded-lg bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 w-48"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewLead}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando leads...</span>
          </div>
        ) : cacheError ? (
          <div className="flex items-center justify-center py-8 text-center">
            <div className="text-red-500">
              <div className="text-sm font-medium">Erro ao carregar leads</div>
              <div className="text-xs text-muted-foreground mt-1">{cacheError}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshCache}
                className="mt-3"
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-center">
            <div className="text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <div className="text-sm font-medium">Nenhum lead alocado</div>
              <div className="text-xs mt-1">Você ainda não possui leads atribuídos</div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {filteredLeads.map((lead, index) => (
                <div
                  key={index}
                  onClick={() => handleLeadClick(lead)}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-background/80 cursor-pointer transition-colors group relative"
                >
                  {/* Indicador de criação de chat */}
                  {creatingChat === lead.phoneLead && (
                    <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-primary">Criando chat...</span>
                    </div>
                  )}

                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {lead.nameLead.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {lead.nameLead}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {lead.phoneLead}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeadClick(lead);
                    }}
                    disabled={creatingChat === lead.phoneLead}
                  >
                    {creatingChat === lead.phoneLead ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {filteredLeads.length > 0 && searchTerm && (
          <div className="mt-3 text-center">
            <Badge variant="outline" className="text-xs">
              {filteredLeads.length} de {leads.length} leads encontrados
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
