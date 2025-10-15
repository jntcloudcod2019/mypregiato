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
            // Validações de entrada
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("Arquivo inválido ou vazio", nameof(file));
            }

            if (string.IsNullOrWhiteSpace(directory))
            {
                throw new ArgumentException("Diretório não pode ser vazio", nameof(directory));
            }

            // Validação de segurança: prevenir path traversal no diretório
            if (directory.Contains("..") || directory.Contains("/") || directory.Contains("\\"))
            {
                throw new ArgumentException("Nome de diretório inválido", nameof(directory));
            }

            var basePath = _configuration["FileStorage:BasePath"] ?? "uploads";
            var uploadPath = Path.Combine(basePath, directory);
            
            // Criar diretório se não existir
            Directory.CreateDirectory(uploadPath);

            // Gerar nome de arquivo seguro
            var safeFileName = Path.GetFileName(file.FileName);
            var fileName = $"{Guid.NewGuid()}_{safeFileName}";
            var filePath = Path.Combine(uploadPath, fileName);

            _logger.LogInformation("Fazendo upload de arquivo: {FileName} para {FilePath}", safeFileName, filePath);

            using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            _logger.LogInformation("Upload concluído com sucesso: {FilePath}", filePath);

            return filePath;
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (IOException ioEx)
        {
            _logger.LogError(ioEx, "Erro de I/O ao fazer upload do arquivo {FileName}", file?.FileName);
            throw new InvalidOperationException($"Erro ao salvar arquivo: {ioEx.Message}", ioEx);
        }
        catch (UnauthorizedAccessException uaEx)
        {
            _logger.LogError(uaEx, "Sem permissão para salvar arquivo {FileName}", file?.FileName);
            throw new InvalidOperationException("Sem permissão para salvar o arquivo", uaEx);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro inesperado ao fazer upload do arquivo {FileName}", file?.FileName);
            throw;
        }
    }

    public async Task<byte[]> GetFileAsync(string filePath)
    {
        try
        {
            // Validação de segurança: verificar se o caminho é válido
            if (string.IsNullOrWhiteSpace(filePath))
            {
                throw new ArgumentException("Caminho do arquivo não pode ser vazio", nameof(filePath));
            }

            // Validação de segurança: prevenir path traversal attacks
            var fullPath = Path.GetFullPath(filePath);
            var basePath = _configuration["FileStorage:BasePath"] ?? "uploads";
            var baseFullPath = Path.GetFullPath(basePath);
            
            if (!fullPath.StartsWith(baseFullPath, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Tentativa de acesso a arquivo fora do diretório permitido: {FilePath}", filePath);
                throw new UnauthorizedAccessException("Acesso ao arquivo não permitido");
            }

            if (!File.Exists(fullPath))
            {
                _logger.LogWarning("Arquivo não encontrado: {FilePath}", fullPath);
                throw new FileNotFoundException("Arquivo não encontrado", fullPath);
            }

            return await File.ReadAllBytesAsync(fullPath);
        }
        catch (FileNotFoundException)
        {
            // Re-throw FileNotFoundException sem logging adicional (já foi logado acima)
            throw;
        }
        catch (UnauthorizedAccessException)
        {
            // Re-throw UnauthorizedAccessException sem logging adicional
            throw;
        }
        catch (IOException ioEx)
        {
            _logger.LogError(ioEx, "Erro de I/O ao ler arquivo {FilePath}", filePath);
            throw new InvalidOperationException($"Erro ao ler arquivo: {ioEx.Message}", ioEx);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro inesperado ao ler arquivo {FilePath}", filePath);
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