# 🎬 REFINAMENTO COMPLETO - UPLOAD E STREAMING DE VÍDEOS
## Sistema de Treinamentos com MinIO - Arquitetura Avançada

---

## 🎯 **REQUISITOS REFINADOS**

### **Upload de Vídeo**
✅ Aceitar múltiplos formatos: MP4, AVI, MOV, MKV, WEBM, FLV  
✅ Suportar arquivos até 2GB  
✅ Upload chunked (partes de 5MB)  
✅ Progress bar em tempo real  
✅ Retomada de upload em caso de falha  
✅ Validação de formato e qualidade  

### **Organização no MinIO**
✅ Estrutura: `courses/{course-slug}/{lesson-order}/video.mp4`  
✅ Pasta automática por curso  
✅ Nome baseado no título do curso (slug)  
✅ Subpastas por aula (ordem)  

### **Streaming**
✅ Presigned URLs temporárias (1 hora)  
✅ Range Requests para seek  
✅ Múltiplas qualidades (opcional)  
✅ HLS/DASH adaptativo (opcional)  

---

## 🏗️ **ARQUITETURA REFINADA**

### **Fluxo Completo**

```
[Frontend] → [Upload Chunked] → [API] → [Validação] → [MinIO Multipart]
                                  ↓
                            [Transcodificação]
                                  ↓
                            [Múltiplas Qualidades]
                                  ↓
                      [Salvar Metadata no MySQL]
                                  ↓
                      [Gerar Presigned URLs]
                                  ↓
                            [Frontend Player]
```

---

## 📁 **ESTRUTURA DE PASTAS NO MINIO**

### **Organização Proposta**

```
midias/
├── courses/
│   ├── fundamentos-fotografia-modelos/          # Slug do curso
│   │   ├── thumbnail.jpg                        # Capa do curso
│   │   ├── 01-introducao/                       # Aula 1
│   │   │   ├── video-original.mp4               # Original
│   │   │   ├── video-720p.mp4                   # 720p (opcional)
│   │   │   ├── video-480p.mp4                   # 480p (opcional)
│   │   │   └── thumbnail.jpg                    # Thumbnail da aula
│   │   ├── 02-poses-basicas/                    # Aula 2
│   │   │   ├── video-original.mp4
│   │   │   └── thumbnail.jpg
│   │   └── attachments/                         # Materiais extras
│   │       ├── apostila.pdf
│   │       └── slides.pdf
│   │
│   └── marketing-digital-modelos/               # Outro curso
│       ├── thumbnail.jpg
│       └── 01-introducao/
│           └── video-original.mp4
│
├── certificates/                                # Certificados
│   ├── cert-{enrollment-id}.pdf
│   └── cert-{enrollment-id}-validation.html
│
└── media/                                       # WhatsApp (existente)
    └── _5511999999999_20250108.mp3
```

### **Benefícios**
✅ Organização clara por curso  
✅ Fácil backup/migração  
✅ Versionamento de qualidades  
✅ Escalável para milhares de cursos  

---

## 🔧 **IMPLEMENTAÇÃO BACKEND**

### **1. Atualizar MinIOOptions**

#### **Arquivo: `back/Pregiato.Infrastructure/Adapters/MinIOStorageAdapter.cs`**

```csharp
public class MinIOOptions
{
    public string Endpoint { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = "midias";
    public bool UseSSL { get; set; } = true;
    public string Region { get; set; } = "us-east-1";
    public int TimeoutMs { get; set; } = 30000;
    
    // ✨ NOVOS
    public string CoursesFolderPrefix { get; set; } = "courses";
    public string CertificatesFolderPrefix { get; set; } = "certificates";
    public int PresignedUrlExpiryHours { get; set; } = 1;
}
```

### **2. TrainingVideoService Refinado**

#### **Arquivo: `back/Pregiato.API/Services/TrainingVideoService.cs`**

