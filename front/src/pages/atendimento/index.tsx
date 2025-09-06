import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { unifiedChatApi } from '@/services/conversations-api';
import { MessageType } from '@/types/message';

// Função para detectar se o texto é apenas base64 de mídia
const isMediaOnlyContent = (text: string, messageType: MessageType): boolean => {
  // Se o texto começa com "data:" é base64
  if (text.startsWith('data:')) {
    return true;
  }
  
  // Se é áudio/voz e o texto é muito longo (provavelmente base64)
  if ((messageType === MessageType.Audio || messageType === MessageType.Voice) && 
      text.length > 100) {
    return true;
  }
  
  return false;
}

// Helper function to convert string type to MessageType enum
const getMessageType = (type?: string | number): MessageType => {
  // Converter para string se for número
  const typeStr = typeof type === 'number' ? type.toString() : type?.toString().toLowerCase();
  
  // Debug: log do tipo recebido
  console.log('🔍 DEBUG - getMessageType chamado com:', {
    originalType: type,
    typeStr,
    typeOf: typeof type,
    isAudio: typeStr === 'audio' || type === MessageType.Audio,
    isVoice: typeStr === 'voice' || type === MessageType.Voice,
    MessageTypeValues: Object.entries(MessageType)
  });
  
  // Se for número, mapear diretamente do enum
  if (typeof type === 'number') {
    console.log('🔢 Tipo numérico detectado:', type);
  switch (type) {
      case MessageType.Text: return MessageType.Text;
      case MessageType.Image: return MessageType.Image;
      case MessageType.Audio:
        console.log('✅ Tipo AUDIO numérico detectado, retornando MessageType.Audio =', MessageType.Audio);
        return MessageType.Audio;
      case MessageType.Document: return MessageType.Document;
      case MessageType.Video: return MessageType.Video;
      case MessageType.Voice:
        console.log('✅ Tipo VOICE numérico detectado, retornando MessageType.Voice =', MessageType.Voice);
        return MessageType.Voice;
      case MessageType.Sticker: return MessageType.Sticker;
      case MessageType.Location: return MessageType.Location;
      case MessageType.Contact: return MessageType.Contact;
      case MessageType.System: return MessageType.System;
      default:
        console.warn('⚠️ Tipo numérico não reconhecido:', type);
        return MessageType.Text;
    }
  }
  
  // Se for string, usar switch normal
  switch (typeStr) {
    case 'text': return MessageType.Text;
    case 'image': return MessageType.Image;
    case 'audio': 
      console.log('✅ Tipo AUDIO string detectado, retornando MessageType.Audio =', MessageType.Audio);
      return MessageType.Audio;
    case 'file': 
    case 'document': return MessageType.Document;
    case 'video': return MessageType.Video;
    case 'voice': 
      console.log('✅ Tipo VOICE string detectado, retornando MessageType.Voice =', MessageType.Voice);
      return MessageType.Voice;
    case 'sticker': return MessageType.Sticker;
    case 'location': return MessageType.Location;
    case 'contact': return MessageType.Contact;
    case 'system': return MessageType.System;
    default: 
      console.warn('⚠️ Tipo de mensagem string não reconhecido:', typeStr, 'retornando MessageType.Text');
      console.warn('⚠️ Tipos válidos são: text, image, audio, file, video, voice, sticker, location, contact');
      return MessageType.Text;
  }
};

interface ChatMessageDto {
  id: string;
  externalMessageId?: string;
  direction: 'in' | 'out';
  text: string;
  ts: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'document' | 'sticker' | 'location' | 'contact' | 'system';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachment?: {
    dataUrl: string;
    mimeType: string;
    fileName?: string;
  } | null;
}

// Extended interface for messages with media properties
interface ExtendedChatMessage extends ChatMessageDto {
  mediaUrl?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  duration?: number;
  thumbnail?: string;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  contactName?: string;
  contactPhone?: string;
  attachment?: {
    dataUrl: string;
    mimeType: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
  } | null;
}

interface ChatEvent {
  chatId: string;
  chat?: Partial<ChatListItem>;
}
interface MessageEvent {
  chatId: string;
  message?: {
    id?: string;
    externalMessageId?: string;
    fromMe?: boolean;
    text?: string;
    body?: string;
    ts?: string;
    timestamp?: string;
    type?: string;
    attachment?: {
      dataUrl?: string;
      mimeType?: string;
      fileName?: string;
    };
  };
}
interface MessageStatusEvent { chatId: string; messageId?: string; status?: string; }
interface TypingEvent { chatId: string; isTyping?: boolean; }
interface ReadEvent { chatId: string; readUpTo?: string; }

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { chatsApi, ChatListItem } from '@/services/chat-service';
import axios from 'axios';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useChatStore } from '@/store/chat-store';
import { BotStatusCard } from '@/components/whatsapp/bot-status-card';
import { OperatorStatusCard } from '@/components/whatsapp/operator-status-card';
import { Minus, X, Check, UserPlus, PhoneCall, Phone, Clock3, MoreVertical, Trash2, Mic, Square, Paperclip, CheckCheck } from 'lucide-react';
import { TextAnimate } from '@/components/magicui/text-animate';
import MediaRenderer from '@/components/whatsapp/media-renderer';
import { useOperatorStatus } from '@/hooks/useOperatorStatus';
import { useTwilioPhone } from '@/hooks/useTwilioPhone';
import { toast } from '@/hooks/use-toast';
import { Search, Plus, Download, RefreshCw } from 'lucide-react';
import crmIconUrl from '@/../public/icons/crm.svg';
import { TimeTicker } from '@/components/ui/time-ticker';
import { ChatListLayout } from '@/components/chat/ChatListLayout';
import { cleanTitle } from '@/utils/chat-utils';
import { LeadsContainer } from '@/components/attendance/LeadsContainer';
import { LeadTrackingForm } from '@/components/attendance/LeadTrackingForm';

