using Pregiato.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Pregiato.Core.Interfaces
{
    /// <summary>
    /// Interface para repositório de arquivos importados
    /// </summary>
    public interface IImportedFileRepository
    {
        /// <summary>
        /// Obtém todos os arquivos importados com paginação
        /// </summary>
        /// <param name="page">Número da página</param>
        /// <param name="pageSize">Tamanho da página</param>
        /// <returns>Lista paginada de arquivos importados e total de registros</returns>
        Task<(IEnumerable<ImportedFile> Items, int Total)> GetAllAsync(int page = 1, int pageSize = 20);
        
        /// <summary>
        /// Obtém um arquivo importado pelo ID
        /// </summary>
        /// <param name="id">ID do arquivo importado</param>
        /// <returns>Arquivo importado ou null se não encontrado</returns>
        Task<ImportedFile?> GetByIdAsync(Guid id);
        
        /// <summary>
        /// Adiciona um novo arquivo importado
        /// </summary>
        /// <param name="importedFile">Arquivo importado a ser adicionado</param>
        /// <returns>Arquivo importado adicionado</returns>
        Task<ImportedFile> AddAsync(ImportedFile importedFile);
        
        /// <summary>
        /// Atualiza um arquivo importado existente
        /// </summary>
        /// <param name="importedFile">Arquivo importado a ser atualizado</param>
        /// <returns>Arquivo importado atualizado</returns>
        Task<ImportedFile> UpdateAsync(ImportedFile importedFile);
        
        /// <summary>
        /// Remove um arquivo importado
        /// </summary>
        /// <param name="id">ID do arquivo importado</param>
        /// <returns>True se removido com sucesso, False caso contrário</returns>
        Task<bool> DeleteAsync(Guid id);
        
        /// <summary>
        /// Atualiza o status de processamento de um arquivo importado
        /// </summary>
        /// <param name="id">ID do arquivo importado</param>
        /// <param name="processingResult">Resultado do processamento em formato JSON</param>
        /// <param name="entityType">Tipo de entidade processada</param>
        /// <returns>Arquivo importado atualizado</returns>
        Task<ImportedFile?> UpdateProcessingStatusAsync(Guid id, string processingResult, string entityType);
    }
}
