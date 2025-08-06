export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  isFromMe: boolean;
}

export interface ChatRequest {
  id: string;
  phone: string;
  customerName?: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  status: 'queued' | 'attending' | 'closed';
  operatorId?: string;
}

export interface ActiveChat {
  id: string;
  phone: string;
  customerName?: string;
  operatorId: string;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  messages: WhatsAppMessage[];
}

export interface Operator {
  id: string;
  name: string;
  email: string;
  status: 'available' | 'busy' | 'away';
  activeChats: ActiveChat[];
  maxChats: number;
}

export interface AttendanceMetrics {
  queueCount: number;
  attendingCount: number;
  averageResponseTime: number; // em minutos
  totalRequests: number;
}

export interface AttendanceState {
  queue: ChatRequest[];
  activeChats: Map<string, ActiveChat[]>; // operatorId -> chats
  operators: Map<string, Operator>;
  metrics: AttendanceMetrics;
  selectedTab: 'queue' | 'active';
} 