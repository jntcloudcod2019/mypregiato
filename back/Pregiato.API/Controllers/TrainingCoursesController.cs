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
    public class TrainingCoursesController : ControllerBase
    {
        private readonly ITrainingCourseService _courseService;
        private readonly ILogger<TrainingCoursesController> _logger;
        private readonly PregiatoDbContext _context;

        public TrainingCoursesController(
            ITrainingCourseService courseService,
            ILogger<TrainingCoursesController> logger,
            PregiatoDbContext context)
        {
            _courseService = courseService;
            _logger = logger;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TrainingCourseDto>>> GetAll(
            [FromQuery] string? category = null,
            [FromQuery] string? search = null,
            [FromQuery] int limit = 50)
        {
            try
            {
                IEnumerable<TrainingCourseDto> courses;

                if (!string.IsNullOrEmpty(search))
                {
                    courses = await _courseService.SearchAsync(search);
                }
                else if (!string.IsNullOrEmpty(category))
                {
                    courses = await _courseService.GetByCategoryAsync(category);
                }
                else
                {
                    courses = await _courseService.GetAllAsync();
                }

                return Ok(courses.Take(limit));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar cursos");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TrainingCourseDto>> GetById(Guid id)
        {
            try
            {
                var course = await _courseService.GetByIdAsync(id);
                if (course == null)
                    return NotFound("Curso não encontrado");

                return Ok(course);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar curso {CourseId}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("{id}/with-enrollments")]
        public async Task<ActionResult<TrainingCourseDto>> GetByIdWithEnrollments(Guid id)
        {
            try
            {
                var course = await _courseService.GetByIdWithEnrollmentsAsync(id);
                if (course == null)
                    return NotFound("Curso não encontrado");

                return Ok(course);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar curso com matrículas {CourseId}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("top-rated")]
        public async Task<ActionResult<IEnumerable<TrainingCourseDto>>> GetTopRated([FromQuery] int limit = 10)
        {
            try
            {
                var courses = await _courseService.GetTopRatedAsync(limit);
                return Ok(courses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar cursos mais bem avaliados");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("most-popular")]
        public async Task<ActionResult<IEnumerable<TrainingCourseDto>>> GetMostPopular([FromQuery] int limit = 10)
        {
            try
            {
                var courses = await _courseService.GetMostPopularAsync(limit);
                return Ok(courses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar cursos mais populares");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories()
        {
            try
            {
                var categories = await _courseService.GetCategoriesAsync();
                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar categorias");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("category-stats")]
        public async Task<ActionResult<Dictionary<string, int>>> GetCategoryStats()
        {
            try
            {
                var stats = await _courseService.GetCategoryStatsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar estatísticas de categorias");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("{id}/stats")]
        public async Task<ActionResult<Dictionary<string, object>>> GetCourseStats(Guid id)
        {
            try
            {
                var stats = await _courseService.GetCourseStatsAsync(id);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar estatísticas do curso {CourseId}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpPost]
        public async Task<ActionResult<TrainingCourseDto>> Create([FromBody] CreateTrainingCourseDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors.Select(e => new { Field = x.Key, Message = e.ErrorMessage }))
                        .ToList();
                    
                    _logger.LogWarning("Validação falhou ao criar curso: {Errors}", string.Join(", ", errors.Select(e => $"{e.Field}: {e.Message}")));
                    return BadRequest(new { 
                        message = "Dados inválidos", 
                        errors = errors 
                    });
                }

                _logger.LogInformation("Criando curso: {Title} com {LessonCount} aulas", createDto.Title, createDto.Lessons?.Count ?? 0);
                
                var course = await _courseService.CreateAsync(createDto);
                
                _logger.LogInformation("Curso criado com sucesso: {CourseId} - {Title}", course.Id, course.Title);
                
                // Retornar status 201 com mensagem específica
                return StatusCode(201, new { 
                    course = course,
                    message = $"Curso {course.Title} criado com sucesso"
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Argumento inválido ao criar curso: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Operação inválida ao criar curso: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao criar curso: {Message}", ex.Message);
                return StatusCode(500, new { 
                    message = "Erro interno do servidor",
                    details = ex.Message
                });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TrainingCourseDto>> Update(Guid id, [FromBody] UpdateTrainingCourseDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var course = await _courseService.UpdateAsync(id, updateDto);
                if (course == null)
                    return NotFound("Curso não encontrado");

                return Ok(course);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar curso {CourseId}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            try
            {
                var deleted = await _courseService.DeleteAsync(id);
                if (!deleted)
                    return NotFound("Curso não encontrado");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao deletar curso {CourseId}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpPost("{id}/rating")]
        public async Task<ActionResult<TrainingCourseDto>> AddRating(
            Guid id,
            [FromBody] CreateTrainingRatingDto ratingDto,
            [FromQuery] string userEmail)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (string.IsNullOrEmpty(userEmail))
                    return BadRequest("Email do usuário é obrigatório");

                // Buscar usuário pelo email
                var decodedEmail = Uri.UnescapeDataString(userEmail);
                _logger.LogInformation($"Buscando usuário com email: {decodedEmail}");
                
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == decodedEmail.ToLower());

                if (user == null)
                {
                    _logger.LogWarning($"Usuário com email {decodedEmail} não encontrado");
                    return NotFound($"Usuário com email {decodedEmail} não encontrado");
                }

                _logger.LogInformation($"Usuário encontrado: {user.FirstName} {user.LastName} (ID: {user.Id})");

                var course = await _courseService.AddRatingAsync(
                    id, 
                    user.Id.ToString(), 
                    ratingDto.RatingType, 
                    ratingDto.Stars, 
                    ratingDto.Comment);

                if (course == null)
                    return NotFound("Curso não encontrado");

                return Ok(course);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao adicionar avaliação ao curso {CourseId}", id);
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }
    }
}
