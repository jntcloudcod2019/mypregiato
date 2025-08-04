import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Phone, 
  Camera, 
  Paperclip, 
  Send, 
  Smile, 
  MoreVertical,
  Star,
  Tag,
  Users,
  Wifi,
  WifiOff,
  MessageCircle,
  UserCheck,
  AlertCircle
} from 'lucide-react';

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  foto: string;
  ultimaMensagem: string;
  horaUltimaMensagem: string;
  mensagensNaoLidas: number;
  online: boolean;
  etiquetas: string[];
}

interface Mensagem {
  id: string;
  conteudo: string;
  tipo: 'texto' | 'imagem' | 'arquivo';
  remetente: 'operador' | 'cliente';
  timestamp: string;
  arquivo?: {
    nome: string;
    url: string;
    tipo: string;
  };
}

// WhatsApp imports
import { TalentData } from '@/types/talent';
import { CurrentUser } from '@/types/whatsapp';
import { getTalents } from '@/lib/talent-service';
import { UserService } from '@/services/user-service';
import { whatsAppService } from '@/services/whatsapp-service';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
import { QRCodeModal } from '@/components/whatsapp/qr-code-modal';
import { TalentChat } from '@/components/whatsapp/talent-chat';
import { useUser } from '@clerk/clerk-react';

