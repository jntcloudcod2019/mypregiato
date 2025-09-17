using Pregiato.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Pregiato.Core.Interfaces
{
    /// <summary>
    /// Interface para repositório de logs de chat
    /// </summary>
    public interface IChatLogRepository
    {
        /// <summary>
        /// Obtém todos os chats com paginação e filtro opcional
        /// </summary>
        /// <param name="search">Texto para busca (opcional)</param>
        /// <param name="page">Número da página</param>
        /// <param name="pageSize">Tamanho da página</param>
        /// <returns>Lista paginada de chats e total de registros</returns>
        Task<(IEnumerable<ChatLog> Items, int Total)> GetAllAsync(string? search = null, int page = 1, int pageSize = 20);
        
        /// <summary>
        /// Obtém um chat pelo ID
        /// </summary>
        /// <param name="id">ID do chat</param>
        /// <returns>Chat ou null se não encontrado</returns>
        Task<ChatLog?> GetByIdAsync(Guid id);
        
        /// <summary>
        /// Obtém um chat pelo ID do chat (agrupamento)
        /// </summary>
        /// <param name="chatId">ID do chat para agrupamento</param>
        /// <returns>Chat ou null se não encontrado</returns>
        Task<ChatLog?> GetByChatIdAsync(Guid chatId);
        
        /// <summary>
        /// Obtém um chat pelo número de telefone
        /// </summary>
        /// <param name="phoneNumber">Número de telefone</param>
        /// <returns>Chat ou null se não encontrado</returns>
        Task<ChatLog?> GetByPhoneNumberAsync(string phoneNumber);
        
        /// <summary>
        /// Adiciona um novo chat
        /// </summary>
        /// <param name="chatLog">Chat a ser adicionado</param>
        /// <returns>Chat adicionado</returns>
        Task<ChatLog> AddAsync(ChatLog chatLog);
        
        /// <summary>
        /// Atualiza um chat existente
        /// </summary>
        /// <param name="chatLog">Chat a ser atualizado</param>
        /// <returns>Chat atualizado</returns>
        Task<ChatLog> UpdateAsync(ChatLog chatLog);
        
        /// <summary>
        /// Remove um chat
        /// </summary>
        /// <param name="id">ID do chat</param>
        /// <returns>True se removido com sucesso, False caso contrário</returns>
        Task<bool> DeleteAsync(Guid id);
        
        /// <summary>
        /// Obtém o histórico de mensagens de um chat
        /// </summary>
        /// <param name="chatId">ID do chat</param>
        /// <param name="cursorTs">Timestamp de cursor para paginação (opcional)</param>
        /// <param name="limit">Limite de mensagens</param>
        /// <returns>Lista de mensagens</returns>
        Task<IEnumerable<ChatLog>> GetMessageHistoryAsync(Guid chatId, DateTime? cursorTs = null, int limit = 50);
        
        /// <summary>
        /// Adiciona uma nova mensagem ao chat
        /// </summary>
        /// <param name="chatId">ID do chat</param>
        /// <param name="message">Mensagem a ser adicionada</param>
        /// <returns>Chat atualizado e mensagem adicionada</returns>
        Task<(ChatLog Chat, object Message)> AddMessageAsync(Guid chatId, object message);
        
        /// <summary>
        /// Marca mensagens como lidas até determinado timestamp
        /// </summary>
        /// <param name="chatId">ID do chat</param>
        /// <param name="timestamp">Timestamp até o qual marcar como lido</param>
        /// <returns>True se atualizado com sucesso, False caso contrário</returns>
        Task<bool> MarkReadUpToAsync(Guid chatId, DateTime timestamp);
        
        /// <summary>
        /// Obtém chats recentes
        /// </summary>
        /// <param name="limit">Limite de chats</param>
        /// <returns>Lista de chats recentes</returns>
        Task<IEnumerable<ChatLog>> GetRecentChatsAsync(int limit = 10);
        
        /// <summary>
        /// Obtém chats filtrados por operador baseado nos leads alocados
        /// </summary>
        /// <param name="operatorEmail">Email do operador</param>
        /// <param name="search">Texto para busca (opcional)</param>
        /// <param name="page">Número da página</param>
        /// <param name="pageSize">Tamanho da página</param>
        /// <returns>Lista paginada de chats do operador e total de registros</returns>
        Task<(IEnumerable<ChatLog> Items, int Total)> GetByOperatorAsync(string operatorEmail, string? search = null, int page = 1, int pageSize = 20);
    }
}
