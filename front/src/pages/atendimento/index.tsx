import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { chatsApi, ChatListItem, ChatMessageDto } from '@/services/chat-service';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BotStatusCard } from '@/components/whatsapp/bot-status-card';
import { OperatorStatusCard } from '@/components/whatsapp/operator-status-card';
import { AnimatedList } from '@/components/ui/animated-list';
import { Minus, X } from 'lucide-react';

const formatTime = (iso?: string) => iso ? new Date(iso).toLocaleString('pt-BR') : '';

export default function AtendimentoPage() {
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [composer, setComposer] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const simulatedMessagesRef = useRef<Map<string, ChatMessageDto[]>>(new Map());

  const refreshChats = async () => {
    const { items, total } = await chatsApi.list(search, 1, 20);
    setTotal(total);
    setChats(items);
  };

  const loadHistory = async (id: string, cursor?: number | null) => {
    const data = await chatsApi.history(id, cursor ?? undefined, 50);
    setNextCursor(data.nextCursor ?? null);
    setMessages(prev => {
      const merged = [...data.messages, ...prev];
      const map = new Map(merged.map(m => [m.id || m.externalMessageId!, m]));
      return Array.from(map.values()).sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    });
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  };

  const sendMessage = async () => {
    if (!selectedChatId || !composer.trim()) return;
    const clientMessageId = crypto.randomUUID();
    setComposer('');
    if (selectedChatId.startsWith('sim-')) {
      const outMsg: ChatMessageDto = { id: clientMessageId, direction: 'out', text: composer, status: 'sent', ts: new Date().toISOString() } as any;
      setMessages(prev => [...prev, outMsg]);
      return;
    }
    await chatsApi.send(selectedChatId, composer, clientMessageId);
  };

  useEffect(() => { refreshChats(); }, [search]);

  useEffect(() => {
    if (!selectedChatId) return;
    setMessages([]);
    setNextCursor(null);
    setIsChatMinimized(false);
    if (selectedChatId.startsWith('sim-')) {
      const msgs = simulatedMessagesRef.current.get(selectedChatId) || [];
      setMessages(msgs);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
      return;
    }
    loadHistory(selectedChatId);
  }, [selectedChatId]);

  useEffect(() => {
    const conn = new HubConnectionBuilder().withUrl('http://localhost:5656/whatsappHub').withAutomaticReconnect().configureLogging(LogLevel.Information).build();
    conn.on('chat.created', async () => { await refreshChats(); });
    conn.on('chat.updated', async () => { await refreshChats(); });
    conn.on('message.inbound', async (evt: any) => {
      if (evt.chatId === selectedChatId) {
        setMessages(prev => [...prev, evt.message]);
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
      }
      await refreshChats();
    });
    conn.on('message.outbound', (evt: any) => {
      if (evt.chatId === selectedChatId) {
        setMessages(prev => [...prev.filter(m => m.id !== evt.message.id), evt.message]);
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
      }
    });
    conn.on('message.status', (evt: any) => {
      if (evt.chatId === selectedChatId) {
        setMessages(prev => prev.map(m => (m.id === evt.messageId || m.externalMessageId === evt.messageId) ? { ...m, status: evt.status } : m));
      }
    });
    conn.start().then(() => conn.invoke('JoinWhatsAppGroup')).catch(console.error);
    return () => { conn.stop(); };
  }, [selectedChatId]);

  useEffect(() => {
    let cancelled = false;
    const mkSimChat = (idx: number): ChatListItem => {
      const phone = `55119999${(1000 + idx).toString()}`;
      const id = `sim-${crypto.randomUUID()}`;
      const now = new Date();
      const msg: ChatMessageDto = {
        id: crypto.randomUUID(),
        externalMessageId: crypto.randomUUID(),
        direction: 'in' as any,
        text: `Mensagem de teste ${idx + 1} do número ${phone}`,
        status: 'delivered' as any,
        ts: now.toISOString()
      };
      simulatedMessagesRef.current.set(id, [msg]);
      return {
        id,
        title: `+${phone}`,
        lastMessagePreview: msg.text,
        unreadCount: 1,
        lastMessageAt: now.toISOString(),
        contactPhoneE164: phone
      } as any;
    };

    const timers: NodeJS.Timeout[] = [];
    [0, 60000, 120000].forEach((delayMs, idx) => {
      const t = setTimeout(() => {
        if (cancelled) return;
        const simChat = mkSimChat(idx);
        setChats(prev => [simChat, ...prev]);
      }, delayMs);
      timers.push(t);
    });

    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, []);

  const chatItems = chats.map(c => ({
    id: c.id,
    content: (
      <div
        className={
          `group relative flex items-start gap-3 rounded-xl border bg-background/70 dark:bg-muted/40 backdrop-blur-sm p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/40 cursor-pointer ${selectedChatId===c.id ? 'ring-2 ring-primary shadow-md bg-primary/5' : ''}`
        }
        onClick={() => setSelectedChatId(c.id)}
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/90 to-primary/60 text-primary-foreground grid place-items-center text-xs font-semibold shadow-sm">
          {c.title?.replace('+','').slice(-2)}
        </div>
        <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
            <div className="font-medium truncate text-sm">{c.title}</div>
            {c.unreadCount>0 && (
              <Badge className="ml-auto rounded-full px-2 py-0.5 text-[10px] leading-none">{c.unreadCount}</Badge>
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground truncate">
            {c.lastMessagePreview || ''}
                  </div>
          <div className="mt-1 text-[10px] text-muted-foreground">{formatTime(c.lastMessageAt)}</div>
                  </div>
                </div>
    )
  }));

  const activeChat = selectedChatId ? chats.find(c => c.id === selectedChatId) : null;

  return (
    <div className="flex flex-col gap-4 px-3 md:px-4 lg:px-6 min-h-[100svh]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BotStatusCard />
        <OperatorStatusCard />
                </div>

      {/* Empilha no mobile, duas colunas no desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Lista de chats */}
        <div className="lg:col-span-4 flex flex-col min-h-[40svh] lg:min-h-[calc(100svh-260px)]">
          <div className="flex items-center gap-2 mb-2 sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-1 rounded-md">
            <Input className="flex-1" placeholder="Buscar por nome/telefone" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && refreshChats()} />
            <Button onClick={() => refreshChats()} className="shrink-0">Buscar</Button>
                  </div>
          <Card className="flex-1 overflow-hidden">
            <CardContent className="h-full p-0">
              <ScrollArea className="h-full">
                <AnimatedList items={chatItems} />
              </ScrollArea>
            </CardContent>
          </Card>
                              </div>

        {/* Janela de chat */}
        <div className="lg:col-span-8 flex flex-col min-h-[50svh] lg:min-h-[calc(100svh-260px)]">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 sticky top-0 z-10">
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

            {!isChatMinimized && (
              <>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full px-4 py-2">
                    {messages.map((m) => (
                      <div key={(m.id||m.externalMessageId)!} className={`my-1 flex ${m.direction==='out'?'justify-end':'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-lg ${m.direction==='out'?'bg-primary text-primary-foreground':'bg-muted'}`}>
                          <div className="whitespace-pre-wrap break-words text-sm">{m.text}</div>
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
