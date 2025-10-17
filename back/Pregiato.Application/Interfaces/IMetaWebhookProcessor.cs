using Pregiato.Application.DTOs.Meta;

namespace Pregiato.Application.Interfaces
{
    /// <summary>
    /// Interface para processamento de webhooks da Meta Cloud API
    /// </summary>
    public interface IMetaWebhookProcessor
    {
        /// <summary>
        /// Processa um webhook completo da Meta
        /// </summary>
        /// <param name="payload">Payload do webhook</param>
        Task ProcessWebhookAsync(MetaWebhookPayload payload);

        /// <summary>
        /// Processa uma mensagem individual recebida
        /// </summary>
        /// <param name="message">Mensagem do webhook</param>
        /// <param name="metadata">Metadata do webhook</param>
        Task ProcessInboundMessageAsync(
            MetaWebhookMessage message, 
            MetaWebhookMetadata metadata);

        /// <summary>
        /// Processa atualização de status de mensagem
        /// </summary>
        /// <param name="status">Status update do webhook</param>
        Task ProcessMessageStatusAsync(MetaWebhookStatus status);
    }
}

