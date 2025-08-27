using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Pregiato.Application.Services
{
    public class WhatsAppService : IWhatsAppService
    {
        private readonly PregiatoDbContext _context;
        private readonly ILogger<WhatsAppService> _logger;

        public WhatsAppService(PregiatoDbContext context, ILogger<WhatsAppService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ContactDto?> GetOrCreateContactAsync(string phone)
        {
            var contact = await _context.Contacts
                .FirstOrDefaultAsync(c => c.Phone == phone);

            if (contact == null)
            {
                contact = new Contact
                {
                    Phone = phone,
                    Name = $"Contato {phone}",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
            };

            _context.Contacts.Add(contact);
            await _context.SaveChangesAsync();
            }

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

        public async Task<ConversationDto> GetOrCreateConversationAsync(Guid contactId)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Contact)
                .Include(c => c.Operator)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                .FirstOrDefaultAsync(c => c.ContactId == contactId && c.Status != ConversationStatus.Closed);

            if (conversation == null)
            {
                conversation = new Conversation
            {
                ContactId = contactId,
                Channel = "whatsapp",
                Status = ConversationStatus.Queued,
                    Priority = ConversationPriority.Normal,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
            };

            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();

                // Recarregar com relacionamentos
                conversation = await _context.Conversations
                    .Include(c => c.Contact)
                    .Include(c => c.Operator)
                    .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                    .FirstAsync(c => c.Id == conversation.Id);
            }

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
                    Name = $"{conversation.Operator.FirstName} {conversation.Operator.LastName}",
                    Email = conversation.Operator.Email,
                    Role = OperatorRole.Agent,
                    Status = OperatorStatus.Online,
                    MaxConcurrentConversations = 5,
                    CreatedAt = conversation.Operator.CreatedAt,
                    UpdatedAt = conversation.Operator.UpdatedAt
                } : null,
                Channel = conversation.Channel,
                Status = conversation.Status,
                Priority = conversation.Priority,
                CloseReason = conversation.CloseReason,
                CreatedAt = conversation.CreatedAt,
                AssignedAt = conversation.AssignedAt,
                ClosedAt = conversation.ClosedAt,
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

        public async Task<MessageDto> CreateMessageAsync(CreateMessageDto dto)
        {
            var message = new Message
            {
                ConversationId = dto.ConversationId,
                Direction = dto.Direction,
                Type = dto.Type,
                Body = dto.Body,
                MediaUrl = dto.MediaUrl,
                ClientMessageId = dto.ClientMessageId,
                Status = MessageStatus.Sent,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return new MessageDto
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                Direction = message.Direction,
                Type = message.Type,
                Body = message.Body,
                MediaUrl = message.MediaUrl,
                CreatedAt = message.CreatedAt
            };
        }

        public async Task<ConversationDto?> AssignConversationToOperatorAsync(Guid conversationId, string operatorId)
        {
            var conversation = await _context.Conversations
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            if (conversation == null)
                throw new ArgumentException("Conversa não encontrada");

            var operator_ = await _context.Users.FindAsync(operatorId);
            if (operator_ == null)
                throw new ArgumentException("Operador não encontrado");

            // Verificar se o operador pode assumir mais conversas
            var activeConversations = await _context.Conversations
                .CountAsync(c => c.OperatorId == operatorId && c.Status == ConversationStatus.Assigned);

            // Por enquanto, vamos usar um limite fixo de 5 conversas
            if (activeConversations >= 5)
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

            _logger.LogInformation($"👤 Conversa {conversationId} atribuída ao operador {operator_.FirstName} {operator_.LastName}");

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
                Contact = new ContactDto
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
                },
                Operator = c.Operator != null ? new OperatorDto
                {
                    Id = c.Operator.Id,
                    Name = $"{c.Operator.FirstName} {c.Operator.LastName}",
                    Email = c.Operator.Email,
                    Role = OperatorRole.Agent,
                    Status = OperatorStatus.Online,
                    MaxConcurrentConversations = 5,
                    CreatedAt = c.Operator.CreatedAt,
                    UpdatedAt = c.Operator.UpdatedAt
                } : null,
                LastMessage = c.Messages.FirstOrDefault() != null ? new MessageDto
                {
                    Id = c.Messages.First().Id,
                    ConversationId = c.Messages.First().ConversationId,
                    Direction = c.Messages.First().Direction,
                    Type = c.Messages.First().Type,
                    Body = c.Messages.First().Body,
                    MediaUrl = c.Messages.First().MediaUrl,
                    CreatedAt = c.Messages.First().CreatedAt
                } : null
            }).ToList();
        }

        public async Task<ConversationDto?> GetConversationByIdAsync(Guid conversationId)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Contact)
                .Include(c => c.Operator)
                .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                .FirstOrDefaultAsync(c => c.Id == conversationId);

            if (conversation == null)
                return null;

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
                    Name = $"{conversation.Operator.FirstName} {conversation.Operator.LastName}",
                    Email = conversation.Operator.Email,
                    Role = OperatorRole.Agent,
                    Status = OperatorStatus.Online,
                    MaxConcurrentConversations = 5,
                    CreatedAt = conversation.Operator.CreatedAt,
                    UpdatedAt = conversation.Operator.UpdatedAt
                } : null,
                Channel = conversation.Channel,
                Status = conversation.Status,
                Priority = conversation.Priority,
                CloseReason = conversation.CloseReason,
                CreatedAt = conversation.CreatedAt,
                AssignedAt = conversation.AssignedAt,
                ClosedAt = conversation.ClosedAt,
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

        public async Task<ConversationDto?> AssignConversationAsync(Guid conversationId, string operatorId)
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
                    Name = $"{conversation.Operator.FirstName} {conversation.Operator.LastName}",
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
                    Name = $"{conversation.Operator.FirstName} {conversation.Operator.LastName}",
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

        public async System.Threading.Tasks.Task ProcessIncomingMessageAsync(WhatsAppMessageDto message)
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