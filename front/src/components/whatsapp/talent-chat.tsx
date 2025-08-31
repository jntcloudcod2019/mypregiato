import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import MediaRenderer from './media-renderer'
import { MessageType } from '@/types/message'
import { 
  Send, 
  Paperclip, 
  Phone, 
  PhoneCall, 
  Check, 
  CheckCheck,
  Clock,
  AlertCircle,
  Smile,
  MoreVertical,
  X,
  Mic,
  Image as ImageIcon,
  User
} from 'lucide-react'
import { TalentData } from '@/types/talent'
import { useTalentChat, Message } from '@/hooks/useTalentChat'
import { cn } from '../../lib/utils'

interface TalentChatProps {
  talent: TalentData
  onClose: () => void
}

export const TalentChat: React.FC<TalentChatProps> = ({ talent, onClose }) => {
  const [message, setMessage] = useState('')
  const [isCallActive, setIsCallActive] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [newMessageAnimation, setNewMessageAnimation] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const { conversation, messages, loading, error, sending, sendMessage, markAsRead, refresh } = useTalentChat(talent.id)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (conversation) {
      markAsRead()
    }
  }, [conversation, markAsRead])

  // Detectar nova mensagem e aplicar animação
  useEffect(() => {
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.direction === 'incoming') {
        setNewMessageAnimation(lastMessage.id)
        setTimeout(() => {
          setNewMessageAnimation(null)
        }, 2000)
      }
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return

    try {
      await sendMessage(message)
      setMessage('')
      setIsTyping(false)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    setIsTyping(e.target.value.length > 0)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await sendMessage('', 'document', file.name)
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const handleAudioCall = () => {
    setIsCallActive(!isCallActive)
  }

  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const quickReplies = [
    { text: '👍 Ok', emoji: '👍' },
    { text: '❤️ Obrigado', emoji: '❤️' },
    { text: '😊 Perfeito', emoji: '😊' },
    { text: '👋 Olá', emoji: '👋' },
    { text: '🔥 Incrível', emoji: '🔥' },
    { text: '💪 Vamos lá', emoji: '💪' }
  ]

  return (
    <Card className="flex flex-col h-[600px] overflow-hidden shadow-2xl border-0 bg-gradient-to-b from-background to-muted/30">
      {/* Header com design moderno */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground">{talent.fullName}</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{talent.phone}</span>
                <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 px-2 py-0.5">
                  Online
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleAudioCall}
              disabled={isCallActive}
              className={cn(
                "hover:bg-primary/20 transition-all duration-200",
                isCallActive && "bg-green-500 text-white animate-pulse"
              )}
            >
              {isCallActive ? <PhoneCall className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-muted/50">
              <MoreVertical className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-red-50 hover:text-red-600">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {isCallActive && (
          <div className="absolute inset-x-0 top-full bg-green-500 text-white px-4 py-2 flex items-center justify-center gap-2 animate-fade-in">
            <PhoneCall className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">Chamada em andamento...</span>
          </div>
        )}
      </div>

      {/* Messages com scroll suave */}
      <ScrollArea className="flex-1 bg-gradient-to-b from-muted/10 to-muted/30">
        <div className="p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className={cn(
                "flex animate-fade-in",
                msg.direction === 'outgoing' ? 'justify-end' : 'justify-start',
                newMessageAnimation === msg.id && msg.direction === 'incoming' && "animate-pulse"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={cn(
                  "group relative max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md",
                  msg.direction === 'outgoing'
                    ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md'
                    : 'bg-gradient-to-br from-card to-muted/50 border border-border/50 rounded-bl-md',
                  newMessageAnimation === msg.id && msg.direction === 'incoming' && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                )}
              >
                {/* Renderizador unificado de mídia */}
                {(msg.mediaUrl || msg.attachment) && (
                  <div className="mb-3">
                    <MediaRenderer
                      type={msg.type}
                      dataUrl={msg.attachment?.dataUrl}
                      mediaUrl={msg.mediaUrl}
                      fileName={msg.fileName}
                      mimeType={msg.attachment?.mimeType}
                      size={msg.attachment?.fileSize}
                      duration={msg.attachment?.duration}
                      thumbnail={msg.thumbnail}
                      latitude={msg.latitude}
                      longitude={msg.longitude}
                      locationAddress={msg.locationAddress}
                      contactName={msg.contactName}
                      contactPhone={msg.contactPhone}
                    />
                  </div>
                )}
                
                {/* Não exibir texto para mensagens de áudio/mídia que só contêm base64 */}
                {msg.body && !isMediaOnlyMessage(msg) && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                )}
                
                <div className="flex items-center justify-between mt-2 pt-1">
                  <span className={cn(
                    "text-xs opacity-70",
                    msg.direction === 'outgoing' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}>
                    {formatTime(msg.createdAt)}
                  </span>
                  
                  {msg.direction === 'outgoing' && (
                    <div className="ml-2">
                      {getMessageStatusIcon(msg.status)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 border border-border/50">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick replies */}
      <div className="px-4 py-2 bg-muted/30 border-t border-border/30">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickReplies.map((reply, index) => (
            <Button
              key={`${reply.text}-${index}`}
              variant="outline"
              size="sm"
              onClick={() => setMessage(reply.text)}
              className="flex-shrink-0 text-xs hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
            >
              {reply.text}
            </Button>
          ))}
        </div>
      </div>

      {/* Message Input com design WhatsApp-like */}
      <div className="p-4 bg-background border-t border-border/50">
        <div className="flex items-end gap-3">
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="hover:bg-primary/10 text-primary"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              disabled={loading}
              className="hover:bg-primary/10 text-primary"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="min-h-[44px] max-h-[120px] resize-none rounded-full border-border/50 bg-muted/30 px-4 py-3 pr-12 focus:bg-background focus:border-primary/50 transition-all duration-200"
              disabled={loading}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-primary/10 text-muted-foreground"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            {message.trim() ? (
              <Button 
                onClick={handleSendMessage}
                disabled={!message.trim() || loading}
                className="rounded-full w-11 h-11 p-0 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Send className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-11 h-11 hover:bg-primary/10 text-primary"
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.txt"
        onChange={handleFileUpload}
      />
    </Card>
  )
}
