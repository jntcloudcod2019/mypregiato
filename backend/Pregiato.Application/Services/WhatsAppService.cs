using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;
using System.Text.Json;
using System.Text;

namespace Pregiato.Application.Services
{
    public class WhatsAppService : IWhatsAppService
    {
        private readonly PregiatoDbContext _context;
        private readonly ILogger<WhatsAppService> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public WhatsAppService(
            PregiatoDbContext context,
            ILogger<WhatsAppService> logger,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        public async Task<ContactDto> CreateContactAsync(CreateContactDto dto)
        {
            var contact = new Contact
            {
                Name = dto.Name,
                Phone = dto.Phone,
                Email = dto.Email,
                OriginCRM = dto.OriginCRM,
                Tags = dto.Tags,
                BusinessName = dto.BusinessName
            };

            _context.Contacts.Add(contact);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"📞 Contato criado: {contact.Name} ({contact.Phone})");

            return new ContactDto
            {
                Id = contact.Id,
                Name = contact.Name,
                Phone = contact.Phone,
                Email = contact.Email,
                OriginCRM = contact.OriginCRM,
                Tags = contact.Tags,
                BusinessName = contact.BusinessName,
                IsActive = contact.IsActive,
                CreatedAt = contact.CreatedAt,
                UpdatedAt = contact.UpdatedAt
            };
        }

        public async Task<ConversationDto> CreateConversationAsync(CreateConversationDto dto)
        {
            var contact = await _context.Contacts.FindAsync(dto.ContactId);
            if (contact == null)
                throw new ArgumentException("Contato não encontrado");

            var conversation = new Conversation
            {
                ContactId = dto.ContactId,
                Channel = dto.Channel,
                Status = ConversationStatus.Queued,
                Priority = dto.Priority
            };

            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();

            // Criar evento de fila
            var queueEvent = new QueueEvent
            {
                ConversationId = conversation.Id,
                EventType = QueueEventType.Queued
            };

            _context.QueueEvents.Add(queueEvent);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"💬 Conversa criada: {conversation.Id} para {contact.Name}");

            return await GetConversationByIdAsync(conversation.Id);
        }

