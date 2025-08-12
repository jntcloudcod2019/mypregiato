import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { chatsApi, ChatListItem, ChatMessageDto } from '@/services/chat-service';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BotStatusCard } from '@/components/whatsapp/bot-status-card';
import { OperatorStatusCard } from '@/components/whatsapp/operator-status-card';
import { AnimatedList } from '@/components/ui/animated-list';
import { Minus, X, Check, UserPlus, PhoneCall, Clock3 } from 'lucide-react';
import { TextAnimate } from '@/components/magicui/text-animate';
import { useOperatorStatus } from '@/hooks/useOperatorStatus';

const formatTime = (iso?: string) => iso ? new Date(iso).toLocaleString('pt-BR') : '';
const formatMMSS = (ms: number) => {
  if (!isFinite(ms) || ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

type TicketState = {
  status: 'novo' | 'em_atendimento' | 'finalizado'
  assignedTo?: string
  step: 1 | 2 | 3 | 4
  description?: string
  verified?: boolean
  startedAt?: string
  endedAt?: string
}

// Stepper visual (círculos, linhas e clique por passo)
const stepsDef: Array<{ k: 1|2|3|4; t: string }> = [
  { k: 1, t: 'Atendimento iniciado' },
  { k: 2, t: 'Atendimento em andamento' },
  { k: 3, t: 'Atendimento Finalizado' },
  { k: 4, t: 'Descrição' },
];

function Stepper({ current, verified, onStepClick }: { current: 1|2|3|4; verified: boolean; onStepClick: (s: 1|2|3|4) => void }) {
  return (
    <div className="mt-3 w-full overflow-x-auto">
      <div className="min-w-[640px] flex items-center gap-3">
        {stepsDef.map((s, idx) => {
          const isActive = verified ? false : current === s.k;
          const isDone = verified ? true : current > s.k;
          return (
            <div key={s.k} className="flex items-center gap-3">
              <button
                className="flex flex-col items-center gap-1 min-w-[120px]"
                onClick={() => onStepClick(s.k)}
                title={s.t}
              >
                <div className={`inline-flex items-center justify-center h-8 w-8 rounded-full border transition-colors ${isActive ? 'bg-primary text-primary-foreground border-primary' : isDone ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-muted-foreground/30'}`}>
                  {isDone ? <Check className="h-4 w-4" /> : <span className="text-xs font-medium">{s.k}</span>}
                </div>
                <span className={`text-[11px] text-center leading-tight ${isActive || isDone ? 'text-foreground' : 'text-muted-foreground'}`}>{s.t}</span>
              </button>
              {idx < stepsDef.length - 1 && (
                <div className={`h-[2px] w-16 md:w-24 ${verified || current > s.k ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DashboardChamados({ inQueue, inService, avgLabel }: { inQueue: number; inService: number; avgLabel: string }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <div className="text-sm font-semibold">Central de Atendimento</div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border bg-blue-50 text-blue-700 p-3 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold leading-none">{inQueue}</div>
              <div className="text-xs">Na Fila</div>
            </div>
            <div className="opacity-70"><UserPlus className="h-5 w-5" /></div>
          </div>
          <div className="rounded-xl border bg-green-50 text-green-700 p-3 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold leading-none">{inService}</div>
              <div className="text-xs">Atendendo</div>
            </div>
            <div className="opacity-70"><PhoneCall className="h-5 w-5" /></div>
          </div>
          <div className="rounded-xl border bg-red-50 text-red-600 p-3 flex items-center justify-between">
            <div>
              <div className="text-base font-bold leading-none">{avgLabel}</div>
              <div className="text-xs">Tempo Médio</div>
            </div>
            <div className="opacity-70"><Clock3 className="h-5 w-5" /></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AtendimentoPage() {
  const { currentOperator } = useOperatorStatus();

  const [search, setSearch] = useState('');
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [composer, setComposer] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  // mapa de status por chat
  const [tickets, setTickets] = useState<Record<string, TicketState>>({});

  const refreshChats = async () => {
    const { items } = await chatsApi.list(search, 1, 20);
    // inicializar como "novo" qualquer chat que ainda não tenha ticket
    setTickets(prev => {
      const next = { ...prev } as Record<string, TicketState>;
      items.forEach(c => { if (!next[c.id]) next[c.id] = { status: 'novo', step: 1 }; });
      return next;
    });
    setChats(items);
  };

  const loadHistory = async (id: string) => {
    const data = await chatsApi.history(id, undefined, 50);
    setMessages(data.messages.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()));
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  };

  const sendMessage = async () => {
    if (!selectedChatId || !composer.trim()) return;
    const clientMessageId = crypto.randomUUID();
    const text = composer;
    setComposer('');
    if (selectedChatId.startsWith('sim-')) {
      const outMsg: ChatMessageDto = { id: clientMessageId, direction: 'out', text, status: 'sent', ts: new Date().toISOString() } as any;
      setMessages(prev => [...prev, outMsg]);
      return;
    }
    await chatsApi.send(selectedChatId, text, clientMessageId);
  };

  useEffect(() => { refreshChats(); }, [search]);

  useEffect(() => {
    if (!selectedChatId) return;
    setMessages([]);
    setIsChatMinimized(false);
    if (selectedChatId.startsWith('sim-')) return; // histórico simulado já é setado em outro fluxo
    loadHistory(selectedChatId);
  }, [selectedChatId]);

  useEffect(() => {
    const conn = new HubConnectionBuilder().withUrl('http://localhost:5656/whatsappHub').withAutomaticReconnect().configureLogging(LogLevel.Information).build();
    conn.on('chat.created', async () => { await refreshChats(); });
    conn.on('chat.updated', async () => { await refreshChats(); });
    conn.on('message.inbound', async (evt: any) => {
      setTickets(prev => ({ ...prev, [evt.chatId]: prev[evt.chatId] || { status: 'novo', step: 1 } }));
      if (evt.chatId === selectedChatId) {
        setMessages(prev => [...prev, evt.message]);
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
      }
      await refreshChats();
    });
    conn.start().then(() => conn.invoke('JoinWhatsAppGroup')).catch(console.error);
    return () => { conn.stop(); };
  }, [selectedChatId]);

  // tick a cada 1s para atualizar tempo médio em tempo real
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Simulação de novas conversas (mantido do fluxo anterior)
  useEffect(() => {
    const mkSim = (idx: number) => {
      const phone = `55119999${(1000 + idx).toString()}`;
      const id = `sim-${crypto.randomUUID()}`;
      setChats(prev => [{ id, title: `+${phone}`, lastMessagePreview: `Mensagem de teste ${idx + 1} do número ${phone}`, unreadCount: 1, lastMessageAt: new Date().toISOString(), contactPhoneE164: phone } as any, ...prev]);
      setTickets(prev => ({ ...prev, [id]: { status: 'novo', step: 1 } }));
    };
    const t1 = setTimeout(() => mkSim(0), 0);
    const t2 = setTimeout(() => mkSim(1), 60000);
    const t3 = setTimeout(() => mkSim(2), 120000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleAttend = (chatId: string) => {
    setSelectedChatId(chatId);
    const name = currentOperator?.name || 'Operador';
    setTickets(prev => ({ ...prev, [chatId]: { ...(prev[chatId]||{step:1}), status: 'em_atendimento', assignedTo: name, step: 1, verified: false, startedAt: new Date().toISOString(), endedAt: undefined } }));
  };

  const handleStep = (chatId: string, step: 1 | 2 | 3 | 4) => {
    setTickets(prev => ({ ...prev, [chatId]: { ...(prev[chatId]||{status:'em_atendimento'}), step, verified: false } }));
  };

  const handleFinalize = (chatId: string) => {
    setTickets(prev => ({ ...prev, [chatId]: { ...(prev[chatId]||{}), status: 'finalizado', step: 4, verified: true, endedAt: new Date().toISOString() } }));
    // sair da fila automaticamente: esconder da lista e fechar janela
    setSelectedChatId(null);
    setMessages([]);
  };

  // métricas para dashboard
  const inQueue = useMemo(() => Object.values(tickets).filter(t => t.status === 'novo').length, [tickets]);
  const inService = useMemo(() => Object.values(tickets).filter(t => t.status === 'em_atendimento').length, [tickets]);
  const avgLabel = useMemo(() => {
    const active = Object.values(tickets).filter(t => t.status === 'em_atendimento' && t.startedAt);
    if (active.length === 0) return '00:00';
    const now = nowTick;
    const avg = active.reduce((acc, t) => acc + Math.max(0, now - new Date(t.startedAt as string).getTime()), 0) / active.length;
    return formatMMSS(avg);
  }, [tickets, nowTick]);

  // chats visíveis na fila (exclui finalizados)
  const visibleChats = chats.filter(c => (tickets[c.id]?.status ?? 'novo') !== 'finalizado');

  const chatItems = visibleChats.map((c, idx) => {
    const queueNumber = String(idx + 1).padStart(2, '0');
    const t = tickets[c.id];
    const statusLabel = t?.status === 'finalizado' ? 'Finalizado' : t?.status === 'em_atendimento' ? `Em Atendimento: ${t.assignedTo || ''}` : 'Novo';
    const statusColor = t?.status === 'finalizado' ? 'bg-gray-200 text-gray-700' : t?.status === 'em_atendimento' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';
    return {
      id: c.id,
      content: (
        <div
          className={`group relative flex items-start gap-3 rounded-xl border bg-background/70 dark:bg-muted/40 backdrop-blur-sm p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/40 cursor-pointer ${selectedChatId===c.id ? 'ring-2 ring-primary shadow-md bg-primary/5' : ''}`}
          onClick={() => setSelectedChatId(c.id)}
        >
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/90 to-primary/60 text-primary-foreground grid place-items-center text-xs font-semibold shadow-sm">
            {queueNumber}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="font-medium truncate text-sm">{c.title}</div>
              {c.unreadCount>0 && (
                <Badge className="ml-auto rounded-full px-2 py-0.5 text-[10px] leading-none">{c.unreadCount}</Badge>
              )}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground truncate">{c.lastMessagePreview || ''}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`text-[10px] rounded-full px-2 py-[2px] ${statusColor}`}>{statusLabel}</span>
              {t?.status === 'novo' && (
                <Button size="sm" className="h-6 px-2 py-0" onClick={(e) => { e.stopPropagation(); handleAttend(c.id); }}>Atender</Button>
              )}
            </div>
          </div>
        </div>
      )
    };
  });

  const activeChat = selectedChatId ? chats.find(c => c.id === selectedChatId) : null;
  const activeTicket = selectedChatId ? tickets[selectedChatId!] : undefined;

  return (
    <div className="flex flex-col gap-4 px-3 md:px-4 lg:px-6 min-h-[100svh]">
      {/* Topo em 3 colunas: 3/6/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3 md:mt-5">
        <div className="lg:col-span-3">
          <BotStatusCard />
        </div>
        <div className="lg:col-span-6">
          <DashboardChamados inQueue={inQueue} inService={inService} avgLabel={avgLabel} />
                  </div>
        <div className="lg:col-span-3">
          <OperatorStatusCard />
                  </div>
                </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2 sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-1 rounded-md">
            <Input className="flex-1" placeholder="Buscar por nome/telefone" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && refreshChats()} />
            <Button onClick={() => refreshChats()} className="shrink-0">Buscar</Button>
          </div>
          <Card className="overflow-hidden h-[72svh]">
            <CardContent className="h-full p-0">
              <ScrollArea className="h-full">
                <div className="p-3 md:p-4">
                  <AnimatedList items={chatItems} className="space-y-4" />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
                              </div>

        <div className="lg:col-span-8 flex flex-col">
          <Card className="h-[72svh] flex flex-col overflow-hidden">
            {/* Header com stepper */}
            <CardHeader className="px-4 py-2 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{activeChat?.title || 'Nenhuma conversa selecionada'}</div>
                  {activeChat && <div className="text-xs text-muted-foreground truncate">{activeChat.contactPhoneE164}</div>}
                </div>
                              <div className="flex items-center gap-2">
                  {selectedChatId && (
                    <Button variant="ghost" size="icon" title={isChatMinimized ? 'Restaurar' : 'Minimizar'} onClick={() => setIsChatMinimized(v => !v)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                  {selectedChatId && (
                    <Button variant="ghost" size="icon" title="Fechar" onClick={() => { setSelectedChatId(null); setMessages([]); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                </div>

              {/* Stepper visual */}
              {selectedChatId && (
                <Stepper current={(activeTicket?.step || 1) as 1|2|3|4} verified={Boolean(activeTicket?.verified)} onStepClick={(s) => handleStep(selectedChatId, s)} />
              )}
            </CardHeader>

            {!isChatMinimized && (
              <>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full px-4 py-2">
                    {/* Descrição (etapa 4) */}
                    {selectedChatId && activeTicket?.step === 4 && !activeTicket?.verified && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-2">Descreva o atendimento e finalize</p>
                        <Textarea
                          value={activeTicket?.description || ''}
                          onChange={(e) => {
                            if (!selectedChatId) return;
                            setTickets(prev => {
                              const cid = selectedChatId as string;
                              const existing: TicketState = prev[cid] ?? { status: 'em_atendimento', step: 4, assignedTo: currentOperator?.name };
                              return { ...prev, [cid]: { ...existing, description: e.target.value } };
                            });
                          }}
                          placeholder="Observações do atendimento..."
                          className="mb-2"
                        />
                        <Button size="sm" onClick={() => handleFinalize(selectedChatId!)}>Salvar e Encerrar</Button>
          </div>
                    )}

                    {messages.map((m) => (
                      <div key={(m.id||m.externalMessageId)!} className={`my-1 flex ${m.direction==='out'?'justify-end':'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-lg ${m.direction==='out'?'bg-primary text-primary-foreground':'bg-muted'}`}>
                          <div className="whitespace-pre-wrap break-words text-sm">
                            <TextAnimate animation="scaleUp" by="character">{m.text}</TextAnimate>
                          </div>
                          <div className="flex gap-2 justify-end items-center text-[10px] opacity-70 mt-1">
                            <span>{new Date(m.ts).toLocaleTimeString('pt-BR')}</span>
                            {m.direction==='out' && <span>{m.status}</span>}
          </div>
        </div>
                  </div>
                    ))}
                    <div ref={bottomRef} />
                  </ScrollArea>
                </CardContent>
                <Separator />
                <div className="p-2 md:p-3 flex gap-2">
                  <Input className="flex-1" placeholder="Digite sua mensagem" value={composer} onChange={e=>setComposer(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); sendMessage(); } }} />
                  <Button onClick={sendMessage} disabled={!selectedChatId} className="shrink-0">Enviar</Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
