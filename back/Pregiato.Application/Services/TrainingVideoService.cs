using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Pregiato.Infrastructure.Adapters;

namespace Pregiato.Application.Services
{
    public class TrainingVideoService : ITrainingVideoService
    {
        private readonly IMediaStoragePort _mediaStorage;
        private readonly MinIOOptions _minioOptions;
        private readonly ILogger<TrainingVideoService> _logger;

        public TrainingVideoService(IMediaStoragePort mediaStorage, IOptions<MinIOOptions> minioOptions, ILogger<TrainingVideoService> logger)
        {
            _mediaStorage = mediaStorage;
            _minioOptions = minioOptions.Value;
            _logger = logger;
        }

        public async Task<VideoPresignedUrlDto> GeneratePresignedUrlAsync(TrainingVideoUploadDto uploadDto)
        {
            try
            {
                // Gerar nome do objeto seguindo o padrão: Course/{courseId}_{courseName}/{courseId}_{lessonId}_{lessonTitle}.ext
                var objectName = GenerateObjectName(uploadDto);
                
                // Gerar URL usando o protocolo correto
                var videoUrl =objectName;

                return new VideoPresignedUrlDto
                {
                    ObjectName = objectName,
                    PresignedUrl = videoUrl, // Implementar presigned URL futuramente se necessário
                    ExpiresAt = DateTime.UtcNow.AddHours(1),
                    VideoUrl = videoUrl
                };
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Erro ao gerar URL pré-assinada: {ex.Message}", ex);
            }
        }