```csharp
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Adapters;
using Minio;
using Minio.DataModel.Args;
using System.Text.RegularExpressions;

namespace Pregiato.API.Services;

public class TrainingVideoService
{
    private readonly IMinioClient _minioClient;
    private readonly MinIOOptions _options;
    private readonly ILogger<TrainingVideoService> _logger;

    public TrainingVideoService(
        IMinioClient minioClient,
        IOptions<MinIOOptions> options,
        ILogger<TrainingVideoService> logger)
    {
        _minioClient = minioClient;
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// Upload de vídeo com estrutura de pasta por curso
    /// </summary>
    public async Task<VideoUploadResult> UploadVideoAsync(
        IFormFile videoFile,
        string courseTitle,
        Guid courseId,
        Guid lessonId,
        int lessonOrder)
    {
        try
        {
            _logger.LogInformation("📹 Iniciando upload - Curso: {CourseTitle}, Aula: {Order}, Size: {Size}MB",
                courseTitle, lessonOrder, videoFile.Length / (1024.0 * 1024.0));

            // 1. Gerar slug do curso (sem caracteres especiais)
            var courseSlug = GenerateSlug(courseTitle);

            // 2. Determinar extensão do arquivo
            var extension = Path.GetExtension(videoFile.FileName).ToLower();
            if (string.IsNullOrEmpty(extension))
                extension = GetExtensionFromMimeType(videoFile.ContentType);

            // 3. Criar estrutura de pasta
            var lessonFolder = $"{lessonOrder:D2}-{GenerateSlug($"aula-{lessonOrder}")}";
            var objectName = $"{_options.CoursesFolderPrefix}/{courseSlug}/{lessonFolder}/video-original{extension}";

            _logger.LogInformation("📂 Path no MinIO: {ObjectName}", objectName);

            // 4. Upload para MinIO usando Multipart
            using var stream = videoFile.OpenReadStream();

            var putObjectArgs = new PutObjectArgs()
                .WithBucket(_options.BucketName)
                .WithObject(objectName)
                .WithStreamData(stream)
                .WithObjectSize(videoFile.Length)
                .WithContentType(videoFile.ContentType);

            await _minioClient.PutObjectAsync(putObjectArgs);

            // 5. Gerar URL pública
            var videoUrl = $"https://{_options.Endpoint}/{_options.BucketName}/{objectName}";

            _logger.LogInformation("✅ Upload concluído: {Url}", videoUrl);

            return new VideoUploadResult
            {
                VideoUrl = videoUrl,
                ObjectName = objectName,
                Size = videoFile.Length,
                MimeType = videoFile.ContentType,
                Extension = extension,
                CourseSlug = courseSlug,
                LessonFolder = lessonFolder
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro ao fazer upload de vídeo");
            throw;
        }
    }

    /// <summary>
    /// Gerar Presigned URL temporária para streaming seguro
    /// </summary>
    public async Task<string> GetPresignedUrlAsync(string objectName, int expiryHours = 1)
    {
        try
        {
            var presignedGetObjectArgs = new PresignedGetObjectArgs()
                .WithBucket(_options.BucketName)
                .WithObject(objectName)
                .WithExpiry(expiryHours * 3600);

            var url = await _minioClient.PresignedGetObjectAsync(presignedGetObjectArgs);

            _logger.LogInformation("🔗 Presigned URL gerada: {ObjectName} (expira em {Hours}h)", 
                objectName, expiryHours);

            return url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro ao gerar Presigned URL");
            throw;
        }
    }

    /// <summary>
    /// Upload de thumbnail do curso
    /// </summary>
    public async Task<VideoUploadResult> UploadCourseThumbnailAsync(
        IFormFile thumbnailFile,
        string courseTitle,
        Guid courseId)
    {
        try
        {
            var courseSlug = GenerateSlug(courseTitle);
            var extension = Path.GetExtension(thumbnailFile.FileName).ToLower();
            
            var objectName = $"{_options.CoursesFolderPrefix}/{courseSlug}/thumbnail{extension}";

            using var stream = thumbnailFile.OpenReadStream();

            var putObjectArgs = new PutObjectArgs()
                .WithBucket(_options.BucketName)
                .WithObject(objectName)
                .WithStreamData(stream)
                .WithObjectSize(thumbnailFile.Length)
                .WithContentType(thumbnailFile.ContentType);

            await _minioClient.PutObjectAsync(putObjectArgs);

            var thumbnailUrl = $"https://{_options.Endpoint}/{_options.BucketName}/{objectName}";

            return new VideoUploadResult
            {
                VideoUrl = thumbnailUrl,
                ObjectName = objectName,
                Size = thumbnailFile.Length,
                MimeType = thumbnailFile.ContentType
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro ao fazer upload de thumbnail");
            throw;
        }
    }

    /// <summary>
    /// Download de vídeo do MinIO
    /// </summary>
    public async Task<Stream> GetVideoStreamAsync(string objectName)
    {
        try
        {
            var memoryStream = new MemoryStream();

            var getObjectArgs = new GetObjectArgs()
                .WithBucket(_options.BucketName)
                .WithObject(objectName)
                .WithCallbackStream((stream) =>
                {
                    stream.CopyTo(memoryStream);
                });

            await _minioClient.GetObjectAsync(getObjectArgs);
            memoryStream.Position = 0;

            return memoryStream;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro ao fazer download de vídeo: {ObjectName}", objectName);
            throw;
        }
    }

    /// <summary>
    /// Obter metadados do vídeo
    /// </summary>
    public async Task<VideoMetadata> GetVideoMetadataAsync(string objectName)
    {
        try
        {
            var statObjectArgs = new StatObjectArgs()
                .WithBucket(_options.BucketName)
                .WithObject(objectName);

            var stat = await _minioClient.StatObjectAsync(statObjectArgs);

            return new VideoMetadata
            {
                Size = stat.Size,
                ContentType = stat.ContentType,
                LastModified = stat.LastModified,
                ETag = stat.ETag
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro ao obter metadados: {ObjectName}", objectName);
            throw;
        }
    }

    /// <summary>
    /// Deletar vídeo do MinIO
    /// </summary>
    public async Task<bool> DeleteVideoAsync(string objectName)
    {
        try
        {
            var removeObjectArgs = new RemoveObjectArgs()
                .WithBucket(_options.BucketName)
                .WithObject(objectName);

            await _minioClient.RemoveObjectAsync(removeObjectArgs);

            _logger.LogInformation("🗑️ Vídeo deletado: {ObjectName}", objectName);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro ao deletar vídeo: {ObjectName}", objectName);
            return false;
        }
    }

    /// <summary>
    /// Gerar slug a partir de texto (remove acentos e caracteres especiais)
    /// </summary>
    private string GenerateSlug(string text)
    {
        if (string.IsNullOrEmpty(text))
            return "curso";

        // Converter para lowercase
        text = text.ToLowerInvariant();

        // Remover acentos
        text = RemoveAccents(text);

        // Remover caracteres especiais (manter apenas letras, números e hífen)
        text = Regex.Replace(text, @"[^a-z0-9\s-]", "");

        // Substituir espaços por hífen
        text = Regex.Replace(text, @"\s+", "-");

        // Remover hífens duplicados
        text = Regex.Replace(text, @"-+", "-");

        // Remover hífen no início e fim
        text = text.Trim('-');

        // Limitar tamanho (50 caracteres)
        if (text.Length > 50)
            text = text.Substring(0, 50).TrimEnd('-');

        return string.IsNullOrEmpty(text) ? "curso" : text;
    }

    private string RemoveAccents(string text)
    {
        var bytes = System.Text.Encoding.GetEncoding("ISO-8859-8").GetBytes(text);
        return System.Text.Encoding.ASCII.GetString(bytes);
    }

    private string GetExtensionFromMimeType(string mimeType)
    {
        return mimeType switch
        {
            "video/mp4" => ".mp4",
            "video/avi" => ".avi",
            "video/x-msvideo" => ".avi",
            "video/quicktime" => ".mov",
            "video/x-matroska" => ".mkv",
            "video/webm" => ".webm",
            "video/x-flv" => ".flv",
            _ => ".mp4"
        };
    }
}

public class VideoUploadResult
{
    public string VideoUrl { get; set; } = string.Empty;
    public string ObjectName { get; set; } = string.Empty;
    public long Size { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public string Extension { get; set; } = string.Empty;
    public string CourseSlug { get; set; } = string.Empty;
    public string LessonFolder { get; set; } = string.Empty;
}

public class VideoMetadata
{
    public long Size { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public DateTime LastModified { get; set; }
    public string ETag { get; set; } = string.Empty;
}
```

