using Microsoft.AspNetCore.Mvc;
using Pregiato.API.Attributes;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [ClerkAuthorize] // ⚠️ TEMPORARIAMENTE DESABILITADO PARA TESTE
    public class TrainingVideosController : ControllerBase
    {
        private readonly ITrainingVideoService _videoService;
        private readonly ILogger<TrainingVideosController> _logger;

        public TrainingVideosController(
            ITrainingVideoService videoService,
            ILogger<TrainingVideosController> logger)
        {
            _videoService = videoService;
            _logger = logger;
        }

        [HttpPost("presigned-url")]
        public async Task<ActionResult<VideoPresignedUrlDto>> GeneratePresignedUrl([FromBody] TrainingVideoUploadDto uploadDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var presignedUrl = await _videoService.GeneratePresignedUrlAsync(uploadDto);
                return Ok(presignedUrl);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar URL pré-assinada");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpPost("upload")]
        public async Task<ActionResult<VideoUploadResultDto>> UploadVideo([FromBody] TrainingVideoUploadDto uploadDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (string.IsNullOrEmpty(uploadDto.Base64Data))
                    return BadRequest("Dados Base64 do vídeo são obrigatórios");

                _logger.LogInformation($"Iniciando upload de vídeo: {uploadDto.FileName} ({uploadDto.FileSize} bytes)");

                // Converter Base64 para bytes
                var videoBytes = Convert.FromBase64String(uploadDto.Base64Data);
                
                // Fazer upload usando o serviço
                var result = await _videoService.UploadVideoAsync(uploadDto, videoBytes);
                
                if (result.Success)
                {
                    _logger.LogInformation($"Upload concluído com sucesso: {result.ObjectName}");
                    return Ok(result);
                }
                else
                {
                    _logger.LogWarning($"Upload falhou: {result.ErrorMessage}");
                    return BadRequest(result);
                }
            }
            catch (FormatException)
            {
                return BadRequest("Dados Base64 inválidos");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no upload de vídeo");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("stream/{objectName}")]
        public async Task<ActionResult<VideoPresignedUrlDto>> GetStreamingUrl(string objectName, [FromQuery] int expiresInHours = 1)
        {
            try
            {
                var expiresIn = TimeSpan.FromHours(expiresInHours);
                var streamingUrl = await _videoService.GenerateStreamingUrlAsync(objectName, expiresIn);
                return Ok(streamingUrl);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar URL de streaming para {ObjectName}", objectName);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("public/{objectName}")]
        public async Task<ActionResult<string>> GetPublicUrl(string objectName)
        {
            try
            {
                var publicUrl = await _videoService.GetVideoStreamingUrlAsync(objectName);
                return Ok(new { url = publicUrl });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao obter URL pública para {ObjectName}", objectName);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("metadata/{objectName}")]
        public async Task<ActionResult<VideoMetadataDto>> GetVideoMetadata(string objectName)
        {
            try
            {
                var metadata = await _videoService.GetVideoMetadataAsync(objectName);
                if (metadata == null)
                    return NotFound("Vídeo não encontrado");

                return Ok(metadata);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao obter metadados do vídeo {ObjectName}", objectName);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("exists/{objectName}")]
        public async Task<ActionResult<bool>> VideoExists(string objectName)
        {
            try
            {
                var exists = await _videoService.VideoExistsAsync(objectName);
                return Ok(exists);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao verificar existência do vídeo {ObjectName}", objectName);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpDelete("{objectName}")]
        public async Task<ActionResult> DeleteVideo(string objectName)
        {
            try
            {
                var deleted = await _videoService.DeleteVideoAsync(objectName);
                if (!deleted)
                    return NotFound("Vídeo não encontrado");

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao deletar vídeo {ObjectName}", objectName);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpPost("upload-chunk")]
        public async Task<ActionResult<VideoUploadResultDto>> UploadChunk([FromBody] VideoChunkUploadRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (string.IsNullOrEmpty(request.ChunkData))
                    return BadRequest("Dados do chunk são obrigatórios");

                var chunkBytes = Convert.FromBase64String(request.ChunkData);
                var result = await _videoService.UploadVideoAsync(request.UploadDto, chunkBytes);
                return Ok(result);
            }
            catch (FormatException)
            {
                return BadRequest("Dados do chunk devem estar em formato base64 válido");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no upload de chunk");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

    }

    // DTO auxiliar para upload de chunk
    public class VideoChunkUploadRequest
    {
        public TrainingVideoUploadDto UploadDto { get; set; } = new();
        public string ChunkData { get; set; } = string.Empty;
    }
}
