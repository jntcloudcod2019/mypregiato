import axios from 'axios'
import { io, Socket } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/whatsapp'
const SIGNALR_URL = import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5000/hubs/whatsapp'

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false
})

let socket: Socket | null = null

export function connectSignalR(token?: string) {
  if (!socket) {
    socket = io(SIGNALR_URL, {
      transports: ['websocket'],
      auth: token ? { token } : undefined
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