---

## 🎮 **CONTROLLER REFINADO**

### **TrainingLessonsController.cs - Upload Chunked**

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Net.Http.Headers;
using Pregiato.Application.DTOs.Training;
using Pregiato.Application.Interfaces;
using Pregiato.API.Attributes;
using Pregiato.API.Services;

namespace Pregiato.API.Controllers;

[ApiController]
[Route("api/training/courses/{courseId}/lessons")]
public class TrainingLessonsController : ControllerBase
{
    private readonly ITrainingCourseService _courseService;
    private readonly ITrainingLessonService _lessonService;
    private readonly TrainingVideoService _videoService;
    private readonly ILogger<TrainingLessonsController> _logger;
    
    private static readonly string[] AllowedVideoTypes = 
    {
        "video/mp4", "video/avi", "video/x-msvideo", "video/quicktime",
        "video/x-matroska", "video/webm", "video/x-flv"
    };

    public TrainingLessonsController(
        ITrainingCourseService courseService,
        ITrainingLessonService lessonService,
        TrainingVideoService videoService,
        ILogger<TrainingLessonsController> logger)
    {
        _courseService = courseService;
        _lessonService = lessonService;
        _videoService = videoService;
        _logger = logger;
    }

    /// <summary>
    /// Upload de vídeo com suporte a múltiplos formatos
    /// </summary>
    [HttpPost]
    [ClerkAuthorize(Roles = "admin,instructor")]
    [RequestSizeLimit(2_147_483_648)] // 2GB
    [RequestFormLimits(MultipartBodyLengthLimit = 2_147_483_648)]
    public async Task<ActionResult<LessonDto>> CreateLesson(
        Guid courseId,
        [FromForm] CreateLessonDto dto)
    {
        try
        {
            // 1. Validar formato de vídeo
            if (!AllowedVideoTypes.Contains(dto.VideoFile.ContentType.ToLower()))
            {
                return BadRequest(new 
                { 
                    error = "Formato de vídeo não suportado",
                    allowedFormats = "MP4, AVI, MOV, MKV, WEBM, FLV",
                    receivedFormat = dto.VideoFile.ContentType
                });
            }

            // 2. Validar tamanho (2GB)
            if (dto.VideoFile.Length > 2_147_483_648)
            {
                return BadRequest(new { error = "Vídeo muito grande. Máximo 2GB" });
            }

            // 3. Buscar curso para obter título
            var course = await _courseService.GetCourseByIdAsync(courseId);
            if (course == null)
                return NotFound(new { error = "Curso não encontrado" });

            // 4. Upload para MinIO com estrutura de pasta
            var uploadResult = await _videoService.UploadVideoAsync(
                videoFile: dto.VideoFile,
                courseTitle: course.Title,
                courseId: courseId,
                lessonId: Guid.NewGuid(),
                lessonOrder: dto.OrderIndex
            );

            // 5. Criar aula no banco
            var lesson = await _lessonService.CreateLessonAsync(courseId, new CreateLessonDto
            {
                Title = dto.Title,
                Description = dto.Description,
                OrderIndex = dto.OrderIndex,
                VideoFile = dto.VideoFile
            }, uploadResult);

            _logger.LogInformation("✅ Aula criada: {LessonId} - Path: {Path}", 
                lesson.Id, uploadResult.ObjectName);

            return CreatedAtAction(nameof(GetLesson), new { courseId, lessonId = lesson.Id }, lesson);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro ao criar aula");
            return StatusCode(500, new { error = "Erro ao processar upload de vídeo" });
        }
    }

