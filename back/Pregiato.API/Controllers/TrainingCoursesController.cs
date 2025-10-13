using Microsoft.AspNetCore.Mvc;
using Pregiato.API.Attributes;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [ClerkAuthorize]
    public class TrainingCoursesController : ControllerBase
    {
        private readonly ITrainingCourseService _courseService;
        private readonly ILogger<TrainingCoursesController> _logger;

        public TrainingCoursesController(
            ITrainingCourseService courseService,
            ILogger<TrainingCoursesController> logger)
        {
            _courseService = courseService;
            _logger = logger;
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
                    return BadRequest(ModelState);

                var course = await _courseService.CreateAsync(createDto);
                return CreatedAtAction(nameof(GetById), new { id = course.Id }, course);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar curso");
                return StatusCode(500, "Erro interno do servidor");
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
            [FromBody] CreateTrainingRatingDto ratingDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // TODO: Obter userId do token JWT do Clerk
                var userId = "temp-user-id"; // Substituir pela autenticação real

                var course = await _courseService.AddRatingAsync(
                    id, 
                    userId, 
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
                return StatusCode(500, "Erro interno do servidor");
            }
        }
    }
}
