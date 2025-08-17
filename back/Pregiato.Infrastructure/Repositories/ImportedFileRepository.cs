using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Pregiato.Infrastructure.Repositories
{
    /// <summary>
    /// Implementação do repositório de arquivos importados
    /// </summary>
    public class ImportedFileRepository : IImportedFileRepository
    {
        private readonly RuntimePregiatoDbContextFactory _contextFactory;
        private readonly ILogger<ImportedFileRepository> _logger;

        /// <summary>
        /// Construtor
        /// </summary>
        /// <param name="contextFactory">Factory para criação de instâncias do DbContext</param>
        /// <param name="logger">Logger</param>
        public ImportedFileRepository(RuntimePregiatoDbContextFactory contextFactory, ILogger<ImportedFileRepository> logger)
        {
            _contextFactory = contextFactory;
            _logger = logger;
        }

        /// <inheritdoc/>
        public async Task<(IEnumerable<ImportedFile> Items, int Total)> GetAllAsync(int page = 1, int pageSize = 20)
        {
            using var context = _contextFactory.CreateDbContext();
            var query = context.Set<ImportedFile>().AsQueryable();
            
            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(x => x.CreatedAtUtc)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            
            return (items, total);
        }

        /// <inheritdoc/>
        public async Task<ImportedFile?> GetByIdAsync(Guid id)
        {
            using var context = _contextFactory.CreateDbContext();
            return await context.Set<ImportedFile>().FindAsync(id);
        }

        /// <inheritdoc/>
        public async Task<ImportedFile> AddAsync(ImportedFile importedFile)
        {
            using var context = _contextFactory.CreateDbContext();
            
            importedFile.CreatedAtUtc = DateTime.UtcNow;
            importedFile.UpdatedAtUtc = DateTime.UtcNow;
            
            await context.Set<ImportedFile>().AddAsync(importedFile);
            await context.SaveChangesAsync();
            
            return importedFile;
        }

        /// <inheritdoc/>
        public async Task<ImportedFile> UpdateAsync(ImportedFile importedFile)
        {
            using var context = _contextFactory.CreateDbContext();
            
            importedFile.UpdatedAtUtc = DateTime.UtcNow;
            
            context.Set<ImportedFile>().Update(importedFile);
            await context.SaveChangesAsync();
            
            return importedFile;
        }

        /// <inheritdoc/>
        public async Task<bool> DeleteAsync(Guid id)
        {
            using var context = _contextFactory.CreateDbContext();
            
            var entity = await context.Set<ImportedFile>().FindAsync(id);
            if (entity == null)
                return false;
            
            context.Set<ImportedFile>().Remove(entity);
            var result = await context.SaveChangesAsync();
            
            return result > 0;
        }

        /// <inheritdoc/>
        public async Task<ImportedFile?> UpdateProcessingStatusAsync(Guid id, string processingResult, string entityType)
        {
            using var context = _contextFactory.CreateDbContext();
            
            var entity = await context.Set<ImportedFile>().FindAsync(id);
            if (entity == null)
                return null;
            
            entity.ProcessedAt = DateTime.UtcNow;
            entity.ProcessingResult = processingResult;
            entity.EntityType = entityType;
            entity.UpdatedAtUtc = DateTime.UtcNow;
            
            await context.SaveChangesAsync();
            
            return entity;
        }
    }
}
