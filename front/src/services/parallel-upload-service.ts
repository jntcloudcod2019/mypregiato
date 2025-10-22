import { trainingService } from './training-service';
import { TrainingVideoUploadDto, VideoUploadResultDto } from '../types/training';

export interface ParallelUploadOptions {
  maxConcurrentUploads: number; // Máximo de uploads simultâneos
  onProgress?: (completed: number, total: number, currentUpload?: string) => void;
  onError?: (error: Error, uploadIndex: number) => void;
}

export interface UploadTask {
  index: number;
  data: TrainingVideoUploadDto;
  resolve: (result: VideoUploadResultDto) => void;
  reject: (error: Error) => void;
}

export class ParallelUploadService {
  private activeUploads = new Set<number>();
  private uploadQueue: UploadTask[] = [];
  private isProcessing = false;
  private options: ParallelUploadOptions;

  constructor(options: ParallelUploadOptions) {
    this.options = options;
  }

  /**
   * Adiciona um upload à fila
   */
  async addUpload(index: number, uploadData: TrainingVideoUploadDto): Promise<VideoUploadResultDto> {
    return new Promise((resolve, reject) => {
      this.uploadQueue.push({
        index,
        data: uploadData,
        resolve,
        reject
      });

      // Inicia o processamento se não estiver rodando
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Processa a fila de uploads com controle de concorrência
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log(`🚀 [PARALLEL-UPLOAD] Iniciando processamento da fila`);

    while (this.uploadQueue.length > 0 || this.activeUploads.size > 0) {
      // Inicia novos uploads até atingir o limite
      while (this.activeUploads.size < this.options.maxConcurrentUploads && this.uploadQueue.length > 0) {
        const task = this.uploadQueue.shift();
        if (task) {
          this.startUpload(task);
        }
      }

      // Aguarda um pouco antes de verificar novamente
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
    console.log(`✅ [PARALLEL-UPLOAD] Todos os uploads foram processados`);
  }

  /**
   * Inicia um upload individual
   */
  private async startUpload(task: UploadTask): Promise<void> {
    const { index, data, resolve, reject } = task;
    
    this.activeUploads.add(index);
    console.log(`🎬 [PARALLEL-UPLOAD] Iniciando upload ${index + 1} (${data.lessonTitle})`);
    
    try {
      const result = await trainingService.uploadVideo(data);
      
      console.log(`✅ [PARALLEL-UPLOAD] Upload ${index + 1} concluído`);
      resolve(result);
      
      // Notifica progresso
      this.options.onProgress?.(
        this.getCompletedCount(), 
        this.getTotalCount(), 
        data.lessonTitle
      );
      
    } catch (error) {
      console.error(`❌ [PARALLEL-UPLOAD] Erro no upload ${index + 1}:`, error);
      this.options.onError?.(error as Error, index);
      reject(error as Error);
    } finally {
      this.activeUploads.delete(index);
    }
  }

  /**
   * Retorna o número de uploads completados
   */
  private getCompletedCount(): number {
    return this.getTotalCount() - this.uploadQueue.length - this.activeUploads.size;
  }

  /**
   * Retorna o total de uploads
   */
  private getTotalCount(): number {
    return this.uploadQueue.length + this.activeUploads.size + this.getCompletedCount();
  }

  /**
   * Limpa a fila e cancela uploads ativos
   */
  clear(): void {
    this.uploadQueue = [];
    this.activeUploads.clear();
    this.isProcessing = false;
  }

  /**
   * Retorna o status atual
   */
  getStatus() {
    return {
      queueLength: this.uploadQueue.length,
      activeUploads: this.activeUploads.size,
      isProcessing: this.isProcessing,
      completed: this.getCompletedCount(),
      total: this.getTotalCount()
    };
  }
}

/**
 * Função utilitária para upload paralelo com controle de concorrência
 */
export async function uploadVideosInParallel(
  uploads: Array<{ index: number; data: TrainingVideoUploadDto }>,
  options: ParallelUploadOptions = { maxConcurrentUploads: 2 }
): Promise<VideoUploadResultDto[]> {
  const service = new ParallelUploadService(options);
  
  console.log(`🚀 [PARALLEL-UPLOAD] Iniciando ${uploads.length} uploads com máximo ${options.maxConcurrentUploads} simultâneos`);
  
  // Adiciona todos os uploads à fila
  const promises = uploads.map(({ index, data }) => 
    service.addUpload(index, data)
  );
  
  // Aguarda todos os uploads terminarem
  const results = await Promise.all(promises);
  
  console.log(`✅ [PARALLEL-UPLOAD] Todos os ${results.length} uploads foram concluídos`);
  return results;
}
