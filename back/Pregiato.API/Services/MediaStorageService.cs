using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Pregiato.Core.Interfaces;

namespace Pregiato.API.Services
{
    public class MediaStorageService
    {
        private readonly ILogger<MediaStorageService> _logger;
        private readonly string _mediaPath;
        private readonly IMediaStoragePort _mediaStoragePort;

        public MediaStorageService(ILogger<MediaStorageService> logger, IMediaStoragePort mediaStoragePort)
        {
            _logger = logger;
            _mediaPath = Path.Combine("wwwroot", "media");
            _mediaStoragePort = mediaStoragePort;
            
            // ✅ REATIVADO: Criar diretório se não existir
            if (!Directory.Exists(_mediaPath))
            {
                Directory.CreateDirectory(_mediaPath);
                _logger.LogInformation("📁 Diretório de mídia criado: {MediaPath}", _mediaPath);
            }
        }

        public async Task<MediaResultDto> StoreMediaAsync(string base64Data, string mimeType, string filename)
        {
            try
            {
                _logger.LogInformation("🎬 Iniciando armazenamento de mídia: {MimeType}, {Filename}", mimeType, filename);

                // ✅ TENTAR MINIO PRIMEIRO
                try
                {
                    var minioUrl = await _mediaStoragePort.StoreMediaAsync(base64Data, mimeType, filename,"nada" );
                    _logger.LogInformation("✅ Mídia armazenada no MinIO: {MinioUrl}", minioUrl);
                    return minioUrl;
                }
                catch (Exception minioEx)
                {
                    _logger.LogWarning(minioEx, "⚠️ Falha no MinIO, usando fallback local");
                }

                // ✅ FALLBACK: ARMAZENAMENTO LOCAL
                var result = await StoreMediaLocallyAsync(base64Data, mimeType, filename);
                
                var data = new MediaResultDto
                {
                    MediaUrl = result,
                    ObjectName = filename
                };

            _logger.LogInformation("✅ Upload concluído: {Url}", data.MediaUrl);
            return data;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao armazenar mídia: {MimeType}, {Filename}", mimeType, filename);
                throw;
            }
        }

        private async Task<string> StoreMediaLocallyAsync(string base64Data, string mimeType, string filename)
        {
            // 🔧 CORREÇÃO CRÍTICA: Parsing robusto do Base64
            string base64Content;
            
            if (string.IsNullOrWhiteSpace(base64Data))
            {
                throw new ArgumentException("Dados Base64 não podem ser vazios", nameof(base64Data));
            }

            if (base64Data.Contains(","))
            {
                // Formato: data:mime;base64,{conteúdo}
                var parts = base64Data.Split(',');
                if (parts.Length >= 2)
                {
                    base64Content = parts[1];
                }
                else
                {
                    throw new ArgumentException("Formato Base64 inválido - separador encontrado mas sem conteúdo", nameof(base64Data));
                }
            }
            else
            {
                // Base64 puro
                base64Content = base64Data;
            }

            // Validar se é Base64 válido
            byte[] bytes;
            try
            {
                bytes = Convert.FromBase64String(base64Content);
            }
            catch (FormatException)
            {
                throw new ArgumentException("Dados Base64 inválidos", nameof(base64Data));
            }
            
            if (bytes.Length == 0)
            {
                throw new ArgumentException("Dados Base64 resultaram em array vazio", nameof(base64Data));
            }

            // Gerar nome único
            var extension = GetFileExtension(mimeType);
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";

            // Caminho de armazenamento
            var filePath = Path.Combine(_mediaPath, uniqueFileName);

            // Salvar arquivo
            await File.WriteAllBytesAsync(filePath, bytes);

            // Retornar URL relativa
            var mediaUrl = $"/media/{uniqueFileName}";

            _logger.LogInformation("✅ Mídia armazenada localmente: {MediaUrl}", mediaUrl);

            return mediaUrl;
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
                "application/pdf" => ".pdf",
                "application/msword" => ".doc",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => ".docx",
                "application/vnd.ms-excel" => ".xls",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => ".xlsx",
                "text/plain" => ".txt",
                _ => ".bin"
            };
        }

        public bool DeleteMedia(string mediaUrl)
        {
            try
            {
                if (string.IsNullOrEmpty(mediaUrl) || !mediaUrl.StartsWith("/media/"))
                {
                    return false;
                }

                var fileName = Path.GetFileName(mediaUrl);
                var filePath = Path.Combine(_mediaPath, fileName);

                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    _logger.LogInformation("🗑️ Mídia removida: {FilePath}", filePath);
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao remover mídia: {MediaUrl}", mediaUrl);
                return false;
            }
        }
    }
}