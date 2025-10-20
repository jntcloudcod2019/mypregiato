using AutoMapper;
using Pregiato.Application.DTOs;
using Pregiato.Core.Entities;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Interfaces;

namespace Pregiato.Application.Services
{
    public class FileUploadService : IFileUploadService
    {
        private readonly IFileUploadRepository _fileUploadRepository;
        private readonly IMapper _mapper;


        public FileUploadService(IFileUploadRepository fileUploadRepository, IMapper mapper)
        {
            _fileUploadRepository = fileUploadRepository;
            _mapper = mapper;
        }

        public async Task<FileUploadDto?> GetByIdAsync(Guid id)
        {
            var fileUpload = await _fileUploadRepository.GetByIdAsync(id);
            return fileUpload != null ? _mapper.Map<FileUploadDto>(fileUpload) : null;
        }

        public async Task<IEnumerable<FileUploadDto>> GetByTalentIdAsync(Guid talentId)
        {
            var fileUploads = await _fileUploadRepository.GetByTalentIdAsync(talentId);
            return _mapper.Map<IEnumerable<FileUploadDto>>(fileUploads);
        }

        public async Task<FileUploadDto> CreateAsync(CreateFileUploadDto createDto)
        {
            var fileUpload = _mapper.Map<FileUpload>(createDto);
            fileUpload.Id = Guid.NewGuid();
            fileUpload.UploadedAt = DateTime.UtcNow;
            
            var createdFileUpload = await _fileUploadRepository.AddAsync(fileUpload);
            return _mapper.Map<FileUploadDto>(createdFileUpload);
        }

        public async Task<FileUploadDto> UpdateAsync(Guid id, CreateFileUploadDto updateDto)
        {
            var existingFileUpload = await _fileUploadRepository.GetByIdAsync(id);
            if (existingFileUpload == null)
                throw new ArgumentException("File upload não encontrado");

            _mapper.Map(updateDto, existingFileUpload);
            var updatedFileUpload = await _fileUploadRepository.UpdateAsync(existingFileUpload);
            return _mapper.Map<FileUploadDto>(updatedFileUpload);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            return await _fileUploadRepository.DeleteAsync(id);
        }

        public async Task<bool> ExistsAsync(Guid id)
        {
            return await _fileUploadRepository.ExistsAsync(id);
        }
    }
}
