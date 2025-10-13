using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Interfaces;

namespace Pregiato.Application.Services
{
    public class TrainingVideoService : ITrainingVideoService
    {
        private readonly IMediaStoragePort _mediaStorage;

        public TrainingVideoService(IMediaStoragePort mediaStorage)
        {
            _mediaStorage = mediaStorage;
        }

        public async Task<VideoPresignedUrlDto> GeneratePresignedUrlAsync(TrainingVideoUploadDto uploadDto)
        {
            try
            {
                // Gerar nome do objeto seguindo o padrão: courses/{course-id}/{lesson-id}/{filename}
                var objectName = GenerateObjectName(uploadDto);
                
                // Por enquanto, retornar uma URL simples (implementação futura)
                var videoUrl = await _mediaStorage.GetPublicUrlAsync(objectName);

                return new VideoPresignedUrlDto
                {
                    ObjectName = objectName,
                    PresignedUrl = videoUrl, // Implementar presigned URL futuramente
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
                // Converter bytes para base64
                var base64Data = Convert.ToBase64String(videoData);
                
                // Upload para MinIO usando o método disponível
                var result = await _mediaStorage.StoreMediaAsync(
                    base64Data,
                    uploadDto.MimeType,
                    uploadDto.FileName, // contactNumber
                    null // senderName
                );

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
            // Formato: courses/{course-id}/{lesson-id}/{filename}
            var courseSlug = uploadDto.CourseId.ToString().ToLower().Replace(" ", "-");
            var lessonSlug = uploadDto.LessonId.ToString().ToLower().Replace(" ", "-");
            var fileName = Path.GetFileNameWithoutExtension(uploadDto.FileName);
            var extension = Path.GetExtension(uploadDto.FileName);
            
            return $"courses/{courseSlug}/{lessonSlug}/{fileName}{extension}";
        }
    }
}
