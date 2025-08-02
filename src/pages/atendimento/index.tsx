import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Phone, 
  Camera, 
  Paperclip, 
  Send, 
  Smile, 
  MoreVertical,
  Star,
  Tag
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          Atendimento
        </h1>
        <p className="text-muted-foreground mt-1">
          Central de atendimento para operadores de telemarketing
        </p>
      </div>

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
    </div>
  );
};

export default AtendimentoPage;