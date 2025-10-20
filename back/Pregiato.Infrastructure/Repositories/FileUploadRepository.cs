using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Data;

namespace Pregiato.Infrastructure.Repositories
{
    public class FileUploadRepository : IFileUploadRepository
    {
        private readonly PregiatoDbContext _context;

        public FileUploadRepository(PregiatoDbContext context)
        {
            _context = context;
        }

        public async Task<FileUpload?> GetByIdAsync(Guid id)
        {
            return await _context.FileUploads.FindAsync(id);
        }

        public async Task<IEnumerable<FileUpload>> GetByTalentIdAsync(Guid talentId)
        {
            return await _context.FileUploads
                .Where(f => f.TalentId == talentId)
                .OrderByDescending(f => f.UploadedAt)
                .ToListAsync();
        }

        public async Task<FileUpload> AddAsync(FileUpload fileUpload)
        {
            _context.FileUploads.Add(fileUpload);
            await _context.SaveChangesAsync();
            return fileUpload;
        }

        public async Task<FileUpload> UpdateAsync(FileUpload fileUpload)
        {
            _context.FileUploads.Update(fileUpload);
            await _context.SaveChangesAsync();
            return fileUpload;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var fileUpload = await _context.FileUploads.FindAsync(id);
            if (fileUpload == null)
                return false;

            _context.FileUploads.Remove(fileUpload);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(Guid id)
        {
            return await _context.FileUploads.AnyAsync(f => f.Id == id);
        }
    }
}
