/**
 * EXEMPLO DE IMPLEMENTAÇÃO DE UPLOAD SEQUENCIAL DE VÍDEOS
 * 
 * Este arquivo demonstra como fazer upload de múltiplos vídeos de forma sequencial
 * usando a API de upload em lote do Pregiato Management System
 * 
 * FLUXO:
 * 1. Iniciar um lote (obter BatchId)
 * 2. Para cada vídeo:
 *    - Fazer upload individual
 *    - Aguardar resposta com URL
 *    - Continuar para o próximo
 * 3. Verificar status final do lote
 */

// ========================================
// TIPOS E INTERFACES
// ========================================

interface TrainingVideoUploadDto {
  courseId?: string;
  lessonId?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  base64Data: string;
  courseTitle: string;
  lessonTitle: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
}

interface VideoUploadResultDto {
  success: boolean;
  objectName?: string;
  videoUrl?: string;
  presignedUrl?: string;
  errorMessage?: string;
  fileSize?: number;
  mimeType?: string;
}

interface BatchUploadInitDto {
  totalVideos: number;
  courseId?: string;
  courseName?: string;
}

interface BatchUploadResponseDto {
  batchId: string;
  totalVideos: number;
  createdAt: string;
  message: string;
}

interface BatchVideoUploadDto {
  batchId: string;
  videoIndex: number;
  videoData: TrainingVideoUploadDto;
}

interface BatchUploadStatusDto {
  batchId: string;
  totalVideos: number;
  uploadedVideos: number;
  failedVideos: number;
  progressPercentage: number;
  isCompleted: boolean;
  results: VideoUploadResultDto[];
  errors: string[];
  createdAt: string;
  completedAt?: string;
}

// ========================================
// CLASSE DE GERENCIAMENTO DE UPLOAD
// ========================================

export class VideoUploadManager {
  private apiBaseUrl: string;
  private onProgress?: (progress: number, videoIndex: number, total: number) => void;
  private onVideoUploaded?: (result: VideoUploadResultDto, videoIndex: number) => void;
  private onError?: (error: string, videoIndex: number) => void;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Configurar callbacks de progresso
   */
  setProgressCallback(callback: (progress: number, videoIndex: number, total: number) => void) {
    this.onProgress = callback;
  }

  setVideoUploadedCallback(callback: (result: VideoUploadResultDto, videoIndex: number) => void) {
    this.onVideoUploaded = callback;
  }

  setErrorCallback(callback: (error: string, videoIndex: number) => void) {
    this.onError = callback;
  }

