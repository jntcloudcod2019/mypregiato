using Microsoft.AspNetCore.Mvc;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Application.Services;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FileUploadsController : ControllerBase
    {
        private readonly IFileUploadService _fileUploadService;
        private readonly ILogger<FileUploadsController> _logger;

        public FileUploadsController(IFileUploadService fileUploadService, ILogger<FileUploadsController> logger)
        {
            _fileUploadService = fileUploadService;
            _logger = logger;
        }

        /// <summary>
        /// Obtém todas as fotos de um talento
        /// </summary>
        [HttpGet("talent/{talentId}")]
        public async Task<ActionResult<IEnumerable<FileUploadDto>>> GetByTalentId(Guid talentId)
        {
            try
            {
                Console.WriteLine($"📸 [FILE-UPLOAD] Buscando fotos do talento: {talentId}");
                
                var fileUploads = await _fileUploadService.GetByTalentIdAsync(talentId);
                
                Console.WriteLine($"✅ [FILE-UPLOAD] Encontradas {fileUploads.Count()} fotos");
                
                return Ok(fileUploads);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [FILE-UPLOAD] Erro: {ex.Message}");
                _logger.LogError(ex, "Erro ao buscar fotos do talento {TalentId}", talentId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        /// <summary>
        /// Obtém uma foto específica
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<FileUploadDto>> GetById(Guid id)
        {
            try
            {
                var fileUpload = await _fileUploadService.GetByIdAsync(id);
                if (fileUpload == null)
                    return NotFound("Foto não encontrada");

                return Ok(fileUpload);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar foto {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        /// <summary>
        /// Cria um novo registro de upload
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<FileUploadDto>> Create([FromBody] CreateFileUploadDto createDto)
        {
            try
            {
                Console.WriteLine($"📤 [FILE-UPLOAD] Criando upload: {createDto.FileName}");
                
                var fileUpload = await _fileUploadService.CreateAsync(createDto);
                
                Console.WriteLine($"✅ [FILE-UPLOAD] Upload criado: {fileUpload.Id}");
                
                return CreatedAtAction(nameof(GetById), new { id = fileUpload.Id }, fileUpload);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [FILE-UPLOAD] Erro: {ex.Message}");
                _logger.LogError(ex, "Erro ao criar upload");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        /// <summary>
        /// Atualiza um registro de upload
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<FileUploadDto>> Update(Guid id, [FromBody] CreateFileUploadDto updateDto)
        {
            try
            {
                var fileUpload = await _fileUploadService.UpdateAsync(id, updateDto);
                return Ok(fileUpload);
            }
            catch (ArgumentException)
            {
                return NotFound("Foto não encontrada");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar foto {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        /// <summary>
        /// Deleta uma foto
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            try
            {
                var deleted = await _fileUploadService.DeleteAsync(id);
                if (!deleted)
                    return NotFound("Foto não encontrada");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao deletar foto {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }
    }
}
