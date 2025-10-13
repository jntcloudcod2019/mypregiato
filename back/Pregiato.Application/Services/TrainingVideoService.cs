using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Interfaces;
using Microsoft.Extensions.Options;
using Pregiato.Infrastructure.Adapters;

namespace Pregiato.Application.Services
{
    public class TrainingVideoService : ITrainingVideoService
    {
        private readonly IMediaStoragePort _mediaStorage;
        private readonly MinIOOptions _minioOptions;

        public TrainingVideoService(IMediaStoragePort mediaStorage, IOptions<MinIOOptions> minioOptions)
        {
            _mediaStorage = mediaStorage;
            _minioOptions = minioOptions.Value;
        }

        public async Task<VideoPresignedUrlDto> GeneratePresignedUrlAsync(TrainingVideoUploadDto uploadDto)
        {
            try
            {
                // Gerar nome do objeto seguindo o padrão: Course/{courseId}_{courseName}/{courseId}_{lessonId}_{lessonTitle}.ext
                var objectName = GenerateObjectName(uploadDto);
                
                // Gerar URL usando o protocolo correto
                var videoUrl = GenerateVideoUrl(objectName);

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
                // Gerar nome do objeto seguindo o padrão correto
                var objectName = GenerateObjectName(uploadDto);
                
                // Converter bytes para base64
                var base64Data = Convert.ToBase64String(videoData);
                
                // Upload para MinIO usando o método disponível
                var result = await _mediaStorage.StoreMediaAsync(
                    base64Data,
                    uploadDto.MimeType,
                    objectName, // Usar o objectName gerado com o padrão correto
                    null // senderName
                );

                // Gerar URL com protocolo correto
                var videoUrl = GenerateVideoUrl(result.ObjectName);

                return new VideoUploadResultDto
                {
                    Success = true,
                    ObjectName = result.ObjectName,
                    VideoUrl = videoUrl,
                    FileSize = uploadDto.FileSize,
                    MimeType = uploadDto.MimeType
                };
            }
            catch (Exception ex)
            {
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
                var videoUrl = await _mediaStorage.GetPublicUrlAsync(objectName);
                
                return new VideoPresignedUrlDto
                {
                    ObjectName = objectName,
                    PresignedUrl = videoUrl, // Implementar presigned URL futuramente
                    ExpiresAt = DateTime.UtcNow.Add(expiresIn),
                    VideoUrl = videoUrl
                };
            }
            catch (Exception ex)
            {
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
                    FileSize = 0, // Implementar futuramente
                    MimeType = "video/mp4", // Implementar futuramente
                    CreatedAt = DateTime.UtcNow, // Implementar futuramente
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
            // Formato: Course/{courseId}_{courseName}/{courseId}_{lessonId}_{lessonTitle}.ext
            // A pasta "Course/" já existe no MinIO, só precisamos criar o restante
            
            // Limpar o nome do curso e da aula para usar em path
            var courseNameSafe = SanitizeForPath(uploadDto.CourseTitle ?? "Untitled");
            var lessonTitleSafe = SanitizeForPath(uploadDto.LessonTitle ?? "Untitled");
            
            // Obter extensão do arquivo
            var extension = Path.GetExtension(uploadDto.FileName);
            
            // Formato: Course/{courseId}_{courseName}/{courseId}_{lessonId}_{lessonTitle}.ext
            var folderPath = $"Course/{uploadDto.CourseId}_{courseNameSafe}";
            var fileName = $"{uploadDto.CourseId}_{uploadDto.LessonId}_{lessonTitleSafe}{extension}";
            
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

        private string GenerateVideoUrl(string objectName)
        {
            // Usar protocolo correto baseado em UseSSL
            var protocol = _minioOptions.UseSSL ? "https" : "http";
            var endpoint = _minioOptions.Endpoint;
            var bucketName = _minioOptions.BucketName;
            
            // Gerar URL pública do vídeo
            return $"{protocol}://{endpoint}/{bucketName}/{objectName}";
        }
    }
}
