using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;

namespace Pregiato.API.Services
{
    /// <summary>
    /// Serviço resiliente para mapeamento de chats com múltiplas estratégias de fallback
    /// e cache automático para otimização de performance
    /// </summary>
    public class ChatMappingService
    {
        private readonly ConcurrentDictionary<string, Guid> _chatIdCache = new();
        private readonly ILogger<ChatMappingService> _logger;
        private readonly PregiatoDbContext _context;

        public ChatMappingService(
            ILogger<ChatMappingService> logger,
            PregiatoDbContext context)
        {
            _logger = logger;
            _context = context;
        }

        /// <summary>
        /// Obtém ou cria o ConversationId para um chat com múltiplas estratégias resilientes
        /// </summary>
        /// <param name="chatId">ID do chat enviado pelo Zap Bot</param>
        /// <param name="phoneNumber">Número de telefone normalizado</param>
        /// <returns>Guid da conversa</returns>
        public async Task<Guid> GetConversationIdAsync(string chatId, string phoneNumber)
        {
            try
            {
                _logger.LogDebug("🔍 Iniciando mapeamento para ChatId={ChatId}, Phone={Phone}",
                    chatId, phoneNumber);

                // 1. Verificar cache primeiro para performance
                if (_chatIdCache.TryGetValue(chatId, out Guid cachedId))
                {
                    _logger.LogDebug("✅ Cache hit para ChatId={ChatId}: {Guid}", chatId, cachedId);
                    return cachedId;
                }

                // 2. Tentar múltiplas estratégias de mapeamento
                var conversationId = await TryMultipleMappingStrategies(chatId, phoneNumber);

                // 3. Armazenar no cache para futuras consultas
                _chatIdCache.TryAdd(chatId, conversationId);

                _logger.LogInformation("✅ Mapeamento concluído: ChatId={ChatId}, Phone={Phone}, ConversationId={Guid}",
                    chatId, phoneNumber, conversationId);

                return conversationId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Falha crítica no mapeamento de chat {ChatId}. Iniciando recuperação de emergência.", chatId);
                return await EmergencyRecovery(chatId, phoneNumber, ex);
            }
        }

        /// <summary>
        /// Tenta múltiplas estratégias de mapeamento em ordem de prioridade
        /// </summary>
        private async Task<Guid> TryMultipleMappingStrategies(string chatId, string phoneNumber)
        {
            var strategies = new Func<Task<Guid?>>[]
            {
                () => TryParseGuidFromChatId(chatId),
                () => FindConversationByPhone(phoneNumber),
                () => FindConversationByPeerE164(phoneNumber),
                () => CreateNewConversation(chatId, phoneNumber)
            };

            foreach (var strategy in strategies)
            {
                try
                {
                    var result = await strategy();
                    if (result.HasValue)
                    {
                        _logger.LogDebug("✅ Estratégia {Strategy} teve sucesso: {Guid}",
                            strategy.Method.Name, result.Value);
                        return result.Value;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "⚠️ Estratégia {Strategy} falhou, tentando próxima...",
                        strategy.Method.Name);
                }
            }

            throw new InvalidOperationException($"Todas as estratégias de mapeamento falharam para ChatId={chatId}");
        }

        /// <summary>
        /// Estratégia 1: Tenta extrair GUID diretamente do chatId
        /// </summary>
        private async Task<Guid?> TryParseGuidFromChatId(string chatId)
        {
            if (string.IsNullOrEmpty(chatId))
                return null;

            // Remove prefixo "chat_" se existir
            var guidString = chatId.Replace("chat_", "");

            if (Guid.TryParse(guidString, out Guid result))
            {
                // Verificar se este GUID existe no banco
                var exists = await _context.Conversations.AnyAsync(c => c.Id == result);
                if (exists)
                    return result;
            }

            return null;
        }

        /// <summary>
        /// Estratégia 2: Busca conversa existente pelo número de telefone
        /// </summary>
        private async Task<Guid?> FindConversationByPhone(string phoneNumber)
        {
            if (string.IsNullOrEmpty(phoneNumber))
                return null;

            var conversation = await _context.Conversations
                .FirstOrDefaultAsync(c => c.PeerE164 == phoneNumber);

            return conversation?.Id;
        }

        /// <summary>
        /// Estratégia 3: Busca conversa existente pelo PeerE164
        /// </summary>
        private async Task<Guid?> FindConversationByPeerE164(string phoneNumber)
        {
            if (string.IsNullOrEmpty(phoneNumber))
                return null;

            var conversation = await _context.Conversations
                .FirstOrDefaultAsync(c => c.PeerE164 == phoneNumber);

            return conversation?.Id;
        }

