using System.Text.Json.Serialization;

namespace Pregiato.Application.DTOs.Meta
{
    // ============================================================================
    // MODELOS DE RESPOSTA DA META API
    // ============================================================================

    /// <summary>
    /// Resultado do envio de mensagem via Meta Cloud API
    /// </summary>
    public class MetaSendMessageResult
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("whatsapp_message_id")]
        public string? WhatsAppMessageId { get; set; }

        [JsonPropertyName("client_message_id")]
        public string? ClientMessageId { get; set; }

        [JsonPropertyName("error")]
        public string? Error { get; set; }
    }

    /// <summary>
    /// Resultado do upload de mídia
    /// </summary>
    public class MetaUploadMediaResult
    {
        [JsonPropertyName("media_id")]
        public string? MediaId { get; set; }

        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("error")]
        public string? Error { get; set; }
    }

    /// <summary>
    /// Resultado do download de mídia
    /// </summary>
    public class MetaDownloadMediaResult
    {
        public byte[] Buffer { get; set; } = Array.Empty<byte>();
        public string MimeType { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string? DataUrl { get; set; } // Base64 data URL para compatibilidade
    }

    /// <summary>
    /// Informações do número de telefone
    /// </summary>
    public class MetaPhoneNumberInfo
    {
        [JsonPropertyName("display_phone_number")]
        public string DisplayPhoneNumber { get; set; } = string.Empty;

        [JsonPropertyName("verified_name")]
        public string VerifiedName { get; set; } = string.Empty;

        [JsonPropertyName("code_verification_status")]
        public string CodeVerificationStatus { get; set; } = string.Empty;

        [JsonPropertyName("quality_rating")]
        public string QualityRating { get; set; } = string.Empty;

        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;
    }

    // ============================================================================
    // MODELOS DE REQUISIÇÃO PARA META API
    // ============================================================================

    /// <summary>
    /// Request para enviar mensagem de texto
    /// </summary>
    public class MetaTextMessageRequest
    {
        [JsonPropertyName("messaging_product")]
        public string MessagingProduct { get; set; } = "whatsapp";

        [JsonPropertyName("recipient_type")]
        public string RecipientType { get; set; } = "individual";

        [JsonPropertyName("to")]
        public string To { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = "text";

        [JsonPropertyName("text")]
        public MetaTextContent Text { get; set; } = new();
    }

    public class MetaTextContent
    {
        [JsonPropertyName("body")]
        public string Body { get; set; } = string.Empty;

        [JsonPropertyName("preview_url")]
        public bool PreviewUrl { get; set; } = false;
    }

    /// <summary>
    /// Request para enviar mensagem com mídia
    /// </summary>
    public class MetaMediaMessageRequest
    {
        [JsonPropertyName("messaging_product")]
        public string MessagingProduct { get; set; } = "whatsapp";

        [JsonPropertyName("recipient_type")]
        public string RecipientType { get; set; } = "individual";

        [JsonPropertyName("to")]
        public string To { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        // Propriedades dinâmicas baseadas no tipo
        [JsonPropertyName("image")]
        public MetaMediaContent? Image { get; set; }

        [JsonPropertyName("audio")]
        public MetaMediaContent? Audio { get; set; }

        [JsonPropertyName("video")]
        public MetaMediaContent? Video { get; set; }

        [JsonPropertyName("document")]
        public MetaMediaContent? Document { get; set; }
    }

    public class MetaMediaContent
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("link")]
        public string? Link { get; set; }

        [JsonPropertyName("caption")]
        public string? Caption { get; set; }

        [JsonPropertyName("filename")]
        public string? Filename { get; set; }
    }

    // ============================================================================
    // MODELOS DE RESPOSTA DA META API (APIs responses)
    // ============================================================================

    /// <summary>
    /// Resposta padrão do envio de mensagem
    /// </summary>
    public class MetaMessageResponse
    {
        [JsonPropertyName("messaging_product")]
        public string MessagingProduct { get; set; } = string.Empty;

        [JsonPropertyName("contacts")]
        public List<MetaContact> Contacts { get; set; } = new();

        [JsonPropertyName("messages")]
        public List<MetaMessage> Messages { get; set; } = new();
    }

    public class MetaContact
    {
        [JsonPropertyName("input")]
        public string Input { get; set; } = string.Empty;

        [JsonPropertyName("wa_id")]
        public string WaId { get; set; } = string.Empty;
    }

    public class MetaMessage
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("message_status")]
        public string? MessageStatus { get; set; }
    }

    /// <summary>
    /// Resposta do upload de mídia
    /// </summary>
    public class MetaMediaUploadResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;
    }

    /// <summary>
    /// Informações de mídia (antes do download)
    /// </summary>
    public class MetaMediaInfo
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("url")]
        public string Url { get; set; } = string.Empty;

        [JsonPropertyName("mime_type")]
        public string MimeType { get; set; } = string.Empty;

        [JsonPropertyName("sha256")]
        public string Sha256 { get; set; } = string.Empty;

        [JsonPropertyName("file_size")]
        public long FileSize { get; set; }

        [JsonPropertyName("messaging_product")]
        public string MessagingProduct { get; set; } = string.Empty;
    }

    /// <summary>
    /// Resposta de erro da Meta API
    /// </summary>
    public class MetaErrorResponse
    {
        [JsonPropertyName("error")]
        public MetaError Error { get; set; } = new();
    }

    public class MetaError
    {
        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("code")]
        public int Code { get; set; }

        [JsonPropertyName("error_subcode")]
        public int? ErrorSubcode { get; set; }

        [JsonPropertyName("fbtrace_id")]
        public string? FbtraceId { get; set; }
    }
}

