using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pregiato.Core.Interfaces;
using System.Text;
using Minio;
using Minio.DataModel.Args;

namespace Pregiato.Infrastructure.Adapters
{
    public class MinIOOptions
    {
        public string Endpoint { get; set; } = string.Empty;
        public string AccessKey { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public string BucketName { get; set; } = "midias";
        public bool UseSSL { get; set; } = true;
        public string Region { get; set; } = "us-east-1";
    }

    /// <summary>
    /// Adaptador de saída para MinIO
    /// Implementa IMediaStoragePort usando MinIO (S3-compatible)
    /// TODO: Implementar integração real com MinIO quando necessário
    /// </summary>
    public class MinIOStorageAdapter : IMediaStoragePort
    {
        private readonly MinIOOptions _options;
        private readonly ILogger<MinIOStorageAdapter> _logger;

        public MinIOStorageAdapter(IOptions<MinIOOptions> options, ILogger<MinIOStorageAdapter> logger)
        {
            _options = options.Value;
            _logger = logger;
        }

        public async Task<string> StoreMediaAsync(string base64Data, string mimeType, string filename)
        {
            try
            {
                _logger.LogInformation("🎬 Iniciando upload para MinIO: {MimeType}, {Filename}", mimeType, filename);

                // TODO: Implementar upload real para MinIO
                // Por enquanto, retornar URL simulada
                var uniqueFileName = $"{Guid.NewGuid()}{GetFileExtension(mimeType)}";
                var mediaUrl = $"{_options.Endpoint}/{_options.BucketName}/media/{uniqueFileName}";
                
                _logger.LogInformation("✅ Upload simulado concluído: {MediaUrl}", mediaUrl);
                
                await Task.Delay(100); // Simular operação assíncrona
                return mediaUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao fazer upload para MinIO: {MimeType}, {Filename}", mimeType, filename);
                throw;
            }
        }

        public async Task<byte[]> GetMediaAsync(string mediaUrl)
        {
            try
            {
                _logger.LogInformation("📥 Iniciando download do MinIO: {MediaUrl}", mediaUrl);

                // TODO: Implementar download real do MinIO
                // Por enquanto, retornar array vazio
                await Task.Delay(100); // Simular operação assíncrona
                
                _logger.LogInformation("✅ Download simulado concluído: {MediaUrl}", mediaUrl);
                return new byte[0];
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao fazer download do MinIO: {MediaUrl}", mediaUrl);
                throw;
            }
        }

        public async Task<bool> DeleteMediaAsync(string mediaUrl)
        {
            try
            {
                _logger.LogInformation("🗑️ Iniciando exclusão do MinIO: {MediaUrl}", mediaUrl);

                // TODO: Implementar exclusão real do MinIO
                await Task.Delay(100); // Simular operação assíncrona
                
                _logger.LogInformation("✅ Exclusão simulada concluída: {MediaUrl}", mediaUrl);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao excluir do MinIO: {MediaUrl}", mediaUrl);
                return false;
            }
        }

        public async Task<string> GetPublicUrlAsync(string mediaUrl)
        {
            // Para MinIO, a URL já é pública se o bucket permitir
            return mediaUrl;
        }

        private string ExtractBase64Content(string base64Data)
        {
            if (string.IsNullOrWhiteSpace(base64Data))
                throw new ArgumentException("Dados Base64 não podem ser vazios");

            if (base64Data.Contains(","))
            {
                var parts = base64Data.Split(',');
                if (parts.Length >= 2)
                    return parts[1];
                else
                    throw new ArgumentException("Formato Base64 inválido");
            }

            return base64Data;
        }

        private string ExtractObjectKeyFromUrl(string mediaUrl)
        {
            // Extrair object key da URL: https://endpoint/bucket/key
            var uri = new Uri(mediaUrl);
            var pathSegments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            
            if (pathSegments.Length < 2)
                throw new ArgumentException("URL de mídia inválida");

            // Pular o bucket name e pegar o resto como object key
            return string.Join("/", pathSegments.Skip(1));
        }

        private string GetFileExtension(string mimeType)
        {
            return mimeType switch
            {
                "image/jpeg" => ".jpg",
                "image/png" => ".png",
                "image/gif" => ".gif",
                "image/webp" => ".webp",
                "video/mp4" => ".mp4",
                "video/avi" => ".avi",
                "video/mov" => ".mov",
                "audio/ogg" => ".ogg",
                "audio/mpeg" => ".mp3",
                "audio/wav" => ".wav",
                "audio/webm" => ".webm",
                "application/pdf" => ".pdf",
                "application/msword" => ".doc",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => ".docx",
                "application/vnd.ms-excel" => ".xls",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => ".xlsx",
                "text/plain" => ".txt",
                _ => ".bin"
            };
        }
    }
}
