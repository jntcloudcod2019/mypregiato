
import { useState, useEffect } from 'react'
import { WhatsAppConnection } from '@/types/whatsapp'
import { whatsAppService } from '@/services/whatsapp-service'

export const useWhatsAppConnection = () => {
  const [connection, setConnection] = useState<WhatsAppConnection>(() => 
    whatsAppService.getConnectionStatus()
  )
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  useEffect(() => {
    const handleConnectionUpdate = (newConnection: WhatsAppConnection) => {
      setConnection(newConnection)
    }

    whatsAppService.on('connection_update', handleConnectionUpdate)

    return () => {
      whatsAppService.off('connection_update', handleConnectionUpdate)
    }
  }, [])

  const generateQR = async () => {
    try {
      setIsGeneratingQR(true)
      await whatsAppService.generateQRCode()
    } catch (error) {
      console.error('Error generating QR:', error)
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const disconnect = async () => {
    try {
      await whatsAppService.disconnect()
    } catch (error) {
      console.error('Error disconnecting:', error)
    }
  }

  return {
    connection,
    generateQR,
    disconnect,
    isGeneratingQR
  }
}