  /**
   * Converter arquivo para Base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remover o prefixo "data:video/mp4;base64," se existir
        const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload de vídeo único (SEM lote)
   * Use este método quando tiver apenas UM vídeo
   */
  async uploadSingleVideo(
    file: File,
    courseTitle: string,
    lessonTitle: string
  ): Promise<VideoUploadResultDto> {
    try {
      console.log(`📤 Iniciando upload único: ${file.name}`);

      const base64Data = await this.fileToBase64(file);

      const uploadDto: TrainingVideoUploadDto = {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        base64Data: base64Data,
        courseTitle: courseTitle,
        lessonTitle: lessonTitle,
      };

      const response = await fetch(`${this.apiBaseUrl}/api/TrainingVideos/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadDto),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Erro no upload');
      }

      const result: VideoUploadResultDto = await response.json();
      console.log(`✅ Upload concluído: ${result.videoUrl}`);

      return result;
    } catch (error) {
      console.error(`❌ Erro no upload:`, error);
      throw error;
    }
  }

  /**
   * Upload sequencial de múltiplos vídeos usando sistema de lote
   * RECOMENDADO para múltiplos vídeos
   */
  async uploadMultipleVideosSequentially(
    files: File[],
    courseTitle: string,
    getLessonTitle: (file: File, index: number) => string
  ): Promise<BatchUploadStatusDto> {
    try {
      console.log(`📦 Iniciando upload em lote de ${files.length} vídeos`);

      // PASSO 1: Iniciar o lote
      const batchResponse = await this.initiateBatch(files.length, courseTitle);
      const batchId = batchResponse.batchId;

      console.log(`✅ Lote iniciado: ${batchId}`);

      // PASSO 2: Upload sequencial de cada vídeo
      const results: VideoUploadResultDto[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const lessonTitle = getLessonTitle(file, i);

        console.log(`📤 Uploading ${i + 1}/${files.length}: ${file.name}`);

        try {
          // Converter para Base64
          const base64Data = await this.fileToBase64(file);

          // Upload do vídeo
          const result = await this.uploadBatchVideo(
            batchId,
            i,
            file,
            base64Data,
            courseTitle,
            lessonTitle
          );

          results.push(result);

          // Notificar progresso
          const progress = ((i + 1) / files.length) * 100;
          this.onProgress?.(progress, i, files.length);

          if (result.success) {
            console.log(`✅ Vídeo ${i + 1} enviado: ${result.videoUrl}`);
            this.onVideoUploaded?.(result, i);
          } else {
            console.error(`❌ Falha no vídeo ${i + 1}: ${result.errorMessage}`);
            this.onError?.(result.errorMessage || 'Erro desconhecido', i);
          }

          // Pequeno delay entre uploads para não sobrecarregar o servidor
          if (i < files.length - 1) {
            await this.delay(500); // 500ms entre uploads
          }
        } catch (error) {
          console.error(`❌ Erro no upload do vídeo ${i + 1}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          this.onError?.(errorMessage, i);
          
          results.push({
            success: false,
            errorMessage: errorMessage,
          });
        }
      }

      // PASSO 3: Verificar status final
      const finalStatus = await this.getBatchStatus(batchId);
      
      console.log(`🎉 Upload em lote concluído!`);
      console.log(`✅ Sucesso: ${finalStatus.uploadedVideos}/${finalStatus.totalVideos}`);
      console.log(`❌ Falhas: ${finalStatus.failedVideos}/${finalStatus.totalVideos}`);

      return finalStatus;
    } catch (error) {
      console.error('❌ Erro no upload em lote:', error);
      throw error;
    }
  }

  /**
   * Iniciar um lote de upload
   */
  private async initiateBatch(
    totalVideos: number,
    courseName?: string
  ): Promise<BatchUploadResponseDto> {
    const initDto: BatchUploadInitDto = {
      totalVideos,
      courseName,
    };

    const response = await fetch(`${this.apiBaseUrl}/api/TrainingVideos/batch/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(initDto),
    });

    if (!response.ok) {
      throw new Error('Falha ao iniciar lote de upload');
    }

    return await response.json();
  }

  /**
   * Upload de vídeo individual dentro de um lote
   */
  private async uploadBatchVideo(
    batchId: string,
    videoIndex: number,
    file: File,
    base64Data: string,
    courseTitle: string,
    lessonTitle: string
  ): Promise<VideoUploadResultDto> {
    const batchUploadDto: BatchVideoUploadDto = {
      batchId,
      videoIndex,
      videoData: {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        base64Data: base64Data,
        courseTitle: courseTitle,
        lessonTitle: lessonTitle,
      },
    };

    const response = await fetch(`${this.apiBaseUrl}/api/TrainingVideos/batch/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchUploadDto),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Erro no upload');
    }

    return await response.json();
  }

  /**
   * Obter status de um lote
   */
  async getBatchStatus(batchId: string): Promise<BatchUploadStatusDto> {
    const response = await fetch(`${this.apiBaseUrl}/api/TrainingVideos/batch/${batchId}/status`);

    if (!response.ok) {
      throw new Error('Falha ao obter status do lote');
    }

    return await response.json();
  }

  /**
   * Delay auxiliar
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ========================================
// EXEMPLO DE USO EM REACT
// ========================================

export function ExampleReactComponent() {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [uploadedVideos, setUploadedVideos] = React.useState<VideoUploadResultDto[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = React.useState(0);
  const [totalVideos, setTotalVideos] = React.useState(0);

  const handleMultipleVideosUpload = async (files: FileList) => {
    setUploading(true);
    setProgress(0);
    setUploadedVideos([]);
    setTotalVideos(files.length);

    const uploadManager = new VideoUploadManager('http://localhost:5000');

    // Configurar callbacks
    uploadManager.setProgressCallback((progress, videoIndex, total) => {
      setProgress(progress);
      setCurrentVideoIndex(videoIndex + 1);
    });

    uploadManager.setVideoUploadedCallback((result, videoIndex) => {
      setUploadedVideos(prev => [...prev, result]);
      console.log(`Vídeo ${videoIndex + 1} URL: ${result.videoUrl}`);
    });

    uploadManager.setErrorCallback((error, videoIndex) => {
      console.error(`Erro no vídeo ${videoIndex + 1}:`, error);
      alert(`Erro no vídeo ${videoIndex + 1}: ${error}`);
    });

    try {
      // Upload sequencial
      const result = await uploadManager.uploadMultipleVideosSequentially(
        Array.from(files),
        'Meu Curso de Treinamento',
        (file, index) => `Aula ${index + 1} - ${file.name}`
      );

      alert(`Upload concluído!\nSucesso: ${result.uploadedVideos}\nFalhas: ${result.failedVideos}`);
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro no upload dos vídeos');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Upload de Vídeos</h2>
      
      <input
        type="file"
        multiple
        accept="video/*"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleMultipleVideosUpload(e.target.files);
          }
        }}
        disabled={uploading}
      />

      {uploading && (
        <div>
          <p>Fazendo upload: {currentVideoIndex}/{totalVideos}</p>
          <progress value={progress} max={100} />
          <p>{progress.toFixed(1)}% concluído</p>
        </div>
      )}

      {uploadedVideos.length > 0 && (
        <div>
          <h3>Vídeos Enviados:</h3>
          <ul>
            {uploadedVideos.map((video, index) => (
              <li key={index}>
                {video.success ? (
                  <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                    Vídeo {index + 1} - {video.videoUrl}
                  </a>
                ) : (
                  <span style={{ color: 'red' }}>Vídeo {index + 1} - Erro: {video.errorMessage}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ========================================
// EXEMPLO DE USO SIMPLES (Vanilla JS)
// ========================================

async function exampleSimpleUsage() {
  const uploadManager = new VideoUploadManager('http://localhost:5000');

  // EXEMPLO 1: Upload de vídeo único
  const singleFile = document.getElementById('video-input') as HTMLInputElement;
  if (singleFile.files && singleFile.files[0]) {
    const result = await uploadManager.uploadSingleVideo(
      singleFile.files[0],
      'Meu Curso',
      'Aula 1'
    );
    console.log('URL do vídeo:', result.videoUrl);
  }

  // EXEMPLO 2: Upload de múltiplos vídeos
  const multipleFiles = document.getElementById('videos-input') as HTMLInputElement;
  if (multipleFiles.files && multipleFiles.files.length > 0) {
    const status = await uploadManager.uploadMultipleVideosSequentially(
      Array.from(multipleFiles.files),
      'Meu Curso de Treinamento',
      (file, index) => `Aula ${index + 1}`
    );
    
    console.log('Resultado final:', status);
  }
}
