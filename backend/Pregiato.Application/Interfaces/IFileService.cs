using Microsoft.AspNetCore.Http;

namespace Pregiato.Application.Interfaces;

public interface IFileService
{
    Task<string> UploadFileAsync(IFormFile file, string directory);
    Task<byte[]> GetFileAsync(string filePath);
    Task<bool> DeleteFileAsync(string filePath);
    Task<IEnumerable<string>> GetFilesAsync(string directory);
} 