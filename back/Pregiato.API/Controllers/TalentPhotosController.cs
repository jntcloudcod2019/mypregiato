using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pregiato.Application.DTOs;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Data;

namespace Pregiato.API.Controllers;

/// <summary>
/// Controller para gerenciamento de fotos de talentos
/// </summary>
[ApiController]
[Route("api/talents/{talentId}/photos")]
public class TalentPhotosController : ControllerBase
{
    private readonly PregiatoDbContext _context;
    private readonly IMediaStoragePort _mediaStorage;
    private readonly ILogger<TalentPhotosController> _logger;

    public TalentPhotosController(
        PregiatoDbContext context,
        IMediaStoragePort mediaStorage,
        ILogger<TalentPhotosController> logger)
    {
        _context = context;
        _mediaStorage = mediaStorage;
        _logger = logger;
    }

    /// <summary>
    /// Listar todas as fotos de um talento
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<FileUploadDto>>> GetTalentPhotos(Guid talentId)
    {
        try
        {
            var photos = await _context.FileUploads
                .Where(f => f.TalentId == talentId && f.Tags == "PHOTO")
                .OrderByDescending(f => f.UploadedAt)
                .Select(f => new FileUploadDto
                {
                    Id = f.Id,
                    FileName = f.FileName,
                    FilePath = f.FilePath,
                    ContentType = f.ContentType,
                    FileSize = f.FileSize,
                    OriginalFileName = f.OriginalFileName,
                    Description = f.Description,
                    Tags = f.Tags,
                    TalentId = f.TalentId,
                    ContractId = f.ContractId,
                    UploadedAt = f.UploadedAt,
                    UploadedBy = f.UploadedBy
                })
                .ToListAsync();

            _logger.LogInformation("Retornando {Count} fotos para talent {TalentId}", photos.Count, talentId);

            return Ok(photos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar fotos do talento {TalentId}", talentId);
            return StatusCode(500, new { error = "Erro ao buscar fotos" });
        }
    }

    /// <summary>
    /// Upload de foto para um talento
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<FileUploadDto>> UploadPhoto(
        Guid talentId,
        [FromBody] TalentPhotoUploadDto dto)
    {
        try
        {
            // Verificar se talent existe
            var talent = await _context.Talent.FindAsync(talentId);
            if (talent == null)
            {
                return NotFound(new { error = "Talento não encontrado" });
            }

            _logger.LogInformation("Fazendo upload de foto para talent {TalentId}: {FileName}", talentId, dto.FileName);

            // Converter base64 para bytes
            var imageBytes = Convert.FromBase64String(dto.Base64Data);
            
            // Gerar nome único para o arquivo
            var extension = Path.GetExtension(dto.FileName);
            var sanitizedFileName = $"{talentId}_{Guid.NewGuid()}{extension}";
            var objectName = $"Talents/{talentId}/Photos/{sanitizedFileName}";

            // Upload para MinIO
            var mediaResult = await _mediaStorage.StoreMediaAsync(
                dto.Base64Data,
                dto.ContentType,
                talentId.ToString(),
                dto.FileName
            );

            _logger.LogInformation("Foto uploaded para MinIO: {Url}", mediaResult.MediaUrl);

            // Salvar no banco
            var fileUpload = new FileUpload
            {
                Id = Guid.NewGuid(),
                FileName = sanitizedFileName,
                FilePath = mediaResult.MediaUrl,
                ContentType = dto.ContentType,
                FileSize = dto.FileSize,
                OriginalFileName = dto.FileName,
                Description = dto.Description,
                Tags = "PHOTO", // Tag para identificar como foto
                TalentId = talentId,
                UploadedAt = DateTime.UtcNow,
                UploadedBy = "system" // TODO: Pegar do usuário autenticado
            };

            _context.FileUploads.Add(fileUpload);
            await _context.SaveChangesAsync();

            var result = new FileUploadDto
            {
                Id = fileUpload.Id,
                FileName = fileUpload.FileName,
                FilePath = fileUpload.FilePath,
                ContentType = fileUpload.ContentType,
                FileSize = fileUpload.FileSize,
                OriginalFileName = fileUpload.OriginalFileName,
                Description = fileUpload.Description,
                Tags = fileUpload.Tags,
                TalentId = fileUpload.TalentId,
                ContractId = fileUpload.ContractId,
                UploadedAt = fileUpload.UploadedAt,
                UploadedBy = fileUpload.UploadedBy
            };

            _logger.LogInformation("Foto salva no banco com ID: {FileId}", result.Id);

            return CreatedAtAction(nameof(GetTalentPhotos), new { talentId }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao fazer upload de foto para talento {TalentId}", talentId);
            return StatusCode(500, new { error = $"Erro ao fazer upload: {ex.Message}" });
        }
    }

    /// <summary>
    /// Deletar uma foto
    /// </summary>
    [HttpDelete("{photoId}")]
    public async Task<ActionResult> DeletePhoto(Guid talentId, Guid photoId)
    {
        try
        {
            var photo = await _context.FileUploads
                .FirstOrDefaultAsync(f => f.Id == photoId && f.TalentId == talentId);

            if (photo == null)
            {
                return NotFound(new { error = "Foto não encontrada" });
            }

            // Nota: IMediaStoragePort não tem DeleteMediaAsync
            // A foto fica no MinIO mas o registro é removido do banco
            _logger.LogInformation("Removendo registro da foto do banco (MinIO mantém o arquivo)");

            // Deletar do banco
            _context.FileUploads.Remove(photo);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Foto deletada com sucesso: {PhotoId}", photoId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao deletar foto {PhotoId}", photoId);
            return StatusCode(500, new { error = "Erro ao deletar foto" });
        }
    }
}

