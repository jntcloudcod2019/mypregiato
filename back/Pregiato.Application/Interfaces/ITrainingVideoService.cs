using Pregiato.Application.DTOs;

namespace Pregiato.Application.Interfaces
{
    public interface ITrainingVideoService
    {
        Task<VideoPresignedUrlDto> GeneratePresignedUrlAsync(TrainingVideoUploadDto uploadDto);
        Task<VideoUploadResultDto> UploadVideoAsync(TrainingVideoUploadDto uploadDto, byte[] videoData);
        Task<string> GetVideoStreamingUrlAsync(string objectName);
        Task<VideoPresignedUrlDto> GenerateStreamingUrlAsync(string objectName, TimeSpan expiresIn);
        Task<VideoMetadataDto?> GetVideoMetadataAsync(string objectName);
        Task<bool> DeleteVideoAsync(string objectName);
        Task<bool> VideoExistsAsync(string objectName);
    }
}
