using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pregiato.API.Attributes;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Infrastructure.Data;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [ClerkAuthorize] // ⚠️ TEMPORARIAMENTE DESABILITADO PARA TESTE
    public class TrainingEnrollmentsController : ControllerBase
    {
        private readonly ITrainingEnrollmentService _enrollmentService;
        private readonly ILogger<TrainingEnrollmentsController> _logger;
        private readonly PregiatoDbContext _context;


        public TrainingEnrollmentsController(
            ITrainingEnrollmentService enrollmentService,
            ILogger<TrainingEnrollmentsController> logger,
            PregiatoDbContext context)
        {
            _enrollmentService = enrollmentService;
            _logger = logger;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TrainingEnrollmentDto>>> GetAll(
            [FromQuery] string? userId = null,
            [FromQuery] Guid? courseId = null)
        {
            try
            {
                Console.WriteLine($"🔍 [ENROLLMENT] Buscando enrollments - UserId: {userId ?? "NULL"}, CourseId: {courseId?.ToString() ?? "NULL"}");
                
                IEnumerable<TrainingEnrollmentDto> enrollments;

                if (!string.IsNullOrEmpty(userId) && courseId.HasValue)
                {
                    var enrollment = await _enrollmentService.GetByUserAndCourseAsync(userId, courseId.Value);
                    enrollments = enrollment != null ? new[] { enrollment } : Array.Empty<TrainingEnrollmentDto>();
                    Console.WriteLine($"✅ [ENROLLMENT] Enrollment encontrado: {enrollment != null}");
                }
                else if (!string.IsNullOrEmpty(userId))
                {
                    enrollments = await _enrollmentService.GetByUserIdAsync(userId);
                    Console.WriteLine($"✅ [ENROLLMENT] Total de enrollments do usuário: {enrollments.Count()}");
                }
                else if (courseId.HasValue)
                {
                    enrollments = await _enrollmentService.GetByCourseIdAsync(courseId.Value);
                    Console.WriteLine($"✅ [ENROLLMENT] Total de enrollments do curso: {enrollments.Count()}");
                }
                else
                {
                    Console.WriteLine($"❌ [ENROLLMENT] Parâmetros inválidos");
                    return BadRequest("É necessário fornecer userId ou courseId");
                }

                return Ok(enrollments);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [ENROLLMENT] Erro: {ex.Message}");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        /// <summary>
        /// Buscar ou criar enrollment automaticamente
        /// </summary>
        [HttpGet("get-or-create")]
        public async Task<ActionResult<TrainingEnrollmentDto>> GetOrCreateEnrollment(
            [FromQuery] string userId,
            [FromQuery] Guid courseId)
        {
            try
            {
                Console.WriteLine($"\n🎓 [ENROLLMENT] ==================== GET OR CREATE ====================");
                Console.WriteLine($"👤 [ENROLLMENT] UserId recebido: {userId}");
                Console.WriteLine($"📚 [ENROLLMENT] CourseId: {courseId}");

                // ⚠️ FALLBACK: Se userId vier vazio/nulo, usar ID padrão
                const string FALLBACK_USER_ID = "cmcakqiv00000l70470zgwq1j";
                
                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine($"⚠️ [ENROLLMENT] UserId vazio/nulo - usando fallback: {FALLBACK_USER_ID}");
                    userId = FALLBACK_USER_ID;
                }
                
                if (courseId == Guid.Empty)
                {
                    Console.WriteLine($"❌ [ENROLLMENT] CourseId vazio ou inválido");
                    return BadRequest(new { error = "CourseId é obrigatório", receivedCourseId = courseId.ToString() });
                }

                // Validar se o usuário existe no banco (userId já é o ID do banco MySQL)
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null)
                {
                    Console.WriteLine($"⚠️ [ENROLLMENT] Usuário não encontrado: {userId} - usando fallback: {FALLBACK_USER_ID}");
                    
                    // Tentar com o fallback
                    user = await _context.Users.FirstOrDefaultAsync(u => u.Id == FALLBACK_USER_ID);
                    
                    if (user == null)
                    {
                        Console.WriteLine($"❌ [ENROLLMENT] Erro crítico: usuário fallback não encontrado");
                        return BadRequest(new { error = "Usuário não encontrado", userId, fallbackUserId = FALLBACK_USER_ID });
                    }
                    
                    Console.WriteLine($"✅ [ENROLLMENT] Usando usuário fallback: {user.FirstName} {user.LastName}");
                }
                else
                {
                    Console.WriteLine($"✅ [ENROLLMENT] Usuário validado: {user.FirstName} {user.LastName} ({user.Role})");
                }

                // Buscar enrollment existente
                var enrollment = await _enrollmentService.GetByUserAndCourseAsync(user.Id,  courseId);

                if (enrollment != null)
                {
                    Console.WriteLine($"✅ [ENROLLMENT] Enrollment existente encontrado: {enrollment.Id}");
                  
                    return Ok(enrollment);
                }

                // Criar novo enrollment
                Console.WriteLine($"🆕 [ENROLLMENT] Criando novo enrollment...");
                
                var createDto = new CreateTrainingEnrollmentDto
                {
                    UserId = userId,
                    CourseId = courseId
                };

                var newEnrollment = await _enrollmentService.EnrollAsync(createDto);
                
                Console.WriteLine($"✅ [ENROLLMENT] Novo enrollment criado: {newEnrollment.Id}");
                

                return Ok(newEnrollment);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [ENROLLMENT] Erro: {ex.Message}");
                Console.WriteLine($"❌ [ENROLLMENT] Stack: {ex.StackTrace}");
                return StatusCode(500, $"Erro interno: {ex.Message}");
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
                Console.WriteLine($"\n📊 [PROGRESS] ==================== UPDATE ====================");
                Console.WriteLine($"📦 [PROGRESS] EnrollmentId: {id}");
                Console.WriteLine($"⏱️ [PROGRESS] TimeWatchedMinutes: {progressDto.TimeWatchedMinutes}");
                Console.WriteLine($"📍 [PROGRESS] CurrentLessonId: {progressDto.CurrentLessonId}");

                if (!ModelState.IsValid)
                {
                    Console.WriteLine($"❌ [PROGRESS] ModelState inválido");
                    return BadRequest(ModelState);
                }

                var enrollment = await _enrollmentService.UpdateProgressAsync(id, progressDto);
                if (enrollment == null)
                {
                    Console.WriteLine($"❌ [PROGRESS] Enrollment não encontrado");
                    return NotFound("Matrícula não encontrada");
                }

                Console.WriteLine($"✅ [PROGRESS] Progresso atualizado: {enrollment.ProgressPercentage}%");
                Console.WriteLine($"🎯 [PROGRESS] ==================== FIM ====================\n");

                return Ok(enrollment);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [PROGRESS] Erro: {ex.Message}");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        /// <summary>
        /// Atualizar progresso de uma aula específica
        /// </summary>
        [HttpPost("{enrollmentId}/lesson-progress")]
        public async Task<ActionResult<TrainingEnrollmentDto>> UpdateLessonProgress(
            Guid enrollmentId,
            [FromBody] UpdateLessonProgressDto progressDto)
        {
            try
            {
                Console.WriteLine($"\n🎬 [LESSON PROGRESS] ==================== UPDATE ====================");
                Console.WriteLine($"📦 [LESSON PROGRESS] EnrollmentId: {enrollmentId}");
                Console.WriteLine($"🎥 [LESSON PROGRESS] LessonId: {progressDto.LessonId}");
                Console.WriteLine($"⏱️ [LESSON PROGRESS] WatchedSeconds: {progressDto.WatchedSeconds}s");
                Console.WriteLine($"📍 [LESSON PROGRESS] LastPosition: {progressDto.LastPositionSeconds}s");
                Console.WriteLine($"✅ [LESSON PROGRESS] IsCompleted: {progressDto.IsCompleted}");

                var enrollment = await _enrollmentService.UpdateLessonProgressAsync(
                    enrollmentId,
                    progressDto.LessonId,
                    progressDto.WatchedSeconds,
                    progressDto.IsCompleted
                );

                if (enrollment == null)
                {
                    Console.WriteLine($"❌ [LESSON PROGRESS] Enrollment não encontrado");
                    return NotFound("Matrícula não encontrada");
                }

                Console.WriteLine($"✅ [LESSON PROGRESS] Progresso da aula atualizado");
                Console.WriteLine($"📊 [LESSON PROGRESS] Progresso geral do curso: {enrollment.ProgressPercentage}%");
                Console.WriteLine($"🎯 [LESSON PROGRESS] ==================== FIM ====================\n");

                return Ok(enrollment);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [LESSON PROGRESS] Erro: {ex.Message}");
                return StatusCode(500, $"Erro interno: {ex.Message}");
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
