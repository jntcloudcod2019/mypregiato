using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pregiato.Core.Interfaces;
using System.Text;
using Minio;
using Minio.DataModel.Args; // ✅ Adicionado para resolver o erro CS0234
using Minio.Exceptions;

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
        public int TimeoutMs { get; set; } = 30000;
    }

    /// <summary>
    /// Adaptador de saída para MinIO
    /// Implementa IMediaStoragePort usando MinIO (S3-compatible)
    /// Versão simplificada para compatibilidade com MinIO 6.0.5
    /// </summary>
    public class MinIOStorageAdapter : IMediaStoragePort
    {
        private readonly MinIOOptions _options;
        private readonly ILogger<MinIOStorageAdapter> _logger;
        private readonly IMinioClient _minioClient;
        private bool _isInitialized = false;

        public MinIOStorageAdapter(IOptions<MinIOOptions> options, ILogger<MinIOStorageAdapter> logger)
        {
            _options = options.Value;
            _logger = logger;
            
            // ✅ CORREÇÃO: Inicializar o cliente MinIO usando o novo construtor
            _minioClient = new MinioClient()
                .WithEndpoint(_options.Endpoint)
                .WithCredentials(_options.AccessKey, _options.SecretKey)
                .WithSSL(_options.UseSSL)
                .Build();
        }

        private async Task EnsureInitializedAsync()
        {
            if (_isInitialized) return;

            try
            {
                _logger.LogInformation("🔄 Inicializando conexão MinIO...");
                
                // ✅ CORREÇÃO: Usar BucketExistsAsync e MakeBucketAsync
                var bucketExistsArgs = new BucketExistsArgs().WithBucket(_options.BucketName);
                bool found = await _minioClient.BucketExistsAsync(bucketExistsArgs);

                if (!found)
                {
                    _logger.LogInformation("Bucket MinIO não existe. Criando: {BucketName}", _options.BucketName);
                    var makeBucketArgs = new MakeBucketArgs().WithBucket(_options.BucketName);
                    await _minioClient.MakeBucketAsync(makeBucketArgs);
                    _logger.LogInformation("✅ Bucket MinIO criado com sucesso: {BucketName}", _options.BucketName);
                }
                else
                {
                    _logger.LogInformation("✅ Bucket MinIO já existe: {BucketName}", _options.BucketName);
                }

                _isInitialized = true;
                _logger.LogInformation("🎉 MinIO inicializado com sucesso - Endpoint: {Endpoint}, Bucket: {BucketName}", 
                    _options.Endpoint, _options.BucketName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Falha ao inicializar MinIO - Endpoint: {Endpoint}, Bucket: {BucketName}", 
                    _options.Endpoint, _options.BucketName);
                throw;
            }
        }

        public async Task<string> StoreMediaAsync(string base64Data, string mimeType, string filename)
        {
            try
            {
                await EnsureInitializedAsync();
                
                _logger.LogInformation("🎬 Iniciando upload para MinIO: {MimeType}, {Filename}", mimeType, filename);

                var base64Content = ExtractBase64Content(base64Data);
                var bytes = Convert.FromBase64String(base64Content);

                var uniqueFileName = $"{Guid.NewGuid()}{GetFileExtension(mimeType)}";
                var objectName = $"media/{uniqueFileName}";

                using var stream = new MemoryStream(bytes);

                // ✅ CORREÇÃO: Usar PutObjectAsync com PutObjectArgs
                var putObjectArgs = new PutObjectArgs()
                    .WithBucket(_options.BucketName)
                    .WithObject(objectName)
                    .WithStreamData(stream)
                    .WithObjectSize(stream.Length)
                    .WithContentType(mimeType);

                await _minioClient.PutObjectAsync(putObjectArgs);

                var mediaUrl = $"{(_options.UseSSL ? "https" : "http")}://{_options.Endpoint.Replace("http://", "").Replace("https://", "")}/{_options.BucketName}/{objectName}";
                
                _logger.LogInformation("✅ Upload para MinIO concluído: {MediaUrl} ({Size} bytes)", 
                    mediaUrl, bytes.Length);
                
                return mediaUrl;
            }
            catch (MinioException ex)
            {
                _logger.LogError(ex, "❌ Erro do MinIO ao fazer upload: {MimeType}, {Filename}", mimeType, filename);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro genérico ao fazer upload para MinIO: {MimeType}, {Filename}", mimeType, filename);
                throw;
            }
        }

        /// <summary>
        /// Armazena mídia com nomenclatura descritiva baseada no contexto da mensagem
        /// Formato: messageId_contato_data_hora_remetente.extensao
        /// </summary>
        public async Task<string> StoreMediaAsync(string base64Data, string mimeType, string messageId, string contactNumber, string senderName)
        {
            try
            {
                await EnsureInitializedAsync();
                
                _logger.LogInformation("🎬 Iniciando upload para MinIO com nomenclatura descritiva: {MimeType}, {MessageId}, {ContactNumber}, {SenderName}", 
                    mimeType, messageId, contactNumber, senderName);

                var base64Content = ExtractBase64Content(base64Data);
                var bytes = Convert.FromBase64String(base64Content);

                // ✅ NOVA NOMENCLATURA: messageId_contato_data_hora_remetente.extensao
                var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
                var extension = GetFileExtension(mimeType);
                
                var descriptiveFileName = $"{messageId}_{contactNumber}_{timestamp}_{senderName}{extension}";
                var objectName = $"media/{descriptiveFileName}";

                using var stream = new MemoryStream(bytes);

                // ✅ CORREÇÃO: Usar PutObjectAsync com PutObjectArgs
                var putObjectArgs = new PutObjectArgs()
                    .WithBucket(_options.BucketName)
                    .WithObject(objectName)
                    .WithStreamData(stream)
                    .WithObjectSize(stream.Length)
                    .WithContentType(mimeType);

                await _minioClient.PutObjectAsync(putObjectArgs);

                var mediaUrl = $"{(_options.UseSSL ? "https" : "http")}://{_options.Endpoint.Replace("http://", "").Replace("https://", "")}/{_options.BucketName}/{objectName}";
                
                _logger.LogInformation("✅ Upload para MinIO concluído com nomenclatura descritiva: {MediaUrl} ({Size} bytes)", 
                    mediaUrl, bytes.Length);
                
                return mediaUrl;
            }
            catch (MinioException ex)
            {
                _logger.LogError(ex, "❌ Erro do MinIO ao fazer upload: {MimeType}, {MessageId}, {ContactNumber}, {SenderName}", 
                    mimeType, messageId, contactNumber, senderName);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro inesperado ao fazer upload: {MimeType}, {MessageId}, {ContactNumber}, {SenderName}", 
                    mimeType, messageId, contactNumber, senderName);
                throw;
            }
        }

        public async Task<byte[]> GetMediaAsync(string mediaUrl)
        {
            try
            {
                await EnsureInitializedAsync();
                
                _logger.LogInformation("📥 Iniciando download do MinIO: {MediaUrl}", mediaUrl);

                var objectName = ExtractObjectKeyFromUrl(mediaUrl);
                
                using var stream = new MemoryStream();

                // ✅ CORREÇÃO: Usar GetObjectAsync com GetObjectArgs
                var getObjectArgs = new GetObjectArgs()
                    .WithBucket(_options.BucketName)
                    .WithObject(objectName)
                    .WithCallbackStream((responseStream) =>
                    {
                        responseStream.CopyTo(stream);
                    });

                await _minioClient.GetObjectAsync(getObjectArgs);
                
                var bytes = stream.ToArray();
                
                _logger.LogInformation("✅ Download do MinIO concluído: {MediaUrl} ({Size} bytes)", 
                    mediaUrl, bytes.Length);
                
                return bytes;
            }
            catch (MinioException ex)
            {
                _logger.LogError(ex, "❌ Erro do MinIO ao fazer download: {MediaUrl}", mediaUrl);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro genérico ao fazer download do MinIO: {MediaUrl}", mediaUrl);
                throw;
            }
        }

        public async Task<bool> DeleteMediaAsync(string mediaUrl)
        {
            try
            {
                await EnsureInitializedAsync();
                
                _logger.LogInformation("🗑️ Iniciando exclusão do MinIO: {MediaUrl}", mediaUrl);

                var objectName = ExtractObjectKeyFromUrl(mediaUrl);
                
                // ✅ CORREÇÃO: Usar RemoveObjectAsync com RemoveObjectArgs
                var removeObjectArgs = new RemoveObjectArgs()
                    .WithBucket(_options.BucketName)
                    .WithObject(objectName);
                
                await _minioClient.RemoveObjectAsync(removeObjectArgs);
                
                _logger.LogInformation("✅ Exclusão do MinIO concluída: {MediaUrl}", mediaUrl);
                return true;
            }
            catch (MinioException ex)
            {
                _logger.LogError(ex, "❌ Erro do MinIO ao excluir: {MediaUrl}", mediaUrl);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro genérico ao excluir do MinIO: {MediaUrl}", mediaUrl);
                throw;
            }
        }

        // ✅ Método de interface renomeado e ajustado
        public Task<string> GetPublicUrlAsync(string mediaUrl)
        {
            // Para MinIO, a URL já é pública se o bucket permitir
            return Task.FromResult(mediaUrl);
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
            var uri = new Uri(mediaUrl);
            var pathSegments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            
            if (pathSegments.Length < 2)
                throw new ArgumentException("URL de mídia inválida");

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
