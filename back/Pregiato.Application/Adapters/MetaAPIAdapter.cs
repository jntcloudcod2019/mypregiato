using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Http;
using Pregiato.Application.DTOs.Meta;
using Pregiato.Application.Interfaces;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace Pregiato.Application.Adapters
{
    /// <summary>
    /// Adapter para Meta Cloud API (WhatsApp Business)
    /// Implementa integração completa com a API oficial do WhatsApp
    /// Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api
    /// </summary>
    public class MetaAPIAdapter : IMetaAPIClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<MetaAPIAdapter> _logger;
        private readonly string _phoneNumberId;
        private readonly string _accessToken;
        private readonly string _apiVersion;
        private readonly string _baseUrl;

        public MetaAPIAdapter(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<MetaAPIAdapter> logger)
        {
            _httpClient = httpClientFactory.CreateClient("MetaAPI");
            _logger = logger;

            // Carregar configurações
            _phoneNumberId = configuration["Meta:PhoneNumberId"] 
                ?? throw new ArgumentNullException("Meta:PhoneNumberId não configurado");
            _accessToken = configuration["Meta:AccessToken"] 
                ?? throw new ArgumentNullException("Meta:AccessToken não configurado");
            _apiVersion = configuration["Meta:ApiVersion"] ?? "v21.0";
            _baseUrl = $"https://graph.facebook.com/{_apiVersion}";

            // Configurar HttpClient
            _httpClient.BaseAddress = new Uri(_baseUrl);
            _httpClient.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", _accessToken);
            _httpClient.Timeout = TimeSpan.FromSeconds(30);

            _logger.LogInformation("✅ MetaAPIAdapter inicializado - Phone Number ID: {PhoneNumberId}, API Version: {ApiVersion}",
                _phoneNumberId, _apiVersion);
        }

        // ============================================================================
        // ENVIO DE MENSAGENS
        // ============================================================================

        public async Task<MetaSendMessageResult> SendTextMessageAsync(
            string to, 
            string body, 
            string? clientMessageId = null)
        {
            try
            {
                _logger.LogInformation("📤 [META] Enviando mensagem de texto - To: {To}, Length: {Length}",
                    to, body?.Length ?? 0);

                var request = new MetaTextMessageRequest
                {
                    To = to,
                    Text = new MetaTextContent
                    {
                        Body = body,
                        PreviewUrl = body.Contains("http://") || body.Contains("https://")
                    }
                };

                var url = $"/{_phoneNumberId}/messages";
                var response = await _httpClient.PostAsJsonAsync(url, request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ [META] Erro ao enviar mensagem - Status: {Status}, Error: {Error}",
                        response.StatusCode, errorContent);

                    return new MetaSendMessageResult
                    {
                        Success = false,
                        Error = $"Meta API error: {response.StatusCode} - {errorContent}",
                        ClientMessageId = clientMessageId
                    };
                }

                var result = await response.Content.ReadFromJsonAsync<MetaMessageResponse>();

                if (result?.Messages != null && result.Messages.Any())
                {
                    var whatsappMessageId = result.Messages[0].Id;
                    
                    _logger.LogInformation("✅ [META] Mensagem de texto enviada - WhatsApp ID: {MessageId}",
                        whatsappMessageId);

                    return new MetaSendMessageResult
                    {
                        Success = true,
                        WhatsAppMessageId = whatsappMessageId,
                        ClientMessageId = clientMessageId
                    };
                }

                _logger.LogWarning("⚠️ [META] Resposta sem messages array");
                return new MetaSendMessageResult
                {
                    Success = false,
                    Error = "Resposta inválida da Meta API",
                    ClientMessageId = clientMessageId
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [META] Exceção ao enviar mensagem de texto");
                return new MetaSendMessageResult
                {
                    Success = false,
                    Error = ex.Message,
                    ClientMessageId = clientMessageId
                };
            }
        }

        public async Task<MetaSendMessageResult> SendMediaMessageAsync(
            string to,
            string mediaType,
            string mediaId,
            string? caption = null,
            string? clientMessageId = null)
        {
            try
            {
                _logger.LogInformation("📤 [META] Enviando mensagem de mídia - To: {To}, Type: {Type}, MediaId: {MediaId}",
                    to, mediaType, mediaId);

                var mediaContent = new MetaMediaContent
                {
                    Id = mediaId,
                    Caption = caption
                };

                var request = new MetaMediaMessageRequest
                {
                    To = to,
                    Type = mediaType.ToLower()
                };

                // Atribuir mídia ao campo correto baseado no tipo
                switch (mediaType.ToLower())
                {
                    case "image":
                        request.Image = mediaContent;
                        break;
                    case "audio":
                    case "voice":
                        request.Audio = mediaContent;
                        break;
                    case "video":
                        request.Video = mediaContent;
                        break;
                    case "document":
                        request.Document = mediaContent;
                        break;
                    default:
                        _logger.LogWarning("⚠️ [META] Tipo de mídia não suportado: {Type}", mediaType);
                        return new MetaSendMessageResult
                        {
                            Success = false,
                            Error = $"Tipo de mídia não suportado: {mediaType}",
                            ClientMessageId = clientMessageId
                        };
                }

                var url = $"/{_phoneNumberId}/messages";
                var response = await _httpClient.PostAsJsonAsync(url, request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ [META] Erro ao enviar mídia - Status: {Status}, Error: {Error}",
                        response.StatusCode, errorContent);

                    return new MetaSendMessageResult
                    {
                        Success = false,
                        Error = $"Meta API error: {response.StatusCode} - {errorContent}",
                        ClientMessageId = clientMessageId
                    };
                }

                var result = await response.Content.ReadFromJsonAsync<MetaMessageResponse>();

                if (result?.Messages != null && result.Messages.Any())
                {
                    var whatsappMessageId = result.Messages[0].Id;
                    
                    _logger.LogInformation("✅ [META] Mensagem de mídia enviada - WhatsApp ID: {MessageId}, Type: {Type}",
                        whatsappMessageId, mediaType);

                    return new MetaSendMessageResult
                    {
                        Success = true,
                        WhatsAppMessageId = whatsappMessageId,
                        ClientMessageId = clientMessageId
                    };
                }

                return new MetaSendMessageResult
                {
                    Success = false,
                    Error = "Resposta inválida da Meta API",
                    ClientMessageId = clientMessageId
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [META] Exceção ao enviar mensagem de mídia");
                return new MetaSendMessageResult
                {
                    Success = false,
                    Error = ex.Message,
                    ClientMessageId = clientMessageId
                };
            }
        }

        // ============================================================================
        // UPLOAD DE MÍDIA
        // ============================================================================

        public async Task<MetaUploadMediaResult> UploadMediaAsync(
            byte[] buffer,
            string mimeType,
            string fileName)
        {
            try
            {
                _logger.LogInformation("📤 [META] Uploading mídia - FileName: {FileName}, Size: {Size} bytes, MimeType: {MimeType}",
                    fileName, buffer.Length, mimeType);

                var url = $"/{_phoneNumberId}/media";

                using var content = new MultipartFormDataContent();
                
                // Adicionar campo messaging_product
                content.Add(new StringContent("whatsapp"), "messaging_product");
                
                // Adicionar arquivo
                var fileContent = new ByteArrayContent(buffer);
                fileContent.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
                content.Add(fileContent, "file", fileName);

                var response = await _httpClient.PostAsync(url, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ [META] Erro no upload de mídia - Status: {Status}, Error: {Error}",
                        response.StatusCode, errorContent);

                    return new MetaUploadMediaResult
                    {
                        Success = false,
                        Error = $"Upload failed: {response.StatusCode} - {errorContent}"
                    };
                }

                var result = await response.Content.ReadFromJsonAsync<MetaMediaUploadResponse>();

                if (result?.Id != null)
                {
                    _logger.LogInformation("✅ [META] Mídia uploaded com sucesso - Media ID: {MediaId}",
                        result.Id);

                    return new MetaUploadMediaResult
                    {
                        Success = true,
                        MediaId = result.Id
                    };
                }

                return new MetaUploadMediaResult
                {
                    Success = false,
                    Error = "Resposta inválida da Meta API (sem ID)"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [META] Exceção ao fazer upload de mídia");
                return new MetaUploadMediaResult
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        // ============================================================================
        // DOWNLOAD DE MÍDIA
        // ============================================================================

        public async Task<MetaDownloadMediaResult> DownloadMediaAsync(string mediaId)
        {
            try
            {
                _logger.LogInformation("📥 [META] Baixando mídia - Media ID: {MediaId}", mediaId);

                // Passo 1: Obter informações da mídia (incluindo URL de download)
                var infoUrl = $"/{mediaId}";
                var infoResponse = await _httpClient.GetAsync(infoUrl);

                if (!infoResponse.IsSuccessStatusCode)
                {
                    var errorContent = await infoResponse.Content.ReadAsStringAsync();
                    _logger.LogError("❌ [META] Erro ao obter info da mídia - Status: {Status}, Error: {Error}",
                        infoResponse.StatusCode, errorContent);

                    throw new Exception($"Failed to get media info: {infoResponse.StatusCode}");
                }

                var mediaInfo = await infoResponse.Content.ReadFromJsonAsync<MetaMediaInfo>();

                if (mediaInfo == null || string.IsNullOrEmpty(mediaInfo.Url))
                {
                    _logger.LogError("❌ [META] Media info inválido - sem URL de download");
                    throw new Exception("Invalid media info response - no download URL");
                }

                _logger.LogInformation("📋 [META] Media info obtido - URL: {Url}, MimeType: {MimeType}, Size: {Size}",
                    mediaInfo.Url, mediaInfo.MimeType, mediaInfo.FileSize);

                // Passo 2: Baixar o arquivo
                var downloadResponse = await _httpClient.GetAsync(mediaInfo.Url);

                if (!downloadResponse.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ [META] Erro ao baixar mídia - Status: {Status}",
                        downloadResponse.StatusCode);
                    throw new Exception($"Failed to download media: {downloadResponse.StatusCode}");
                }

                var buffer = await downloadResponse.Content.ReadAsByteArrayAsync();

                _logger.LogInformation("✅ [META] Mídia baixada com sucesso - Size: {Size} bytes", buffer.Length);

                // Passo 3: Converter para base64 data URL (compatibilidade com sistema atual)
                var base64 = Convert.ToBase64String(buffer);
                var dataUrl = $"data:{mediaInfo.MimeType};base64,{base64}";

                return new MetaDownloadMediaResult
                {
                    Buffer = buffer,
                    MimeType = mediaInfo.MimeType,
                    FileName = ExtractFileNameFromMimeType(mediaInfo.MimeType, mediaId),
                    FileSize = buffer.Length,
                    DataUrl = dataUrl
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [META] Exceção ao baixar mídia");
                throw;
            }
        }

        // ============================================================================
        // INFORMAÇÕES DO NÚMERO
        // ============================================================================

        public async Task<MetaPhoneNumberInfo> GetPhoneNumberInfoAsync()
        {
            try
            {
                _logger.LogInformation("📞 [META] Obtendo informações do número - Phone Number ID: {PhoneNumberId}",
                    _phoneNumberId);

                var url = $"/{_phoneNumberId}";
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("❌ [META] Erro ao obter info do número - Status: {Status}, Error: {Error}",
                        response.StatusCode, errorContent);

                    throw new Exception($"Failed to get phone number info: {response.StatusCode}");
                }

                var info = await response.Content.ReadFromJsonAsync<MetaPhoneNumberInfo>();

                if (info != null)
                {
                    _logger.LogInformation("✅ [META] Informações do número obtidas - Number: {Number}, Name: {Name}, Quality: {Quality}",
                        info.DisplayPhoneNumber, info.VerifiedName, info.QualityRating);

                    return info;
                }

                throw new Exception("Invalid phone number info response");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [META] Exceção ao obter informações do número");
                throw;
            }
        }

        // ============================================================================
        // MARCAR COMO LIDO
        // ============================================================================

        public async Task<bool> MarkMessageAsReadAsync(string messageId)
        {
            try
            {
                _logger.LogInformation("✓ [META] Marcando mensagem como lida - Message ID: {MessageId}", messageId);

                var request = new
                {
                    messaging_product = "whatsapp",
                    status = "read",
                    message_id = messageId
                };

                var url = $"/{_phoneNumberId}/messages";
                var response = await _httpClient.PostAsJsonAsync(url, request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("⚠️ [META] Falha ao marcar como lido - Status: {Status}, Error: {Error}",
                        response.StatusCode, errorContent);
                    return false;
                }

                _logger.LogInformation("✅ [META] Mensagem marcada como lida");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [META] Exceção ao marcar mensagem como lida");
                return false;
            }
        }

        // ============================================================================
        // HEALTH CHECK
        // ============================================================================

        public async Task<bool> IsHealthyAsync()
        {
            try
            {
                _logger.LogDebug("🏥 [META] Verificando saúde da API");

                // Tentar obter info do número como health check
                var info = await GetPhoneNumberInfoAsync();
                
                var isHealthy = info != null && !string.IsNullOrEmpty(info.DisplayPhoneNumber);

                if (isHealthy)
                {
                    _logger.LogDebug("✅ [META] Health check OK");
                }
                else
                {
                    _logger.LogWarning("⚠️ [META] Health check falhou - resposta inválida");
                }

                return isHealthy;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [META] Health check falhou com exceção");
                return false;
            }
        }

        // ============================================================================
        // MÉTODOS AUXILIARES PRIVADOS
        // ============================================================================

        /// <summary>
        /// Extrai nome de arquivo baseado no MIME type
        /// </summary>
        private string ExtractFileNameFromMimeType(string mimeType, string mediaId)
        {
            var extension = mimeType switch
            {
                "image/jpeg" => "jpg",
                "image/png" => "png",
                "image/webp" => "webp",
                "audio/mpeg" => "mp3",
                "audio/ogg" => "ogg",
                "audio/opus" => "opus",
                "audio/aac" => "aac",
                "audio/mp4" => "m4a",
                "video/mp4" => "mp4",
                "video/3gpp" => "3gp",
                "application/pdf" => "pdf",
                "application/vnd.ms-powerpoint" => "ppt",
                "application/msword" => "doc",
                "application/vnd.ms-excel" => "xls",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => "docx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => "xlsx",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation" => "pptx",
                _ => "bin"
            };

            return $"media_{mediaId}.{extension}";
        }

        /// <summary>
        /// Formata número para padrão E.164 (sem + no início)
        /// Meta API espera apenas dígitos
        /// </summary>
        private string NormalizePhoneNumberForMeta(string phoneNumber)
        {
            // Remover todos os caracteres não numéricos
            var digits = new string(phoneNumber.Where(char.IsDigit).ToArray());
            
            _logger.LogDebug("📞 [META] Número normalizado: {Original} → {Normalized}",
                phoneNumber, digits);

            return digits;
        }
    }
}