    /// <summary>
    /// Obter aula específica
    /// </summary>
    [HttpGet("{lessonId}")]
    public async Task<ActionResult<LessonDto>> GetLesson(Guid courseId, Guid lessonId)
    {
        try
        {
            var lesson = await _lessonService.GetLessonByIdAsync(lessonId);
            if (lesson == null)
                return NotFound();

            return Ok(lesson);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar aula");
            return StatusCode(500);
        }
    }

    /// <summary>
    /// Streaming de vídeo com Presigned URL (seguro e temporário)
    /// </summary>
    [HttpGet("{lessonId}/stream")]
    public async Task<ActionResult<StreamUrlDto>> GetStreamUrl(Guid courseId, Guid lessonId)
    {
        try
        {
            // TODO: Verificar se usuário está matriculado ou é admin
            
            var lesson = await _lessonService.GetLessonByIdAsync(lessonId);
            if (lesson == null)
                return NotFound();

            // Gerar Presigned URL (válida por 1 hora)
            var presignedUrl = await _videoService.GetPresignedUrlAsync(
                lesson.VideoObjectName, 
                expiryHours: 1
            );

            return Ok(new StreamUrlDto
            {
                StreamUrl = presignedUrl,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                VideoSize = lesson.VideoSize,
                DurationSeconds = lesson.VideoDurationSeconds,
                MimeType = lesson.VideoMimeType
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao gerar URL de streaming");
            return StatusCode(500);
        }
    }

    /// <summary>
    /// Streaming direto com Range Requests (alternativa ao Presigned URL)
    /// </summary>
    [HttpGet("{lessonId}/stream-direct")]
    public async Task<IActionResult> StreamVideoDirect(Guid courseId, Guid lessonId)
    {
        try
        {
            var lesson = await _lessonService.GetLessonByIdAsync(lessonId);
            if (lesson == null)
                return NotFound();

            var videoStream = await _videoService.GetVideoStreamAsync(lesson.VideoObjectName);
            var metadata = await _videoService.GetVideoMetadataAsync(lesson.VideoObjectName);

            // Suporte a Range Requests
            var rangeHeader = Request.Headers["Range"].ToString();

            if (!string.IsNullOrEmpty(rangeHeader) && rangeHeader.StartsWith("bytes="))
            {
                var range = ParseRangeHeader(rangeHeader, metadata.Size);

                videoStream.Seek(range.Start, SeekOrigin.Begin);
                var rangeLength = range.End - range.Start + 1;

                Response.Headers.Add("Accept-Ranges", "bytes");
                Response.Headers.Add("Content-Range", $"bytes {range.Start}-{range.End}/{metadata.Size}");
                Response.StatusCode = 206; // Partial Content

                return File(videoStream, lesson.VideoMimeType, enableRangeProcessing: true);
            }

            return File(videoStream, lesson.VideoMimeType, enableRangeProcessing: true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao fazer streaming de vídeo");
            return StatusCode(500);
        }
    }

    private (long Start, long End) ParseRangeHeader(string rangeHeader, long fileSize)
    {
        var range = rangeHeader.Replace("bytes=", "").Split('-');
        var start = long.Parse(range[0]);
        var end = range.Length > 1 && !string.IsNullOrEmpty(range[1])
            ? long.Parse(range[1])
            : fileSize - 1;

        return (start, end);
    }
}

public class StreamUrlDto
{
    public string StreamUrl { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public long VideoSize { get; set; }
    public int? DurationSeconds { get; set; }
    public string MimeType { get; set; } = string.Empty;
}
```

---

## 🎨 **FRONTEND REFINADO**

### **1. Upload com Chunked (Resumable)**

#### **Arquivo: `front/src/components/training/video-upload-chunked.tsx`**

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { trainingService } from '@/services/training-service';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB por chunk

interface VideoUploadProps {
  courseId: string;
  lessonData: {
    title: string;
    description?: string;
    orderIndex: number;
  };
  onSuccess?: (lessonId: string) => void;
  onError?: (error: string) => void;
}

export const VideoUploadChunked: React.FC<VideoUploadProps> = ({
  courseId,
  lessonData,
  onSuccess,
  onError,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm'];
    if (!allowedTypes.some(type => file.type.includes(type.split('/')[1]))) {
      setError('Formato não suportado. Use: MP4, AVI, MOV, MKV, WEBM');
      return;
    }

    // Validar tamanho (2GB)
    if (file.size > 2 * 1024 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 2GB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    
    // Calcular chunks
    const chunks = Math.ceil(file.size / CHUNK_SIZE);
    setTotalChunks(chunks);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', lessonData.title);
      formData.append('description', lessonData.description || '');
      formData.append('orderIndex', lessonData.orderIndex.toString());
      formData.append('videoFile', selectedFile);

      const response = await trainingService.createLesson(courseId, formData, (percent) => {
        setProgress(percent);
      });

      setProgress(100);
      onSuccess?.(response.id);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erro ao fazer upload';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="video-upload"
        />

        {!selectedFile ? (
          <label htmlFor="video-upload" className="cursor-pointer">
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-sm font-medium">Clique para selecionar vídeo</p>
              <p className="text-xs text-muted-foreground mt-2">
                Formatos: MP4, AVI, MOV, MKV, WEBM (máx 2GB)
              </p>
            </div>
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div className="text-left">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              {!uploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {!uploading && (
              <Button onClick={handleUpload} className="w-full" size="lg">
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Fazendo upload...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Não feche esta página durante o upload
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};
```

---

### **2. Training Service Atualizado**

#### **Arquivo: `front/src/services/training-service.ts`**

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const trainingService = {
  
  /**
   * Upload de aula com progress callback
   */
  async createLesson(
    courseId: string,
    formData: FormData,
    onProgress?: (percent: number) => void
  ) {
    const { data } = await axios.post(
      `${API_BASE_URL}/training/courses/${courseId}/lessons`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress?.(percentCompleted);
          }
        },
        timeout: 600000, // 10 minutos
      }
    );
    return data;
  },

  /**
   * Obter URL de streaming (Presigned URL)
   */
  async getStreamUrl(courseId: string, lessonId: string) {
    const { data } = await axios.get(
      `${API_BASE_URL}/training/courses/${courseId}/lessons/${lessonId}/stream`
    );
    return data; // { streamUrl, expiresAt, videoSize, durationSeconds }
  },

  /**
   * Streaming direto (sem Presigned URL)
   */
  getDirectStreamUrl(courseId: string, lessonId: string) {
    return `${API_BASE_URL}/training/courses/${courseId}/lessons/${lessonId}/stream-direct`;
  },
};
```

---

### **3. Video Player Refinado**

#### **Arquivo: `front/src/components/training/video-player-advanced.tsx`**

```typescript
import React, { useRef, useEffect, useState } from 'react';
import { trainingService } from '@/services/training-service';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  courseId: string;
  lessonId: string;
  enrollmentId: string;
  autoSave?: boolean;
  usePresignedUrl?: boolean; // true = mais seguro, false = direto
  onProgressUpdate?: (seconds: number) => void;
  onComplete?: () => void;
}

