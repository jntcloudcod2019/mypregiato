using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Pregiato.API.Services
{
    /// <summary>
    /// Classe auxiliar para operações de chat
    /// </summary>
    public static class ChatHelper
    {
        /// <summary>
        /// Normaliza um número de telefone ou ID de grupo para um formato padrão
        /// </summary>
        /// <param name="phone">Número de telefone ou ID de grupo</param>
        /// <param name="isGroup">Se é um ID de grupo</param>
        /// <returns>Número normalizado</returns>
        public static string NormalizePhoneE164Br(string phone, bool isGroup = false)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return string.Empty;
            
            // Remover todos os caracteres não numéricos
            var digits = new string(phone.Where(char.IsDigit).ToArray());
            
            // Para grupos, sempre retornar apenas os dígitos (sem @g.us)
            // O @g.us será adicionado apenas quando necessário
            if (isGroup || (digits.StartsWith("120") && digits.Length >= 18))
            {
                return digits;
            }
            
            // Para números individuais brasileiros, aplicar formato E.164 BR
            // Números brasileiros: 10 ou 11 dígitos (DDD + número)
            if (digits.Length == 10 || digits.Length == 11)
            {
                return $"55{digits}";
            }
            
            // Se já tiver código do país (12+ dígitos) ou outro formato, retornar como está
            return digits;
        }
        
        /// <summary>
        /// Consolida chats duplicados em um chat principal
        /// </summary>
        public static async Task ConsolidateDuplicateChats(ChatLog mainChat, List<ChatLog> duplicateChats, 
            PregiatoDbContext context, IServiceScope scope, ILogger logger)
        {
            try
            {
                var chatLogService = scope.ServiceProvider.GetRequiredService<ChatLogService>();
                
                // Deserializar payload do chat principal
                var mainPayload = chatLogService.Deserialize(mainChat.PayloadJson);
                if (mainPayload == null)
                {
                    mainPayload = new ChatLogService.ChatPayload
                    {
                        Contact = new ChatLogService.ContactInfo
                        {
                            Name = mainChat.Title,
                            PhoneE164 = mainChat.ContactPhoneE164,
                            ProfilePic = null
                        },
                        Messages = new List<ChatLogService.MessageInfo>()
                    };
                }
                
                var allMessages = new List<ChatLogService.MessageInfo>();
                if (mainPayload.Messages != null)
                {
                    allMessages.AddRange(mainPayload.Messages);
                }
                
                // Consolidar mensagens de todos os chats duplicados
                foreach (var duplicateChat in duplicateChats)
                {
                    try
                    {
                        var duplicatePayload = chatLogService.Deserialize(duplicateChat.PayloadJson);
                        if (duplicatePayload?.Messages != null)
                        {
                            // Adicionar mensagens que não existem no chat principal
                            foreach (var message in duplicatePayload.Messages)
                            {
                                if (!allMessages.Any(m => m.Id == message.Id))
                                {
                                    allMessages.Add(message);
                                }
                            }
                        }
                        
                        logger.LogInformation("📝 Consolidando mensagens do chat duplicado {DuplicateId} para {MainId}", 
                            duplicateChat.Id, mainChat.Id);
                            
                    } catch (Exception ex)
                    {
                        logger.LogError(ex, "❌ Erro ao processar chat duplicado {DuplicateId}", duplicateChat.Id);
                    }
                }
                
                // Ordenar mensagens por timestamp
                allMessages = allMessages
                    .OrderBy(m => DateTime.TryParse(m.timestamp, out var dt) ? dt : DateTime.MinValue)
                    .ToList();
                
                // Atualizar payload do chat principal
                mainPayload.Messages = allMessages;
                mainChat.PayloadJson = JsonSerializer.Serialize(mainPayload);
                
                // Atualizar informações do chat principal
                var latestMessage = allMessages.LastOrDefault();
                if (latestMessage != null)
                {
                    mainChat.LastMessageAt = DateTime.TryParse(latestMessage.timestamp, out var dt) ? dt : DateTime.UtcNow;
                    mainChat.LastMessagePreview = !string.IsNullOrEmpty(latestMessage.body) ? 
                        (latestMessage.body.Length > 200 ? latestMessage.body.Substring(0, 200) : latestMessage.body) : 
                        "Mensagem";
                }
                
                mainChat.UnreadCount = allMessages.Count(m => m.Direction == "inbound" && m.Status != "read");
                
                // Remover chats duplicados
                context.ChatLogs.RemoveRange(duplicateChats);
                
                // Salvar mudanças
                await context.SaveChangesAsync();
                
                logger.LogInformation("✅ Consolidação concluída: {Count} mensagens no chat {MainId}, removidos {DuplicateCount} chats duplicados", 
                    allMessages.Count, mainChat.Id, duplicateChats.Count);
                    
            } catch (Exception ex)
            {
                logger.LogError(ex, "❌ Erro durante consolidação de chats duplicados");
            }
        }
    }
}
