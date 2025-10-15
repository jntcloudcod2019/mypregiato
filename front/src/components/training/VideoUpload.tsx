import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Play, Pause, RotateCcw } from 'lucide-react';
import { trainingService } from '@/services/training-service';
import { useToast } from '@/hooks/use-toast';
import { TrainingVideoUploadDto, VideoUploadResultDto } from '@/types/training';

interface VideoUploadProps {
  courseId: string;
  lessonId: string;
  onUploadComplete?: (result: VideoUploadResultDto) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

// ✅ CONFIGURAÇÕES DINÂMICAS BASEADAS NO TAMANHO DO ARQUIVO
const getDynamicChunkSize = (fileSize: number): number => {
  // Para arquivos pequenos (< 10MB): chunk de 1MB
  if (fileSize < 10 * 1024 * 1024) {
    return 1 * 1024 * 1024; // 1MB
  }
  // Para arquivos médios (10MB - 100MB): chunk de 5MB
  else if (fileSize < 100 * 1024 * 1024) {
    return 5 * 1024 * 1024; // 5MB
  }
  // Para arquivos grandes (100MB - 1GB): chunk de 10MB
  else if (fileSize < 1024 * 1024 * 1024) {
    return 10 * 1024 * 1024; // 10MB
  }
  // Para arquivos muito grandes (> 1GB): chunk de 20MB
  else {
    return 20 * 1024 * 1024; // 20MB
  }
};

const getDynamicMaxFileSize = (fileSize: number): number => {
  // Aceitar qualquer tamanho de arquivo, mas com limites de segurança
  const maxAllowed = 5 * 1024 * 1024 * 1024; // 5GB máximo absoluto
  return Math.min(fileSize, maxAllowed);
};

export const VideoUpload: React.FC<VideoUploadProps> = ({
  courseId,
  lessonId,
  onUploadComplete,
  onUploadStart,
  onUploadError,
  className,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<{
    duration?: number;
    size?: number;
    type?: string;
  }>({});

  // ✅ VALIDAÇÃO DINÂMICA BASEADA NO TAMANHO DO ARQUIVO
  const validateFile = useCallback((file: File): string | null => {
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    
    if (!validTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use MP4, WebM, MOV ou AVI.';
    }
    
    // ✅ USAR TAMANHO MÁXIMO DINÂMICO
    const dynamicMaxSize = getDynamicMaxFileSize(file.size);
    const maxAllowed = 5 * 1024 * 1024 * 1024; // 5GB máximo absoluto
    
    if (file.size > maxAllowed) {
      return `Arquivo muito grande. Tamanho máximo permitido: ${Math.round(maxAllowed / 1024 / 1024 / 1024)}GB`;
    }
    
    return null;
  }, []);

  // Processar arquivo selecionado
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      toast({
        title: 'Arquivo inválido',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    
    // Criar preview do vídeo
    const videoUrl = URL.createObjectURL(file);
    setVideoPreview(videoUrl);
    
    // Obter metadados do vídeo
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      setVideoMetadata({
        duration: video.duration,
        size: file.size,
        type: file.type,
      });
      URL.revokeObjectURL(videoUrl);
    };
    video.src = videoUrl;
  }, [validateFile, toast]);

  // ✅ UPLOAD EM CHUNKS COM TAMANHO DINÂMICO
  const uploadInChunks = useCallback(async (file: File): Promise<VideoUploadResultDto> => {
    // ✅ CALCULAR CHUNK_SIZE DINÂMICO BASEADO NO TAMANHO DO ARQUIVO
    const dynamicChunkSize = getDynamicChunkSize(file.size);
    const totalChunks = Math.ceil(file.size / dynamicChunkSize);
    let uploadedChunks = 0;
    
    console.log(`📊 [Upload] Arquivo: ${formatFileSize(file.size)}`);
    console.log(`📊 [Upload] Chunk Size: ${formatFileSize(dynamicChunkSize)}`);
    console.log(`📊 [Upload] Total de Chunks: ${totalChunks}`);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * dynamicChunkSize;
      const end = Math.min(start + dynamicChunkSize, file.size);
      const chunk = file.slice(start, end);
      
      // Converter chunk para base64
      const base64Chunk = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:video/mp4;base64,
        };
        reader.readAsDataURL(chunk);
      });
      
