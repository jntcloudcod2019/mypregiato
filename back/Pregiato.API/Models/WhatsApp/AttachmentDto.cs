namespace Pregiato.API.Models.WhatsApp
{
    // Espelha o payload enviado pelo zap-bot (node) para inbound e outbound
    public class AttachmentDto
    {
        public string? dataUrl { get; set; } // data:mime;base64,...
        public string? mimeType { get; set; }
        public string? fileName { get; set; }
        public string? mediaType { get; set; } // image | file | audio
    }
}