        /// <summary>
        /// Estratégia 4: Cria uma nova conversa
        /// </summary>
        private async Task<Guid?> CreateNewConversation(string chatId, string phoneNumber)
        {
            try
            {
                // Primeiro, verificar se existe um Contact para este número
                var contact = await _context.Contacts
                    .FirstOrDefaultAsync(c => c.Phone == phoneNumber);

                if (contact == null)
                {
                    // Criar um novo Contact se não existir
                    contact = new Contact
                    {
                        Id = Guid.NewGuid(),
                        Name = phoneNumber,
                        Phone = phoneNumber,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _context.Contacts.AddAsync(contact);
                }

                var newConversation = new Conversation
                {
                    Id = Guid.NewGuid(),
                    ContactId = contact.Id,
                    Channel = "whatsapp",
                    Status = ConversationStatus.Queued,
                    Priority = ConversationPriority.Normal,
                    CreatedAt = DateTime.UtcNow,
                    PeerE164 = phoneNumber,
                    IsGroup = false,
                    Title = $"Chat com {phoneNumber}",
                    LastMessageAt = DateTime.UtcNow
                };

                await _context.Conversations.AddAsync(newConversation);
                await _context.SaveChangesAsync();

                _logger.LogInformation("📝 Nova conversa criada: Id={Id}, Phone={Phone}, ChatId={ChatId}",
                    newConversation.Id, phoneNumber, chatId);

                return newConversation.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Falha ao criar nova conversa para {ChatId}", chatId);
                return null;
            }
        }

        /// <summary>
        /// Recuperação de emergência quando todas as estratégias falham
        /// </summary>
        private async Task<Guid> EmergencyRecovery(string chatId, string phoneNumber, Exception originalException)
        {
            try
            {
                // Gerar GUID determinístico baseado no número de telefone
                var emergencyGuid = GenerateDeterministicGuid(phoneNumber);

                // Verificar se já existe uma conversa com este GUID
                var existingConversation = await _context.Conversations
                    .FirstOrDefaultAsync(c => c.Id == emergencyGuid);

                if (existingConversation != null)
                {
                    // Se existe, retornar o GUID encontrado
                    _logger.LogWarning("🔄 Recuperação encontrou conversa existente: {Guid}", emergencyGuid);
                    return emergencyGuid;
                }

                // Criar um novo Contact se necessário
                var contact = await _context.Contacts
                    .FirstOrDefaultAsync(c => c.Phone == phoneNumber);

                if (contact == null)
                {
                    contact = new Contact
                    {
                        Id = Guid.NewGuid(),
                        Name = phoneNumber,
                        Phone = phoneNumber,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _context.Contacts.AddAsync(contact);
                }

                // Se não existe, criar uma nova conversa com este GUID
                var emergencyConversation = new Conversation
                {
                    Id = emergencyGuid,
                    ContactId = contact.Id,
                    Channel = "whatsapp",
                    Status = ConversationStatus.Queued,
                    Priority = ConversationPriority.Normal,
                    CreatedAt = DateTime.UtcNow,
                    PeerE164 = phoneNumber,
                    IsGroup = false,
                    Title = $"Chat com {phoneNumber} (Recuperação de Emergência)",
                    LastMessageAt = DateTime.UtcNow
                };

                await _context.Conversations.AddAsync(emergencyConversation);
                await _context.SaveChangesAsync();

                _logger.LogWarning("🚨 RECUPERAÇÃO DE EMERGÊNCIA: ChatId={ChatId}, Phone={Phone}, GeneratedGuid={Guid}, Error={Error}",
                    chatId, phoneNumber, emergencyGuid, originalException.Message);

                return emergencyGuid;
            }
            catch (Exception recoveryEx)
            {
                _logger.LogCritical(recoveryEx, "❌ Falha crítica na recuperação de emergência para {ChatId}", chatId);

                // Último fallback: GUID completamente novo
                var finalFallbackGuid = Guid.NewGuid();
                _logger.LogCritical("🔥 ÚLTIMO FALLBACK: Gerando GUID completamente novo {Guid}", finalFallbackGuid);

                return finalFallbackGuid;
            }
        }

        /// <summary>
        /// Gera um GUID determinístico baseado no número de telefone
        /// </summary>
        private static Guid GenerateDeterministicGuid(string phoneNumber)
        {
            using var sha256 = SHA256.Create();
            var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(phoneNumber));

            // Usar os primeiros 16 bytes do hash para criar o GUID
            var guidBytes = new byte[16];
            Array.Copy(hash, guidBytes, 16);

            return new Guid(guidBytes);
        }

        /// <summary>
        /// Limpa o cache (útil para testes ou manutenção)
        /// </summary>
        public void ClearCache()
        {
            _chatIdCache.Clear();
            _logger.LogInformation("🧹 Cache de mapeamento de chats limpo");
        }

        /// <summary>
        /// Obtém estatísticas do cache
        /// </summary>
        public (int Count, IEnumerable<string> Keys) GetCacheStats()
        {
            return (_chatIdCache.Count, _chatIdCache.Keys);
        }
    }
}