        public async Task<MessageDto> CreateMessageAsync(CreateMessageDto dto)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Contact)
                .FirstOrDefaultAsync(c => c.Id == dto.ConversationId);

            if (conversation == null)
                throw new ArgumentException("Conversa não encontrada");

            var message = new Message
            {
                ConversationId = dto.ConversationId,
                Direction = dto.Direction,
                Type = dto.Type,
                Body = dto.Body,
                MediaUrl = dto.MediaUrl,
                FileName = dto.FileName,
                ClientMessageId = dto.ClientMessageId,
                InternalNote = dto.InternalNote
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"📨 Mensagem criada: {message.Id} na conversa {dto.ConversationId}");

            // Se for mensagem de entrada, processar roteamento
            if (dto.Direction == MessageDirection.In)
            {
                await ProcessIncomingMessageAsync(conversation, message);
            }
            else if (dto.Direction == MessageDirection.Out)
            {
                await SendMessageToWhatsAppAsync(message);
            }

            return new MessageDto
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                Direction = message.Direction,
                Type = message.Type,
                Body = message.Body,
                MediaUrl = message.MediaUrl,
                FileName = message.FileName,
                ClientMessageId = message.ClientMessageId,
                WhatsAppMessageId = message.WhatsAppMessageId,
                Status = message.Status,
                InternalNote = message.InternalNote,
                CreatedAt = message.CreatedAt,
                UpdatedAt = message.UpdatedAt
            };
        }

        public async Task<ConversationDto?> AssignConversationToOperatorAsync(Guid conversationId, Guid operatorId)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Contact)
                .Include(c => c.Operator)
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            if (conversation == null)
                throw new ArgumentException("Conversa não encontrada");

            var operator_ = await _context.Users.FindAsync(operatorId);
            if (operator_ == null)
                throw new ArgumentException("Operador não encontrado");

            // Verificar se o operador pode assumir mais conversas
            var activeConversations = await _context.Conversations
                .CountAsync(c => c.OperatorId == operatorId && c.Status == ConversationStatus.Assigned);

            if (activeConversations >= operator_.MaxConcurrentConversations)
                throw new InvalidOperationException("Operador atingiu limite de conversas simultâneas");

            conversation.OperatorId = operatorId;
            conversation.Status = ConversationStatus.Assigned;
            conversation.AssignedAt = DateTime.UtcNow;
            conversation.UpdatedAt = DateTime.UtcNow;

            // Criar evento de atribuição
            var queueEvent = new QueueEvent
            {
                ConversationId = conversationId,
                OperatorId = operatorId,
                EventType = QueueEventType.Assigned
            };

            _context.QueueEvents.Add(queueEvent);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"👤 Conversa {conversationId} atribuída ao operador {operator_.Name}");

            return await GetConversationByIdAsync(conversationId);
        }

        public async Task<QueueMetricsDto> GetQueueMetricsAsync()
        {
            var queuedConversations = await _context.Conversations
                .Include(c => c.Contact)
                .Where(c => c.Status == ConversationStatus.Queued)
                .OrderBy(c => c.Priority)
                .ThenBy(c => c.CreatedAt)
                .ToListAsync();

            var attendingConversations = await _context.Conversations
                .CountAsync(c => c.Status == ConversationStatus.Assigned);

            var averageWaitTime = queuedConversations.Any() 
                ? queuedConversations.Average(c => (DateTime.UtcNow - c.CreatedAt).TotalMinutes)
                : 0;

            var queueItems = queuedConversations.Select(c => new QueueItemDto
            {
                ConversationId = c.Id,
                ContactName = c.Contact.Name,
                ContactPhone = c.Contact.Phone,
                Priority = c.Priority,
                QueuedAt = c.CreatedAt,
                WaitTimeMinutes = (int)(DateTime.UtcNow - c.CreatedAt).TotalMinutes
            }).ToList();

            return new QueueMetricsDto
            {
                TotalInQueue = queuedConversations.Count,
                AttendingCount = attendingConversations,
                AverageWaitTimeMinutes = averageWaitTime,
                QueueItems = queueItems
            };
        }

        public async Task<ConversationDto?> GetConversationByIdAsync(Guid id)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Contact)
                .Include(c => c.Operator)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(50))
                .FirstOrDefaultAsync(c => c.Id == id);

            if (conversation == null)
                return null;

            var unreadCount = conversation.Messages
                .Count(m => m.Direction == MessageDirection.In && m.Status != MessageStatus.Read);

            var lastMessage = conversation.Messages
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefault();

            return new ConversationDto
            {
                Id = conversation.Id,
                ContactId = conversation.ContactId,
                OperatorId = conversation.OperatorId,
                Channel = conversation.Channel,
                Status = conversation.Status,
                Priority = conversation.Priority,
                CloseReason = conversation.CloseReason,
                CreatedAt = conversation.CreatedAt,
                AssignedAt = conversation.AssignedAt,
                ClosedAt = conversation.ClosedAt,
                UpdatedAt = conversation.UpdatedAt,
                Contact = conversation.Contact != null ? new ContactDto
                {
                    Id = conversation.Contact.Id,
                    Name = conversation.Contact.Name,
                    Phone = conversation.Contact.Phone,
                    Email = conversation.Contact.Email,
                    OriginCRM = conversation.Contact.OriginCRM,
                    Tags = conversation.Contact.Tags,
                    BusinessName = conversation.Contact.BusinessName,
                    IsActive = conversation.Contact.IsActive,
                    CreatedAt = conversation.Contact.CreatedAt,
                    UpdatedAt = conversation.Contact.UpdatedAt
                } : null,
                Operator = conversation.Operator != null ? new OperatorDto
                {
                    Id = conversation.Operator.Id,
                    Name = conversation.Operator.Name,
                    Email = conversation.Operator.Email,
                    Role = OperatorRole.Agent, // Mapear do User para OperatorRole
                    Status = OperatorStatus.Online, // Mapear do User para OperatorStatus
                    Skills = conversation.Operator.Skills,
                    MaxConcurrentConversations = conversation.Operator.MaxConcurrentConversations,
                    CreatedAt = conversation.Operator.CreatedAt,
                    UpdatedAt = conversation.Operator.UpdatedAt,
                    LastActivityAt = conversation.Operator.LastActivityAt
                } : null,
                Messages = conversation.Messages.Select(m => new MessageDto
                {
                    Id = m.Id,
                    ConversationId = m.ConversationId,
                    Direction = m.Direction,
                    Type = m.Type,
                    Body = m.Body,
                    MediaUrl = m.MediaUrl,
                    FileName = m.FileName,
                    ClientMessageId = m.ClientMessageId,
                    WhatsAppMessageId = m.WhatsAppMessageId,
                    Status = m.Status,
                    InternalNote = m.InternalNote,
                    CreatedAt = m.CreatedAt,
                    UpdatedAt = m.UpdatedAt
                }).ToList(),
                UnreadCount = unreadCount,
                LastMessage = lastMessage != null ? new MessageDto
                {
                    Id = lastMessage.Id,
                    ConversationId = lastMessage.ConversationId,
                    Direction = lastMessage.Direction,
                    Type = lastMessage.Type,
                    Body = lastMessage.Body,
                    MediaUrl = lastMessage.MediaUrl,
                    FileName = lastMessage.FileName,
                    ClientMessageId = lastMessage.ClientMessageId,
                    WhatsAppMessageId = lastMessage.WhatsAppMessageId,
                    Status = lastMessage.Status,
                    InternalNote = lastMessage.InternalNote,
                    CreatedAt = lastMessage.CreatedAt,
                    UpdatedAt = lastMessage.UpdatedAt
                } : null
            };
        }

        private async Task ProcessIncomingMessageAsync(Conversation conversation, Message message)
        {
            // Se a conversa não tem operador, colocar na fila
            if (conversation.OperatorId == null)
            {
                conversation.Status = ConversationStatus.Queued;
                conversation.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation($"📋 Conversa {conversation.Id} colocada na fila");
            }
        }

        private async Task SendMessageToWhatsAppAsync(Message message)
        {
            try
            {
                var conversation = await _context.Conversations
                    .Include(c => c.Contact)
                    .FirstOrDefaultAsync(c => c.Id == message.ConversationId);

                if (conversation == null)
                    throw new ArgumentException("Conversa não encontrada");

                var sendMessageDto = new SendMessageDto
                {
                    To = conversation.Contact.Phone,
                    Content = message.Body,
                    Type = message.Type.ToString().ToLower(),
                    MediaUrl = message.MediaUrl,
                    FileName = message.FileName,
                    ClientMessageId = message.ClientMessageId ?? Guid.NewGuid().ToString()
                };

                var httpClient = _httpClientFactory.CreateClient();
                var gatewayUrl = _configuration["WhatsAppGateway:Url"] ?? "http://localhost:3001";
                
                var json = JsonSerializer.Serialize(sendMessageDto);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await httpClient.PostAsync($"{gatewayUrl}/messages/send", content);
                
                if (response.IsSuccessStatusCode)
                {
                    message.Status = MessageStatus.Sent;
                    message.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"📤 Mensagem enviada via WhatsApp: {message.Id}");
                }
                else
                {
                    message.Status = MessageStatus.Failed;
                    message.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    _logger.LogError($"❌ Falha ao enviar mensagem via WhatsApp: {message.Id}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Erro ao enviar mensagem via WhatsApp: {message.Id}");
                message.Status = MessageStatus.Failed;
                message.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
    }
} 