        public async Task<VideoUploadResultDto> UploadVideoAsync(TrainingVideoUploadDto uploadDto, byte[] videoData)
        {
            try
            {
                Console.WriteLine($"\n🎬 [VIDEO-SERVICE] ========================================");
                Console.WriteLine($"🎬 [VIDEO-SERVICE] Iniciando upload de vídeo");
                Console.WriteLine($"   📚 Curso: {uploadDto.CourseTitle}");
                Console.WriteLine($"   📝 Aula: {uploadDto.LessonTitle}");
                Console.WriteLine($"   📦 Arquivo: {uploadDto.FileName} ({uploadDto.FileSize} bytes)");
                Console.WriteLine($"   🎞️ MIME: {uploadDto.MimeType}");
                
                // Gerar nome do objeto seguindo o padrão correto
                var objectName = GenerateObjectName(uploadDto);
                Console.WriteLine($"   📁 Path gerado: {objectName}");
                
                // Converter bytes para base64
                var base64Data = Convert.ToBase64String(videoData);
                Console.WriteLine($"🔄 [VIDEO-SERVICE] Base64 convertido - Tamanho: {base64Data.Length} chars");
                
                // Upload para MinIO usando o método disponível
                Console.WriteLine($"📤 [VIDEO-SERVICE] Chamando MinIO para upload");
                var result = await _mediaStorage.StoreMediaAsync(
                    base64Data,
                    uploadDto.MimeType,
                    objectName, // Usar o objectName gerado com o padrão correto
                    null // senderName
                );
                

                Console.WriteLine($"✅ [VIDEO-SERVICE] Upload concluído com sucesso - URL: {result.MediaUrl}");
                
                return new VideoUploadResultDto
                {
                    Success = true,
                    ObjectName = result.ObjectName,
                    VideoUrl = result.MediaUrl,
                    FileSize = uploadDto.FileSize,
                    MimeType = uploadDto.MimeType
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [VIDEO-SERVICE] Erro no upload: {ex.Message}");
                return new VideoUploadResultDto
                {
                    Success = false,
                    ErrorMessage = $"Erro no upload: {ex.Message}"
                };
            }
        }

        public async Task<string> GetVideoStreamingUrlAsync(string objectName)
        {
            try
            {
                return await _mediaStorage.GetPublicUrlAsync(objectName);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Erro ao obter URL de streaming: {ex.Message}", ex);
            }
        }

        public async Task<VideoPresignedUrlDto> GenerateStreamingUrlAsync(string objectName, TimeSpan expiresIn)
        {
            try
            {
                // ✅ CORREÇÃO: Gerar URL de streaming válida do MinIO
                var videoUrl = await _mediaStorage.GetPublicUrlAsync(objectName);
                
                _logger.LogInformation("🔗 [VIDEO-SERVICE] Gerando URL de streaming para: {ObjectName}", objectName);
                _logger.LogInformation("🔗 [VIDEO-SERVICE] URL gerada: {VideoUrl}", videoUrl);
                
                return new VideoPresignedUrlDto
                {
                    ObjectName = objectName,
                    PresignedUrl = videoUrl, // URL válida para streaming
                    ExpiresAt = DateTime.UtcNow.Add(expiresIn),
                    VideoUrl = videoUrl // URL que o frontend vai usar no <video> tag
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [VIDEO-SERVICE] Erro ao gerar URL de streaming para {ObjectName}", objectName);
                throw new InvalidOperationException($"Erro ao gerar URL de streaming: {ex.Message}", ex);
            }
        }

        public async Task<VideoMetadataDto?> GetVideoMetadataAsync(string objectName)
        {
            try
            {
                // Implementação básica - verificar se o objeto existe tentando obter a URL
                var videoUrl = await _mediaStorage.GetPublicUrlAsync(objectName);
                
                return new VideoMetadataDto
                {
                    ObjectName = objectName,
                    FileSize = videoUrl.Length, // Implementar futuramente
                    MimeType = videoUrl.MimeType, // Implementar futuramente
                };
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Erro ao obter metadados do vídeo: {ex.Message}", ex);
            }
        }

        public async Task<bool> DeleteVideoAsync(string objectName)
        {
            try
            {
                // Implementação futura - por enquanto retornar true
                return true;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Erro ao deletar vídeo: {ex.Message}", ex);
            }
        }

        public async Task<bool> VideoExistsAsync(string objectName)
        {
            try
            {
                // Verificar se o objeto existe tentando obter a URL
                var videoUrl = await _mediaStorage.GetPublicUrlAsync(objectName);
                return !string.IsNullOrEmpty(videoUrl);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Erro ao verificar existência do vídeo: {ex.Message}", ex);
            }
        }

        private string GenerateObjectName(TrainingVideoUploadDto uploadDto)
        {
            // ✅ NOVO FORMATO (sem IDs): Course/{courseName}/{timestamp}_{lessonTitle}.ext
            // O vídeo é enviado ANTES de criar o curso, então não temos IDs ainda
            
            // Limpar o nome do curso e da aula para usar em path
            var courseNameSafe = SanitizeForPath(uploadDto.CourseTitle);
            var lessonTitleSafe = SanitizeForPath(uploadDto.LessonTitle);
            
            // Gerar timestamp único para evitar conflitos
            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
            var uniqueId = Guid.NewGuid().ToString("N").Substring(0, 8);
            
            // Obter extensão do arquivo
            var extension = Path.GetExtension(uploadDto.FileName);
            if (string.IsNullOrEmpty(extension))
            {
                // Inferir extensão do MIME type
                extension = uploadDto.MimeType switch
                {
                    "video/mp4" => ".mp4",
                    "video/webm" => ".webm",
                    "video/quicktime" => ".mov",
                    _ => ".mp4"
                };
            }
            
            // ✅ Formato: Course/{courseName}/{timestamp}_{uniqueId}_{lessonTitle}.ext
            var folderPath = $"Course/{courseNameSafe}";
            var fileName = $"{timestamp}_{uniqueId}_{lessonTitleSafe}{extension}";
            
            return $"{folderPath}/{fileName}";
        }

        private string SanitizeForPath(string input)
        {
            // Remove caracteres especiais e substitui espaços por underscores
            var sanitized = input
                .Replace(" ", "_")
                .Replace("/", "_")
                .Replace("\\", "_")
                .Replace(":", "_")
                .Replace("*", "_")
                .Replace("?", "_")
                .Replace("\"", "_")
                .Replace("<", "_")
                .Replace(">", "_")
                .Replace("|", "_");
            
            // Limitar tamanho para evitar paths muito longos
            if (sanitized.Length > 50)
            {
                sanitized = sanitized.Substring(0, 50);
            }
            
            return sanitized;
        }


    }
}
