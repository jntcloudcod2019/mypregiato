
import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { 
  Send, 
  Paperclip, 
  Phone, 
  PhoneCall, 
  Check, 
  CheckCheck,
  Clock,
  AlertCircle
} from 'lucide-react'
import { TalentData } from '@/types/talent'
import { WhatsAppMessage } from '@/types/whatsapp'
import { useTalentChat } from '@/hooks/useTalentChat'

interface TalentChatProps {
  talent: TalentData
  onClose: () => void
}

export const TalentChat: React.FC<TalentChatProps> = ({ talent, onClose }) => {
  const [message, setMessage] = useState('')
  const [isCallActive, setIsCallActive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { conversation, sendMessage, markAsRead, isLoading } = useTalentChat(talent.id)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages])

  useEffect(() => {
    if (conversation) {
      markAsRead()
    }
  }, [conversation, markAsRead])

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return

    try {
      await sendMessage(message)
      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const fileType = file.type.startsWith('image/') ? 'image' : 'file'
      await sendMessage(`Enviou um ${fileType === 'image' ? 'imagem' : 'arquivo'}: ${file.name}`, fileType, file)
    } catch (error) {
      console.error('Error sending file:', error)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAudioCall = () => {
    setIsCallActive(true)
    
    // Simulate call duration
    setTimeout(() => {
      setIsCallActive(false)
    }, 10000)
  }

  const getMessageStatusIcon = (status: WhatsAppMessage['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-muted-foreground" />
      case 'sent':
        return <Check className="w-3 h-3 text-muted-foreground" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      default:
        return <AlertCircle className="w-3 h-3 text-red-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Initialize conversation if it doesn't exist
  useEffect(() => {
    if (!conversation) {
      // The hook will initialize it automatically
    }
  }, [talent.id, conversation])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${talent.fullName}`} />
              <AvatarFallback>{talent.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-medium">{talent.fullName}</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{talent.phone}</p>
                {conversation?.isOnline && (
                  <Badge variant="secondary" className="text-xs">Online</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleAudioCall}
              disabled={isCallActive}
              className={isCallActive ? 'bg-green-500 text-white' : ''}
            >
              {isCallActive ? <PhoneCall className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {isCallActive && (
          <div className="mt-2 p-2 bg-green-100 rounded-lg text-center">
            <p className="text-sm text-green-800">📞 Chamada em andamento...</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {conversation?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'operator' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender === 'operator'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.file && (
                  <div className="mb-2">
                    {msg.file.type.startsWith('image/') ? (
                      <img 
                        src={msg.file.url} 
                        alt={msg.file.name}
                        className="max-w-full h-auto rounded"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-white/20 rounded">
                        <Paperclip className="w-4 h-4" />
                        <span className="text-sm">{msg.file.name}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-sm">{msg.content}</p>
                
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${
                    msg.sender === 'operator' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </span>
                  
                  {msg.sender === 'operator' && (
                    <div className="ml-2">
                      {getMessageStatusIcon(msg.status)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[40px] max-h-32 resize-none"
              rows={1}
              disabled={isLoading}
            />
          </div>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => setMessage('👍 Ok')}
          >
            👍 Ok
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => setMessage('❤️ Obrigado')}
          >
            ❤️ Obrigado
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => setMessage('😊 Perfeito')}
          >
            😊 Perfeito
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.txt"
        onChange={handleFileUpload}
      />
    </div>
  )
}
