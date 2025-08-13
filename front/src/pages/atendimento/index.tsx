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
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useChatStore } from '@/store/chat-store';
import { BotStatusCard } from '@/components/whatsapp/bot-status-card';
import { OperatorStatusCard } from '@/components/whatsapp/operator-status-card';
import { AnimatedList } from '@/components/ui/animated-list';
import { Minus, X, Check, UserPlus, PhoneCall, Clock3, MoreVertical, Trash2, Mic, Square, Paperclip, CheckCheck } from 'lucide-react';
import { TextAnimate } from '@/components/magicui/text-animate';
import { useOperatorStatus } from '@/hooks/useOperatorStatus';
import Dock, { DockItem } from '@/components/ui/dock';
import { Search, Plus, Download, RefreshCw } from 'lucide-react';
import crmIconUrl from '@/../public/icons/crm.svg';

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
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [historyLoaded, setHistoryLoaded] = useState<boolean>(false);

  // refs auxiliares para evitar duplicação e problemas de stale state
  const connRef = useRef<HubConnection | null>(null);
  const selectedChatIdRef = useRef<string | null>(null);
  const processedInboundIdsRef = useRef<Set<string>>(new Set());
  const lastMessageKeyByChatRef = useRef<Record<string, string>>({});
  const historyCacheRef = useRef<Record<string, ChatMessageDto[]>>({});
  const pendingChatPatchesRef = useRef<Map<string, Partial<ChatListItem>>>(new Map());
  const commitTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);
  const recordTickRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordMs, setRecordMs] = useState(0);
  const setTyping = useChatStore(s => s.setTyping);
  const setLastReadAt = useChatStore(s => s.setLastReadAt);
  const typingByChat = useChatStore(s => s.byChat);
  const lastReadAtByChat = useChatStore(s => s.lastReadAtByChat);

  const pickFile = () => fileInputRef.current?.click();
  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  const compressImageToDataUrl = async (file: File, maxDimension = 1280, initialQuality = 0.8, targetBytes = 600 * 1024): Promise<{ dataUrl: string; mimeType: string }> => {
    const dataUrl = await readFileAsDataUrl(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const imgLoaded: Promise<void> = new Promise((res, rej) => { img.onload = () => res(); img.onerror = (e) => rej(e); });
    img.src = dataUrl;
    await imgLoaded;

    const { naturalWidth: w, naturalHeight: h } = img as HTMLImageElement;
    const scale = Math.min(1, maxDimension / Math.max(w, h));
    const destW = Math.max(1, Math.round(w * scale));
    const destH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = destW;
    canvas.height = destH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { dataUrl, mimeType: file.type || 'image/jpeg' };
    ctx.drawImage(img, 0, 0, destW, destH);

    let q = initialQuality;
    let out = canvas.toDataURL('image/jpeg', q);
    // Reduzir qualidade gradualmente até atingir o alvo
    // Limite inferior de qualidade para evitar degradação extrema
    while (out.length * 0.75 > targetBytes && q > 0.4) { // dataUrl ~ 4/3 do binário
      q = Math.max(0.4, q - 0.1);
      out = canvas.toDataURL('image/jpeg', q);
    }
    return { dataUrl: out, mimeType: 'image/jpeg' };
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#chat-options-menu')) setOptionsOpen(false);
    };
    window.addEventListener('click', handler, true);
    return () => window.removeEventListener('click', handler, true);
  }, []);

  useEffect(() => { selectedChatIdRef.current = selectedChatId; }, [selectedChatId]);

  // mapa de status por chat (rehydrate do localStorage)
  const [tickets, setTickets] = useState<Record<string, TicketState>>(() => {
    try {
      const raw = localStorage.getItem('atd.tickets');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // persistência automática no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('atd.tickets', JSON.stringify(tickets));
    } catch {}
  }, [tickets]);

  const refreshChats = async () => {
    const { items } = await chatsApi.list(search, 1, 50);
    // deduplicação por id e por título/telefone para evitar entradas repetidas
    const byId = new Map<string, ChatListItem>();
    const byKey = new Map<string, string>();
    for (const c of items) {
      const key = `${c.contactPhoneE164 || ''}|${c.title || ''}`;
      if (!byKey.has(key) && !byId.has(c.id)) {
        byKey.set(key, c.id);
        byId.set(c.id, c);
      }
    }
    const unique = Array.from(byId.values())
      .sort((a, b) => new Date(b.lastMessageAt || b['updatedAt'] || 0).getTime() - new Date(a.lastMessageAt || a['updatedAt'] || 0).getTime());

    setTickets(prev => {
      const next = { ...prev } as Record<string, TicketState>;
      unique.forEach(c => {
        if (!next[c.id]) {
          next[c.id] = { status: 'novo', step: 1 };
        }
      });
      // remover tickets órfãos que não existem mais nos chats visíveis
      const ids = new Set(unique.map(c => c.id));
      Object.keys(next).forEach(id => { if (!ids.has(id)) delete next[id]; });
      return next;
    });
    setChats(unique);
  };

  // Commit em lote de alterações da lista de chats para evitar re-render excessivo
  const scheduleCommitChats = () => {
    if (commitTimerRef.current) return;
    commitTimerRef.current = window.setTimeout(() => {
      const patches = pendingChatPatchesRef.current;
      pendingChatPatchesRef.current = new Map();
      commitTimerRef.current = null;
      if (patches.size === 0) return;
      setChats(prev => {
        if (!prev || prev.length === 0) return prev;
        const indexMap = new Map(prev.map((c, idx) => [c.id, idx] as const));
        const next = prev.map(c => {
          const p = patches.get(c.id);
          return p ? ({ ...c, ...p }) : c;
        });
        // reordenar apenas se houver mudanças de lastMessageAt
        let needSort = false;
        for (const [id, p] of patches) {
          if (typeof p.lastMessageAt !== 'undefined') { needSort = true; break; }
        }
        if (needSort) {
          next.sort((a, b) => {
            const ta = new Date(a.lastMessageAt || 0).getTime();
            const tb = new Date(b.lastMessageAt || 0).getTime();
            if (tb !== ta) return tb - ta;
            // estável: manter ordem original
            return (indexMap.get(a.id) || 0) - (indexMap.get(b.id) || 0);
          });
        }
        return next;
      });
    }, 120); // agrega atualizações próximas (reduz oscilação)
  };

  const queueChatPatch = (chatId: string, patch: Partial<ChatListItem>) => {
    const merged = { ...(pendingChatPatchesRef.current.get(chatId) || {}), ...patch };
    pendingChatPatchesRef.current.set(chatId, merged);
    scheduleCommitChats();
  };

  const loadHistory = async (id: string) => {
    const data = await chatsApi.history(id, undefined, 50);
    setMessages(data.messages.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()));
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  };

  const sendMessage = async (file?: File) => {
    if (!selectedChatId || (!composer.trim() && !file)) return;
    const clientMessageId = crypto.randomUUID();
    const text = composer;
    setComposer('');
    // preparar anexo base64 quando existir
    let attachment: { dataUrl: string; mimeType: string; fileName?: string; mediaType?: 'image' | 'file' | 'audio' } | undefined;
    let optimisticType: 'text' | 'image' | 'file' | 'audio' = 'text';
    if (file) {
      const isImage = (file.type || '').startsWith('image/');
      const { dataUrl, mimeType } = isImage
        ? await compressImageToDataUrl(file, 1280, 0.82, 600 * 1024)
        : { dataUrl: await readFileAsDataUrl(file), mimeType: file.type || 'application/octet-stream' };
      const isAudio = (file.type || '').startsWith('audio/');
      const mediaType = isImage ? 'image' : isAudio ? 'audio' : 'file';
      optimisticType = mediaType;
      attachment = { dataUrl, mimeType, fileName: file.name, mediaType };
    }
    // Otimista: adicionar mensagem pendente imediatamente
    const optimistic: ChatMessageDto = { id: clientMessageId, direction: 'out', text, status: 'pending', ts: new Date().toISOString(), type: optimisticType, attachment: attachment ? { dataUrl: attachment.dataUrl, mimeType: attachment.mimeType, fileName: attachment.fileName } : null } as any;
    setMessages(prev => [...prev, optimistic]);
    try {
      await chatsApi.send(selectedChatId, text, clientMessageId, attachment);
      // status será atualizado via evento message.status
    } catch (e) {
      // falha imediata: marcar como failed
      setMessages(prev => prev.map(m => m.id === clientMessageId ? { ...m, status: 'failed' } : m));
    }
  };

  const sendAudio = async (dataUrl: string, mimeType: string, fileName = 'gravacao.webm') => {
    if (!selectedChatId) return;
    const clientMessageId = crypto.randomUUID();
    const optimistic: ChatMessageDto = {
      id: clientMessageId,
      direction: 'out',
      text: '',
      status: 'pending',
      ts: new Date().toISOString(),
      type: 'audio',
      attachment: { dataUrl, mimeType, fileName }
    } as any;
    setMessages(prev => [...prev, optimistic]);
    try {
      await chatsApi.send(selectedChatId!, '', clientMessageId, { dataUrl, mimeType, fileName, mediaType: 'audio' });
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === clientMessageId ? { ...m, status: 'failed' } : m));
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = (window as any).MediaRecorder && (MediaRecorder as any).isTypeSupported && MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined;
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];
      mr.ondataavailable = (e: BlobEvent) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        try {
          const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' });
          const reader = new FileReader();
          const dataUrl: string = await new Promise((res, rej) => { reader.onload = () => res(String(reader.result)); reader.onerror = rej; reader.readAsDataURL(blob); });
          await sendAudio(dataUrl, blob.type || 'audio/webm');
        } finally {
          stream.getTracks().forEach(t => t.stop());
          setIsRecording(false);
          if (recordTickRef.current) { window.clearInterval(recordTickRef.current); recordTickRef.current = null; }
          setRecordMs(0);
        }
      };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      recordStartRef.current = Date.now();
      setRecordMs(0);
      recordTickRef.current = window.setInterval(() => setRecordMs(Date.now() - recordStartRef.current), 200) as unknown as number;
    } catch (e) {
      console.error('Erro ao iniciar gravação de áudio:', e);
    }
  };

  const stopRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
  };

  useEffect(() => { refreshChats(); }, [search]);

  // não carregar histórico automaticamente ao mudar seleção

  // Conexão SignalR única (monta/desmonta 1x) + deduplicação de mensagens
  useEffect(() => {
    if (connRef.current) return; // já conectado
    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5656/whatsappHub')
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(LogLevel.Information)
      .build();

    connection.onreconnected(() => {
      connection.invoke('JoinWhatsAppGroup').catch(() => {});
    });

    // limpar potenciais handlers antigos antes de registrar
    connection.off('chat.created');
    connection.off('chat.updated');
    connection.off('message.inbound');
    connection.off('message.outbound');
    connection.off('message.status');
    connection.off('presence.typing');
    connection.off('chat.read');

    let lastRefresh = 0;
    const throttledRefresh = async (ms = 5000) => {
      const now = Date.now();
      if (now - lastRefresh < ms) return;
      lastRefresh = now;
      await refreshChats();
    };
    connection.on('chat.created', (evt: any) => {
      const chat: Partial<ChatListItem> | undefined = evt?.chat;
      const id: string | undefined = chat?.id || evt?.chatId;
      if (id && chat) {
        queueChatPatch(id, chat as Partial<ChatListItem>);
      } else {
        throttledRefresh(5000);
      }
    });
    connection.on('chat.updated', (evt: any) => {
      const chat: Partial<ChatListItem> | undefined = evt?.chat;
      const id: string | undefined = chat?.id || evt?.chatId;
      if (id && chat) {
        queueChatPatch(id, chat as Partial<ChatListItem>);
      } else {
        throttledRefresh(5000);
      }
    });
    connection.on('message.inbound', async (evt: any) => {
      const id: string | undefined = evt?.message?.id || evt?.message?.externalMessageId;
      const ts: string | undefined = evt?.message?.ts || evt?.message?.timestamp;
      const text: string | undefined = evt?.message?.text || evt?.message?.body;
      const chatId: string = evt?.chatId;
      // chave de fallback caso não exista id único
      const fallbackKey = `${text || ''}|${ts || ''}`;
      const dedupeKey = id || fallbackKey;
      if (id) {
        if (processedInboundIdsRef.current.has(id)) return;
        processedInboundIdsRef.current.add(id);
        // limitar memória
        if (processedInboundIdsRef.current.size > 5000) {
          processedInboundIdsRef.current = new Set(Array.from(processedInboundIdsRef.current).slice(-1000));
        }
      }
      // guarda por chat para evitar re-render de mesma mensagem
      const lastKey = lastMessageKeyByChatRef.current[chatId];
      if (lastKey === dedupeKey) return;
      lastMessageKeyByChatRef.current[chatId] = dedupeKey;
      const currentSelected = selectedChatIdRef.current;
      setTickets(prev => ({ ...prev, [evt.chatId]: prev[evt.chatId] || { status: 'novo', step: 1 } }));
      if (evt.chatId === currentSelected) {
        setMessages(prev => [...prev, evt.message]);
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
      }
      // Atualização local do item da lista para evitar full refresh
      const preview = (evt?.message?.text || evt?.message?.body) ? (evt?.message?.text || evt?.message?.body) : (evt?.message?.type === 'image' ? 'Imagem' : evt?.message?.type === 'audio' ? 'Áudio' : evt?.message?.type === 'file' ? (evt?.message?.attachment?.fileName || 'Arquivo') : 'Mensagem');
      const tsVal = evt?.message?.ts || evt?.message?.timestamp || new Date().toISOString();
      const isCurrentOpen = evt?.chatId === selectedChatIdRef.current;
      queueChatPatch(evt?.chatId, {
        lastMessageAt: tsVal,
        lastMessagePreview: preview,
        unreadCount: isCurrentOpen ? 0 : undefined
      } as Partial<ChatListItem>);
    });

    // quando API confirma criação da mensagem (pendente), garantir presença/consistência
    connection.on('message.outbound', (evt: any) => {
      const currentSelected = selectedChatIdRef.current;
      if (evt?.chatId !== currentSelected) return;
      const msg = evt?.message;
      if (!msg?.id) return;
      setMessages(prev => {
        const exists = prev.some(m => m.id === msg.id);
        return exists ? prev : [...prev, msg];
      });
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
    });

    // atualização de status (sent/failed/delivered/read)
    connection.on('message.status', (evt: any) => {
      const currentSelected = selectedChatIdRef.current;
      if (evt?.chatId !== currentSelected) return;
      const { messageId, status } = evt || {};
      if (!messageId || !status) return;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status } : m));
    });

    // estado de digitação do outro lado
    connection.on('presence.typing', (evt: any) => {
      if (!evt?.chatId) return;
      setTyping(evt.chatId, Boolean(evt?.isTyping));
    });

    // leitura (confirmação de leitura em grupo whatsapp -> refletir na UI)
    connection.on('chat.read', (evt: any) => {
      if (!evt?.chatId || !evt?.readUpTo) return;
      setLastReadAt(evt.chatId, String(evt.readUpTo));
      if (evt.chatId === selectedChatIdRef.current) {
        setMessages(prev => prev.map(m => (new Date(m.ts).getTime() <= new Date(evt.readUpTo).getTime() && m.direction==='in') ? { ...m, status: 'read' } : m));
      }
    });

    connection.start()
      .then(() => connection.invoke('JoinWhatsAppGroup'))
      .catch(console.error);

    connRef.current = connection;
    return () => {
      processedInboundIdsRef.current.clear();
      lastMessageKeyByChatRef.current = {};
      connRef.current?.stop().catch(() => {});
      connRef.current = null;
    };
  }, []);

  // tick a cada 1s para atualizar tempo médio em tempo real
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Removida simulação de conversas para uso do fluxo real-time
  // useEffect(() => { ... }, []);

  const handleAttend = async (chatId: string) => {
    const name = currentOperator?.name || 'Operador';
    setTickets(prev => ({ ...prev, [chatId]: { ...(prev[chatId]||{step:1}), status: 'em_atendimento', assignedTo: name, step: 1, verified: false, startedAt: new Date().toISOString(), endedAt: undefined } }));
    // Prefetch de histórico com cache para tornar imperceptível
    let history = historyCacheRef.current[chatId];
    if (!history) {
      try {
        const data = await chatsApi.history(chatId, undefined, 50);
        history = data.messages.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
        historyCacheRef.current[chatId] = history;
      } catch {
        history = [] as ChatMessageDto[];
      }
    }
    setSelectedChatId(chatId);
    setIsChatMinimized(false);
    setMessages(history || []);
    setHistoryLoaded(true);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
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
  const isPeerTyping = selectedChatId ? Boolean(typingByChat[selectedChatId!]) : false;
  const lastReadAtIso = selectedChatId ? lastReadAtByChat[selectedChatId!] : undefined;
  const lastReadAtLabel = lastReadAtIso ? new Date(lastReadAtIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

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

      {/* Barra de ações (Dock) acima das duas colunas para manter alinhamento vertical */}
      <div className="mb-2">
        <Dock
          items={[
            { label: 'Buscar', icon: <Search className="h-5 w-5" />, onClick: () => refreshChats() },
            { label: 'Novo Lead', icon: <Plus className="h-5 w-5" />, onClick: () => { /* abrir modal lead */ } },
            { label: 'CRM', icon: <img src={crmIconUrl} alt="CRM" className="h-5 w-5" />, onClick: () => { window.location.href = '/crm'; } },
            { label: 'Histórico', icon: <Download className="h-5 w-5" />, onClick: () => { window.location.href = '/atendimento/historico'; } },
            { label: 'Atualizar', icon: <RefreshCw className="h-5 w-5" />, onClick: () => refreshChats() },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-4 flex flex-col">
          <Card className="overflow-hidden h-[72svh] soft-border shadow-smooth bg-card/60">
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
          <Card className="h-[72svh] flex flex-col overflow-hidden relative soft-border shadow-smooth bg-card/60">
            {/* Header com stepper */}
            <CardHeader className="px-4 py-2 border-b bg-card/50">
                  <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{activeChat?.title || 'Nenhuma conversa selecionada'}</div>
                  {activeChat && (
                    <>
                      <div className="text-xs text-muted-foreground truncate">{activeChat.contactPhoneE164}</div>
                      {isPeerTyping ? (
                        <div className="text-[11px] text-emerald-600">digitando...</div>
                      ) : lastReadAtLabel ? (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <CheckCheck className="h-3 w-3" /> Lido às {lastReadAtLabel}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
                              <div className="flex items-center gap-2">
                  {/* Histórico automático ao abrir o chat */}
                  {selectedChatId && (
                    <div id="chat-options-menu" className="relative">
                      <Button variant="ghost" size="icon" title="Opções" onClick={() => setOptionsOpen(o => !o)}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      {optionsOpen && (
                        <div className="absolute right-0 mt-1 z-20 min-w-[160px] rounded-md border bg-popover text-popover-foreground shadow">
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            onClick={async () => {
                              if (!selectedChatId) return;
                              try {
                        await chatsApi.delete(selectedChatId);
                        setSelectedChatId(null);
                        setMessages([]);
                        setTickets(prev => {
                          const next = { ...prev } as Record<string, TicketState>;
                          delete next[selectedChatId];
                          return next;
                        });
                        await refreshChats();
                              } catch (e) { console.error(e); }
                              setOptionsOpen(false);
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
                <CardContent className="flex-1 p-0 relative">
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
                          {m.type === 'image' && m.attachment?.dataUrl ? (
                            <img src={m.attachment.dataUrl} alt={m.attachment.fileName || 'imagem'} className="rounded-md mb-2 max-h-[320px] object-contain" />
                          ) : null}
                          {m.type === 'audio' && m.attachment?.dataUrl ? (
                            <audio controls className="mb-2 max-w-full">
                              <source src={m.attachment.dataUrl} type={m.attachment.mimeType || 'audio/mpeg'} />
                              Seu navegador não suporta áudio.
                            </audio>
                          ) : null}
                          {m.type === 'file' && m.attachment?.dataUrl ? (
                            <a href={m.attachment.dataUrl} download={m.attachment.fileName || 'arquivo'} className="underline mb-2 block text-sm">
                              {m.attachment.fileName || 'Arquivo'}
                            </a>
                          ) : null}
                          {m.text && (
                            <div className="whitespace-pre-wrap break-words text-sm">
                              <TextAnimate animation="scaleUp" by="character">{m.text}</TextAnimate>
                            </div>
                          )}
                           <div className="flex gap-2 justify-end items-center text-[10px] opacity-70 mt-1">
                             <span>{new Date(m.ts).toLocaleTimeString('pt-BR')}</span>
                             {m.direction==='out' && (
                               (() => {
                                 const isRead = lastReadAtIso && new Date(m.ts).getTime() <= new Date(lastReadAtIso).getTime();
                                 return isRead ? (
                                   <span className="inline-flex items-center gap-1"><CheckCheck className="h-3 w-3" /> lido</span>
                                 ) : <span>{m.status}</span>;
                               })()
                             )}
          </div>
        </div>
                  </div>
                    ))}
                    <div ref={bottomRef} />
                  </ScrollArea>
                </CardContent>
                <Separator />
                <div className="p-2 md:p-3 flex gap-2 items-center">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) sendMessage(f); }} />
                  <Button type="button" variant="outline" size="icon" onClick={()=>fileInputRef.current?.click()} title="Anexar arquivo">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  {!isRecording ? (
                    <Button type="button" variant="outline" size="icon" onClick={startRecording} title="Gravar áudio">
                      <Mic className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="button" variant="destructive" size="icon" onClick={stopRecording} title={`Parar gravação (${new Date(recordMs).toISOString().substring(14, 19)})`}>
                      <Square className="h-4 w-4" />
                    </Button>
                  )}
                  <Input className="flex-1" placeholder="Digite sua mensagem" value={composer} onChange={e=>setComposer(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); sendMessage(); } }} />
                  <Button onClick={()=>sendMessage()} disabled={!selectedChatId} className="shrink-0">Enviar</Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
