import axios from 'axios'
import { io, Socket } from 'socket.io-client'

const API_BASE_URL = 'http://localhost:5001/api';
const WHATSAPP_GATEWAY_URL = 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false
})

let socket: Socket | null = null

export function connectSignalR(token?: string) {
  if (!socket) {
    console.log('Connecting to WhatsApp Gateway:', WHATSAPP_GATEWAY_URL)
    socket = io(WHATSAPP_GATEWAY_URL, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined
    })
    
    socket.on('connect', () => {
      console.log('✅ Connected to WhatsApp Gateway')
    })
    
    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WhatsApp Gateway')
    })
    
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error)
    })
    
    // Log all events for debugging
    socket.onAny((eventName, ...args) => {
      console.log('📡 Socket event:', eventName, args)
    })
  }
  return socket
}

export function disconnectSignalR() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket() {
  return socket
} 

// WhatsApp Gateway endpoints
export const whatsAppGateway = {
  connect: () => api.post('/whatsapp/session/connect'),
  disconnect: () => api.post('/whatsapp/session/disconnect'),
  getStatus: () => api.get('/whatsapp/session/status'),
  sendMessage: (data: SendMessageRequest) => api.post('/whatsapp/messages/send', data)
};

// API endpoints
export const whatsAppApi = {
  getContacts: () => api.get('/whatsapp/contacts'),
  getConversations: (status?: string) => api.get(`/whatsapp/conversations${status ? `?status=${status}` : ''}`),
  getConversation: (id: string) => api.get(`/whatsapp/conversations/${id}`),
  getMessages: (conversationId: string) => api.get(`/whatsapp/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, data: SendMessageRequest) => api.post(`/whatsapp/conversations/${conversationId}/messages`, data),
  assignConversation: (conversationId: string, operatorId: string) => api.post(`/whatsapp/conversations/${conversationId}/assign`, { operatorId }),
  closeConversation: (conversationId: string, reason?: string) => api.post(`/whatsapp/conversations/${conversationId}/close`, { reason }),
  getQueueMetrics: () => api.get('/whatsapp/queue/metrics'),
  getQueueConversations: () => api.get('/whatsapp/queue/conversations'),
  markAsRead: (conversationId: string) => api.post(`/whatsapp/conversations/${conversationId}/read`)
}; 