using System.ComponentModel.DataAnnotations;

namespace Pregiato.Core.Entities
{
    public class ChatLog
    {
        [Key]
        public Guid Id { get; set; }

        // ID do chat relacionado (para agrupamento)
        public Guid ChatId { get; set; }
    
        // Telefone do remetente ou destinatário
        public string? PhoneNumber { get; set; }
        
        // ID da mensagem específica
        public string? MessageId { get; set; }
        
        // Direção: "inbound" ou "outbound"
        public string? Direction { get; set; }
        
        // Conteúdo da mensagem
        public string? Content { get; set; }
        
        // Tipo de conteúdo: "text", "image", "video", "audio", "document"
        public string? ContentType { get; set; }
        
        // Data/hora da mensagem
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        // Telefone do contato normalizado em E.164 (ex.: 5511999999999)
        [Required]
        [StringLength(20)]
        public string ContactPhoneE164 { get; set; } = string.Empty;

        // Título exibido no front (nome do contato ou telefone formatado)
        [Required]
        [StringLength(150)]
        public string Title { get; set; } = string.Empty;

        // Documento JSON completo da conversa (estrutura definível pela aplicação)
        // Ex.: { chatId, contact, messages: [{ id, dir, text, ts, status }], unreadCount, lastMessageAt, lastMessagePreview }
        [Required]
        public string PayloadJson { get; set; } = "{}";

        // Contadores e rastreio para listagens
        public int UnreadCount { get; set; } = 0;
        public DateTime? LastMessageAt { get; set; }
        
        // Timestamp UTC da última mensagem (para ordenação)
        public DateTime? LastMessageUtc { get; set; }
        
        [StringLength(200)]
        public string? LastMessagePreview { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Controle de concorrência
        [Timestamp]
        public byte[] RowVersion { get; set; } = new byte[8];
    }
}
