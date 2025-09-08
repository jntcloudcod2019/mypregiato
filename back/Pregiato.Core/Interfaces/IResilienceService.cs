namespace Pregiato.Core.Interfaces
{
    /// <summary>
    /// Interface para o serviço de resiliência
    /// </summary>
    public interface IResilienceService
    {
        /// <summary>
        /// Executa uma operação com resiliência automática
        /// </summary>
        Task<T> ExecuteWithResilienceAsync<T>(
            Func<Task<T>> operation,
            string operationName,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Executa uma operação sem retorno com resiliência automática
        /// </summary>
        Task ExecuteWithResilienceAsync(
            Func<Task> operation,
            string operationName,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Obtém o status de saúde dos serviços
        /// </summary>
        object GetHealthStatus();
    }
}
