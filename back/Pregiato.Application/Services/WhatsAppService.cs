using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Data;
using RabbitMQ.Client;
using SystemTask = System.Threading.Tasks.Task;

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

        public async Task<ContactDto> GetOrCreateContactAsync(string phone)
        {
            // Buscar contato existente
            var contact = await _context.Contacts.FirstOrDefaultAsync(c => c.Phone == phone);
            
            if (contact != null)
            {
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

            // Criar novo contato
            var createContactDto = new CreateContactDto
            {
                Name = $"Contato {phone}",
                Phone = phone,
                OriginCRM = "WhatsApp"
            };

            return await CreateContactAsync(createContactDto);
        }

        public async Task<ConversationDto> GetOrCreateConversationAsync(Guid contactId)
        {
            // Buscar conversa ativa existente
            var conversation = await _context.Conversations
                .Include(c => c.Contact)
                .FirstOrDefaultAsync(c => c.ContactId == contactId && 
                                        (c.Status == ConversationStatus.Queued || 
                                         c.Status == ConversationStatus.Assigned));

            if (conversation != null)
            {
                return await GetConversationByIdAsync(conversation.Id);
            }

            // Criar nova conversa
            var createConversationDto = new CreateConversationDto
            {
                ContactId = contactId,
                Channel = "whatsapp",
                Priority = ConversationPriority.Normal
            };

            return await CreateConversationAsync(createConversationDto);
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
            try
            {
                var queuedConversations = await _context.Conversations
                    .Include(c => c.Contact)
                    .Where(c => c.Status == ConversationStatus.Queued)
                    .ToListAsync();

                var assignedConversations = await _context.Conversations
                    .Include(c => c.Contact)
                    .Where(c => c.Status == ConversationStatus.Assigned)
                    .ToListAsync();

                var queueItems = queuedConversations.Select(c => new QueueItemDto
                {
                    ConversationId = c.Id,
                    ContactName = c.Contact?.Name ?? "Contato",
                    ContactPhone = c.Contact?.Phone ?? "",
                    Priority = c.Priority.ToString(),
                    QueuedAt = c.CreatedAt,
                    WaitTime = DateTime.UtcNow - c.CreatedAt
                }).ToList();

                return new QueueMetricsDto
                {
                    TotalQueued = queuedConversations.Count,
                    TotalAssigned = assignedConversations.Count,
                    AverageWaitTime = queueItems.Any() ? TimeSpan.FromTicks((long)queueItems.Average(q => q.WaitTime.Ticks)) : TimeSpan.Zero,
                    QueueItems = queueItems
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar métricas da fila");
                return new QueueMetricsDto
                {
                    TotalQueued = 0,
                    TotalAssigned = 0,
                    AverageWaitTime = TimeSpan.Zero,
                    QueueItems = new List<QueueItemDto>()
                };
            }
        }

        public async Task<List<ConversationDto>> GetQueueConversationsAsync()
        {
            var conversations = await _context.Conversations
                .Include(c => c.Contact)
                .Include(c => c.Operator)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                .Where(c => c.Status == ConversationStatus.Queued)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            return conversations.Select(c => new ConversationDto
            {
                Id = c.Id,
                ContactId = c.ContactId,
                OperatorId = c.OperatorId,
                Channel = c.Channel,
                Status = c.Status,
                Priority = c.Priority,
                CloseReason = c.CloseReason,
                CreatedAt = c.CreatedAt,
                AssignedAt = c.AssignedAt,
                ClosedAt = c.ClosedAt,
                UpdatedAt = c.UpdatedAt,
                Contact = c.Contact != null ? new ContactDto
                {
                    Id = c.Contact.Id,
                    Name = c.Contact.Name,
                    Phone = c.Contact.Phone,
                    Email = c.Contact.Email,
                    OriginCRM = c.Contact.OriginCRM,
                    Tags = c.Contact.Tags,
                    BusinessName = c.Contact.BusinessName,
                    IsActive = c.Contact.IsActive,
                    CreatedAt = c.Contact.CreatedAt,
                    UpdatedAt = c.Contact.UpdatedAt
                } : null,
                Operator = c.Operator != null ? new OperatorDto
                {
                    Id = c.Operator.Id,
                    Name = c.Operator.Name,
                    Email = c.Operator.Email,
                    Role = OperatorRole.Agent, // Default role
                    Status = OperatorStatus.Online, // Default status
                    Skills = c.Operator.Skills,
                    MaxConcurrentConversations = c.Operator.MaxConcurrentConversations,
                    CreatedAt = c.Operator.CreatedAt,
                    UpdatedAt = c.Operator.UpdatedAt,
                    LastActivityAt = c.Operator.LastActivityAt
                } : null,
                Messages = c.Messages.Select(m => new MessageDto
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
                UnreadCount = c.Messages.Count(m => m.Direction == MessageDirection.In && m.Status != MessageStatus.Read),
                LastMessage = c.Messages.FirstOrDefault() != null ? new MessageDto
                {
                    Id = c.Messages.First().Id,
                    ConversationId = c.Messages.First().ConversationId,
                    Direction = c.Messages.First().Direction,
                    Type = c.Messages.First().Type,
                    Body = c.Messages.First().Body,
                    MediaUrl = c.Messages.First().MediaUrl,
                    FileName = c.Messages.First().FileName,
                    ClientMessageId = c.Messages.First().ClientMessageId,
                    WhatsAppMessageId = c.Messages.First().WhatsAppMessageId,
                    Status = c.Messages.First().Status,
                    InternalNote = c.Messages.First().InternalNote,
                    CreatedAt = c.Messages.First().CreatedAt,
                    UpdatedAt = c.Messages.First().UpdatedAt
                } : null
            }).ToList();
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

        public async Task<List<ConversationDto>> GetAllConversationsAsync()
        {
            var conversations = await _context.Conversations
                .Include(c => c.Contact)
                .Include(c => c.Operator)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                .OrderByDescending(c => c.UpdatedAt)
                .ToListAsync();

            return conversations.Select(c => new ConversationDto
            {
                Id = c.Id,
                ContactId = c.ContactId,
                OperatorId = c.OperatorId,
                Channel = c.Channel,
                Status = c.Status,
                Priority = c.Priority,
                CloseReason = c.CloseReason,
                CreatedAt = c.CreatedAt,
                AssignedAt = c.AssignedAt,
                ClosedAt = c.ClosedAt,
                UpdatedAt = c.UpdatedAt,
                Contact = c.Contact != null ? new ContactDto
                {
                    Id = c.Contact.Id,
                    Name = c.Contact.Name,
                    Phone = c.Contact.Phone,
                    Email = c.Contact.Email,
                    OriginCRM = c.Contact.OriginCRM,
                    Tags = c.Contact.Tags,
                    BusinessName = c.Contact.BusinessName,
                    IsActive = c.Contact.IsActive,
                    CreatedAt = c.Contact.CreatedAt,
                    UpdatedAt = c.Contact.UpdatedAt
                } : null,
                Operator = c.Operator != null ? new OperatorDto
                {
                    Id = c.Operator.Id,
                    Name = c.Operator.Name,
                    Email = c.Operator.Email,
                    Role = OperatorRole.Agent,
                    Status = OperatorStatus.Online,
                    Skills = c.Operator.Skills,
                    MaxConcurrentConversations = c.Operator.MaxConcurrentConversations,
                    CreatedAt = c.Operator.CreatedAt,
                    UpdatedAt = c.Operator.UpdatedAt,
                    LastActivityAt = c.Operator.LastActivityAt
                } : null,
                Messages = c.Messages.Select(m => new MessageDto
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
                UnreadCount = c.Messages.Count(m => m.Direction == MessageDirection.In && m.Status != MessageStatus.Read),
                LastMessage = c.Messages.FirstOrDefault() != null ? new MessageDto
                {
                    Id = c.Messages.First().Id,
                    ConversationId = c.Messages.First().ConversationId,
                    Direction = c.Messages.First().Direction,
                    Type = c.Messages.First().Type,
                    Body = c.Messages.First().Body,
                    MediaUrl = c.Messages.First().MediaUrl,
                    FileName = c.Messages.First().FileName,
                    ClientMessageId = c.Messages.First().ClientMessageId,
                    WhatsAppMessageId = c.Messages.First().WhatsAppMessageId,
                    Status = c.Messages.First().Status,
                    InternalNote = c.Messages.First().InternalNote,
                    CreatedAt = c.Messages.First().CreatedAt,
                    UpdatedAt = c.Messages.First().UpdatedAt
                } : null
            }).ToList();
        }

        public async Task<List<ConversationDto>> GetConversationsByStatusAsync(ConversationStatus status)
        {
            var conversations = await _context.Conversations
                .Include(c => c.Contact)
                .Include(c => c.Operator)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                .Where(c => c.Status == status)
                .OrderByDescending(c => c.UpdatedAt)
                .ToListAsync();

            return conversations.Select(c => new ConversationDto
            {
                Id = c.Id,
                ContactId = c.ContactId,
                OperatorId = c.OperatorId,
                Channel = c.Channel,
                Status = c.Status,
                Priority = c.Priority,
                CloseReason = c.CloseReason,
                CreatedAt = c.CreatedAt,
                AssignedAt = c.AssignedAt,
                ClosedAt = c.ClosedAt,
                UpdatedAt = c.UpdatedAt,
                Contact = c.Contact != null ? new ContactDto
                {
                    Id = c.Contact.Id,
                    Name = c.Contact.Name,
                    Phone = c.Contact.Phone,
                    Email = c.Contact.Email,
                    OriginCRM = c.Contact.OriginCRM,
                    Tags = c.Contact.Tags,
                    BusinessName = c.Contact.BusinessName,
                    IsActive = c.Contact.IsActive,
                    CreatedAt = c.Contact.CreatedAt,
                    UpdatedAt = c.Contact.UpdatedAt
                } : null,
                Operator = c.Operator != null ? new OperatorDto
                {
                    Id = c.Operator.Id,
                    Name = c.Operator.Name,
                    Email = c.Operator.Email,
                    Role = OperatorRole.Agent,
                    Status = OperatorStatus.Online,
                    Skills = c.Operator.Skills,
                    MaxConcurrentConversations = c.Operator.MaxConcurrentConversations,
                    CreatedAt = c.Operator.CreatedAt,
                    UpdatedAt = c.Operator.UpdatedAt,
                    LastActivityAt = c.Operator.LastActivityAt
                } : null,
                Messages = c.Messages.Select(m => new MessageDto
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
                UnreadCount = c.Messages.Count(m => m.Direction == MessageDirection.In && m.Status != MessageStatus.Read),
                LastMessage = c.Messages.FirstOrDefault() != null ? new MessageDto
                {
                    Id = c.Messages.First().Id,
                    ConversationId = c.Messages.First().ConversationId,
                    Direction = c.Messages.First().Direction,
                    Type = c.Messages.First().Type,
                    Body = c.Messages.First().Body,
                    MediaUrl = c.Messages.First().MediaUrl,
                    FileName = c.Messages.First().FileName,
                    ClientMessageId = c.Messages.First().ClientMessageId,
                    WhatsAppMessageId = c.Messages.First().WhatsAppMessageId,
                    Status = c.Messages.First().Status,
                    InternalNote = c.Messages.First().InternalNote,
                    CreatedAt = c.Messages.First().CreatedAt,
                    UpdatedAt = c.Messages.First().UpdatedAt
                } : null
            }).ToList();
        }

        private async SystemTask ProcessIncomingMessageAsync(Conversation conversation, Message message)
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

        private async SystemTask SendMessageToWhatsAppAsync(Message message)
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

        public async Task<ContactDto> GetContactByIdAsync(Guid id)
        {
            var contact = await _context.Contacts.FindAsync(id);
            
            if (contact == null)
                return null!;

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

        public async Task<ConversationDto?> AssignConversationAsync(Guid conversationId, Guid operatorId)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Contact)
                .Include(c => c.Operator)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            if (conversation == null)
                return null;

            var operator_ = await _context.Users.FindAsync(operatorId);
            if (operator_ == null)
                throw new ArgumentException("Operador não encontrado");

            conversation.OperatorId = operatorId;
            conversation.Status = ConversationStatus.Assigned;
            conversation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"📋 Conversa {conversationId} atribuída ao operador {operatorId}");

            return new ConversationDto
            {
                Id = conversation.Id,
                ContactId = conversation.ContactId,
                Contact = new ContactDto
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
                },
                OperatorId = conversation.OperatorId,
                Operator = conversation.Operator != null ? new OperatorDto
                {
                    Id = conversation.Operator.Id,
                    Name = conversation.Operator.Name,
                    Email = conversation.Operator.Email,
                    Role = OperatorRole.Agent,
                    Status = OperatorStatus.Online,
                    MaxConcurrentConversations = 5,
                    CreatedAt = conversation.Operator.CreatedAt,
                    UpdatedAt = conversation.Operator.UpdatedAt
                } : null,
                Status = conversation.Status,
                CreatedAt = conversation.CreatedAt,
                UpdatedAt = conversation.UpdatedAt,
                LastMessage = conversation.Messages.FirstOrDefault() != null ? new MessageDto
                {
                    Id = conversation.Messages.First().Id,
                    ConversationId = conversation.Messages.First().ConversationId,
                    Direction = conversation.Messages.First().Direction,
                    Type = conversation.Messages.First().Type,
                    Body = conversation.Messages.First().Body,
                    MediaUrl = conversation.Messages.First().MediaUrl,
                    CreatedAt = conversation.Messages.First().CreatedAt
                } : null
            };
        }

        public async Task<ConversationDto?> CloseConversationAsync(Guid conversationId, string? reason = null)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Contact)
                .Include(c => c.Operator)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            if (conversation == null)
                return null;

            conversation.Status = ConversationStatus.Closed;
            conversation.ClosedAt = DateTime.UtcNow;
            conversation.CloseReason = reason;
            conversation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"🔒 Conversa {conversationId} fechada. Motivo: {reason ?? "Não informado"}");

            return new ConversationDto
            {
                Id = conversation.Id,
                ContactId = conversation.ContactId,
                Contact = new ContactDto
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
                },
                OperatorId = conversation.OperatorId,
                Operator = conversation.Operator != null ? new OperatorDto
                {
                    Id = conversation.Operator.Id,
                    Name = conversation.Operator.Name,
                    Email = conversation.Operator.Email,
                    Role = OperatorRole.Agent,
                    Status = OperatorStatus.Online,
                    MaxConcurrentConversations = 5,
                    CreatedAt = conversation.Operator.CreatedAt,
                    UpdatedAt = conversation.Operator.UpdatedAt
                } : null,
                Status = conversation.Status,
                CreatedAt = conversation.CreatedAt,
                UpdatedAt = conversation.UpdatedAt,
                LastMessage = conversation.Messages.FirstOrDefault() != null ? new MessageDto
                {
                    Id = conversation.Messages.First().Id,
                    ConversationId = conversation.Messages.First().ConversationId,
                    Direction = conversation.Messages.First().Direction,
                    Type = conversation.Messages.First().Type,
                    Body = conversation.Messages.First().Body,
                    MediaUrl = conversation.Messages.First().MediaUrl,
                    CreatedAt = conversation.Messages.First().CreatedAt
                } : null
            };
        }

        public async SystemTask ProcessIncomingMessageAsync(WhatsAppMessageDto message)
        {
            try
            {
                _logger.LogInformation($"📨 Processando mensagem recebida de {message.From}");

                // Buscar ou criar contato
                var contact = await GetOrCreateContactAsync(message.From);

                // Buscar ou criar conversa
                var conversation = await GetOrCreateConversationAsync(contact.Id);

                // Criar mensagem
                var createMessageDto = new CreateMessageDto
                {
                    ConversationId = conversation.Id,
                    Direction = MessageDirection.In,
                    Type = GetMessageType(message.Type),
                    Body = message.Content,
                    MediaUrl = message.MediaUrl,
                    ClientMessageId = message.Id
                };

                await CreateMessageAsync(createMessageDto);

                _logger.LogInformation($"✅ Mensagem processada com sucesso");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao processar mensagem recebida");
                throw;
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
    }
} 