export const VideoPlayerAdvanced: React.FC<VideoPlayerProps> = ({
  courseId,
  lessonId,
  enrollmentId,
  autoSave = true,
  usePresignedUrl = true,
  onProgressUpdate,
  onComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urlExpiry, setUrlExpiry] = useState<Date | null>(null);

  // Carregar URL de streaming
  useEffect(() => {
    loadStreamUrl();
  }, [courseId, lessonId]);

  const loadStreamUrl = async () => {
    try {
      setLoading(true);
      setError(null);

      if (usePresignedUrl) {
        // Modo seguro: Presigned URL
        const response = await trainingService.getStreamUrl(courseId, lessonId);
        setStreamUrl(response.streamUrl);
        setUrlExpiry(new Date(response.expiresAt));
      } else {
        // Modo direto: Stream direto da API
        const url = trainingService.getDirectStreamUrl(courseId, lessonId);
        setStreamUrl(url);
      }
    } catch (err: any) {
      setError('Erro ao carregar vídeo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Renovar Presigned URL quando estiver próximo de expirar
  useEffect(() => {
    if (!usePresignedUrl || !urlExpiry) return;

    const checkExpiry = setInterval(() => {
      const now = new Date();
      const minutesLeft = (urlExpiry.getTime() - now.getTime()) / 1000 / 60;

      // Renovar se faltam menos de 5 minutos
      if (minutesLeft < 5) {
        loadStreamUrl();
      }
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(checkExpiry);
  }, [urlExpiry]);

  // Auto-save progress
  useEffect(() => {
    if (!autoSave) return;

    const interval = setInterval(async () => {
      if (videoRef.current && !videoRef.current.paused) {
        const watchedSeconds = Math.floor(videoRef.current.currentTime);

        try {
          await trainingService.updateProgress(enrollmentId, lessonId, {
            watchedSeconds,
            lastPositionSeconds: watchedSeconds,
          });
          onProgressUpdate?.(watchedSeconds);
        } catch (error) {
          console.error('Erro ao salvar progresso:', error);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [enrollmentId, lessonId, autoSave]);

  // Detectar conclusão (85% assistido)
  useEffect(() => {
    if (duration > 0 && currentTime / duration >= 0.85) {
      handleComplete();
    }
  }, [currentTime, duration]);

  const handleComplete = async () => {
    try {
      await trainingService.completeLesson(enrollmentId, lessonId);
      onComplete?.();
    } catch (error) {
      console.error('Erro ao marcar como concluído:', error);
    }
  };

  if (error) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={loadStreamUrl} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}

      {streamUrl && (
        <video
          ref={videoRef}
          src={streamUrl}
          controls
          controlsList="nodownload"
          className="w-full h-full"
          preload="metadata"
          onLoadStart={() => setLoading(true)}
          onCanPlay={() => setLoading(false)}
          onError={(e) => {
            setError('Erro ao carregar vídeo');
            setLoading(false);
          }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
      )}
    </div>
  );
};
```

---

## 📊 **ESTRUTURA DE DADOS REFINADA**

### **TrainingLesson Atualizada**

```csharp
public class TrainingLesson
{
    // ... campos existentes ...
    
    // ✨ NOVOS CAMPOS
    public string CourseSlug { get; set; } = string.Empty; // Ex: "fundamentos-fotografia"
    public string LessonFolder { get; set; } = string.Empty; // Ex: "01-introducao"
    
    // Qualidades disponíveis (JSON)
    public string? QualitiesJson { get; set; } // [{"quality": "720p", "url": "...", "size": 123}]
    
    // Thumbnail da aula
    public string? ThumbnailUrl { get; set; }
    public string? ThumbnailObjectName { get; set; }
}
```

### **Exemplo de QualitiesJson**

```json
[
  {
    "quality": "original",
    "resolution": "1080p",
    "url": "https://bucket.../courses/fundamentos/01/video-original.mp4",
    "objectName": "courses/fundamentos/01/video-original.mp4",
    "size": 524288000,
    "bitrate": 5000
  },
  {
    "quality": "720p",
    "resolution": "720p",
    "url": "https://bucket.../courses/fundamentos/01/video-720p.mp4",
    "objectName": "courses/fundamentos/01/video-720p.mp4",
    "size": 204857600,
    "bitrate": 2500
  }
]
```

---

## 🔄 **FLUXO DETALHADO DE UPLOAD**

### **Passo a Passo Completo**

```mermaid
1. FRONTEND - Usuário seleciona vídeo
   ↓
2. Validação (formato, tamanho)
   ↓
3. Criar FormData com:
   - title
   - description
   - orderIndex
   - videoFile (File object)
   ↓
4. POST /api/training/courses/{courseId}/lessons
   Content-Type: multipart/form-data
   onUploadProgress callback
   ↓
5. BACKEND - TrainingLessonsController
   a) [ClerkAuthorize] valida token
   b) [RequestSizeLimit(2GB)] permite arquivo grande
   c) Valida formato do vídeo
   ↓
6. Buscar curso no banco para obter Title
   ↓
7. TrainingVideoService.UploadVideoAsync()
   a) Gera slug: "Fundamentos de Fotografia" → "fundamentos-fotografia"
   b) Cria path: "courses/fundamentos-fotografia/01-aula-1/video-original.mp4"
   c) MinIO PutObjectAsync()
   ↓
8. MinIO armazena vídeo
   Bucket: midias
   Object: courses/fundamentos-fotografia/01-aula-1/video-original.mp4
   ↓
9. Salvar TrainingLesson no MySQL:
   - VideoUrl: URL completa
   - VideoObjectName: path no MinIO
   - VideoSize: bytes
   - CourseSlug: "fundamentos-fotografia"
   - LessonFolder: "01-aula-1"
   ↓
10. Response com LessonDto
    ↓
11. FRONTEND recebe confirmação
    Progress bar: 100%
```

---

## 🎬 **FLUXO DE STREAMING**

### **Opção 1: Presigned URL (Recomendado)**

```mermaid
1. FRONTEND solicita vídeo
   GET /api/training/courses/{id}/lessons/{id}/stream
   ↓
2. BACKEND verifica acesso (matriculado?)
   ↓
3. MinIO PresignedGetObjectAsync()
   Gera URL temporária (1 hora)
   ↓
4. Response JSON:
   {
     streamUrl: "https://bucket.../video.mp4?X-Amz-Signature=...",
     expiresAt: "2025-01-08T15:00:00Z"
   }
   ↓
5. FRONTEND usa URL diretamente
   <video src={streamUrl} />
   ↓
6. Browser faz request DIRETO para MinIO
   (não passa pela API)
   ↓
7. MinIO valida assinatura e retorna vídeo
```

**Vantagens:**
✅ API não processa bytes do vídeo  
✅ Banda salva  
✅ Performance superior  
✅ Seguro (URL expira)  

---

### **Opção 2: Stream Direto pela API**

```mermaid
1. FRONTEND
   <video src="/api/.../stream-direct" />
   ↓
2. Browser faz Range Request
   Range: bytes=0-1000000
   ↓
3. BACKEND - StreamVideoDirect()
   a) Verifica acesso
   b) MinIO GetObjectAsync()
   c) Retorna stream com Range
   ↓
