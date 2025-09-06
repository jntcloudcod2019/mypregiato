/**
 * ============================================================================
 * RENDERIZADOR COMPLETO DE MÍDIAS WHATSAPP
 * ============================================================================
 * 
 * Componente que renderiza TODOS os tipos de mídia suportados pelo WhatsApp:
 * - Imagens (JPG, PNG, GIF, WebP)
 * - Vídeos (MP4, WebM, MOV)
 * - Áudios (MP3, OGG, WAV)
 * - Notas de voz (PTT)
 * - Stickers/Figurinhas
 * - Documentos (PDF, DOC, etc.)
 * - Localização
 * - Contatos compartilhados
 * 
 * Todos os dados são recebidos em base64 via dataUrl
 * ============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  FileText, 
  MapPin, 
  User, 
  Volume2, 
  VolumeX,
  Maximize,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { MessageType } from '@/types/message';
import { cn } from '@/lib/utils';
import AdvancedAudioPlayer from '@/components/ui/advanced-audio-player';

interface MediaRendererProps {
  type: MessageType;
  dataUrl?: string;
  mediaUrl?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  duration?: number;
  thumbnail?: string;
  
  // Campos específicos para localização
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  
  // Campos específicos para contato
  contactName?: string;
  contactPhone?: string;
  
  // Props de estilo
  className?: string;
  maxWidth?: string;
  maxHeight?: string;
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({
  type,
  dataUrl,
  mediaUrl,
  fileName,
  mimeType,
  size,
  duration,
  thumbnail,
  latitude,
  longitude,
  locationAddress,
  contactName,
  contactPhone,
  className,
  maxWidth = "320px",
  maxHeight = "240px"
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // URL da mídia (prioriza dataUrl, senão mediaUrl)
  const mediaSource = dataUrl || mediaUrl;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = (mediaElement: HTMLAudioElement | HTMLVideoElement) => {
    if (isPlaying) {
      mediaElement.pause();
    } else {
      mediaElement.play().catch(err => {
        console.error('Erro ao reproduzir mídia:', err);
        setError('Erro ao reproduzir mídia');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = (mediaElement: HTMLAudioElement | HTMLVideoElement) => {
    setCurrentTime(mediaElement.currentTime);
    if (mediaElement.duration) {
      setMediaDuration(mediaElement.duration);
    }
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setIsLoading(false);
    setError(errorMessage);
    console.error('Erro na mídia:', errorMessage);
  };

  const openGoogleMaps = () => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(url, '_blank');
    }
  };

  const downloadFile = () => {
    if (mediaSource) {
      const link = document.createElement('a');
      link.href = mediaSource;
      link.download = fileName || 'arquivo';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Debug: verificar tipo recebido
  console.log('🔍 MediaRenderer recebeu tipo:', {
    type,
    typeOf: typeof type,
    isNumber: typeof type === 'number',
    isAudio: type === MessageType.Audio,
    isVoice: type === MessageType.Voice,
    MessageTypeAudio: MessageType.Audio,
    MessageTypeVoice: MessageType.Voice,
    dataUrl: dataUrl ? `${dataUrl.substring(0, 50)}...` : 'null',
    mediaUrl: mediaUrl ? `${mediaUrl.substring(0, 50)}...` : 'null'
  });

  // Renderização por tipo
  switch (type) {
    case MessageType.Image:
      return (
        <div className={cn("relative group", className)} style={{ maxWidth }}>
          {mediaSource ? (
            <div className="relative">
              <img
                src={mediaSource}
                alt={fileName || 'Imagem'}
                className="rounded-lg shadow-sm max-w-full h-auto object-contain cursor-pointer transition-transform hover:scale-[1.02]"
                style={{ maxHeight }}
                onLoad={handleLoadedData}
                onError={() => handleError('Erro ao carregar imagem')}
                onClick={() => setIsFullscreen(true)}
              />
              
              {/* Overlay com informações */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-end">
                <div className="w-full p-2 bg-gradient-to-t from-black/50 to-transparent rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-center text-white text-xs">
                    <span>{fileName}</span>
                    {size && <span>{formatFileSize(size)}</span>}
                  </div>
                </div>
              </div>

              {/* Botão de fullscreen */}
              <button
                onClick={() => setIsFullscreen(true)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
              <AlertCircle className="w-6 h-6 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Imagem não disponível</span>
            </div>
          )}
        </div>
      );

    case MessageType.Video:
      return (
        <div className={cn("relative group", className)} style={{ maxWidth }}>
          {mediaSource ? (
            <div className="relative">
              <video
                ref={videoRef}
                src={mediaSource}
                poster={thumbnail}
                className="rounded-lg shadow-sm max-w-full h-auto object-contain"
                style={{ maxHeight }}
                controls
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={() => handleTimeUpdate(videoRef.current!)}
                onLoadedData={handleLoadedData}
                onError={() => handleError('Erro ao carregar vídeo')}
              />
              
              {/* Informações do vídeo */}
              <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-center">
                  <span>{fileName || 'Vídeo'}</span>
                  <div className="flex gap-2">
                    {mediaDuration > 0 && <span>{formatDuration(mediaDuration)}</span>}
                    {size && <span>{formatFileSize(size)}</span>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
              <AlertCircle className="w-6 h-6 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Vídeo não disponível</span>
            </div>
          )}
        </div>
      );

    case MessageType.Audio:
    case MessageType.Voice:
      // Debug: log do áudio recebido
      console.log('🎵 DEBUG ÁUDIO - TIPO DETECTADO:', {
        type: type,
        typeNumber: typeof type === 'number' ? type : 'string',
        mediaSource: mediaSource ? `${mediaSource.substring(0, 100)}...` : 'null',
        mimeType,
        fileName,
        size,
        duration
      });
      
      // Debug adicional para verificar se o áudio está sendo carregado
      if (mediaSource) {
        console.log('🎵 DEBUG ÁUDIO - MediaSource válido:', {
          startsWithData: mediaSource.startsWith('data:'),
          mimeTypeFromData: mediaSource.split(';')[0],
          base64Length: mediaSource.split(',')[1]?.length || 0
        });
      }
      
      return (
        <div className={cn("flex items-center gap-3 p-3 bg-muted rounded-lg", className)} style={{ maxWidth }}>
          {mediaSource ? (
            <>
              <audio
                ref={audioRef}
                src={mediaSource}
                onPlay={() => {
                  console.log('🎵 Áudio iniciado');
                  setIsPlaying(true);
                }}
                onPause={() => {
                  console.log('🎵 Áudio pausado');
                  setIsPlaying(false);
                }}
                onTimeUpdate={() => handleTimeUpdate(audioRef.current!)}
                onLoadedData={() => {
                  console.log('🎵 Áudio carregado com sucesso');
                  handleLoadedData();
                }}
                onError={(e) => {
                  console.error('🎵 Erro no áudio:', e);
                  console.error('🎵 Detalhes do erro:', {
                    error: e,
                    audioElement: audioRef.current,
                    src: mediaSource
                  });
                  handleError('Erro ao carregar áudio');
                }}
                onCanPlay={() => console.log('🎵 Áudio pronto para reproduzir')}
                onLoadStart={() => console.log('🎵 Iniciando carregamento do áudio')}
                onLoad={() => console.log('🎵 Áudio carregado completamente')}
                onAbort={() => console.log('🎵 Carregamento do áudio abortado')}
                onSuspend={() => console.log('🎵 Carregamento do áudio suspenso')}
                preload="metadata"
                controls={false}
                style={{ display: 'none' }}
              />
              
              {/* Controles customizados */}
              <button
                onClick={() => handlePlayPause(audioRef.current!)}
                className="flex-shrink-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>

              {/* Informações do áudio */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {type === MessageType.Voice ? '🎤 Nota de Voz' : (fileName || '🎵 Áudio')}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {mediaDuration > 0 && (
                      <span>{formatDuration(currentTime)} / {formatDuration(mediaDuration)}</span>
                    )}
                    {size && <span>{formatFileSize(size)}</span>}
                  </div>
                </div>
                
                {/* Barra de progresso */}
                {mediaDuration > 0 && (
                  <div className="mt-2 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(currentTime / mediaDuration) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Controles de volume */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Áudio não disponível</span>
            </div>
          )}
        </div>
      );

    case MessageType.Sticker:
      return (
        <div className={cn("relative group", className)}>
          {mediaSource ? (
            <div className="relative inline-block">
              <img
                src={mediaSource}
                alt="Figurinha"
                className="rounded-lg max-w-[150px] max-h-[150px] object-contain hover:scale-105 transition-transform cursor-pointer"
                onLoad={handleLoadedData}
                onError={() => handleError('Erro ao carregar figurinha')}
              />
              
              {/* Label de figurinha */}
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                😀 Sticker
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
              <span className="text-2xl">😀</span>
              <span className="text-sm text-muted-foreground ml-2">Figurinha</span>
            </div>
          )}
        </div>
      );

    case MessageType.Document:
      return (
        <div className={cn("flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors", className)}>
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{fileName || 'Documento'}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {mimeType && <span>{mimeType}</span>}
              {size && <span>{formatFileSize(size)}</span>}
            </div>
          </div>
          
          {mediaSource && (
            <button
              onClick={downloadFile}
              className="flex-shrink-0 p-2 text-muted-foreground hover:text-primary transition-colors"
              title="Baixar arquivo"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </div>
      );

    case MessageType.Location:
      return (
        <div className={cn("border rounded-lg overflow-hidden", className)} style={{ maxWidth }}>
          {latitude && longitude ? (
            <>
              {/* Mapa estático ou thumbnail */}
              <div className="relative h-32 bg-muted flex items-center justify-center cursor-pointer" onClick={openGoogleMaps}>
                <MapPin className="w-8 h-8 text-primary" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent flex items-end">
                  <div className="p-2 text-white text-xs">
                    📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </div>
                </div>
              </div>
              
              {/* Informações da localização */}
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">📍 Localização Compartilhada</p>
                    {locationAddress && (
                      <p className="text-sm text-muted-foreground mt-1">{locationAddress}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                    </p>
                  </div>
                  
                  <button
                    onClick={openGoogleMaps}
                    className="p-1 text-primary hover:bg-primary/10 rounded"
                    title="Abrir no Google Maps"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 text-center">
              <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Localização não disponível</p>
            </div>
          )}
        </div>
      );

    case MessageType.Contact:
      return (
        <div className={cn("flex items-center gap-3 p-3 border rounded-lg", className)}>
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
            <User className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1">
            <p className="font-medium">👤 {contactName || 'Contato'}</p>
            {contactPhone && (
              <p className="text-sm text-muted-foreground">{contactPhone}</p>
            )}
          </div>
          
          {contactPhone && (
            <button
              onClick={() => window.open(`tel:${contactPhone}`, '_blank')}
              className="text-primary hover:bg-primary/10 p-2 rounded"
              title="Ligar"
            >
              📞
            </button>
          )}
        </div>
      );

    case MessageType.System:
      return (
        <div className={cn("flex items-center justify-center p-2 text-xs text-muted-foreground bg-muted/50 rounded", className)}>
          ⚙️ Mensagem do sistema
        </div>
      );

    default:
      console.error('❌ TIPO NÃO SUPORTADO no MediaRenderer:', {
        type,
        typeValue: type,
        typeNumber: typeof type === 'number' ? type : 'não é número',
        allMessageTypes: Object.entries(MessageType)
      });
      return (
        <div className={cn("flex items-center gap-2 p-3 bg-muted rounded-lg", className)}>
          <AlertCircle className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Tipo de mídia não suportado (tipo: {type})</span>
        </div>
      );
  }
};

export default MediaRenderer;
