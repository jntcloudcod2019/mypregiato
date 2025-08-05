import axios from 'axios'
import { io, Socket } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/whatsapp'
const WHATSAPP_GATEWAY_URL = import.meta.env.VITE_WHATSAPP_GATEWAY_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
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