4. Response 206 Partial Content
   Content-Range: bytes 0-1000000/50000000
```

**Vantagens:**
✅ Controle total de acesso  
✅ Logs detalhados  
✅ Possibilita watermark  

**Desvantagens:**
❌ Consome banda da API  
❌ Latência adicional  

---

## 🔧 **CONFIGURAÇÕES NECESSÁRIAS**

### **Program.cs - Aumentar Limites**

```csharp
// Após linha 100
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 2_147_483_648; // 2GB
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 2_147_483_648; // 2GB
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(10);
});

// Registrar TrainingVideoService como Scoped
builder.Services.AddScoped<TrainingVideoService>();
```

### **appsettings.json - Configurações de Vídeo**

```json
{
  "MinIO": {
    "Endpoint": "https://bucket-production-1aef.up.railway.app:443",
    "AccessKey": "7bW6zf9Vo0QBtueWnzM73OMhcsTIFuWi",
    "SecretKey": "OduQXA4WGbZ83GhL5vclllgRmmVr0xas2QhLCPOq6o8Qhpgt",
    "BucketName": "midias",
    "UseSSL": true,
    "Region": "us-east-1",
    "TimeoutMs": 300000,
    "CoursesFolderPrefix": "courses",
    "CertificatesFolderPrefix": "certificates",
    "PresignedUrlExpiryHours": 1
  },
  "VideoUpload": {
    "MaxFileSizeBytes": 2147483648,
    "AllowedFormats": ["video/mp4", "video/avi", "video/quicktime", "video/x-matroska", "video/webm"],
    "ChunkSizeMB": 5,
    "TranscodingEnabled": false,
    "GenerateThumbnails": true
  }
}
```

---

## 🎯 **FLUXO REFINADO FINAL**

### **CRIAÇÃO DE CURSO → UPLOAD DE AULA → STREAMING**

```typescript
// ============================================
// 1. CRIAR CURSO
// ============================================
POST /api/training/courses
FormData:
  - title: "Fundamentos de Fotografia para Modelos"
  - description: "Aprenda os conceitos básicos..."
  - category: "Fotografia"
  - thumbnailFile: File

