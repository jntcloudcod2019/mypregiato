import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5656/api',
  timeout: 0,
  headers: { 'Content-Type': 'application/json' }
});

export interface ChatListItem {
  id: string;
  title: string;
  lastMessagePreview?: string;
  unreadCount: number;
  lastMessageAt?: string;
  contactPhoneE164: string;
}

export interface ChatMessageDto {
  id: string;
  externalMessageId?: string;
  direction: 'in' | 'out';
  text: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  ts: string;
  type?: 'text' | 'image' | 'file' | 'audio';
  attachment?: {
    dataUrl: string;
    mimeType: string;
    fileName?: string;
  } | null;
}

export interface ChatHistoryResponse {
  messages: ChatMessageDto[];
  nextCursor?: number | null;
}

export const chatsApi = {
  list: async (search = '', page = 1, pageSize = 20) => {
    const { data } = await api.get('/chats', { params: { search, page, pageSize } });
    return data as { items: ChatListItem[]; total: number };
  },
  history: async (id: string, cursorTs?: number, limit = 50) => {
    const { data } = await api.get(`/chats/${id}/messages`, { params: { cursorTs, limit } });
    return data as ChatHistoryResponse;
  },
  send: async (id: string, text: string, clientMessageId: string, attachment?: { dataUrl: string; mimeType: string; fileName?: string; mediaType?: 'image' | 'file' | 'audio' }) => {
    const { data } = await api.post(`/chats/${id}/messages`, { text, clientMessageId, attachment });
    return data;
  },
  read: async (id: string, readUpToTs: number) => {
    const { data } = await api.post(`/chats/${id}/read`, { readUpToTs });
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/chats/${id}`);
    return data;
  }
};

export default chatsApi;
