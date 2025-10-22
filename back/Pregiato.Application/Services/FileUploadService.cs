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
        private readonly IMediaStoragePort _mediaStorage;
        private readonly IMapper _mapper;


        public FileUploadService(
            IFileUploadRepository fileUploadRepository, 
            IMediaStoragePort mediaStorage,
            IMapper mapper)
        {
            _fileUploadRepository = fileUploadRepository;
            _mediaStorage = mediaStorage;
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
            Console.WriteLine($"📤 [FILE-UPLOAD-SERVICE] Iniciando upload: {createDto.FileName}");
            
            // ✅ Fazer upload do Base64 para MinIO
            var mediaResult = await _mediaStorage.StoreMediaAsync(
                createDto.Base64Data,
                createDto.ContentType,
                createDto.TalentId?.ToString() ?? "general",
                createDto.FileName
            );
            
            Console.WriteLine($"✅ [FILE-UPLOAD-SERVICE] Upload para MinIO concluído: {mediaResult.MediaUrl}");
            
            // Criar entity com FilePath do MinIO
            var fileUpload = new FileUpload
            {
                Id = Guid.NewGuid(),
                FileName = createDto.FileName,
                FilePath = mediaResult.MediaUrl,
                ContentType = createDto.ContentType,
                FileSize = createDto.FileSize,
                OriginalFileName = createDto.OriginalFileName,
                Description = createDto.Description,
                Tags = createDto.Tags,
                TalentId = createDto.TalentId,
                ContractId = createDto.ContractId,
                UploadedAt = DateTime.UtcNow,
                UploadedBy = createDto.UploadedBy
            };
            
            var createdFileUpload = await _fileUploadRepository.AddAsync(fileUpload);
            
            Console.WriteLine($"✅ [FILE-UPLOAD-SERVICE] Registro criado no banco: {createdFileUpload.Id}");
            
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
