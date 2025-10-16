using Microsoft.AspNetCore.Mvc;
using Pregiato.API.Attributes;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [ClerkAuthorize] // ⚠️ TEMPORARIAMENTE DESABILITADO PARA TESTE
    public class TrainingEnrollmentsController : ControllerBase
    {
        private readonly ITrainingEnrollmentService _enrollmentService;
        private readonly ILogger<TrainingEnrollmentsController> _logger;

        public TrainingEnrollmentsController(
            ITrainingEnrollmentService enrollmentService,
            ILogger<TrainingEnrollmentsController> logger)
        {
            _enrollmentService = enrollmentService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TrainingEnrollmentDto>>> GetAll(
            [FromQuery] string? userId = null,
            [FromQuery] Guid? courseId = null)
        {
            try
            {
                IEnumerable<TrainingEnrollmentDto> enrollments;

                if (!string.IsNullOrEmpty(userId) && courseId.HasValue)
                {
                    var enrollment = await _enrollmentService.GetByUserAndCourseAsync(userId, courseId.Value);
                    enrollments = enrollment != null ? new[] { enrollment } : Array.Empty<TrainingEnrollmentDto>();
                }
                else if (!string.IsNullOrEmpty(userId))
                {
                    enrollments = await _enrollmentService.GetByUserIdAsync(userId);
                }
                else if (courseId.HasValue)
                {
                    enrollments = await _enrollmentService.GetByCourseIdAsync(courseId.Value);
                }
                else
                {
                    return BadRequest("É necessário fornecer userId ou courseId");
                }

                return Ok(enrollments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar matrículas");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TrainingEnrollmentDto>> GetById(Guid id)
        {
            try
            {
                var enrollment = await _enrollmentService.GetByIdAsync(id);
                if (enrollment == null)
                    return NotFound("Matrícula não encontrada");

                return Ok(enrollment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar matrícula {EnrollmentId}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("user/{userId}/completed")]
        public async Task<ActionResult<IEnumerable<TrainingEnrollmentDto>>> GetCompletedByUser(string userId)
        {
            try
            {
                var enrollments = await _enrollmentService.GetCompletedByUserIdAsync(userId);
                return Ok(enrollments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar matrículas concluídas do usuário {UserId}", userId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("user/{userId}/in-progress")]
        public async Task<ActionResult<IEnumerable<TrainingEnrollmentDto>>> GetInProgressByUser(string userId)
        {
            try
            {
                var enrollments = await _enrollmentService.GetInProgressByUserIdAsync(userId);
                return Ok(enrollments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar matrículas em progresso do usuário {UserId}", userId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("user/{userId}/progress-summary")]
        public async Task<ActionResult<IEnumerable<TrainingProgressSummaryDto>>> GetUserProgressSummary(string userId)
        {
            try
            {
                var summaries = await _enrollmentService.GetUserProgressSummaryAsync(userId);
                return Ok(summaries);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar resumo de progresso do usuário {UserId}", userId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("course/{courseId}/stats")]
        public async Task<ActionResult<Dictionary<string, object>>> GetCourseEnrollmentStats(Guid courseId)
        {
            try
            {
                var stats = await _enrollmentService.GetEnrollmentStatsAsync(courseId);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar estatísticas de matrículas do curso {CourseId}", courseId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpPost]
        public async Task<ActionResult<TrainingEnrollmentDto>> Enroll([FromBody] CreateTrainingEnrollmentDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var enrollment = await _enrollmentService.EnrollAsync(createDto);
                return CreatedAtAction(nameof(GetById), new { id = enrollment.Id }, enrollment);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao matricular usuário");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpPut("{id}/progress")]
        public async Task<ActionResult<TrainingEnrollmentDto>> UpdateProgress(
            Guid id,
            [FromBody] UpdateTrainingProgressDto progressDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var enrollment = await _enrollmentService.UpdateProgressAsync(id, progressDto);
                if (enrollment == null)
                    return NotFound("Matrícula não encontrada");

                return Ok(enrollment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar progresso da matrícula {EnrollmentId}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpPut("{id}/complete")]
        public async Task<ActionResult> MarkAsCompleted(Guid id)
        {
            try
            {
                var completed = await _enrollmentService.MarkAsCompletedAsync(id);
                if (!completed)
                    return NotFound("Matrícula não encontrada");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao marcar matrícula como concluída {EnrollmentId}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("user/{userId}/course/{courseId}/progress")]
        public async Task<ActionResult<TrainingProgressSummaryDto>> GetProgressSummary(string userId, Guid courseId)
        {
            try
            {
                var summary = await _enrollmentService.GetProgressSummaryAsync(userId, courseId);
                if (summary == null)
                    return NotFound("Progresso não encontrado");

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar resumo de progresso do usuário {UserId} no curso {CourseId}", userId, courseId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("user/{userId}/course/{courseId}/is-enrolled")]
        public async Task<ActionResult<bool>> IsEnrolled(string userId, Guid courseId)
        {
            try
            {
                var isEnrolled = await _enrollmentService.IsEnrolledAsync(userId, courseId);
                return Ok(isEnrolled);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao verificar se usuário {UserId} está matriculado no curso {CourseId}", userId, courseId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }
    }
}
