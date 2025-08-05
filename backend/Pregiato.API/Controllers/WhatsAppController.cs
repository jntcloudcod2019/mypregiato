using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using FluentValidation;
using System.Text.Json;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WhatsAppController : ControllerBase
    {
        private readonly IWhatsAppService _whatsAppService;
        private readonly ILogger<WhatsAppController> _logger;

        public WhatsAppController(IWhatsAppService whatsAppService, ILogger<WhatsAppController> logger)
        {
            _whatsAppService = whatsAppService;
            _logger = logger;
        }

        /// <summary>
        /// Cria um novo contato
        /// </summary>
        [HttpPost("contacts")]
        public async Task<ActionResult<ContactDto>> CreateContact(CreateContactDto dto)
        {
            try
            {
                var contact = await _whatsAppService.CreateContactAsync(dto);
                return CreatedAtAction(nameof(GetContact), new { id = contact.Id }, contact);
            }
            catch (FluentValidation.ValidationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar contato");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Obtém um contato por ID
        /// </summary>
        [HttpGet("contacts/{id}")]
        public async Task<ActionResult<ContactDto>> GetContact(Guid id)
        {
            try
            {
                // Implementar busca de contato
                return Ok(new ContactDto());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar contato {Id}", id);
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Cria uma nova conversa
        /// </summary>
        [HttpPost("conversations")]
        public async Task<ActionResult<ConversationDto>> CreateConversation(CreateConversationDto dto)
        {
            try
            {
                var conversation = await _whatsAppService.CreateConversationAsync(dto);
                return CreatedAtAction(nameof(GetConversation), new { id = conversation.Id }, conversation);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar conversa");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Obtém uma conversa por ID
        /// </summary>
        [HttpGet("conversations/{id}")]
        public async Task<ActionResult<ConversationDto>> GetConversation(Guid id)
        {
            try
            {
                var conversation = await _whatsAppService.GetConversationByIdAsync(id);
                if (conversation == null)
                    return NotFound(new { error = "Conversa não encontrada" });

                return Ok(conversation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar conversa {Id}", id);
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Atribui uma conversa a um operador
        /// </summary>
        [HttpPost("conversations/{id}/assign")]
        public async Task<ActionResult<ConversationDto>> AssignConversation(Guid id, [FromBody] Guid operatorId)
        {
            try
            {
                var conversation = await _whatsAppService.AssignConversationToOperatorAsync(id, operatorId);
                if (conversation == null)
                    return NotFound(new { error = "Conversa não encontrada" });

                return Ok(conversation);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atribuir conversa {Id} ao operador {OperatorId}", id, operatorId);
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Cria uma nova mensagem
        /// </summary>
        [HttpPost("messages")]
        public async Task<ActionResult<MessageDto>> CreateMessage(CreateMessageDto dto)
        {
            try
            {
                var message = await _whatsAppService.CreateMessageAsync(dto);
                return CreatedAtAction(nameof(GetMessage), new { id = message.Id }, message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar mensagem");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Obtém uma mensagem por ID
        /// </summary>
        [HttpGet("messages/{id}")]
        public async Task<ActionResult<MessageDto>> GetMessage(Guid id)
        {
            try
            {
                // Implementar busca de mensagem
                return Ok(new MessageDto());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar mensagem {Id}", id);
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Obtém métricas da fila
        /// </summary>
        [HttpGet("queue/metrics")]
        public async Task<ActionResult<QueueMetricsDto>> GetQueueMetrics()
        {
            try
            {
                var metrics = await _whatsAppService.GetQueueMetricsAsync();
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar métricas da fila");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Obtém itens da fila
        /// </summary>
        [HttpGet("queue/items")]
        public async Task<ActionResult<List<QueueItemDto>>> GetQueueItems()
        {
            try
            {
                var metrics = await _whatsAppService.GetQueueMetricsAsync();
                return Ok(metrics.QueueItems);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar itens da fila");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Obtém conversas na fila de atendimento
        /// </summary>
        [HttpGet("conversations/queue")]
        public async Task<ActionResult<List<ConversationDto>>> GetQueueConversations()
        {
            try
            {
                var conversations = await _whatsAppService.GetQueueConversationsAsync();
                return Ok(conversations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar conversas na fila");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        /// <summary>
        /// Processa mensagem recebida do WhatsApp Gateway
        /// </summary>
        [HttpPost("webhook/message")]
        public async Task<ActionResult> ProcessWebhookMessage([FromBody] WhatsAppMessageDto message)
        {
            try
            {
                _logger.LogInformation($"📨 Mensagem recebida do WhatsApp: {message.Id} de {message.From}");

                // 1. Buscar ou criar contato
                var contact = await _whatsAppService.GetOrCreateContactAsync(message.From);
                
                // 2. Buscar ou criar conversa
                var conversation = await _whatsAppService.GetOrCreateConversationAsync(contact.Id);
                
                // 3. Criar mensagem
                var createMessageDto = new CreateMessageDto
                {
                    ConversationId = conversation.Id,
                    Direction = MessageDirection.In,
                    Type = GetMessageType(message.Type),
                    Body = message.Content,
                    MediaUrl = message.MediaUrl,
                    ClientMessageId = message.Id
                };

                var createdMessage = await _whatsAppService.CreateMessageAsync(createMessageDto);

                // 4. Se a conversa não tem operador, colocar na fila
                if (conversation.OperatorId == null && conversation.Status == ConversationStatus.Queued)
                {
                    _logger.LogInformation($"📋 Conversa {conversation.Id} colocada na fila de atendimento");
                }

                return Ok(new { 
                    success = true, 
                    messageId = createdMessage.Id,
                    conversationId = conversation.Id,
                    contactId = contact.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar webhook de mensagem");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        private MessageType GetMessageType(string type)
        {
            return type.ToLower() switch
            {
                "text" => MessageType.Text,
                "image" => MessageType.Image,
                "audio" => MessageType.Audio,
                "document" => MessageType.Document,
                "video" => MessageType.Video,
                _ => MessageType.Text
            };
        }

        /// <summary>
        /// Processa evento de sessão do WhatsApp Gateway
        /// </summary>
        [HttpPost("webhook/session")]
        public ActionResult ProcessWebhookSession([FromBody] object sessionEvent)
        {
            try
            {
                _logger.LogInformation($"📱 Evento de sessão recebido: {JsonSerializer.Serialize(sessionEvent)}");
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar webhook de sessão");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }
    }
} 