// Serviço para cache e streaming de vídeos do MinIO
import { apiClient } from './api-client';

interface BlobResponse {
  data: Blob;
}

interface MinIOVideoCache {
  url: string;
  blobUrl: string;
}

class MinIOCacheService {
  private cache = new Map<string, MinIOVideoCache>();

  /**
   * Obtém um vídeo do MinIO e cria um blob URL para streaming
   */
  async getVideoStream(videoUrl: string): Promise<string> {
    try {
      console.log('🎬 [MINIO-CACHE] Buscando vídeo:', videoUrl);

      // Verificar cache primeiro
      const cached = this.cache.get(videoUrl);
      if (cached) {
        console.log('✅ [MINIO-CACHE] Usando cache:', videoUrl);
        return cached.blobUrl;
      }

      // Fazer download do vídeo
      const blob = await this.downloadVideoFromMinIO(videoUrl);
      
      // Criar blob URL
      const blobUrl = URL.createObjectURL(blob);
      
      // Salvar no cache
      this.cache.set(videoUrl, {
        url: videoUrl,
        blobUrl
      });

      console.log('✅ [MINIO-CACHE] Vídeo carregado e cacheado:', videoUrl);
      return blobUrl;

    } catch (error) {
      console.error('❌ [MINIO-CACHE] Erro ao carregar vídeo:', error);
      throw error;
    }
  }

  /**
   * Faz download do vídeo do MinIO via API backend
   */
  private async downloadVideoFromMinIO(videoUrl: string): Promise<Blob> {
    try {
      console.log('📥 [MINIO-CACHE] Fazendo download via API:', videoUrl);
      
      // Extrair objectName da URL
      const objectName = this.extractObjectNameFromUrl(videoUrl);
      
      // Chamar endpoint do backend para fazer download
      const response = await apiClient.get(`/api/TrainingVideos/download/${encodeURIComponent(objectName)}`, {
        responseType: 'blob'
      }) as BlobResponse;

      console.log('✅ [MINIO-CACHE] Download concluído:', objectName);
      return response.data;

    } catch (error) {
      console.error('❌ [MINIO-CACHE] Erro no download:', error);
      throw new Error(`Falha ao baixar vídeo: ${error}`);
    }
  }

  /**
   * Extrai o objectName da URL do MinIO
   */
  private extractObjectNameFromUrl(videoUrl: string): string {
    try {
      // URL: https://bucket-production-1aef.up.railway.app/midias/Course/...
      const url = new URL(videoUrl);
      const pathParts = url.pathname.split('/');
      
      // Remover 'midias' e juntar o resto
      const midiasIndex = pathParts.indexOf('midias');
      if (midiasIndex !== -1 && midiasIndex < pathParts.length - 1) {
        return pathParts.slice(midiasIndex + 1).join('/');
      }
      
      throw new Error('URL do MinIO inválida');
    } catch (error) {
      console.error('❌ [MINIO-CACHE] Erro ao extrair objectName:', error);
      throw new Error('URL do vídeo inválida');
    }
  }

 
 
}

// Instância singleton
export const minioCacheService = new MinIOCacheService();
