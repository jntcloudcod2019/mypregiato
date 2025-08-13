using System;

namespace Pregiato.API.Models.WhatsApp
{
    // Espelha o formato publicado pelo zap-bot na fila whatsapp.incoming
    public class InboundMessageDto
    {
        public string? externalMessageId { get; set; }
        public string? from { get; set; }
        public string? fromNormalized { get; set; }
        public string? to { get; set; }
        public string? body { get; set; }
        public string? type { get; set; } // text | image | file | audio
        public AttachmentDto? attachment { get; set; }
        public string? timestamp { get; set; } // ISO
        public string? instanceId { get; set; }
    }
}