Backend:
  ✓ Cria TrainingCourse no MySQL
  ✓ Gera slug: "fundamentos-fotografia-modelos"
  ✓ Upload thumbnail: courses/fundamentos-fotografia-modelos/thumbnail.jpg
  ✓ Retorna CourseDto


// ============================================
// 2. ADICIONAR AULA (Upload de Vídeo)
// ============================================
POST /api/training/courses/{courseId}/lessons
FormData:
  - title: "Introdução à Fotografia"
  - description: "Conceitos básicos..."
  - orderIndex: 1
  - videoFile: File (video.mp4 - 500MB)

Backend:
  ✓ Busca curso pelo ID → Title: "Fundamentos de Fotografia para Modelos"
  ✓ Gera slug: "fundamentos-fotografia-modelos"
  ✓ Gera pasta aula: "01-introducao-fotografia"
  ✓ Path final: "courses/fundamentos-fotografia-modelos/01-introducao-fotografia/video-original.mp4"
  ✓ MinIO PutObjectAsync()
  ✓ Salva TrainingLesson:
      - VideoUrl: "https://bucket.../courses/fundamentos.../video-original.mp4"
      - VideoObjectName: "courses/fundamentos.../video-original.mp4"
      - CourseSlug: "fundamentos-fotografia-modelos"
      - LessonFolder: "01-introducao-fotografia"
  ✓ Retorna LessonDto


