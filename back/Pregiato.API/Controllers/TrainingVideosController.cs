using Microsoft.AspNetCore.Mvc;
using Pregiato.API.Attributes;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using System.Collections.Concurrent;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [ClerkAuthorize] // ⚠️ TEMPORARIAMENTE DESABILITADO PARA TESTE
    public class TrainingVideosController : ControllerBase
    {
        private readonly ITrainingVideoService _videoService;
        private readonly ILogger<TrainingVideosController> _logger;
        
        // Armazenamento em memória para status de uploads em lote
        // Em produção, considere usar Redis ou banco de dados
        private static readonly ConcurrentDictionary<Guid, BatchUploadStatusDto> _batchStatuses = new();

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

        /// <summary>
        /// Upload de vídeo único (RECOMENDADO)
        /// Este endpoint aceita apenas UM vídeo por vez
        /// </summary>
        [HttpPost("upload")]
        [RequestSizeLimit(524_288_000)] // 500MB por requisição
        [RequestFormLimits(MultipartBodyLengthLimit = 524_288_000)]
        public async Task<ActionResult<VideoUploadResultDto>> UploadVideo([FromBody] TrainingVideoUploadDto uploadDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (string.IsNullOrEmpty(uploadDto.Base64Data))
                    return BadRequest(new { error = "Dados Base64 do vídeo são obrigatórios" });

                // Validar tamanho máximo (100MB em base64 = ~75MB em bytes)
                const long maxSizeBytes = 104_857_600; // 100MB
                if (uploadDto.FileSize > maxSizeBytes)
                {
                    return BadRequest(new 
                    { 
                        error = "Arquivo muito grande", 
                        message = $"O tamanho máximo permitido é 100MB. Arquivo enviado: {uploadDto.FileSize / 1024 / 1024}MB" 
                    });
                }

                _logger.LogInformation("📤 Iniciando upload de vídeo: {FileName} ({FileSize} bytes)", 
                    uploadDto.FileName, uploadDto.FileSize);

                // Converter Base64 para bytes
                byte[] videoBytes;
                try
                {
                    videoBytes = Convert.FromBase64String(uploadDto.Base64Data);
                }
                catch (FormatException)
                {
                    return BadRequest(new { error = "Dados Base64 inválidos" });
                }
                
                // Fazer upload usando o serviço
                var result = await _videoService.UploadVideoAsync(uploadDto, videoBytes);
                
                if (result.Success)
                {
                    _logger.LogInformation("✅ Upload concluído com sucesso: {ObjectName}", result.ObjectName);
                    return Ok(result);
                }
                else
                {
                    _logger.LogWarning("❌ Upload falhou: {ErrorMessage}", result.ErrorMessage);
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro no upload de vídeo: {FileName}", uploadDto?.FileName);
                return StatusCode(500, new { error = "Erro interno do servidor", details = ex.Message });
            }
        }

        /// <summary>
        /// Iniciar um processo de upload em lote
        /// Retorna um BatchId que será usado para fazer uploads sequenciais
        /// </summary>
        [HttpPost("batch/init")]
        public ActionResult<BatchUploadResponseDto> InitiateBatchUpload([FromBody] BatchUploadInitDto initDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var batchId = Guid.NewGuid();
                var batchStatus = new BatchUploadStatusDto
                {
                    BatchId = batchId,
                    TotalVideos = initDto.TotalVideos,
                    UploadedVideos = 0,
                    FailedVideos = 0,
                    ProgressPercentage = 0,
                    IsCompleted = false,
                    CreatedAt = DateTime.UtcNow,
                    Results = new List<VideoUploadResultDto>(),
                    Errors = new List<string>()
                };

                _batchStatuses.TryAdd(batchId, batchStatus);

                _logger.LogInformation("📦 Lote de upload iniciado: {BatchId} com {TotalVideos} vídeos", 
                    batchId, initDto.TotalVideos);

                return Ok(new BatchUploadResponseDto
                {
                    BatchId = batchId,
                    TotalVideos = initDto.TotalVideos,
                    CreatedAt = batchStatus.CreatedAt,
                    Message = $"Lote iniciado com sucesso. Use o BatchId para fazer upload de cada vídeo individualmente."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao iniciar lote de upload");
                return StatusCode(500, new { error = "Erro ao iniciar lote", details = ex.Message });
            }
        }

        /// <summary>
        /// Upload de vídeo individual dentro de um lote
        /// Use este endpoint para fazer upload sequencial de múltiplos vídeos
        /// </summary>
        [HttpPost("batch/upload")]
        [RequestSizeLimit(524_288_000)] // 500MB
        public async Task<ActionResult<VideoUploadResultDto>> UploadBatchVideo([FromBody] BatchVideoUploadDto batchUploadDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Verificar se o lote existe
                if (!_batchStatuses.TryGetValue(batchUploadDto.BatchId, out var batchStatus))
                {
                    return NotFound(new { error = "Lote não encontrado", batchId = batchUploadDto.BatchId });
                }

                // Verificar se o lote já foi completado
                if (batchStatus.IsCompleted)
                {
                    return BadRequest(new { error = "Este lote já foi completado" });
                }

                var uploadDto = batchUploadDto.VideoData;

                _logger.LogInformation("📤 Upload de vídeo {VideoIndex}/{TotalVideos} no lote {BatchId}: {FileName}",
                    batchUploadDto.VideoIndex + 1, batchStatus.TotalVideos, batchUploadDto.BatchId, uploadDto.FileName);

                VideoUploadResultDto result;
                try
                {
                    // Converter Base64 para bytes
                    var videoBytes = Convert.FromBase64String(uploadDto.Base64Data);
                    
                    // Fazer upload usando o serviço
                    result = await _videoService.UploadVideoAsync(uploadDto, videoBytes);
                }
                catch (FormatException)
                {
                    result = new VideoUploadResultDto
                    {
                        Success = false,
                        ErrorMessage = "Dados Base64 inválidos"
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro no upload do vídeo {VideoIndex}", batchUploadDto.VideoIndex);
                    result = new VideoUploadResultDto
                    {
                        Success = false,
                        ErrorMessage = ex.Message
                    };
                }

                // Atualizar status do lote
                batchStatus.Results.Add(result);
                
                if (result.Success)
                {
                    batchStatus.UploadedVideos++;
                    _logger.LogInformation("✅ Vídeo {VideoIndex} enviado com sucesso: {ObjectName}", 
                        batchUploadDto.VideoIndex, result.ObjectName);
                }
                else
                {
                    batchStatus.FailedVideos++;
                    batchStatus.Errors.Add($"Vídeo {batchUploadDto.VideoIndex}: {result.ErrorMessage}");
                    _logger.LogWarning("❌ Falha no upload do vídeo {VideoIndex}: {Error}", 
                        batchUploadDto.VideoIndex, result.ErrorMessage);
                }

                // Calcular progresso
                var totalProcessed = batchStatus.UploadedVideos + batchStatus.FailedVideos;
                batchStatus.ProgressPercentage = (totalProcessed * 100.0) / batchStatus.TotalVideos;

                // Verificar se o lote foi completado
                if (totalProcessed >= batchStatus.TotalVideos)
                {
                    batchStatus.IsCompleted = true;
                    batchStatus.CompletedAt = DateTime.UtcNow;
                    _logger.LogInformation("🎉 Lote {BatchId} completado: {UploadedVideos} sucesso, {FailedVideos} falhas",
                        batchUploadDto.BatchId, batchStatus.UploadedVideos, batchStatus.FailedVideos);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no upload em lote");
                return StatusCode(500, new { error = "Erro interno do servidor", details = ex.Message });
            }
        }

        /// <summary>
        /// Obter status de um lote de upload
        /// </summary>
        [HttpGet("batch/{batchId}/status")]
        public ActionResult<BatchUploadStatusDto> GetBatchStatus(Guid batchId)
        {
            if (!_batchStatuses.TryGetValue(batchId, out var batchStatus))
            {
                return NotFound(new { error = "Lote não encontrado", batchId });
            }

            return Ok(batchStatus);
        }

        /// <summary>
        /// Limpar lotes antigos (opcional - pode ser chamado periodicamente)
        /// </summary>
        [HttpDelete("batch/cleanup")]
        public ActionResult CleanupOldBatches([FromQuery] int olderThanHours = 24)
        {
            try
            {
                var cutoffTime = DateTime.UtcNow.AddHours(-olderThanHours);
                var removedCount = 0;

                foreach (var batch in _batchStatuses.ToList())
                {
                    if (batch.Value.CreatedAt < cutoffTime)
                    {
                        _batchStatuses.TryRemove(batch.Key, out _);
                        removedCount++;
                    }
                }

                _logger.LogInformation("🧹 Limpeza de lotes: {RemovedCount} lotes removidos", removedCount);

                return Ok(new { message = $"{removedCount} lotes antigos foram removidos", removedCount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro na limpeza de lotes");
                return StatusCode(500, new { error = "Erro ao limpar lotes", details = ex.Message });
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
