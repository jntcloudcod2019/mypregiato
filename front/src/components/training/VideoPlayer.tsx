import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Play, Pause, Maximize, RotateCcw, Settings } from 'lucide-react';
import { trainingService } from '@/services/training-service';
import { useToast } from '@/hooks/use-toast';
import { UpdateTrainingProgressDto } from '@/types/training';

interface VideoPlayerProps {
  videoUrl: string;
  objectName: string;
  enrollmentId: string;
  lessonId: string;
  userId: string;
  onProgressUpdate?: (progress: number) => void;
  onVideoComplete?: () => void;
  className?: string;
  autoPlay?: boolean;
  showControls?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  objectName,
  enrollmentId,
  lessonId,
  userId,
  onProgressUpdate,
  onVideoComplete,
  className,
  autoPlay = false,
  showControls = true,
}) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Estados do player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [lastSavedPosition, setLastSavedPosition] = useState(0);

  // Atualizar tempo do vídeo
  const updateTime = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      // Calcular progresso percentual
      const progress = duration > 0 ? (time / duration) * 100 : 0;
      onProgressUpdate?.(progress);
      
      // Salvar posição a cada 5 segundos
      if (Math.abs(time - lastSavedPosition) >= 5) {
        saveProgress(time);
        setLastSavedPosition(time);
      }
    }
  }, [duration, onProgressUpdate, lastSavedPosition]);

  // Salvar progresso no backend
  const saveProgress = useCallback(async (time: number) => {
    try {
      const progress: UpdateTrainingProgressDto = {
        lessonId,
        watchedSeconds: time,
        lastPositionSeconds: time,
        isCompleted: time >= duration * 0.95, // 95% considerado completo
      };
      
      await trainingService.updateProgress(enrollmentId, progress);
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  }, [enrollmentId, lessonId, duration]);

  // Eventos do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onVideoComplete?.();
      
      // Marcar como concluído
      saveProgress(duration);
    };

    const handleError = () => {
      setError('Erro ao carregar o vídeo');
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      updateTime();
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    // Event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [updateTime, saveProgress, duration, onVideoComplete]);

  // Controlar play/pause
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  // Controlar volume
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, []);

  // Controlar posição
  const handleSeek = useCallback((value: number[]) => {
    const newTime = value[0];
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Alterar velocidade de reprodução
  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }, []);

  // Formatar tempo
  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showControls) return;
      
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          togglePlay();
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
        case 'ArrowLeft':
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          }
          break;
        case 'ArrowRight':
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showControls, togglePlay, toggleMute, toggleFullscreen, duration]);

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative bg-black rounded-lg overflow-hidden">
          {/* Vídeo */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-auto"
            preload="metadata"
            autoPlay={autoPlay}
          />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="flex items-center space-x-2 text-white">
                <RotateCcw className="h-6 w-6 animate-spin" />
                <span>Carregando...</span>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center text-white">
                <p className="text-lg font-medium mb-2">Erro ao carregar vídeo</p>
                <p className="text-sm opacity-75">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="mt-4"
                >
                  Recarregar
                </Button>
              </div>
            </div>
          )}

          {/* Controles */}
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              {/* Barra de progresso */}
              <div className="mb-4">
                <Slider
                  value={[currentTime]}
                  max={duration || 0}
                  step={1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
              </div>

              {/* Controles principais */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  {/* Volume */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-white hover:bg-opacity-20"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <Slider
                      value={[volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-20"
                    />
                  </div>

                  {/* Tempo */}
                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Configurações */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                      className="text-white hover:bg-white hover:bg-opacity-20"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                    
                    {showSettings && (
                      <div className="absolute bottom-12 right-0 bg-black bg-opacity-90 rounded-lg p-2 min-w-32">
                        <div className="text-white text-sm mb-2">Velocidade</div>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => {
                              handlePlaybackRateChange(rate);
                              setShowSettings(false);
                            }}
                            className={`block w-full text-left px-2 py-1 text-sm hover:bg-white hover:bg-opacity-20 rounded ${
                              playbackRate === rate ? 'bg-white bg-opacity-20' : ''
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fullscreen */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
