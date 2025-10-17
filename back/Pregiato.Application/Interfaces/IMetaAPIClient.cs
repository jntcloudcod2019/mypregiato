using Pregiato.Application.DTOs.Meta;

namespace Pregiato.Application.Interfaces
{
    /// <summary>
    /// Interface para cliente da Meta Cloud API (WhatsApp Business)
    /// Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api
    /// </summary>
    public interface IMetaAPIClient
    {
        /// <summary>
        /// Envia uma mensagem de texto via Meta Cloud API
        /// </summary>
        /// <param name="to">Número do destinatário (formato E.164)</param>
        /// <param name="body">Texto da mensagem</param>
        /// <param name="clientMessageId">ID único da mensagem (para tracking)</param>
        /// <returns>Resultado do envio com WhatsApp Message ID</returns>
        Task<MetaSendMessageResult> SendTextMessageAsync(
            string to, 
            string body, 
            string? clientMessageId = null);

        /// <summary>
        /// Envia uma mensagem com mídia via Meta Cloud API
        /// </summary>
        /// <param name="to">Número do destinatário</param>
        /// <param name="mediaType">Tipo de mídia (image, audio, video, document)</param>
        /// <param name="mediaId">ID da mídia já uploadada na Meta</param>
        /// <param name="caption">Legenda opcional (para imagem/video/document)</param>
        /// <param name="clientMessageId">ID único da mensagem</param>
        /// <returns>Resultado do envio</returns>
        Task<MetaSendMessageResult> SendMediaMessageAsync(
            string to,
            string mediaType,
            string mediaId,
            string? caption = null,
            string? clientMessageId = null);

        /// <summary>
        /// Upload de mídia para Meta Cloud API
        /// </summary>
        /// <param name="buffer">Buffer com dados da mídia</param>
        /// <param name="mimeType">MIME type (ex: audio/mpeg)</param>
        /// <param name="fileName">Nome do arquivo</param>
        /// <returns>ID da mídia uploadada na Meta</returns>
        Task<MetaUploadMediaResult> UploadMediaAsync(
            byte[] buffer,
            string mimeType,
            string fileName);

        /// <summary>
        /// Download de mídia recebida via webhook
        /// </summary>
        /// <param name="mediaId">ID da mídia fornecido no webhook</param>
        /// <returns>Dados da mídia (buffer, mime type, nome)</returns>
        Task<MetaDownloadMediaResult> DownloadMediaAsync(string mediaId);

        /// <summary>
        /// Obtém informações do número de telefone configurado
        /// </summary>
        /// <returns>Informações do número (display, nome verificado, qualidade)</returns>
        Task<MetaPhoneNumberInfo> GetPhoneNumberInfoAsync();

        /// <summary>
        /// Marca mensagem como lida
        /// </summary>
        /// <param name="messageId">WhatsApp Message ID</param>
        /// <returns>True se marcado com sucesso</returns>
        Task<bool> MarkMessageAsReadAsync(string messageId);

        /// <summary>
        /// Verifica se o cliente está configurado e funcionando
        /// </summary>
        /// <returns>True se Meta API está acessível</returns>
        Task<bool> IsHealthyAsync();
    }
}

