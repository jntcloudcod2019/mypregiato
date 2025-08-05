using Pregiato.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace Pregiato.Application.Services;

public class FileService : IFileService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<FileService> _logger;

    public FileService(IConfiguration configuration, ILogger<FileService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> UploadFileAsync(IFormFile file, string directory)
    {
        try
        {
            var basePath = _configuration["FileStorage:BasePath"] ?? "uploads";
            var uploadPath = Path.Combine(basePath, directory);
            
            Directory.CreateDirectory(uploadPath);

            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadPath, fileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            return filePath;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao fazer upload do arquivo {FileName}", file.FileName);
            throw;
        }
    }

    public async Task<byte[]> GetFileAsync(string filePath)
    {
        try
        {
            if (!File.Exists(filePath))
                throw new FileNotFoundException("Arquivo não encontrado", filePath);

            return await File.ReadAllBytesAsync(filePath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao ler arquivo {FilePath}", filePath);
            throw;
        }
    }

    public Task<bool> DeleteFileAsync(string filePath)
    {
        try
        {
            if (!File.Exists(filePath))
                return Task.FromResult(false);

            File.Delete(filePath);
            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao deletar arquivo {FilePath}", filePath);
            return Task.FromResult(false);
        }
    }

    public Task<IEnumerable<string>> GetFilesAsync(string directory)
    {
        try
        {
            var basePath = _configuration["FileStorage:BasePath"] ?? "uploads";
            var dirPath = Path.Combine(basePath, directory);

            if (!Directory.Exists(dirPath))
                return Task.FromResult(Enumerable.Empty<string>());

            var files = Directory.GetFiles(dirPath)
                .Select(f => Path.GetFileName(f))
                .ToList();

            return Task.FromResult<IEnumerable<string>>(files);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao listar arquivos do diretório {Directory}", directory);
            return Task.FromResult(Enumerable.Empty<string>());
        }
    }
} 