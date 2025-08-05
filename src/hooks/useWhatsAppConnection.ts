
import { useState, useEffect } from 'react'
import { connectSignalR, disconnectSignalR, getSocket } from '@/services/whatsapp-api'
import axios from 'axios'

type ConnectionStatus = 'disconnected' | 'qr_ready' | 'connecting' | 'connected'

const WHATSAPP_GATEWAY_URL = import.meta.env.VITE_WHATSAPP_GATEWAY_URL || 'http://localhost:3001'

export const useWhatsAppConnection = () => {
  const [connection, setConnection] = useState({
    isConnected: false,
    status: 'disconnected' as ConnectionStatus,
    qrCode: '',
  })
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  useEffect(() => {
    const socket = connectSignalR()
    
    // Escutar eventos do WhatsApp Gateway
    socket.on('session:status', (data: any) => {
      console.log('Received session status:', data)
      setConnection({
        isConnected: data.isConnected,
        status: data.status as ConnectionStatus,
        qrCode: data.qrCode || ''
      })
    })
    
    socket.on('session:qr', (data: any) => {
      console.log('Received QR code:', data)
      setConnection((prev) => ({ 
        ...prev, 
        status: 'qr_ready' as ConnectionStatus, 
        qrCode: data.qrCode 
      }))
    })
    
    socket.on('session:connected', () => {
      console.log('WhatsApp connected')
      setConnection((prev) => ({ 
        ...prev, 
        isConnected: true, 
        status: 'connected' as ConnectionStatus, 
        qrCode: '' 
      }))
    })
    
    socket.on('session:disconnected', () => {
      console.log('WhatsApp disconnected')
      setConnection((prev) => ({ 
        ...prev, 
        isConnected: false, 
        status: 'disconnected' as ConnectionStatus, 
        qrCode: '' 
      }))
    })

    return () => {
      disconnectSignalR()
    }
  }, [])

  const generateQR = async () => {
    setIsGeneratingQR(true)
    try {
      await axios.post(`${WHATSAPP_GATEWAY_URL}/session/connect`)
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const disconnect = async () => {
    await axios.post(`${WHATSAPP_GATEWAY_URL}/session/disconnect`)
  }

  return {
    connection,
    generateQR,
    disconnect,
    isGeneratingQR
  }
}
