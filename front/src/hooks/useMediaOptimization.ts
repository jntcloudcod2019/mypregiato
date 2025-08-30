/**
 * ============================================================================
 * HOOK DE OTIMIZAÇÃO DE MÍDIA PARA WHATSAPP
 * ============================================================================
 * 
 * Hook para otimizar performance de mídias base64 pesadas:
 * - Lazy loading de mídias grandes
 * - Cache inteligente de base64
 * - Compressão de imagens
 * - Thumbnails para vídeos
 * - Preload de áudios
 * ============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageType } from '@/types/message';

interface MediaOptimizationOptions {
  maxImageSize?: number;      // Tamanho máximo de imagem em bytes
  maxVideoSize?: number;      // Tamanho máximo de vídeo em bytes
  enableCache?: boolean;      // Ativar cache
  enableLazyLoad?: boolean;   // Ativar lazy loading
  compressionQuality?: number; // Qualidade de compressão (0-1)
}

interface OptimizedMedia {
  originalSize: number;
  optimizedSize: number;
  dataUrl: string;
  thumbnail?: string;
  isCompressed: boolean;
  compressionRatio: number;
}

const DEFAULT_OPTIONS: MediaOptimizationOptions = {
  maxImageSize: 2 * 1024 * 1024,    // 2MB
  maxVideoSize: 10 * 1024 * 1024,   // 10MB
  enableCache: true,
  enableLazyLoad: true,
  compressionQuality: 0.8
};

// Cache global para mídias otimizadas
const mediaCache = new Map<string, OptimizedMedia>();
const cacheStats = {
  hits: 0,
  misses: 0,
  totalSaved: 0
};

export const useMediaOptimization = (options: MediaOptimizationOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStats, setOptimizationStats] = useState(cacheStats);
  
  // Worker para compressão em background (se disponível)
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Tentar criar worker para compressão se o browser suportar
    if (typeof Worker !== 'undefined') {
      try {
        const workerCode = `
          self.onmessage = function(e) {
            const { imageData, quality } = e.data;
            
            // Simular compressão (em produção usaria canvas)
            setTimeout(() => {
              self.postMessage({
                success: true,
                compressedData: imageData, // Em produção seria comprimido
                originalSize: imageData.length,
                compressedSize: Math.floor(imageData.length * quality)
              });
            }, 100);
          };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        workerRef.current = new Worker(URL.createObjectURL(blob));
      } catch (error) {
        console.warn('Worker não disponível, usando compressão principal thread');
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const getCacheKey = (dataUrl: string, type: MessageType): string => {
    // Usar hash simples do início e fim da string para chave única
    const start = dataUrl.substring(0, 50);
    const end = dataUrl.substring(dataUrl.length - 50);
    return `${type}_${btoa(start + end)}`;
  };

  const getDataUrlSize = (dataUrl: string): number => {
    // Calcular tamanho aproximado do base64
    const base64Data = dataUrl.split(',')[1] || dataUrl;
    return Math.floor(base64Data.length * 0.75); // base64 é ~33% maior que binário
  };

  const compressImage = async (dataUrl: string, quality: number = opts.compressionQuality!): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular dimensões mantendo aspect ratio
        let { width, height } = img;
        const maxDimension = 1920; // Max 1920px

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Desenhar e comprimir
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        resolve(compressedDataUrl);
      };

      img.onerror = () => resolve(dataUrl); // Fallback para original
      img.src = dataUrl;
    });
  };

  const generateVideoThumbnail = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadeddata = () => {
        // Ir para 1 segundo do vídeo
        video.currentTime = 1;
      };

      video.onseeked = () => {
        canvas.width = 320; // Thumbnail pequeno
        canvas.height = (video.videoHeight / video.videoWidth) * 320;
        
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        
        resolve(thumbnail);
      };

      video.onerror = () => resolve(''); // Sem thumbnail se falhar
      video.src = dataUrl;
    });
  };

  const optimizeMedia = useCallback(async (
    dataUrl: string,
    type: MessageType,
    fileName?: string
  ): Promise<OptimizedMedia> => {
    const cacheKey = getCacheKey(dataUrl, type);
    
    // Verificar cache primeiro
    if (opts.enableCache && mediaCache.has(cacheKey)) {
      cacheStats.hits++;
      setOptimizationStats({ ...cacheStats });
      return mediaCache.get(cacheKey)!;
    }

    cacheStats.misses++;
    setIsOptimizing(true);

    try {
      const originalSize = getDataUrlSize(dataUrl);
      let optimizedDataUrl = dataUrl;
      let thumbnail: string | undefined;
      let isCompressed = false;

      // Processar baseado no tipo
      switch (type) {
        case MessageType.Image:
          if (originalSize > opts.maxImageSize!) {
            optimizedDataUrl = await compressImage(dataUrl);
            isCompressed = true;
          }
          break;

        case MessageType.Video:
          // Gerar thumbnail para vídeos
          thumbnail = await generateVideoThumbnail(dataUrl);
          
          // Se vídeo muito grande, manter só thumbnail para preview
          if (originalSize > opts.maxVideoSize!) {
            console.warn(`Vídeo muito grande (${originalSize} bytes), usando apenas thumbnail`);
          }
          break;

        case MessageType.Sticker:
          // Stickers geralmente são pequenos, mas garantir tamanho máximo
          if (originalSize > 512 * 1024) { // 512KB max para stickers
            optimizedDataUrl = await compressImage(dataUrl, 0.9);
            isCompressed = true;
          }
          break;
      }

      const optimizedSize = getDataUrlSize(optimizedDataUrl);
      const compressionRatio = originalSize > 0 ? (originalSize - optimizedSize) / originalSize : 0;

      const result: OptimizedMedia = {
        originalSize,
        optimizedSize,
        dataUrl: optimizedDataUrl,
        thumbnail,
        isCompressed,
        compressionRatio
      };

      // Salvar no cache
      if (opts.enableCache) {
        mediaCache.set(cacheKey, result);
        cacheStats.totalSaved += (originalSize - optimizedSize);
      }

      setOptimizationStats({ ...cacheStats });
      return result;

    } catch (error) {
      console.error('Erro na otimização de mídia:', error);
      
      // Retornar dados originais em caso de erro
      return {
        originalSize: getDataUrlSize(dataUrl),
        optimizedSize: getDataUrlSize(dataUrl),
        dataUrl,
        isCompressed: false,
        compressionRatio: 0
      };
    } finally {
      setIsOptimizing(false);
    }
  }, [opts]);

  const preloadAudio = useCallback((dataUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000); // Timeout de 5s

      audio.oncanplay = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      audio.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      audio.src = dataUrl;
    });
  }, []);

  const clearCache = useCallback(() => {
    mediaCache.clear();
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    cacheStats.totalSaved = 0;
    setOptimizationStats({ ...cacheStats });
  }, []);

  const getCacheStats = useCallback(() => {
    const cacheSize = mediaCache.size;
    const hitRate = cacheStats.hits + cacheStats.misses > 0 
      ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100 
      : 0;

    return {
      ...cacheStats,
      cacheSize,
      hitRate: parseFloat(hitRate.toFixed(2)),
      totalSavedMB: parseFloat((cacheStats.totalSaved / (1024 * 1024)).toFixed(2))
    };
  }, []);

  const shouldLazyLoad = useCallback((type: MessageType, size?: number): boolean => {
    if (!opts.enableLazyLoad) return false;
    
    // Lazy load para mídias grandes
    if (size && size > 1024 * 1024) return true; // > 1MB
    
    // Sempre lazy load para vídeos
    if (type === MessageType.Video) return true;
    
    return false;
  }, [opts.enableLazyLoad]);

  return {
    optimizeMedia,
    preloadAudio,
    isOptimizing,
    clearCache,
    getCacheStats,
    shouldLazyLoad,
    optimizationStats
  };
};

// Hook simplificado para uso comum
export const useQuickMediaOptimization = () => {
  return useMediaOptimization({
    enableCache: true,
    enableLazyLoad: true,
    compressionQuality: 0.8
  });
};

export default useMediaOptimization;