      const uploadDto: TrainingVideoUploadDto = {
        courseId,
        lessonId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        chunkIndex: i,
        totalChunks,
      };
      
      try {
        const result = await trainingService.uploadVideoChunk(uploadDto, base64Chunk);
        
        uploadedChunks++;
        const progress = Math.round((uploadedChunks / totalChunks) * 100);
        setUploadProgress(progress);
        
        // Se é o último chunk, retornar resultado
        if (i === totalChunks - 1) {
          return result;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        throw new Error(`Erro no chunk ${i + 1}: ${errorMessage}`);
      }
    }
    
    throw new Error('Upload incompleto');
  }, [courseId, lessonId]);

  // ✅ UPLOAD DIRETO REFATORADO: Usar novo endpoint
  const uploadDirect = useCallback(async (file: File): Promise<VideoUploadResultDto> => {
    // Converter arquivo para base64
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:video/mp4;base64,
      };
      reader.readAsDataURL(file);
    });
    
    const uploadDto: TrainingVideoUploadDto = {
      courseId,
      lessonId,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      base64Data, // ✅ DADOS BASE64 INCLUÍDOS
      durationSeconds: videoMetadata.duration ? Math.round(videoMetadata.duration) : undefined,
      // ✅ ADICIONAR: Metadados do vídeo quando disponíveis
    };
    
    return await trainingService.uploadVideo(uploadDto);
  }, [courseId, lessonId, videoMetadata.duration]);

  // Iniciar upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    onUploadStart?.();
    
    try {
      let result: VideoUploadResultDto;
      
      // ✅ DECISÃO SIMPLIFICADA: Usar upload direto para todos os arquivos
      // O novo endpoint UploadVideo já lida com arquivos grandes internamente
      console.log(`🔄 [Upload] Usando upload direto (arquivo: ${formatFileSize(selectedFile.size)})`);
      result = await uploadDirect(selectedFile);
      
      if (result.success) {
        toast({
          title: 'Upload concluído!',
          description: 'O vídeo foi enviado com sucesso.',
        });
        onUploadComplete?.(result);
      } else {
        throw new Error(result.errorMessage || 'Erro no upload');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado no upload';
      setUploadError(errorMessage);
      onUploadError?.(errorMessage);
      toast({
        title: 'Erro no upload',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, uploadDirect, onUploadStart, onUploadComplete, onUploadError, toast]);

  // Limpar seleção
  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setVideoPreview(null);
    setVideoMetadata({});
    setUploadProgress(0);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Formatar tamanho de arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatar duração
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Vídeo
        </CardTitle>
        <CardDescription>
          Faça upload de um vídeo para esta aula. Formatos suportados: MP4, WebM, MOV, AVI (máx. 5GB)
          {selectedFile && (
            <div className="mt-2 text-xs text-blue-600">
              📊 Configurações dinâmicas: Chunk de {formatFileSize(getDynamicChunkSize(selectedFile.size))} para arquivo de {formatFileSize(selectedFile.size)}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de upload */}
        {!selectedFile && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <Label htmlFor="video-upload" className="cursor-pointer">
              <span className="text-lg font-medium text-gray-700">
                Clique para selecionar um vídeo
              </span>
              <br />
              <span className="text-sm text-gray-500">
                ou arraste e solte aqui
              </span>
            </Label>
            <Input
              ref={fileInputRef}
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Preview do arquivo selecionado */}
        {selectedFile && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{selectedFile.name}</h4>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                  {videoMetadata.duration && ` • ${formatDuration(videoMetadata.duration)}`}
                </p>
                <div className="text-xs text-blue-600 mt-1">
                  📊 Chunk: {formatFileSize(getDynamicChunkSize(selectedFile.size))} • 
                  Total: {Math.ceil(selectedFile.size / getDynamicChunkSize(selectedFile.size))} chunks
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Preview do vídeo */}
            {videoPreview && (
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  src={videoPreview}
                  controls
                  className="w-full max-h-64"
                  preload="metadata"
                />
              </div>
            )}

            {/* Progresso do upload */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Enviando vídeo...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Erro */}
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{uploadError}</p>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Vídeo
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isUploading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoUpload;
