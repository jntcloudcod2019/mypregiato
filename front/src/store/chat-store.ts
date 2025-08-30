import { create } from 'zustand'
import { ChatListItem, ChatMessageDto } from '../services/chat-service'
import { MessageDto, MessageDirection, MessageType, MessageStatus } from '../types/message'

// Interface para conversa no store
interface ConversationUI {
  conversationId: string;
  peerE164: string;
  isGroup: boolean;
  title?: string | null;
  lastMessageAt?: string;
  currentSessionId?: string | null;
  messages: MessageDto[];
  messagesMap: Record<string, true>;
  isWhatsApp: boolean;
}

// Interface para status do bot
interface BotStatus {
  online: boolean;
  validated: boolean;
  phone?: string;
  lastUpdate: string;
}

interface ChatState {
  // Status de digitação por chat
  byChat: Record<string, boolean>
  // Último timestamp de leitura por chat
  lastReadAtByChat: Record<string, string>
  // Cache de chats para deduplicação
  chatsCache: Map<string, ChatListItem>
  // Cache de mensagens para deduplicação
  messagesCache: Map<string, Set<string>> // chatId -> Set<messageId>
  
  // Novas funcionalidades para conversas
  conversations: Record<string, ConversationUI>;
  botStatus: BotStatus;
  
  // Ações existentes
  setTyping: (chatId: string, isTyping: boolean) => void
  setLastReadAt: (chatId: string, timestamp: string) => void
  addChat: (chat: ChatListItem) => void
  updateChat: (chatId: string, updates: Partial<ChatListItem>) => void
  addMessage: (chatId: string, message: ChatMessageDto) => boolean // retorna true se mensagem foi adicionada (não duplicada)
  clearCache: () => void
  
  // Novas ações para conversas
  upsertConversation: (c: Partial<ConversationUI> & { conversationId: string }) => void;
  appendInbound: (conversationId: string, msg: MessageDto) => void;
  markOutboundStatus: (conversationId: string, clientMessageId: string, status: 'sent' | 'failed', externalMessageId?: string) => void;
  updateBotStatus: (status: BotStatus) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  byChat: {},
  lastReadAtByChat: {},
  chatsCache: new Map(),
  messagesCache: new Map(),
  
  // Novas funcionalidades
  conversations: {},
  botStatus: {
    online: false,
    validated: false,
    lastUpdate: new Date().toISOString()
  },
  
  setTyping: (chatId, isTyping) => set(state => ({
    byChat: {
      ...state.byChat,
      [chatId]: isTyping
    }
  })),
  
  setLastReadAt: (chatId, timestamp) => set(state => ({
    lastReadAtByChat: {
      ...state.lastReadAtByChat,
      [chatId]: timestamp
    }
  })),
  
  addChat: (chat) => set(state => {
    const newCache = new Map(state.chatsCache);
    newCache.set(chat.id, chat);
    return { chatsCache: newCache };
  }),
  
  updateChat: (chatId, updates) => set(state => {
    const newCache = new Map(state.chatsCache);
    const existing = newCache.get(chatId);
    if (existing) {
      newCache.set(chatId, { ...existing, ...updates });
    }
    return { chatsCache: newCache };
  }),
  
  addMessage: (chatId, message) => {
    const state = get();
    const messageIds = state.messagesCache.get(chatId) || new Set();
    
    // Verificar se a mensagem já existe para evitar duplicação
    if (messageIds.has(message.id)) {
      console.log(`🔧 Mensagem duplicada ignorada: ${message.id} em chat ${chatId}`);
      return false;
    }
    
    // Adicionar mensagem ao cache
    messageIds.add(message.id);
    const newMessagesCache = new Map(state.messagesCache);
    newMessagesCache.set(chatId, messageIds);
    
    set({ messagesCache: newMessagesCache });
    console.log(`🔧 Mensagem adicionada ao cache: ${message.id} em chat ${chatId}`);
    return true;
  },
  
  clearCache: () => set({
    chatsCache: new Map(),
    messagesCache: new Map()
  }),
  
  // Novas ações para conversas
  upsertConversation: (c) => set((s) => {
    const prev = s.conversations[c.conversationId];
    const base: ConversationUI = prev ?? {
      conversationId: c.conversationId,
      peerE164: c.peerE164 ?? '',
      isGroup: !!c.isGroup,
      title: c.title ?? null,
      currentSessionId: c.currentSessionId ?? null,
      lastMessageAt: c.lastMessageAt ?? undefined,
      messages: [],
      messagesMap: {},
      isWhatsApp: c.isWhatsApp ?? true
    };
    const next: ConversationUI = {
      ...base,
      ...c,
      messages: base.messages,
      messagesMap: base.messagesMap,
    };
    return {
      conversations: {
        ...s.conversations,
        [c.conversationId]: next
      }
    };
  }),
  
  appendInbound: (conversationId, msg) => set((s) => {
    const conv = s.conversations[conversationId];
    if (!conv) return s;
    
    const extId = msg.externalMessageId ?? '';
    if (extId && conv.messagesMap[extId]) return s;
    
    const messages = conv.messages.slice();
    messages.push(msg);
    
    const messagesMap = { ...conv.messagesMap };
    if (extId) messagesMap[extId] = true;
    
    const lastMessageAt = msg.ts ?? msg.createdAt ?? conv.lastMessageAt;
    
    return {
      conversations: {
        ...s.conversations,
        [conversationId]: {
          ...conv,
          messages,
          messagesMap,
          lastMessageAt,
        },
      },
    };
  }),
  
  markOutboundStatus: (conversationId, clientMessageId, status, externalMessageId) => set((s) => {
    const conv = s.conversations[conversationId];
    if (!conv) return s;
    
    const messages = conv.messages.map((m) => {
      if (m.clientMessageId === clientMessageId) {
        const updated: MessageDto = {
          ...m,
          status: status === 'sent' ? MessageStatus.Sent : MessageStatus.Failed
        };
        if (externalMessageId) {
          updated.externalMessageId = externalMessageId;
          conv.messagesMap[externalMessageId] = true;
        }
        return updated;
      }
      return m;
    });
    
    return {
      conversations: {
        ...s.conversations,
        [conversationId]: {
          ...conv,
          messages,
        },
      },
    };
  }),
  
  updateBotStatus: (status) => set(() => ({
    botStatus: status
  }))
}))
