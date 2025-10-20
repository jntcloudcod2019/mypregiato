using Pregiato.Application.DTOs;

namespace Pregiato.Application.Interfaces
{
    public interface IFileUploadService
    {
        Task<FileUploadDto?> GetByIdAsync(Guid id);
        Task<IEnumerable<FileUploadDto>> GetByTalentIdAsync(Guid talentId);
        Task<FileUploadDto> CreateAsync(CreateFileUploadDto createDto);
        Task<FileUploadDto> UpdateAsync(Guid id, CreateFileUploadDto updateDto);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> ExistsAsync(Guid id);
    }
}
