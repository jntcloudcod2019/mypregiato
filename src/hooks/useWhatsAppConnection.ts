
import { useState, useEffect } from 'react'
import { api, connectSignalR, disconnectSignalR, getSocket } from '@/services/whatsapp-api'

type ConnectionStatus = 'disconnected' | 'qr_ready' | 'connecting' | 'connected'

export const useWhatsAppConnection = () => {
  const [connection, setConnection] = useState({
    isConnected: false,
    status: 'disconnected' as ConnectionStatus,
    qrCode: '',
  })
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  useEffect(() => {
    const socket = connectSignalR()
    socket.on('session:status', (data: any) => {
      setConnection(data)
    })
    socket.on('session:qr', (data: any) => {
      setConnection((prev) => ({ ...prev, status: 'qr_ready' as ConnectionStatus, qrCode: data.qrCode }))
    })
    socket.on('session:connected', () => {
      setConnection((prev) => ({ ...prev, isConnected: true, status: 'connected' as ConnectionStatus, qrCode: '' }))
    })
    socket.on('session:disconnected', () => {
      setConnection((prev) => ({ ...prev, isConnected: false, status: 'disconnected' as ConnectionStatus, qrCode: '' }))
    })
    return () => {
      disconnectSignalR()
    }
  }, [])

  const generateQR = async () => {
    setIsGeneratingQR(true)
    try {
      await api.post('/session/connect')
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const disconnect = async () => {
    await api.post('/session/disconnect')
  }

  return {
    connection,
    generateQR,
    disconnect,
    isGeneratingQR
  }
}
