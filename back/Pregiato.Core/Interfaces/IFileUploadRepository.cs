using Pregiato.Core.Entities;

namespace Pregiato.Core.Interfaces
{
    public interface IFileUploadRepository
    {
        Task<FileUpload?> GetByIdAsync(Guid id);
        Task<IEnumerable<FileUpload>> GetByTalentIdAsync(Guid talentId);
        Task<FileUpload> AddAsync(FileUpload fileUpload);
        Task<FileUpload> UpdateAsync(FileUpload fileUpload);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> ExistsAsync(Guid id);
    }
}
