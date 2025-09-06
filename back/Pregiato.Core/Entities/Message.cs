using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace Pregiato.Core.Entities
{
    public enum MessageDirection
    {
        In = 0,
        Out = 1
    }

    public enum MessageType
    {
        Text = 0,
        Image = 1,
        Audio = 2,
        Document = 3,
        Video = 4,
        Voice = 5,       // Nota de voz
        Sticker = 6,     // Figurinha
        Location = 7,    // Localização
        Contact = 8,     // Contato compartilhado
        System = 9       // Mensagem do sistema
    }

    public enum MessageStatus
    {
        Queued = 0,
        Sending = 1,
        Sent = 2,
        Delivered = 3,
        Read = 4,
        Failed = 5
    }

    /// <summary>
    /// Entidade Message Unificada - Suporta todos os tipos de mensagens
    /// Campos obrigatórios mínimos: Id, ConversationId, Direction, Type, CreatedAt, Status
    /// Todos os demais campos são nullable para flexibilidade
    /// </summary>
    public class Message
    {
        // === CAMPOS OBRIGATÓRIOS MÍNIMOS ===
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid ConversationId { get; set; }  // ChatId do requisito
        
        [Required]
        public MessageDirection Direction { get; set; }
        
        [Required]
        public MessageType Type { get; set; } = MessageType.Text;
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public MessageStatus Status { get; set; } = MessageStatus.Queued;

        // === IDENTIFICAÇÃO DO REMETENTE ===
        [StringLength(100)]
        public string? SenderId { get; set; }  // ID do usuário/sistema que enviou
        
        [StringLength(50)]
        public string? FromNormalized { get; set; }  // Número normalizado (ex: 5511999999999)
        
        [StringLength(100)]
        public string? FromOriginal { get; set; }   // Número original completo
        
        public bool FromMe { get; set; } = false;   // Enviado por nós ou recebido
        
        public bool IsGroup { get; set; } = false;  // Mensagem de grupo

        // === CONTEÚDO DE TEXTO (NULLABLE) ===
        // Removido StringLength para suportar mensagens longas (Base64 de áudio, etc)
        public string? Text { get; set; }  // Conteúdo da mensagem (texto, legenda)

        // === CAMPOS DE MÍDIA (NULLABLE) ===
        [StringLength(1000)]  // Aumentado para URLs longas
        public string? MediaUrl { get; set; }  // URL da mídia armazenada (S3, drive, etc)
        
        [StringLength(255)]   // Aumentado para nomes longos
        public string? FileName { get; set; }
        
        [StringLength(100)]
        public string? MimeType { get; set; }
        
        public long? Size { get; set; }  // Tamanho do arquivo em bytes
        
        public int? Duration { get; set; }  // Duração em segundos (áudio/vídeo)
        
        [StringLength(1000)]
        public string? Thumbnail { get; set; }  // URL do thumbnail (vídeo/imagem)

        // === CAMPOS DE LOCALIZAÇÃO (NULLABLE) ===
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        [StringLength(500)]
        public string? LocationAddress { get; set; }

        // === CAMPOS DE CONTATO (NULLABLE) ===
        [StringLength(200)]
        public string? ContactName { get; set; }
        [StringLength(50)]
        public string? ContactPhone { get; set; }

        // === METADADOS FLEXÍVEIS ===
        // Removido StringLength para suportar metadados extensos
        public string? Metadata { get; set; }  // JSON para extensões futuras
        
        // Removido StringLength para suportar payload completo original
        public string? PayloadJson { get; set; }  // Payload completo original (backup)

        // === IDENTIFICADORES EXTERNOS ===
        [StringLength(255)]
        public string? ExternalMessageId { get; set; }
        
        [StringLength(255)]
        public string? ClientMessageId { get; set; }
        
        [StringLength(500)]
        public string? WhatsAppMessageId { get; set; }
        
        [StringLength(100)]
        public string? ChatId { get; set; }  // ID do chat/conversa externa

        // === SISTEMA ===
        public Guid? SessionId { get; set; }
        
        [StringLength(1000)]
        public string? InternalNote { get; set; }  // Nota interna do operador
        
        public DateTime? UpdatedAt { get; set; }
        
        // === RELACIONAMENTOS ===
        public virtual Conversation Conversation { get; set; } = null!;
        public virtual ChatSession? Session { get; set; }

        // === PROPRIEDADES COMPUTADAS ===
        public bool HasMedia => !string.IsNullOrEmpty(MediaUrl);
        
        public bool HasLocation => Latitude.HasValue && Longitude.HasValue;
        
        public bool HasContact => !string.IsNullOrEmpty(ContactName);

        public string TypeDescription => Type switch
        {
            MessageType.Text => "Texto",
            MessageType.Image => "Imagem", 
            MessageType.Audio => "Áudio",
            MessageType.Video => "Vídeo",
            MessageType.Voice => "Nota de Voz",
            MessageType.Document => "Documento",
            MessageType.Sticker => "Figurinha",
            MessageType.Location => "Localização",
            MessageType.Contact => "Contato",
            MessageType.System => "Sistema",
            _ => "Desconhecido"
        };

        public string Preview => Type switch
        {
            MessageType.Text => Text?.Substring(0, Math.Min(Text.Length, 100)) ?? "",
            MessageType.Image => "📷 Imagem",
            MessageType.Video => "🎬 Vídeo", 
            MessageType.Audio => "🎵 Áudio",
            MessageType.Voice => "🎤 Nota de Voz",
            MessageType.Document => $"📄 {FileName ?? "Documento"}",
            MessageType.Sticker => "😀 Figurinha",
            MessageType.Location => $"📍 {LocationAddress ?? "Localização"}",
            MessageType.Contact => $"👤 {ContactName ?? "Contato"}",
            MessageType.System => "⚙️ Sistema",
            _ => "❓ Desconhecido"
        };

        // === MÉTODOS UTILITÁRIOS ===
        public void SetMetadata<T>(T data) where T : class
        {
            Metadata = JsonSerializer.Serialize(data);
        }

        public T? GetMetadata<T>() where T : class
        {
            if (string.IsNullOrEmpty(Metadata)) return null;
            try
            {
                return JsonSerializer.Deserialize<T>(Metadata);
            }
            catch
            {
                return null;
            }
        }

        // === COMPATIBILIDADE (DEPRECATED) ===
        [Obsolete("Use Text instead")]
        public string Body 
        { 
            get => Text ?? string.Empty; 
            set => Text = value; 
        }
    }
} 