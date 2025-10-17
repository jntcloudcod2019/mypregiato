using System.Text.Json.Serialization;

namespace Pregiato.Application.DTOs.Meta
{
    // ============================================================================
    // MODELOS DE WEBHOOK DA META API
    // Estrutura que a Meta envia via POST para nosso endpoint
    // ============================================================================

    /// <summary>
    /// Payload principal do webhook da Meta
    /// </summary>
    public class MetaWebhookPayload
    {
        [JsonPropertyName("object")]
        public string Object { get; set; } = string.Empty;

        [JsonPropertyName("entry")]
        public List<MetaWebhookEntry> Entry { get; set; } = new();
    }

    /// <summary>
    /// Entry do webhook (pode ter múltiplas)
    /// </summary>
    public class MetaWebhookEntry
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("changes")]
        public List<MetaWebhookChange> Changes { get; set; } = new();
    }

    /// <summary>
    /// Change dentro de um entry
    /// </summary>
    public class MetaWebhookChange
    {
        [JsonPropertyName("value")]
        public MetaWebhookValue Value { get; set; } = new();

        [JsonPropertyName("field")]
        public string Field { get; set; } = string.Empty;
    }

    /// <summary>
    /// Value contém os dados reais (mensagens, status, etc)
    /// </summary>
    public class MetaWebhookValue
    {
        [JsonPropertyName("messaging_product")]
        public string MessagingProduct { get; set; } = string.Empty;

        [JsonPropertyName("metadata")]
        public MetaWebhookMetadata Metadata { get; set; } = new();

        [JsonPropertyName("contacts")]
        public List<MetaWebhookContact>? Contacts { get; set; }

        [JsonPropertyName("messages")]
        public List<MetaWebhookMessage>? Messages { get; set; }

        [JsonPropertyName("statuses")]
        public List<MetaWebhookStatus>? Statuses { get; set; }
    }

    /// <summary>
    /// Metadata do webhook (info do número que recebeu)
    /// </summary>
    public class MetaWebhookMetadata
    {
        [JsonPropertyName("display_phone_number")]
        public string DisplayPhoneNumber { get; set; } = string.Empty;

        [JsonPropertyName("phone_number_id")]
        public string PhoneNumberId { get; set; } = string.Empty;
    }

    /// <summary>
    /// Informações de contato no webhook
    /// </summary>
    public class MetaWebhookContact
    {
        [JsonPropertyName("profile")]
        public MetaWebhookProfile Profile { get; set; } = new();

        [JsonPropertyName("wa_id")]
        public string WaId { get; set; } = string.Empty;
    }

    public class MetaWebhookProfile
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>
    /// Mensagem recebida via webhook
    /// </summary>
    public class MetaWebhookMessage
    {
        [JsonPropertyName("from")]
        public string From { get; set; } = string.Empty;

        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("timestamp")]
        public string Timestamp { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        // Conteúdo baseado no tipo
        [JsonPropertyName("text")]
        public MetaWebhookTextContent? Text { get; set; }

        [JsonPropertyName("image")]
        public MetaWebhookMediaContent? Image { get; set; }

        [JsonPropertyName("audio")]
        public MetaWebhookMediaContent? Audio { get; set; }

        [JsonPropertyName("voice")]
        public MetaWebhookMediaContent? Voice { get; set; }

        [JsonPropertyName("video")]
        public MetaWebhookMediaContent? Video { get; set; }

        [JsonPropertyName("document")]
        public MetaWebhookDocumentContent? Document { get; set; }

        [JsonPropertyName("sticker")]
        public MetaWebhookMediaContent? Sticker { get; set; }

        [JsonPropertyName("location")]
        public MetaWebhookLocationContent? Location { get; set; }

        [JsonPropertyName("contacts")]
        public List<MetaWebhookContactContent>? Contacts { get; set; }

        [JsonPropertyName("context")]
        public MetaWebhookContext? Context { get; set; }
    }

    /// <summary>
    /// Conteúdo de mensagem de texto
    /// </summary>
    public class MetaWebhookTextContent
    {
        [JsonPropertyName("body")]
        public string Body { get; set; } = string.Empty;
    }

    /// <summary>
    /// Conteúdo de mídia (imagem, áudio, vídeo, sticker)
    /// </summary>
    public class MetaWebhookMediaContent
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("mime_type")]
        public string MimeType { get; set; } = string.Empty;

        [JsonPropertyName("sha256")]
        public string? Sha256 { get; set; }

        [JsonPropertyName("caption")]
        public string? Caption { get; set; }
    }

    /// <summary>
    /// Conteúdo de documento (tem filename adicional)
    /// </summary>
    public class MetaWebhookDocumentContent : MetaWebhookMediaContent
    {
        [JsonPropertyName("filename")]
        public string? Filename { get; set; }
    }

    /// <summary>
    /// Conteúdo de localização
    /// </summary>
    public class MetaWebhookLocationContent
    {
        [JsonPropertyName("latitude")]
        public double Latitude { get; set; }

        [JsonPropertyName("longitude")]
        public double Longitude { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("address")]
        public string? Address { get; set; }
    }

    /// <summary>
    /// Conteúdo de contato compartilhado
    /// </summary>
    public class MetaWebhookContactContent
    {
        [JsonPropertyName("name")]
        public MetaWebhookContactName? Name { get; set; }

        [JsonPropertyName("phones")]
        public List<MetaWebhookPhone>? Phones { get; set; }
    }

    public class MetaWebhookContactName
    {
        [JsonPropertyName("formatted_name")]
        public string FormattedName { get; set; } = string.Empty;

        [JsonPropertyName("first_name")]
        public string? FirstName { get; set; }

        [JsonPropertyName("last_name")]
        public string? LastName { get; set; }
    }

    public class MetaWebhookPhone
    {
        [JsonPropertyName("phone")]
        public string Phone { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("wa_id")]
        public string? WaId { get; set; }
    }

    /// <summary>
    /// Contexto da mensagem (quando é resposta)
    /// </summary>
    public class MetaWebhookContext
    {
        [JsonPropertyName("from")]
        public string From { get; set; } = string.Empty;

        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;
    }

    /// <summary>
    /// Status update de mensagem enviada
    /// </summary>
    public class MetaWebhookStatus
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("timestamp")]
        public string Timestamp { get; set; } = string.Empty;

        [JsonPropertyName("recipient_id")]
        public string RecipientId { get; set; } = string.Empty;

        [JsonPropertyName("conversation")]
        public MetaConversationInfo? Conversation { get; set; }

        [JsonPropertyName("pricing")]
        public MetaPricingInfo? Pricing { get; set; }

        [JsonPropertyName("errors")]
        public List<MetaWebhookError>? Errors { get; set; }
    }

    public class MetaConversationInfo
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("origin")]
        public MetaConversationOrigin Origin { get; set; } = new();

        [JsonPropertyName("expiration_timestamp")]
        public string? ExpirationTimestamp { get; set; }
    }

    public class MetaConversationOrigin
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;
    }

    public class MetaPricingInfo
    {
        [JsonPropertyName("billable")]
        public bool Billable { get; set; }

        [JsonPropertyName("pricing_model")]
        public string PricingModel { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty;
    }

    public class MetaWebhookError
    {
        [JsonPropertyName("code")]
        public int Code { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("error_data")]
        public MetaErrorData? ErrorData { get; set; }
    }

    public class MetaErrorData
    {
        [JsonPropertyName("details")]
        public string Details { get; set; } = string.Empty;
    }
}

