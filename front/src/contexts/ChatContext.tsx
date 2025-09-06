import React, { createContext, useContext, ReactNode } from 'react';
import { ChatListItem } from '@/services/chat-service';

interface ChatContextType {
  refreshChats: () => Promise<void>;
  setSelectedChatId: (chatId: string | null) => void;
  addChat: (chat: ChatListItem) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  value: ChatContextType;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children, value }) => {
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext deve ser usado dentro de um ChatProvider');
  }
  return context;
};

export default ChatContext;
