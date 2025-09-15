namespace Pregiato.Core.Interfaces
{
    /// <summary>
    /// Porta de saída para armazenamento de mídia
    /// Define o contrato para operações de armazenamento sem depender de implementação específica
    /// </summary>
    public interface IMediaStoragePort
    {
        Task<string> StoreMediaAsync(string base64Data, string mimeType, string filename);
        Task<byte[]> GetMediaAsync(string mediaUrl);
        Task<bool> DeleteMediaAsync(string mediaUrl);
        Task<string> GetPublicUrlAsync(string mediaUrl);
    }
}
