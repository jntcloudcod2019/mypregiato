import { create } from 'zustand'

interface ChatState {
  // Status de digitação por chat
  byChat: Record<string, boolean>
  // Último timestamp de leitura por chat
  lastReadAtByChat: Record<string, string>
  // Ações
  setTyping: (chatId: string, isTyping: boolean) => void
  setLastReadAt: (chatId: string, timestamp: string) => void
}

export const useChatStore = create<ChatState>((set) => ({
  byChat: {},
  lastReadAtByChat: {},
  
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
  }))
}))
