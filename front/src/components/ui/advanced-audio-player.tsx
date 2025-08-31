/**
 * ============================================================================
 * PLAYER DE ÁUDIO AVANÇADO - WHATSAPP STYLE
 * ============================================================================
 * 
 * Componente completo de áudio com:
 * - Controles customizados
 * - Visualização de forma de onda
 * - Suporte a diferentes formatos
 * - Debug integrado
 * ============================================================================
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download,
  AlertCircle,
  Loader2,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AudioProcessor, { AudioPlayer, AudioDebugger, AudioMetadata } from '@/utils/audio-utils';

interface AdvancedAudioPlayerProps {
  src: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  duration?: number;
  autoAnalyze?: boolean;
  showDebug?: boolean;
  className?: string;
  variant?: 'compact' | 'full' | 'minimal';
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

export const AdvancedAudioPlayer: React.FC<AdvancedAudioPlayerProps> = ({
  src,
  fileName,
  mimeType = 'audio/mpeg',
  size,
  duration: initialDuration,
  autoAnalyze = true,
  showDebug = false,
  className,
  variant = 'full',
  onPlay,
  onPause,
  onEnded,
  onError
}) => {
  // Estado do player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);

  // Refs
  const playerRef = useRef<AudioPlayer | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Debug
  useEffect(() => {
    if (showDebug) {
      console.log('🎵 AdvancedAudioPlayer montado:', {
        src: src.substring(0, 100) + '...',
        fileName,
        mimeType,
        size,
        duration: initialDuration
      });
    }
  }, [src, fileName, mimeType, size, initialDuration, showDebug]);

  // Inicializar player
  useEffect(() => {
    if (!src) return;

    const player = new AudioPlayer(src);
    playerRef.current = player;

    // Event listeners
    player.on('loadstart', () => {
      setIsLoading(true);
      setError(null);
      if (showDebug) console.log('🎵 Carregamento iniciado');
    });

    player.on('loadedmetadata', () => {
      setDuration(player.duration);
      setIsLoading(false);
      if (showDebug) console.log('🎵 Metadata carregada:', player.duration);
    });

    player.on('canplay', () => {
      setIsLoading(false);
      if (showDebug) console.log('🎵 Pronto para reproduzir');
    });

    player.on('play', () => {
      setIsPlaying(true);
      onPlay?.();
      if (showDebug) console.log('🎵 Reprodução iniciada');
    });

    player.on('pause', () => {
      setIsPlaying(false);
      onPause?.();
      if (showDebug) console.log('🎵 Reprodução pausada');
    });

    player.on('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
      if (showDebug) console.log('🎵 Reprodução finalizada');
    });

    player.on('timeupdate', () => {
      setCurrentTime(player.currentTime);
    });

    player.on('volumechange', () => {
      setVolume(player.volume);
      setIsMuted(player.muted);
    });

    player.on('error', () => {
      const errorMsg = 'Erro ao carregar áudio';
      setError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
      if (showDebug) console.error('🎵 Erro no player');
    });

    // Analisar metadata se solicitado
    if (autoAnalyze && src.includes('base64')) {
      analyzeAudio();
    }

    return () => {
      player.destroy();
    };
  }, [src, autoAnalyze, showDebug]);

  // Analisar áudio
  const analyzeAudio = useCallback(async () => {
    if (!src.includes('base64')) return;

    try {
      const base64Data = src.split(',')[1];
      const metadata = await AudioProcessor.analyzeAudioMetadata(base64Data, mimeType);
      setMetadata(metadata);
      
      if (showDebug) {
        console.log('🎵 Metadata analisada:', metadata);
      }
    } catch (error) {
      if (showDebug) {
        console.error('🎵 Erro ao analisar metadata:', error);
      }
    }
  }, [src, mimeType, showDebug]);

  // Controles
  const handlePlayPause = useCallback(async () => {
    if (!playerRef.current) return;

    try {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        await playerRef.current.play();
      }
    } catch (error) {
      const errorMsg = 'Erro ao reproduzir áudio';
      setError(errorMsg);
      onError?.(errorMsg);
      if (showDebug) console.error('🎵 Erro no play/pause:', error);
    }
  }, [isPlaying, showDebug]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    playerRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleVolumeToggle = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.muted = !playerRef.current.muted;
  }, []);

  const handleDownload = useCallback(() => {
    if (!src) return;
    
    const link = document.createElement('a');
    link.href = src;
    link.download = fileName || 'audio.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [src, fileName]);

  const skip = useCallback((seconds: number) => {
    if (!playerRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    playerRef.current.currentTime = newTime;
  }, [currentTime, duration]);

  // Formatadores
  const formatTime = (seconds: number) => AudioProcessor.formatDuration(seconds);
  const formatSize = (bytes?: number) => bytes ? AudioProcessor.formatFileSize(bytes) : '';

  // Renderização condicional por variante
  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <button
          onClick={handlePlayPause}
          disabled={isLoading || !!error}
          className="flex-shrink-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
        
        <span className="text-sm text-muted-foreground">
          {error ? 'Erro' : fileName || 'Áudio'}
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-3 p-3 bg-muted rounded-lg", className)}>
        <button
          onClick={handlePlayPause}
          disabled={isLoading || !!error}
          className="flex-shrink-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">
              {fileName || '🎵 Áudio'}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {duration > 0 && <span>{formatTime(currentTime)} / {formatTime(duration)}</span>}
              {size && <span>{formatSize(size)}</span>}
            </div>
          </div>
          
          {duration > 0 && (
            <div 
              ref={progressBarRef}
              onClick={handleSeek}
              className="mt-2 h-1 bg-muted-foreground/20 rounded-full overflow-hidden cursor-pointer"
            >
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          )}
        </div>

        {error && <AlertCircle className="w-4 h-4 text-destructive" />}
      </div>
    );
  }

  // Variante full
  return (
    <div className={cn("p-4 bg-card border rounded-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded">
            <Volume2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{fileName || 'Áudio'}</p>
            <p className="text-xs text-muted-foreground">
              {mimeType} {size && `• ${formatSize(size)}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {src && (
            <button
              onClick={handleDownload}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Baixar áudio"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Controles principais */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => skip(-10)}
          disabled={isLoading || !!error}
          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
          title="Voltar 10s"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={handlePlayPause}
          disabled={isLoading || !!error}
          className="flex-shrink-0 p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => skip(10)}
          disabled={isLoading || !!error}
          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
          title="Avançar 10s"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleVolumeToggle}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          <div className="text-xs text-muted-foreground">
            {duration > 0 ? (
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            ) : (
              <span>--:-- / --:--</span>
            )}
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      {duration > 0 && (
        <div 
          ref={progressBarRef}
          onClick={handleSeek}
          className="h-2 bg-muted rounded-full overflow-hidden cursor-pointer mb-3 group"
        >
          <div 
            className="h-full bg-primary transition-all group-hover:bg-primary/80"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      )}

      {/* Informações e debug */}
      {(error || metadata || showDebug) && (
        <div className="space-y-2 text-xs">
          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
          
          {metadata && (
            <div className="text-muted-foreground">
              <span>Formato: {metadata.format}</span>
              {metadata.duration && <span> • Duração: {formatTime(metadata.duration)}</span>}
              <span> • Válido: {metadata.isValid ? '✅' : '❌'}</span>
            </div>
          )}
          
          {showDebug && (
            <div className="font-mono text-muted-foreground bg-muted/50 p-2 rounded">
              <div>Ready State: {playerRef.current?.readyState}</div>
              <div>Current Time: {currentTime.toFixed(2)}s</div>
              <div>Volume: {Math.round(volume * 100)}%</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedAudioPlayer;
