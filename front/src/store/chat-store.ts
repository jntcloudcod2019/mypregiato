import { create } from 'zustand'

type TypingState = {
  byChat: Record<string, boolean>
  setTyping: (chatId: string, isTyping: boolean) => void
}

type ReadState = {
  lastReadAtByChat: Record<string, string>
  setLastReadAt: (chatId: string, iso: string) => void
}

type ChatStore = TypingState & ReadState

export const useChatStore = create<ChatStore>((set) => ({
  byChat: {},
  setTyping: (chatId, isTyping) => set((s) => ({ byChat: { ...s.byChat, [chatId]: isTyping } })),
  lastReadAtByChat: {},
  setLastReadAt: (chatId, iso) => set((s) => ({ lastReadAtByChat: { ...s.lastReadAtByChat, [chatId]: iso } })),
}))