import { ChatProvider } from '@/contexts/ChatContext';

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
};

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
  const { makeCall, callDuration } = useTwilioPhone();

  const [search, setSearch] = useState('');
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [composer, setComposer] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [activeCall, setActiveCall] = useState<(() => void) | null>(null);
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [historyLoaded, setHistoryLoaded] = useState<boolean>(false);

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
    while (out.length * 0.75 > targetBytes && q > 0.4) {
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

  const loadChatHistory = useCallback(async (chatId: string) => {
    let history = historyCacheRef.current[chatId];
    if (!history) {
      try {
        console.log(`🔍 Buscando histórico para chat: ${chatId}`);
        const data = await chatsApi.history(chatId, undefined, 50) as { messages: ChatMessageDto[]; nextCursor?: number };
        const messages = data.messages || [];
        history = messages.sort((a: ChatMessageDto, b: ChatMessageDto) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
        historyCacheRef.current[chatId] = history;
        console.log(`✅ Histórico carregado: ${messages.length} mensagens`);
      } catch (error) {
        console.error(`❌ Erro ao buscar histórico para ${chatId}:`, error);
        history = [] as ChatMessageDto[];
            historyCacheRef.current[chatId] = history;
      }
    }
    
    setMessages(history || []);
    setHistoryLoaded(true);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }, []);

  // Carregar histórico automaticamente quando selectedChatId mudar
  useEffect(() => {
    if (selectedChatId) {
      loadChatHistory(selectedChatId);
    } else {
      setMessages([]);
      setHistoryLoaded(false);
    }
  }, [selectedChatId, loadChatHistory]);

  const [tickets, setTickets] = useState<Record<string, TicketState>>(() => {
    try {
      const raw = localStorage.getItem('atd.tickets');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('atd.tickets', JSON.stringify(tickets));
    } catch (error) {
      console.warn('Falha ao salvar tickets no localStorage:', error);
    }
  }, [tickets]);

  const refreshChatsRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);

  const refreshChats = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    const isDebugEnabled = localStorage.getItem('debug.chat') === 'true';
    if (timeSinceLastRefresh < 2000) {
      if (refreshChatsRef.current) clearTimeout(refreshChatsRef.current);
      if (isDebugEnabled) console.debug(`[chat] Debouncing refreshChats (${timeSinceLastRefresh}ms desde último refresh)`);
      refreshChatsRef.current = setTimeout(() => {
        refreshChatsRef.current = null;
        refreshChats();
      }, 2000 - timeSinceLastRefresh);
      return;
    }
    if (isDebugEnabled) console.debug('[chat] Executando refreshChats');
    lastRefreshTimeRef.current = now;

    try {
      const response = await chatsApi.list(search, 1, 50) as { items: ChatListItem[]; total: number };
      const items = response.items || [];
      
      // NOVA LÓGICA: Deduplicação resiliente por número de telefone
      const byPhone = new Map<string, ChatListItem>();
      const byId = new Map<string, ChatListItem>();
      
      for (const c of items) {
        const phone = c.contactPhoneE164;
        
        if (phone) {
          // Se já existe chat para este número, manter o mais recente
          const existing = byPhone.get(phone);
          if (existing) {
            const currentTime = new Date(c.lastMessageAt || 0).getTime();
            const existingTime = new Date(existing.lastMessageAt || 0).getTime();
            
            if (currentTime > existingTime) {
              // Chat atual é mais recente, substituir
              byPhone.set(phone, c);
              byId.delete(existing.id);
              byId.set(c.id, c);
            }
            // Se o existente é mais recente, manter o existente e ignorar o atual
          } else {
            // Primeiro chat para este número
            byPhone.set(phone, c);
            byId.set(c.id, c);
          }
        } else {
          // Chat sem número (edge case), adicionar se não existir por ID
          if (!byId.has(c.id)) {
            byId.set(c.id, c);
          }
        }
      }
      const unique = Array.from(byId.values())
        .sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());

      setTickets(prev => {
        const next = { ...prev } as Record<string, TicketState>;
        unique.forEach(c => { if (!next[c.id]) next[c.id] = { status: 'novo', step: 1 }; });
        const ids = new Set(unique.map(c => c.id));
        Object.keys(next).forEach(id => { if (!ids.has(id)) delete next[id]; });
        return next;
      });
      // ✅ PRESERVAR CHATS LOCAIS: Manter chats criados pelo frontend
      setChats(prev => {
        const localChats = prev.filter(c => c.id.startsWith('chat_'));
        const serverChats = unique.filter(c => !c.id.startsWith('chat_'));
        const combined = [...localChats, ...serverChats];
        
        if (isDebugEnabled) console.debug(`[chat] Preservando ${localChats.length} chats locais + ${serverChats.length} chats do servidor`);
        
        return combined;
      });

      if (isDebugEnabled) console.debug(`[chat] refreshChats concluído: ${unique.length} chats`);
    } catch (error) {
      console.error('[chat] Erro ao atualizar lista de chats:', error);
    }
  }, [search, setChats, setTickets]);

  const scheduleCommitChats = () => {
    if (commitTimerRef.current) return;
    commitTimerRef.current = window.setTimeout(() => {
      const patches = pendingChatPatchesRef.current;
      pendingChatPatchesRef.current = new Map();
      commitTimerRef.current = null;
      if (patches.size === 0) return;
      setChats(prev => {
        const indexMap = new Map(prev?.map((c, idx) => [c.id, idx] as const) || []);
        const existingChats = prev || [];
        
        // Atualizar chats existentes
        const updatedChats = existingChats.map(c => {
          const p = patches.get(c.id);
          return p ? ({ ...c, ...p }) : c;
        });
        
        // Adicionar novos chats
        const newChats: ChatListItem[] = [];
        for (const [chatId, patch] of patches) {
          if (!indexMap.has(chatId)) {
            // É um novo chat - criar objeto completo
            newChats.push({
              id: chatId,
              title: patch.title || patch.contactPhoneE164 || `Chat ${chatId.slice(0, 8)}`,
              contactPhoneE164: patch.contactPhoneE164 || '',
              lastMessageAt: patch.lastMessageAt || new Date().toISOString(),
              lastMessagePreview: patch.lastMessagePreview || '',
              unreadCount: patch.unreadCount || 0
            } as ChatListItem);
          }
        }
        
        const next = [...updatedChats, ...newChats];
        
        // Ordenar se necessário
        let needSort = false;
        for (const [, p] of patches) {
          if (typeof p.lastMessageAt !== 'undefined') { needSort = true; break; }
        }
        if (needSort || newChats.length > 0) {
          next.sort((a, b) => {
            const ta = new Date(a.lastMessageAt || 0).getTime();
            const tb = new Date(b.lastMessageAt || 0).getTime();
            if (tb !== ta) return tb - ta;
            return (indexMap.get(a.id) || 0) - (indexMap.get(b.id) || 0);
          });
        }
        
        return next;
      });
    }, 120);
  };

  const queueChatPatch = useCallback((chatId: string, patch: Partial<ChatListItem>) => {
    const merged = { ...(pendingChatPatchesRef.current.get(chatId) || {}), ...patch };
    pendingChatPatchesRef.current.set(chatId, merged);
    scheduleCommitChats();
  }, []);

  const handlePhoneCall = (phoneNumber: string) => {
    if (activeCall) { activeCall(); setActiveCall(null); return; }
    try {
      if (!phoneNumber.startsWith('+')) phoneNumber = `+${phoneNumber.replace(/\D/g, '')}`;
      toast({ title: "Iniciando chamada", description: `Ligando para ${phoneNumber}...` });
      const endCallFn = makeCall(phoneNumber);
      setActiveCall(() => endCallFn);
    } catch (error) {
      console.error('Erro ao iniciar chamada:', error);
      toast({ title: "Erro na chamada", description: "Não foi possível iniciar a chamada.", variant: "destructive" });
    }
  };

  const sendMessage = async (file?: File) => {
    if (!selectedChatId || (!composer.trim() && !file)) return;
    const clientMessageId = crypto.randomUUID();
    const text = composer;
    setComposer('');
    let attachment: { dataUrl: string; mimeType: string; fileName?: string; mediaType?: 'image' | 'document' | 'audio' } | undefined;
          let optimisticType: 'text' | 'image' | 'document' | 'audio' = 'text';
    if (file) {
      const isImage = (file.type || '').startsWith('image/');
      const { dataUrl, mimeType } = isImage
        ? await compressImageToDataUrl(file, 1280, 0.82, 600 * 1024)
        : { dataUrl: await readFileAsDataUrl(file), mimeType: file.type || 'application/octet-stream' };
      const isAudio = (file.type || '').startsWith('audio/');
      const mediaType = isImage ? 'image' : isAudio ? 'audio' : 'document';
      optimisticType = mediaType as 'text' | 'image' | 'document' | 'audio';
      attachment = { dataUrl, mimeType, fileName: file.name, mediaType };
    }
    const optimistic: ChatMessageDto = {
      id: clientMessageId,
      direction: 'out',
      text,
      status: 'pending',
      ts: new Date().toISOString(),
      type: optimisticType,
      attachment: attachment ? { dataUrl: attachment.dataUrl, mimeType: attachment.mimeType, fileName: attachment.fileName } : null
    } as ChatMessageDto;
    setMessages(prev => [...prev, optimistic]);
    try {
      await chatsApi.send(selectedChatId, text, clientMessageId, attachment);
    } catch {
      setMessages(prev => prev.map(m => m.id === clientMessageId ? { ...m, status: 'failed' } : m));
    }
  };

  const sendAudio = async (dataUrl: string, mimeType: string, fileName = 'gravacao.webm') => {
    if (!selectedChatId) return;
    
    console.log('🎵 [DEBUG] sendAudio chamado:', {
      dataUrlLength: dataUrl.length,
      mimeType,
      fileName,
      selectedChatId
    });
    
    const clientMessageId = crypto.randomUUID();
    const optimistic: ChatMessageDto = {
      id: clientMessageId,
      direction: 'out',
      text: '',
      status: 'pending',
      ts: new Date().toISOString(),
      type: 'audio',
      attachment: { dataUrl, mimeType, fileName }
    } as ChatMessageDto;
    
    console.log('🎵 [DEBUG] Mensagem otimista criada:', optimistic);
    
    setMessages(prev => [...prev, optimistic]);
    try {
      await chatsApi.send(selectedChatId!, '', clientMessageId, { dataUrl, mimeType, fileName, mediaType: 'audio' });
      console.log('🎵 [DEBUG] Áudio enviado com sucesso via API');
    } catch (error) {
      console.error('🎵 [DEBUG] Erro ao enviar áudio:', error);
      setMessages(prev => prev.map(m => m.id === clientMessageId ? { ...m, status: 'failed' } : m));
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorderSupported = typeof window !== 'undefined' && 'MediaRecorder' in window;
      const mimeType = mediaRecorderSupported && typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined;
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];
      mr.ondataavailable = (e: BlobEvent) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data); };
              mr.onstop = async () => {
          try {
            const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' });
            console.log('🎵 [DEBUG] Blob de áudio criado:', {
              size: blob.size,
              type: blob.type,
              chunks: audioChunksRef.current.length
            });
            
            const reader = new FileReader();
            const dataUrl: string = await new Promise((res, rej) => { 
              reader.onload = () => {
                const result = String(reader.result);
                console.log('🎵 [DEBUG] DataURL gerado:', {
                  length: result.length,
                  startsWithData: result.startsWith('data:'),
                  mimeType: result.split(';')[0]
                });
                res(result);
              }; 
              reader.onerror = rej; 
              reader.readAsDataURL(blob); 
            });
            
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
  const stopRecording = () => { try { mediaRecorderRef.current?.stop(); } catch (error) { console.error('Erro ao parar gravação de áudio:', error); } };

  useEffect(() => { refreshChats(); }, [search, refreshChats]);

  const throttledRefreshRef = useRef<{lastTime: number, timer: NodeJS.Timeout | null}>({ lastTime: 0, timer: null });

  useEffect(() => {
    if (connRef.current) return;

    try {
      fetch('http://localhost:5656/api/health', { method: 'GET' })
        .then(response => { if (response.ok) initSignalR(); else console.error('Servidor não está respondendo'); })
        .catch((error) => { console.error('Erro ao conectar com o servidor:', error); });
    } catch (error) {
      console.error('Erro ao inicializar conexão:', error);
    }

    function initSignalR() {
      try {
        const connection = new HubConnectionBuilder()
          .withUrl('http://localhost:5656/whatsappHub')
          .withAutomaticReconnect([0, 2000, 10000, 30000])
          .configureLogging(LogLevel.Information)
          .build();

        connection.onreconnected(() => { connection.invoke('JoinWhatsAppGroup').catch(() => {}); });

        connection.off('chat.created');
        connection.off('chat.updated');
        connection.off('message.inbound');
        connection.off('message.outbound');
        connection.off('message.status');
        connection.off('presence.typing');
        connection.off('chat.read');

        const throttledRefresh = async (ms = 5000) => {
          const isDebugEnabled = localStorage.getItem('debug.chat') === 'true';
          const now = Date.now();
          const timeSinceLastRefresh = now - throttledRefreshRef.current.lastTime;
          if (timeSinceLastRefresh < ms) {
            if (throttledRefreshRef.current.timer) clearTimeout(throttledRefreshRef.current.timer);
            if (isDebugEnabled) console.debug(`[chat] Throttling refreshChats (${timeSinceLastRefresh}ms / ${ms}ms)`);
            throttledRefreshRef.current.timer = setTimeout(() => {
              throttledRefreshRef.current.timer = null;
              throttledRefreshRef.current.lastTime = Date.now();
              if (isDebugEnabled) console.debug('[chat] Executando refreshChats após throttle');
              refreshChats().catch(e => console.error('[chat] Erro em refreshChats throttled:', e));
            }, ms - timeSinceLastRefresh);
            return;
          }
          throttledRefreshRef.current.lastTime = now;
          if (isDebugEnabled) console.debug('[chat] Executando refreshChats imediatamente');
          await refreshChats();
        };

        connection.on('chat.created', (evt: ChatEvent) => {
          console.log('📨 chat.created recebido:', evt);
          const chat: Partial<ChatListItem> | undefined = evt?.chat;
          const id: string | undefined = chat?.id || evt?.chatId;
          
          if (id && chat) {
            // VERIFICAÇÃO MAIS ROBUSTA: buscar por múltiplos critérios
            const existingChat = chats.find(c => 
              c.id === id || 
              c.contactPhoneE164 === chat.contactPhoneE164 ||
              (chat.contactPhoneE164 && c.contactPhoneE164 === chat.contactPhoneE164)
            );
            
            if (existingChat) {
              console.log('⚠️ Chat JÁ EXISTE! Ignorando chat.created e não criando duplicata:', {
                existingId: existingChat.id,
                newId: id,
                phone: chat.contactPhoneE164
              });
              // NÃO fazer nada - chat já existe, ignora o evento chat.created
              return;
            } else {
              console.log('✅ Realmente é novo chat, criando:', id);
              queueChatPatch(id, chat as Partial<ChatListItem>);
            }
          } else {
            throttledRefresh(5000);
          }
        });

        connection.on('chat.updated', (evt: ChatEvent) => {
          console.log('📝 chat.updated recebido:', evt);
          const chat: Partial<ChatListItem> | undefined = evt?.chat;
          const id: string | undefined = chat?.id || evt?.chatId;
          
          if (id && chat) {
            console.log('✅ Chat atualizado:', id);
            queueChatPatch(id, chat as Partial<ChatListItem>);
          } else {
            throttledRefresh(5000);
          }
        });

        connection.on('message.inbound', async (evt: MessageEvent) => {
          const isDebugEnabled = localStorage.getItem('debug.chat') === 'true';
          if (evt?.message?.fromMe === true) return;

          const id: string | undefined = evt?.message?.id || evt?.message?.externalMessageId;
          const ts: string | undefined = evt?.message?.ts || evt?.message?.timestamp;
          const text: string | undefined = evt?.message?.text || evt?.message?.body;
          const chatId: string = evt?.chatId;
          if (!id || !chatId) return;

          if (processedInboundIdsRef.current.has(id)) return;
          processedInboundIdsRef.current.add(id);
          if (processedInboundIdsRef.current.size > 5000) {
            processedInboundIdsRef.current = new Set(Array.from(processedInboundIdsRef.current).slice(-1000));
          }

          const fallbackKey = `${chatId}|${text || ''}|${ts || ''}`;
          const lastKey = lastMessageKeyByChatRef.current[chatId];
          if (lastKey === fallbackKey) return;
          lastMessageKeyByChatRef.current[chatId] = fallbackKey;

          const currentSelected = selectedChatIdRef.current;
          setTickets(prev => ({ ...prev, [chatId]: prev[chatId] || { status: 'novo', step: 1 } }));

          // NOVA LÓGICA: Criar mensagem sempre, não só para chat selecionado
          const chatMessage: ChatMessageDto = {
            id: evt.message.id || crypto.randomUUID(),
            externalMessageId: evt.message.externalMessageId,
            direction: 'in',
            text: evt.message.text || evt.message.body || '',
            ts: evt.message.ts || evt.message.timestamp || new Date().toISOString(),
            type: (evt.message.type as 'text' | 'image' | 'video' | 'audio' | 'voice' | 'document' | 'sticker' | 'location' | 'contact' | 'system') || 'text',
            status: 'delivered',
            attachment: evt.message.attachment ? {
              dataUrl: evt.message.attachment.dataUrl || '',
              mimeType: evt.message.attachment.mimeType || 'application/octet-stream',
              fileName: evt.message.attachment.fileName
            } : null
          };

          if (chatId === currentSelected && evt.message) {
            // Se é o chat atualmente aberto, adicionar à lista de mensagens
            setMessages(prev => {
              // Verificar se a mensagem já existe para evitar duplicatas
              const exists = prev.some(m => m.id === chatMessage.id || m.externalMessageId === chatMessage.externalMessageId);
              if (exists) {
                console.debug('[chat] Mensagem já existe, ignorando duplicata:', chatMessage.id);
                return prev;
              }
              
              const newMessages = [...prev, chatMessage];
              // Ordenar por timestamp para manter cronologia
              return newMessages.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
            });
            requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
          } else {
            // Se não é o chat atual, atualizar cache para quando for aberto
            historyCacheRef.current[chatId] = historyCacheRef.current[chatId] || [];
            const cachedMessages = historyCacheRef.current[chatId];
            
            // Verificar se a mensagem já existe no cache
            const exists = cachedMessages.some(m => m.id === chatMessage.id || m.externalMessageId === chatMessage.externalMessageId);
            if (!exists) {
              cachedMessages.push(chatMessage);
              // Ordenar por timestamp
              cachedMessages.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
              console.debug('[chat] Mensagem adicionada ao cache do chat:', chatId);
            }
          }

          const preview = (text) ? text : (evt?.message?.type === 'image' ? 'Imagem' :
                                           evt?.message?.type === 'audio' ? 'Áudio' :
                                           evt?.message?.type === 'file' ? (evt?.message?.attachment?.fileName || 'Arquivo') :
                                           'Mensagem');
          const tsVal = ts || new Date().toISOString();
          const isCurrentOpen = chatId === selectedChatIdRef.current;

          queueChatPatch(chatId, {
            lastMessageAt: tsVal,
            lastMessagePreview: preview,
            unreadCount: isCurrentOpen ? 0 : undefined
          } as Partial<ChatListItem>);
        });

        connection.on('message.outbound', (evt: MessageEvent) => {
          const currentSelected = selectedChatIdRef.current;
          if (evt?.chatId !== currentSelected) return;
          const msg = evt?.message;
          if (!msg?.id) return;

          const chatMessage: ChatMessageDto = {
            id: msg.id,
            externalMessageId: msg.externalMessageId,
            direction: 'out',
            text: msg.text || msg.body || '',
            ts: msg.ts || msg.timestamp || new Date().toISOString(),
            type: (msg.type as 'text' | 'image' | 'video' | 'audio' | 'voice' | 'document' | 'sticker' | 'location' | 'contact' | 'system') || 'text',
            status: 'sent',
            attachment: msg.attachment ? {
              dataUrl: msg.attachment.dataUrl || '',
              mimeType: msg.attachment.mimeType || 'application/octet-stream',
              fileName: msg.attachment.fileName
            } : null
          };

          setMessages(prev => {
            const exists = prev.some(m => m.id === msg.id);
            return exists ? prev : [...prev, chatMessage];
          });
          requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
        });

        connection.on('message.status', (evt: MessageStatusEvent) => {
          const currentSelected = selectedChatIdRef.current;
          if (evt?.chatId !== currentSelected) return;
          const { messageId, status } = evt || {};
          if (!messageId || !status) return;
          const validStatuses = new Set(['pending', 'sent', 'delivered', 'read', 'failed']);
          const s = validStatuses.has(status as string) ? status : 'sent';
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: s as ChatMessageDto['status'] } : m));
        });

        connection.on('presence.typing', (evt: TypingEvent) => {
          if (!evt?.chatId) return;
          setTyping(evt.chatId, Boolean(evt?.isTyping));
        });

        connection.on('chat.read', (evt: ReadEvent) => {
          if (!evt?.chatId || !evt?.readUpTo) return;
          setLastReadAt(evt.chatId, String(evt.readUpTo));
          if (evt.chatId === selectedChatIdRef.current) {
            setMessages(prev => prev.map(m => (new Date(m.ts).getTime() <= new Date(evt.readUpTo).getTime() && m.direction==='in') ? { ...m, status: 'read' } : m));
          }
        });

        connRef.current = connection;
        connection.start()
          .then(() => connection.invoke('JoinWhatsAppGroup'))
          .catch(console.error);

      } catch (error) {
        console.error("Erro ao inicializar SignalR:", error);
      }
    }

    return () => {
      processedInboundIdsRef.current.clear();
      lastMessageKeyByChatRef.current = {};
      connRef.current?.stop().catch(() => {});
      connRef.current = null;
    };
  }, [queueChatPatch, refreshChats, setLastReadAt, setTyping, chats]);

  const handleTick = useCallback((timestamp: number) => { setNowTick(timestamp); }, []);

  // Função para carregar histórico de um chat
  const loadHistory = useCallback(async (chatId: string) => {
    let history = historyCacheRef.current[chatId];
    if (!history) {
      try {
        console.log(`🔍 Buscando histórico para chat: ${chatId}`);
        const data = await chatsApi.history(chatId, undefined, 50) as { messages: ChatMessageDto[]; nextCursor?: number };
        const messages = data.messages || [];
        history = messages.sort((a: ChatMessageDto, b: ChatMessageDto) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
        historyCacheRef.current[chatId] = history;
        console.log(`✅ Histórico carregado: ${messages.length} mensagens`);
      } catch (error) {
        console.error(`❌ Erro ao buscar histórico para ${chatId}:`, error);
        history = [] as ChatMessageDto[];
            historyCacheRef.current[chatId] = history;
      }
    }
    
    setMessages(history || []);
    setHistoryLoaded(true);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }, []);

  // Carregar histórico automaticamente quando selectedChatId mudar
  useEffect(() => {
    if (selectedChatId) {
      loadHistory(selectedChatId);
    } else {
      setMessages([]);
      setHistoryLoaded(false);
    }
  }, [selectedChatId, loadHistory]);

  // Auto-scroll quando mensagens mudam
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages.length]);

  const handleAttend = useCallback(async (chatId: string) => {
    const name = currentOperator?.name || 'Operador';
    const operatorId = currentOperator?.id || 'anonymous';

    setTickets(prev => ({
      ...prev,
      [chatId]: {
        ...(prev[chatId]||{step:1}),
        status: 'em_atendimento',
        assignedTo: name,
        step: 1,
        verified: false,
        startedAt: new Date().toISOString(),
        endedAt: undefined
      }
    }));

    try {
      axios.post(`http://localhost:5656/api/attendances/${chatId}/assign`, {
        OperatorId: operatorId,
        OperatorName: name
      }).catch((error) => console.error(`Erro ao atribuir chat ${chatId} ao operador ${name}:`, error));
    } catch (error) {
      console.error(`Erro ao atribuir chat ${chatId}:`, error);
    }

    // Selecionar o chat (o histórico será carregado automaticamente pelo useEffect)
    setSelectedChatId(chatId);
    setIsChatMinimized(false);
  }, [currentOperator?.name, currentOperator?.id]);

  const handleStep = useCallback(async (chatId: string, step: 1 | 2 | 3 | 4) => {
    const operatorId = currentOperator?.id || 'anonymous';
    setTickets(prev => ({
      ...prev,
      [chatId]: {
        ...(prev[chatId]||{status:'em_atendimento'}),
        step,
        verified: false
      }
    }));
    try {
      await axios.post(`http://localhost:5656/api/attendances/${chatId}/step`, { Step: step, OperatorId: operatorId });
    } catch (error) {
      console.error(`Erro ao atualizar passo ${step} do chat ${chatId}:`, error);
    }
  }, [currentOperator?.id]);

  const handleFinalize = useCallback(async (chatId: string) => {
    const activeTicket = tickets[chatId];
    const description = activeTicket?.description || "";
    const operatorId = currentOperator?.id || 'anonymous';

    setTickets(prev => ({
      ...prev,
      [chatId]: {
        ...(prev[chatId]||{}),
        status: 'finalizado',
        step: 4,
        verified: true,
        endedAt: new Date().toISOString()
      }
    }));

    try {
      await axios.post(`http://localhost:5656/api/attendances/${chatId}/finalize`, {
        Description: description,
        Verified: true,
        OperatorId: operatorId
      });
    } catch (error) {
      console.error("Erro ao finalizar atendimento no servidor:", error);
    } finally {
      setSelectedChatId(null);
      setMessages([]);
    }
  }, [tickets, currentOperator?.id]);

  const inQueue = useMemo(() => Object.values(tickets).filter(t => t.status === 'novo').length, [tickets]);
  const inService = useMemo(() => Object.values(tickets).filter(t => t.status === 'em_atendimento').length, [tickets]);
  const avgLabel = useMemo(() => {
    const active = Object.values(tickets).filter(t => t.status === 'em_atendimento' && t.startedAt);
    if (active.length === 0) return '00:00';
    const now = nowTick;
    const avg = active.reduce((acc, t) => acc + Math.max(0, now - new Date(t.startedAt as string).getTime()), 0) / active.length;
    return formatMMSS(avg);
  }, [tickets, nowTick]);

  const visibleChats = useMemo(
    () => chats.filter(c => (tickets[c.id]?.status ?? 'novo') !== 'finalizado'),
    [chats, tickets]
  );

  const activeChat = selectedChatId ? chats.find(c => c.id === selectedChatId) : null;
  const activeTicket = selectedChatId ? tickets[selectedChatId!] : undefined;
  const isPeerTyping = selectedChatId ? Boolean(typingByChat[selectedChatId!]) : false;
  const lastReadAtIso = selectedChatId ? lastReadAtByChat[selectedChatId!] : undefined;
  const lastReadAtLabel = lastReadAtIso ? new Date(lastReadAtIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <>
      <TimeTicker onTick={handleTick} />
      <div className="flex flex-col gap-4 px-3 md:px-4 lg:px-6 min-h-[100svh]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3 md:mt-5">
          <div className="lg:col-span-3"><BotStatusCard /></div>
          <div className="lg:col-span-6"><DashboardChamados inQueue={inQueue} inService={inService} avgLabel={avgLabel} /></div>
          <div className="lg:col-span-3"><OperatorStatusCard /></div>
        </div>

        {/* CONTAINER DE LEADS ALOCADOS */}
        <div className="mb-4">
          <ChatProvider value={{
            refreshChats,
            setSelectedChatId,
            addChat: (chat: ChatListItem) => {
              console.log('🔍 [ChatProvider] addChat chamado com:', chat);
              
              // ✅ Adicionar chat ao estado local da página (chats)
              setChats(prev => {
                console.log('🔍 [ChatProvider] Estado anterior:', prev.length, 'chats');
                const newState = [...prev, chat];
                console.log('🔍 [ChatProvider] Novo estado:', newState.length, 'chats');
                return newState;
              });
              
              // ✅ Adicionar chat ao store global usando useChatStore
              useChatStore.getState().addChat(chat);
              
              console.log('✅ Chat adicionado ao estado local e store global via contexto:', chat);
            }
          }}>
            <LeadsContainer />
          </ChatProvider>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* LISTA DE CHATS */}
          <div className="lg:col-span-4 flex flex-col">
            <Card className="overflow-hidden h-[75vh] soft-border shadow-smooth bg-card/60">
              <CardContent className="h-full p-0">
                <ScrollArea className="h-full">
                  <ChatListLayout
                    key={`chat-list-${visibleChats.map(c => c.id).join('-')}`}
                    chats={visibleChats}
                    ticketsById={tickets}
                    selectedId={selectedChatId}
                    onSelect={(id) => setSelectedChatId(id)}
                    onAttend={(id) => handleAttend(id)}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* PAINEL DO CHAT */}
          <div className="lg:col-span-8 flex flex-col">
            <Card className="h-[75vh] flex flex-col overflow-hidden relative soft-border shadow-smooth bg-card/60">
              <CardHeader className="px-4 py-2 border-b bg-card/50">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {activeChat ? cleanTitle(activeChat.title, activeChat.contactPhoneE164) : 'Nenhuma conversa selecionada'}
                    </div>
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

                {selectedChatId && (
                  <Stepper current={(activeTicket?.step || 1) as 1|2|3|4} verified={Boolean(activeTicket?.verified)} onStepClick={(s) => handleStep(selectedChatId, s)} />
                )}
              </CardHeader>

              {!isChatMinimized && (
                <>
                  <CardContent className="flex-1 p-0 relative overflow-hidden">
                    <ScrollArea className="h-full w-full" type="always">
                      <div className="px-4 py-2 space-y-2 min-h-full">
                      {selectedChatId && activeTicket?.step === 3 && !activeTicket?.verified && (
                        <div className="mb-6">
                          <LeadTrackingForm 
                            isVisible={true}
                            phoneLead={activeChat?.contactPhoneE164 || ''}
                            onUpdateSuccess={() => {
                              toast({
                                title: "Sucesso",
                                description: "Progresso do lead atualizado com sucesso!",
                                variant: "default"
                              });
                            }}
                          />
                        </div>
                      )}

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
                        <div key={(m.id||m.externalMessageId)!} className={`mb-3 flex ${m.direction==='out'?'justify-end':'justify-start'}`}>
                          <div className={`max-w-[85%] md:max-w-[70%] px-3 py-2 rounded-lg ${m.direction==='out'?'bg-primary text-primary-foreground':'bg-muted'}`} translate="no">
                            {/* Renderizador unificado de mídia */}
                            <MediaRenderer
                              type={getMessageType(m.type)}
                              dataUrl={m.attachment?.dataUrl || (m as ExtendedChatMessage).mediaUrl}
                              fileName={m.attachment?.fileName || (m as ExtendedChatMessage).fileName}
                              mimeType={m.attachment?.mimeType || (m as ExtendedChatMessage).mimeType}
                              size={(m as ExtendedChatMessage).attachment?.fileSize || (m as ExtendedChatMessage).size}
                              duration={(m as ExtendedChatMessage).attachment?.duration || (m as ExtendedChatMessage).duration}
                              thumbnail={(m as ExtendedChatMessage).thumbnail}
                              latitude={(m as ExtendedChatMessage).latitude}
                              longitude={(m as ExtendedChatMessage).longitude}
                              locationAddress={(m as ExtendedChatMessage).locationAddress}
                              contactName={(m as ExtendedChatMessage).contactName}
                              contactPhone={(m as ExtendedChatMessage).contactPhone}
                              className="mb-2"
                            />
                            
                            {/* DEBUG: Log do tipo de mensagem para áudio */}
                            {m.type === 'audio' && (
                              <div className="text-xs text-muted-foreground mt-1">
                                🔍 DEBUG: Tipo={m.type}, getMessageType={getMessageType(m.type)}, 
                                MessageType.Audio={MessageType.Audio}
                              </div>
                            )}
                            
                            {m.text && !isMediaOnlyContent(m.text, getMessageType(m.type)) && (
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
                      
                      {/* Elemento para auto-scroll */}
                      <div ref={bottomRef} className="h-4" />
                      </div>
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
                    {selectedChatId && activeChat?.contactPhoneE164 && (
                      <Button
                        type="button"
                        variant={activeCall ? "destructive" : "outline"}
                        size="icon"
                        onClick={() => handlePhoneCall(activeChat.contactPhoneE164)}
                        title={activeCall ? `Encerrar chamada (${callDuration}s)` : "Ligar para contato"}
                        className={`${activeCall ? "animate-pulse" : "text-green-600 hover:text-green-700 hover:bg-green-50"}`}
                      >
                        <Phone className="h-4 w-4" />
                        {activeCall && callDuration > 0 && (
                          <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                            {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}
                          </span>
                        )}
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
    </>
  );
}