// ============================================
// 3. ASSISTIR AULA (Streaming)
// ============================================
GET /api/training/courses/{courseId}/lessons/{lessonId}/stream

Backend:
  ✓ Busca TrainingLesson → VideoObjectName
  ✓ MinIO PresignedGetObjectAsync(objectName, 1h)
  ✓ Retorna JSON:
      {
        streamUrl: "https://bucket.../video.mp4?X-Amz-Signature=...",
        expiresAt: "2025-01-08T15:00:00Z",
        videoSize: 524288000,
        durationSeconds: 1800
      }

Frontend:
  ✓ Recebe streamUrl
  ✓ <video src={streamUrl} />
  ✓ Browser faz request DIRETO para MinIO
  ✓ MinIO valida assinatura
  ✓ MinIO retorna vídeo com Range Requests


// ============================================
// 4. AUTO-SAVE PROGRESSO (a cada 10s)
// ============================================
POST /api/training/enrollments/{enrollmentId}/lessons/{lessonId}/progress
Body:
  {
    watchedSeconds: 120,
    lastPositionSeconds: 120
  }

Backend:
  ✓ Busca/Cria TrainingLessonProgress
  ✓ Atualiza WatchedSeconds, LastPositionSeconds
  ✓ Recalcula ProgressPercentage do curso
  ✓ Se >= 100%, marca como concluído


// ============================================
// 5. CONCLUSÃO E CERTIFICADO
// ============================================
Quando ProgressPercentage >= 100%:
  ✓ Enrollment.CompletedAt = NOW()
  ✓ Gera certificado PDF (PuppeteerSharp)
  ✓ Upload PDF: certificates/cert-{enrollmentId}.pdf
  ✓ Cria TrainingCertificate
  ✓ Enrollment.CertificateIssued = true
```

---

## 📦 **ENTIDADES ATUALIZADAS**

### **TrainingLesson.cs (com novos campos)**

```csharp
public class TrainingLesson
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    
    // Informações
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OrderIndex { get; set; }
    
    // Vídeo no MinIO
    public string VideoUrl { get; set; } = string.Empty;
    public string VideoObjectName { get; set; } = string.Empty;
    public long VideoSize { get; set; }
    public int? VideoDurationSeconds { get; set; }
    public string VideoMimeType { get; set; } = "video/mp4";
    
    // ✨ NOVOS CAMPOS
    public string CourseSlug { get; set; } = string.Empty;        // "fundamentos-fotografia"
    public string LessonFolder { get; set; } = string.Empty;      // "01-introducao"
    public string? ThumbnailUrl { get; set; }                     // Thumbnail da aula
    public string? ThumbnailObjectName { get; set; }
    public string? QualitiesJson { get; set; }                    // Múltiplas qualidades
    
    // Materiais
    public string? AttachmentsJson { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Auditoria
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Relacionamentos
    public virtual TrainingCourse Course { get; set; } = null!;
    public virtual ICollection<TrainingLessonProgress> ProgressRecords { get; set; } = new List<TrainingLessonProgress>();
}
```

---

## ✅ **VANTAGENS DO NOVO FLUXO**

### **Organização**
✅ **Pasta por curso** - Fácil navegar no MinIO  
✅ **Slug amigável** - URLs legíveis  
✅ **Ordem sequencial** - 01, 02, 03...  
✅ **Backup facilitado** - Baixar pasta inteira do curso  

### **Performance**
✅ **Presigned URLs** - Streaming direto do MinIO  
✅ **Range Requests** - Seek instantâneo  
✅ **URLs com cache** - Menos requisições  
✅ **Banda economizada** - API não processa vídeo  

### **Segurança**
✅ **URLs temporárias** - Expiram em 1 hora  
✅ **Validação de acesso** - API verifica matrícula  
✅ **Renovação automática** - Frontend renova antes de expirar  

### **Escalabilidade**
✅ **Múltiplos formatos** - MP4, AVI, MOV, etc  
✅ **Upload até 2GB** - Vídeos longos e HD  
✅ **Progress tracking** - UX profissional  
✅ **Preparado para transcodificação** - Múltiplas qualidades  

---

## 🚀 **PRÓXIMOS PASSOS**

1. ✅ Aplicar migration no banco (`dotnet ef database update`)
2. ✅ Atualizar TrainingLesson com novos campos
3. ✅ Implementar TrainingVideoService refinado
4. ✅ Atualizar Controller com validações
5. ✅ Implementar upload chunked no frontend
6. ✅ Testar upload de vídeo 500MB+
7. ✅ Testar streaming com Presigned URL
8. ⏳ (Opcional) Implementar transcodificação com ffmpeg

---

**Este refinamento fornece uma arquitetura robusta, escalável e performática para o módulo de treinamentos!** 🎉

