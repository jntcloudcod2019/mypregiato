namespace Pregiato.Core.Interfaces
{
    /// <summary>
    /// Porta de saída para armazenamento de mídia
    /// Define o contrato para operações de armazenamento sem depender de implementação específica
    /// </summary>
    /// 

    public class MediaResultDto
    {
        public required string MediaUrl { get; set; }
        public required string ObjectName { get; set; }
    }


    public interface IMediaStoragePort
    {
        Task<MediaResultDto> StoreMediaAsync(string base64Data, string mimeType, string contactNumber, string? senderName);
        Task<byte[]> GetMediaAsync(string mediaUrl);      
        Task<string> GetPublicUrlAsync(string mediaUrl);
    }
}