const AtendimentoPage = () => {
  const [clientes] = useState<Cliente[]>([
    {
      id: '1',
      nome: 'Ana Clara Santos',
      telefone: '(11) 99999-9999',
      foto: '/src/assets/ana-clara-profile.jpg',
      ultimaMensagem: 'Gostaria de saber sobre os serviços...',
      horaUltimaMensagem: '14:30',
      mensagensNaoLidas: 2,
      online: true,
      etiquetas: ['VIP', 'Interessado']
    },
    {
      id: '2',
      nome: 'Maria Silva',
      telefone: '(11) 88888-8888',
      foto: '/src/assets/ana-clara-beauty.jpg',
      ultimaMensagem: 'Quando posso agendar?',
      horaUltimaMensagem: '13:45',
      mensagensNaoLidas: 0,
      online: false,
      etiquetas: ['Agendamento']
    }
  ]);

  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(clientes[0]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: '1',
      conteudo: 'Olá! Gostaria de saber mais sobre os serviços de fotografia.',
      tipo: 'texto',
      remetente: 'cliente',
      timestamp: '14:25'
    },
    {
      id: '2',
      conteudo: 'Olá Ana Clara! Claro, ficarei feliz em ajudar. Temos diversos pacotes disponíveis.',
      tipo: 'texto',
      remetente: 'operador',
      timestamp: '14:26'
    }
  ]);

  const [novaMensagem, setNovaMensagem] = useState('');
  const [busca, setBusca] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp state
  const { user, isLoaded } = useUser();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [talents, setTalents] = useState<TalentData[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<TalentData | null>(null);
  const [talentSearch, setTalentSearch] = useState('');
  const [isLoadingTalents, setIsLoadingTalents] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [newContactAlerts, setNewContactAlerts] = useState<any[]>([]);
  const [connectionHealth, setConnectionHealth] = useState<string>('disconnected');
  const [hasActiveNumber, setHasActiveNumber] = useState(false);

  const { connection, generateQR, disconnect, isGeneratingQR } = useWhatsAppConnection();
  const { toast } = useToast();

  // Listen for intelligent system events
  useEffect(() => {
    const handleNewContactAlert = (contactData: any) => {
      setNewContactAlerts(prev => [contactData, ...prev].slice(0, 10));
      toast({
        title: "🔔 Novo Contato Detectado!",
        description: `${contactData.name} (${contactData.number}): "${contactData.message.substring(0, 50)}..."`,
        duration: 8000,
      });
    };

    const handleClientReady = (data: any) => {
      setServerInfo(data.businessInfo);
      setHasActiveNumber(data.hasActiveConnection || false);
    };

    const handleSessionRestored = (data: any) => {
      toast({
        title: "🤖 Sistema Inteligente",
        description: "Sessão anterior restaurada automaticamente!",
        duration: 5000,
      });
      setHasActiveNumber(true);
    };

    const handleNoActiveSession = (data: any) => {
      toast({
        title: "ℹ️ Sistema Inteligente",
        description: "Nenhum número conectado encontrado. Conecte um número para iniciar.",
        duration: 5000,
      });
      setHasActiveNumber(false);
    };

    const handleConnectionRestored = (data: any) => {
      toast({
        title: "✅ Sistema Inteligente",
        description: data.message,
        duration: 5000,
      });
    };

    const handleHeartbeat = (data: any) => {
      setConnectionHealth(data.connectionHealth);
    };

    const handleMaxReconnectAttempts = (data: any) => {
      toast({
        title: "⚠️ Sistema Inteligente",
        description: data.message,
        variant: "destructive",
        duration: 10000,
      });
    };

    // Register all intelligent system listeners
    whatsAppService.on('new_contact_alert', handleNewContactAlert);
    whatsAppService.on('client_ready', handleClientReady);
    whatsAppService.on('session_restored', handleSessionRestored);
    whatsAppService.on('no_active_session', handleNoActiveSession);
    whatsAppService.on('connection_restored', handleConnectionRestored);
    whatsAppService.on('heartbeat', handleHeartbeat);
    whatsAppService.on('max_reconnect_attempts', handleMaxReconnectAttempts);

    return () => {
      whatsAppService.off('new_contact_alert', handleNewContactAlert);
      whatsAppService.off('client_ready', handleClientReady);
      whatsAppService.off('session_restored', handleSessionRestored);
      whatsAppService.off('no_active_session', handleNoActiveSession);
      whatsAppService.off('connection_restored', handleConnectionRestored);
      whatsAppService.off('heartbeat', handleHeartbeat);
      whatsAppService.off('max_reconnect_attempts', handleMaxReconnectAttempts);
    };
  }, [toast]);

  // Monitor connection status intelligently
  useEffect(() => {
    const checkConnectionStatus = () => {
      const hasActive = whatsAppService.hasActiveNumber();
      const health = whatsAppService.getConnectionHealth();
      
      setHasActiveNumber(hasActive);
      setConnectionHealth(health);
    };

    // Check immediately and then every 10 seconds
    checkConnectionStatus();
    const interval = setInterval(checkConnectionStatus, 10000);

    return () => clearInterval(interval);
  }, [connection.isConnected]);

  // Load current user and check permissions
  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!isLoaded || !user?.emailAddresses?.[0]?.emailAddress) return;

      try {
        const email = user.emailAddresses[0].emailAddress;
        const userData = await UserService.getUserByEmail(email);
        
        if (userData) {
          setCurrentUser(userData);
          const access = UserService.hasWhatsAppAccess(userData.role);
          setHasAccess(access);
          
          if (!access) {
            toast({
              title: "Acesso Negado",
              description: "Apenas funcionários têm acesso ao sistema de atendimento WhatsApp.",
              variant: "destructive"
            });
          }
        } else {
          // Create mock user for testing
          const mockUser: CurrentUser = {
            id: 'user_mock',
            email,
            fullName: user.fullName || 'Operador Teste',
            role: 'OPERATOR'
          };
          setCurrentUser(mockUser);
          setHasAccess(true);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do usuário.",
          variant: "destructive"
        });
      }
    };

    loadCurrentUser();
  }, [isLoaded, user, toast]);

  // Load talents for WhatsApp
  useEffect(() => {
    const loadTalents = async () => {
      if (!hasAccess) return;

      try {
        setIsLoadingTalents(true);
        const talentsData = await getTalents();
        setTalents(talentsData);
        
        // Initialize conversations for all talents
        talentsData.forEach(talent => {
          whatsAppService.initializeConversation(
            talent.id, 
            talent.fullName, 
            talent.phone || 'Não informado'
          );
        });
      } catch (error) {
        console.error('Error loading talents:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar lista de modelos.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingTalents(false);
      }
    };

    loadTalents();
  }, [hasAccess, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviarMensagem = () => {
    if (!novaMensagem.trim() || !clienteSelecionado) return;

    const mensagem: Mensagem = {
      id: Date.now().toString(),
      conteudo: novaMensagem,
      tipo: 'texto',
      remetente: 'operador',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMensagens(prev => [...prev, mensagem]);
    setNovaMensagem('');
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
    cliente.telefone.includes(busca)
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  // WhatsApp functions
  const talentsFiltrados = talents.filter(talent =>
    talent.fullName.toLowerCase().includes(talentSearch.toLowerCase()) ||
    (talent.phone && talent.phone.includes(talentSearch))
  );

  const handleConnectWhatsApp = () => {
    if (connection.isConnected) {
      disconnect();
    } else {
      setShowQRModal(true);
      if (!connection.qrCode) {
        generateQR();
      }
    }
  };

  // Get connection status display
  const getConnectionStatusDisplay = () => {
    if (!connection.isConnected) {
      return {
        color: 'bg-red-500',
        text: 'Desconectado',
        icon: <WifiOff className="w-4 h-4" />
      };
    }

    if (!hasActiveNumber) {
      return {
        color: 'bg-yellow-500',
        text: 'Conectado - Sem Número',
        icon: <AlertCircle className="w-4 h-4" />
      };
    }

    switch (connectionHealth) {
      case 'excellent':
        return {
          color: 'bg-green-500',
          text: 'Excelente',
          icon: <Wifi className="w-4 h-4" />
        };
      case 'good':
        return {
          color: 'bg-green-400',
          text: 'Boa',
          icon: <Wifi className="w-4 h-4" />
        };
      case 'fair':
        return {
          color: 'bg-yellow-500',
          text: 'Regular',
          icon: <Wifi className="w-4 h-4" />
        };
      case 'poor':
        return {
          color: 'bg-orange-500',
          text: 'Fraca',
          icon: <AlertCircle className="w-4 h-4" />
        };
      default:
        return {
          color: 'bg-gray-500',
          text: 'Desconhecido',
          icon: <AlertCircle className="w-4 h-4" />
        };
    }
  };

  const connectionStatus = getConnectionStatusDisplay();

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Sistema Inteligente de Atendimento WhatsApp
            </h1>
            <p className="text-muted-foreground mt-1">
              Central inteligente PREGIATO MANAGEMENT - Detecção automática de conexões
            </p>
          </div>
          
          {currentUser && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{currentUser.fullName}</p>
                <p className="text-sm text-muted-foreground">{currentUser.role}</p>
              </div>
              <Avatar>
                <AvatarFallback>{currentUser.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        {/* Intelligent System Status */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 ${connectionStatus.color} rounded-full ${connection.isConnected ? 'animate-pulse' : ''}`} />
              <div className="flex-1">
                <h3 className="font-semibold flex items-center gap-2">
                  {connectionStatus.icon}
                  Status da Conexão
                </h3>
                <p className="text-sm text-muted-foreground">
                  {connectionStatus.text}
                </p>
              </div>
            </div>
            {connection.isConnected && hasActiveNumber && serverInfo?.number && (
              <div className="mt-2 text-xs text-muted-foreground">
                📞 {serverInfo.number}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              {serverInfo?.profilePicture ? (
                <Avatar className="h-12 w-12">
                  <AvatarImage src={serverInfo.profilePicture} alt="PREGIATO MANAGEMENT" />
                  <AvatarFallback>PM</AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <h3 className="font-semibold">
                  {serverInfo?.businessName || 'PREGIATO MANAGEMENT'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {hasActiveNumber ? 'Número Ativo Detectado' : 'Aguardando Conexão'}
                </p>
              </div>
              <div className="ml-auto">
                {hasActiveNumber ? (
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                ) : (
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Novos Contatos
                </h3>
                <p className="text-sm text-muted-foreground">
                  {newContactAlerts.length} detectados hoje
                </p>
              </div>
              <Badge variant="secondary" className="bg-blue-500 text-white">
                {newContactAlerts.length}
              </Badge>
            </div>
            {newContactAlerts.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                Último: {new Date(newContactAlerts[0]?.timestamp).toLocaleTimeString('pt-BR')}
              </div>
            )}
          </Card>
        </div>

        {/* Smart Alerts */}
        {!hasActiveNumber && connection.isConnected && (
          <Card className="p-4 mt-4 border-yellow-200 bg-yellow-50">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Sistema Conectado sem Número Ativo</h3>
                <p className="text-sm text-yellow-700">
                  O servidor está conectado mas não foi detectado nenhum número WhatsApp ativo. 
                  Escaneie o QR Code para ativar um número.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Tabs defaultValue="clientes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Clientes Tradicionais
          </TabsTrigger>
          <TabsTrigger value="grupos" className="flex items-center gap-2" disabled={!hasAccess}>
            <Users className="w-4 h-4" />
            Sistema Inteligente WhatsApp
            {hasActiveNumber && (
              <div className="w-2 h-2 bg-green-500 rounded-full ml-1"></div>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes">
          <Card className="h-[700px] flex overflow-hidden">
            <div className="w-80 border-r border-border flex flex-col">
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar contatos..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {clientesFiltrados.map((cliente) => (
                  <div
                    key={cliente.id}
                    className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                      clienteSelecionado?.id === cliente.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setClienteSelecionado(cliente)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={cliente.foto} alt={cliente.nome} />
                          <AvatarFallback>{cliente.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {cliente.online && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-sm truncate">{cliente.nome}</h3>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">{cliente.horaUltimaMensagem}</span>
                            {cliente.mensagensNaoLidas > 0 && (
                              <Badge variant="default" className="bg-green-500 text-white rounded-full min-w-[20px] h-5 text-xs flex items-center justify-center">
                                {cliente.mensagensNaoLidas}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {cliente.ultimaMensagem}
                        </p>
                        
                        <div className="flex gap-1 mt-2">
                          {cliente.etiquetas.map((etiqueta, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {etiqueta}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {clienteSelecionado ? (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={clienteSelecionado.foto} alt={clienteSelecionado.nome} />
                          <AvatarFallback>{clienteSelecionado.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {clienteSelecionado.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-background"></div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-medium">{clienteSelecionado.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          {clienteSelecionado.online ? 'Online' : 'Offline'} • {clienteSelecionado.telefone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {mensagens.map((mensagem) => (
                      <div
                        key={mensagem.id}
                        className={`flex ${mensagem.remetente === 'operador' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            mensagem.remetente === 'operador'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{mensagem.conteudo}</p>
                          <p className={`text-xs mt-1 ${
                            mensagem.remetente === 'operador' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {mensagem.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Digite sua mensagem..."
                        value={novaMensagem}
                        onChange={(e) => setNovaMensagem(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="min-h-[40px] max-h-32 resize-none pr-20"
                        rows={1}
                      />
                      
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Smile className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={enviarMensagem}
                          disabled={!novaMensagem.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      👍 Ok
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      ❤️ Obrigado
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      😊 Perfeito
                    </Button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx"
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-muted/10">
                <div className="text-center">
                  <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Selecione um contato</h3>
                  <p className="text-muted-foreground">
                    Escolha um cliente da lista para iniciar o atendimento
                  </p>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="grupos">
          <div className="space-y-4">
            {/* Enhanced WhatsApp Connection Status */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${connectionStatus.color} ${connection.isConnected ? 'animate-pulse' : ''}`} />
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      {connectionStatus.icon}
                      Sistema Inteligente WhatsApp
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {connection.isConnected 
                        ? hasActiveNumber
                          ? `PREGIATO MANAGEMENT operacional - Conexão ${connectionStatus.text.toLowerCase()}`
                          : 'Sistema conectado - Nenhum número WhatsApp detectado'
                        : 'Sistema desconectado - Aguardando ativação'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={hasActiveNumber ? "default" : "secondary"} className={hasActiveNumber ? "bg-green-500 text-white" : ""}>
                    {hasActiveNumber ? "Número Ativo" : "Sem Número"}
                  </Badge>
                  <Button 
                    variant={connection.isConnected ? "outline" : "default"}
                    onClick={handleConnectWhatsApp}
                    className="flex items-center gap-2"
                  >
                    {connection.isConnected ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                    {connection.isConnected ? 'Desconectar' : 'Conectar Sistema'}
                  </Button>
                </div>
              </div>
              
              {/* Connection Health Bar */}
              {connection.isConnected && hasActiveNumber && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Saúde da Conexão:</span>
                    <span className={`font-medium ${
                      connectionHealth === 'excellent' ? 'text-green-600' :
                      connectionHealth === 'good' ? 'text-green-500' :
                      connectionHealth === 'fair' ? 'text-yellow-500' :
                      'text-orange-500'
                    }`}>
                      {connectionStatus.text}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        connectionHealth === 'excellent' ? 'bg-green-500 w-full' :
                        connectionHealth === 'good' ? 'bg-green-400 w-3/4' :
                        connectionHealth === 'fair' ? 'bg-yellow-500 w-1/2' :
                        'bg-orange-500 w-1/4'
                      }`}
                    ></div>
                  </div>
                </div>
              )}
            </Card>

            <Tabs defaultValue="modelos">
              <TabsList>
                <TabsTrigger value="modelos" className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Modelos Cadastrados
                </TabsTrigger>
              </TabsList>

              <TabsContent value="modelos">
                <Card className="h-[650px] flex overflow-hidden">
                  {/* Talents List with proper scroll */}
                  <div className="w-80 border-r border-border flex flex-col bg-muted/20">
                    <div className="p-4 border-b border-border bg-background">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Buscar modelos cadastrados..."
                          value={talentSearch}
                          onChange={(e) => setTalentSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground text-center">
                        {talentsFiltrados.length} de {talents.length} modelos
                      </div>
                    </div>

                    <ScrollArea className="flex-1 h-0">
                      <div className="p-2 space-y-1">
                        {isLoadingTalents ? (
                          <div className="p-8 text-center">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-sm text-muted-foreground">Carregando modelos...</p>
                          </div>
                        ) : talentsFiltrados.length === 0 ? (
                          <div className="p-8 text-center">
                            <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">
                              {talentSearch ? 'Nenhum modelo encontrado' : 'Nenhum modelo cadastrado'}
                            </p>
                          </div>
                        ) : (
                          talentsFiltrados.map((talent) => {
                            const conversation = whatsAppService.getConversation(talent.id);
                            return (
                              <div
                                key={talent.id}
                                className={`p-3 rounded-lg cursor-pointer hover:bg-muted/80 transition-all duration-200 border ${
                                  selectedTalent?.id === talent.id 
                                    ? 'bg-primary/10 border-primary/30 shadow-sm' 
                                    : 'bg-background border-border hover:border-border/60'
                                }`}
                                onClick={() => setSelectedTalent(talent)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <Avatar className="h-11 w-11">
                                      <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${talent.fullName}`} />
                                      <AvatarFallback className="text-xs font-semibold">
                                        {talent.fullName.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    {conversation?.isOnline && (
                                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background"></div>
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-1">
                                      <h3 className="font-medium text-sm truncate leading-tight">
                                        {talent.fullName}
                                      </h3>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        {conversation?.lastMessage && (
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(conversation.lastMessage.timestamp).toLocaleTimeString('pt-BR', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                        )}
                                        {conversation && conversation.unreadCount > 0 && (
                                          <Badge variant="default" className="bg-green-500 text-white rounded-full min-w-[18px] h-4 text-xs flex items-center justify-center px-1.5">
                                            {conversation.unreadCount}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                      {talent.phone || 'Telefone não informado'}
                                    </p>
                                    
                                    {conversation?.lastMessage && (
                                      <p className="text-xs text-muted-foreground truncate mt-1 bg-muted/50 px-2 py-1 rounded">
                                        {conversation.lastMessage.content}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Chat Area */}
                  {selectedTalent ? (
                    <div className="flex-1">
                      {connection.isConnected ? (
                        <TalentChat 
                          talent={selectedTalent}
                          onClose={() => setSelectedTalent(null)}
                        />
                      ) : (
                        <div className="flex-1 flex items-center justify-center bg-muted/10">
                          <div className="text-center">
                            <WifiOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Servidor Desconectado</h3>
                            <p className="text-muted-foreground mb-4 max-w-md">
                              Conecte o servidor PREGIATO MANAGEMENT ao WhatsApp para iniciar conversas com os modelos
                            </p>
                            <Button onClick={handleConnectWhatsApp}>
                              <Wifi className="w-4 h-4 mr-2" />
                              Conectar Servidor
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-muted/10">
                      <div className="text-center">
                        <UserCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Selecione um Modelo</h3>
                        <p className="text-muted-foreground max-w-md">
                          Escolha um modelo da lista para iniciar ou continuar uma conversa via WhatsApp Business
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrCode={connection.qrCode}
        status={connection.status}
        onGenerateQR={generateQR}
        onDisconnect={disconnect}
        isGeneratingQR={isGeneratingQR}
      />
    </div>
  );
};

export default AtendimentoPage;
