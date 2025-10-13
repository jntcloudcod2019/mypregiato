# 🎯 REFINAMENTO DE IMPLEMENTAÇÃO - PARTE 2
## Módulo de Treinamentos - Services, Controllers e Frontend

---

<a name="fase-4"></a>
## ⚙️ **FASE 4: SERVICES**

### **4.1 - Training Video Service (MinIO Integration)**

#### **Arquivo: `back/Pregiato.API/Services/TrainingVideoService.cs`**

```csharp
using Microsoft.Extensions.Logging;
using Pregiato.Core.Interfaces;

namespace Pregiato.API.Services;

/// <summary>
/// Service especializado para upload e streaming de vídeos de treinamento
/// </summary>
public class TrainingVideoService
{
    private readonly IMediaStoragePort _mediaStorage;
    private readonly ILogger<TrainingVideoService> _logger;

    public TrainingVideoService(IMediaStoragePort mediaStorage, ILogger<TrainingVideoService> logger)
    {
        _mediaStorage = mediaStorage;
        _logger = logger;
    }

    /// <summary>
    /// Upload de vídeo para MinIO
    /// </summary>
    public async Task<(string VideoUrl, string ObjectName, long Size)> UploadVideoAsync(
        IFormFile videoFile, 
        Guid courseId, 
        Guid lessonId)
    {
        try
        {
            _logger.LogInformation("📹 Iniciando upload de vídeo - Course: {CourseId}, Lesson: {LessonId}, Size: {Size} MB", 
                courseId, lessonId, videoFile.Length / (1024.0 * 1024.0));

            // Converter para Base64 (compatível com IMediaStoragePort)
            using var memoryStream = new MemoryStream();
            await videoFile.CopyToAsync(memoryStream);
            var bytes = memoryStream.ToArray();
            var base64 = Convert.ToBase64String(bytes);

            // Usar nomenclatura específica para treinamentos
            var fileName = $"training_{courseId}_{lessonId}";

            var result = await _mediaStorage.StoreMediaAsync(
                base64Data: base64,
                mimeType: videoFile.ContentType,
                contactNumber: fileName,
                senderName: "training"
            );

            _logger.LogInformation("✅ Upload de vídeo concluído - URL: {Url}", result.MediaUrl);

            return (result.MediaUrl, result.ObjectName, videoFile.Length);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro ao fazer upload de vídeo");
            throw;
        }
    }

    /// <summary>
    /// Download de vídeo do MinIO (para streaming)
    /// </summary>
    public async Task<byte[]> DownloadVideoAsync(string videoUrl)
    {
        try
        {
            return await _mediaStorage.GetMediaAsync(videoUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro ao fazer download de vídeo: {Url}", videoUrl);
            throw;
        }
    }

    /// <summary>
    /// Obter URL pública (signed URL se necessário)
    /// </summary>
    public async Task<string> GetPublicUrlAsync(string videoUrl)
    {
        return await _mediaStorage.GetPublicUrlAsync(videoUrl);
    }
}
```

### **4.2 - Training Course Service**

#### **Arquivo: `back/Pregiato.Application/Services/TrainingCourseService.cs`**

```csharp
using AutoMapper;
using Microsoft.Extensions.Logging;
using Pregiato.Application.DTOs.Training;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;

namespace Pregiato.Application.Services;

public class TrainingCourseService : ITrainingCourseService
{
    private readonly ITrainingCourseRepository _courseRepository;
    private readonly ITrainingEnrollmentRepository _enrollmentRepository;
    private readonly IMediaStoragePort _mediaStorage;
    private readonly IMapper _mapper;
    private readonly ILogger<TrainingCourseService> _logger;

    public TrainingCourseService(
        ITrainingCourseRepository courseRepository,
        ITrainingEnrollmentRepository enrollmentRepository,
        IMediaStoragePort mediaStorage,
        IMapper mapper,
        ILogger<TrainingCourseService> logger)
    {
        _courseRepository = courseRepository;
        _enrollmentRepository = enrollmentRepository;
        _mediaStorage = mediaStorage;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<(List<CourseDto> Items, int Total)> GetCoursesAsync(
        int page,
        int pageSize,
        string? search = null,
        string? category = null,
        string? difficulty = null,
        string? userId = null)
    {
        var (courses, total) = await _courseRepository.GetPaginatedAsync(
            page, pageSize, search, category, difficulty);

        var courseDtos = new List<CourseDto>();

        foreach (var course in courses)
        {
            var dto = _mapper.Map<CourseDto>(course);

            // Se usuário estiver logado, buscar status de enrollment
            if (!string.IsNullOrEmpty(userId))
            {
                var enrollment = await _enrollmentRepository
                    .GetByUserAndCourseAsync(userId, course.Id);

                if (enrollment != null)
                {
                    dto.UserEnrollment = new EnrollmentStatusDto
                    {
                        EnrollmentId = enrollment.Id,
                        ProgressPercentage = enrollment.ProgressPercentage,
                        CompletedLessons = enrollment.CompletedLessons,
                        LastAccessedAt = enrollment.LastAccessedAt,
                        CertificateIssued = enrollment.CertificateIssued
                    };
                }
            }

            courseDtos.Add(dto);
        }

        return (courseDtos, total);
    }

    public async Task<CourseDto?> GetCourseByIdAsync(Guid id, string? userId = null)
    {
        var course = await _courseRepository.GetWithLessonsAsync(id);
        if (course == null) return null;

        var dto = _mapper.Map<CourseDto>(course);

        // Buscar enrollment do usuário
        if (!string.IsNullOrEmpty(userId))
        {
            var enrollment = await _enrollmentRepository
                .GetByUserAndCourseAsync(userId, id);

            if (enrollment != null)
            {
                dto.UserEnrollment = new EnrollmentStatusDto
                {
                    EnrollmentId = enrollment.Id,
                    ProgressPercentage = enrollment.ProgressPercentage,
                    CompletedLessons = enrollment.CompletedLessons,
                    LastAccessedAt = enrollment.LastAccessedAt,
                    CertificateIssued = enrollment.CertificateIssued
                };
            }
        }

        return dto;
    }

    public async Task<CourseDto> CreateCourseAsync(CreateCourseDto dto, string creatorId)
    {
        var course = new TrainingCourse
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            Category = dto.Category,
            Difficulty = dto.Difficulty,
            CreatedBy = creatorId,
            IsActive = true
        };

        // Upload thumbnail se fornecido
        if (dto.ThumbnailFile != null)
        {
            using var stream = new MemoryStream();
            await dto.ThumbnailFile.CopyToAsync(stream);
            var base64 = Convert.ToBase64String(stream.ToArray());

            var result = await _mediaStorage.StoreMediaAsync(
                base64,
                dto.ThumbnailFile.ContentType,
                $"course_{course.Id}_thumbnail",
                "training"
            );

            course.ThumbnailUrl = result.MediaUrl;
            course.ThumbnailObjectName = result.ObjectName;
        }

        var created = await _courseRepository.CreateAsync(course);

        _logger.LogInformation("✅ Curso criado: {CourseId} - {Title}", created.Id, created.Title);

        return _mapper.Map<CourseDto>(created);
    }

    public async Task<CourseDto?> UpdateCourseAsync(Guid id, UpdateCourseDto dto, string userId)
    {
        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null) return null;

        // Verificar permissão (criador ou admin)
        if (course.CreatedBy != userId)
            throw new UnauthorizedAccessException("Apenas o criador pode editar este curso");

        // Atualizar campos
        if (!string.IsNullOrEmpty(dto.Title))
            course.Title = dto.Title;

        if (!string.IsNullOrEmpty(dto.Description))
            course.Description = dto.Description;

        if (dto.Category != null)
            course.Category = dto.Category;

        if (dto.Difficulty != null)
            course.Difficulty = dto.Difficulty;

        if (dto.IsActive.HasValue)
            course.IsActive = dto.IsActive.Value;

        // Upload nova thumbnail se fornecida
        if (dto.ThumbnailFile != null)
        {
            using var stream = new MemoryStream();
            await dto.ThumbnailFile.CopyToAsync(stream);
            var base64 = Convert.ToBase64String(stream.ToArray());

            var result = await _mediaStorage.StoreMediaAsync(
                base64,
                dto.ThumbnailFile.ContentType,
                $"course_{course.Id}_thumbnail",
                "training"
            );

            course.ThumbnailUrl = result.MediaUrl;
            course.ThumbnailObjectName = result.ObjectName;
        }

        var updated = await _courseRepository.UpdateAsync(course);

        _logger.LogInformation("✅ Curso atualizado: {CourseId}", id);

        return _mapper.Map<CourseDto>(updated);
    }

    public async Task<bool> DeleteCourseAsync(Guid id, string userId)
    {
        var course = await _courseRepository.GetByIdAsync(id);
        if (course == null) return false;

        // Verificar permissão
        if (course.CreatedBy != userId)
            throw new UnauthorizedAccessException("Apenas o criador pode deletar este curso");

        var deleted = await _courseRepository.DeleteAsync(id);

        if (deleted)
            _logger.LogInformation("🗑️ Curso deletado: {CourseId}", id);

        return deleted;
    }

    public async Task RecalculateCourseMetadataAsync(Guid courseId)
    {
        var course = await _courseRepository.GetWithLessonsAsync(courseId);
        if (course == null) return;

        // Recalcular total de aulas e duração
        course.TotalLessons = course.Lessons.Count(l => l.IsActive);
        course.TotalDurationMinutes = course.Lessons
            .Where(l => l.IsActive && l.VideoDurationSeconds.HasValue)
            .Sum(l => l.VideoDurationSeconds!.Value / 60);

        // Recalcular avaliações
        course.TotalLikes = course.Ratings.Count(r => r.RatingType == "like");
        course.TotalDislikes = course.Ratings.Count(r => r.RatingType == "dislike");

        if (course.Ratings.Any(r => r.Stars.HasValue))
        {
            course.AverageRating = (decimal)course.Ratings
                .Where(r => r.Stars.HasValue)
                .Average(r => r.Stars!.Value);
        }

        await _courseRepository.UpdateAsync(course);
    }
}
```

### **4.3 - Training Lesson Service**

#### **Arquivo: `back/Pregiato.Application/Services/TrainingLessonService.cs`**

```csharp
using AutoMapper;
using Microsoft.Extensions.Logging;
using Pregiato.Application.DTOs.Training;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;
using Pregiato.API.Services;

namespace Pregiato.Application.Services;

public class TrainingLessonService : ITrainingLessonService
{
    private readonly PregiatoDbContext _context;
    private readonly ITrainingCourseRepository _courseRepository;
    private readonly TrainingVideoService _videoService;
    private readonly IMapper _mapper;
    private readonly ILogger<TrainingLessonService> _logger;

    public TrainingLessonService(
        PregiatoDbContext context,
        ITrainingCourseRepository courseRepository,
        TrainingVideoService videoService,
        IMapper mapper,
        ILogger<TrainingLessonService> logger)
    {
        _context = context;
        _courseRepository = courseRepository;
        _videoService = videoService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<LessonDto> CreateLessonAsync(Guid courseId, CreateLessonDto dto)
    {
        // Verificar se curso existe
        var courseExists = await _courseRepository.ExistsAsync(courseId);
        if (!courseExists)
            throw new ArgumentException("Curso não encontrado");

        var lessonId = Guid.NewGuid();

        // Upload do vídeo para MinIO
        var (videoUrl, objectName, size) = await _videoService.UploadVideoAsync(
            dto.VideoFile, 
            courseId, 
            lessonId);

        var lesson = new TrainingLesson
        {
            Id = lessonId,
            CourseId = courseId,
            Title = dto.Title,
            Description = dto.Description,
            OrderIndex = dto.OrderIndex,
            VideoUrl = videoUrl,
            VideoObjectName = objectName,
            VideoSize = size,
            VideoMimeType = dto.VideoFile.ContentType,
            IsActive = true
        };

        _context.TrainingLessons.Add(lesson);
        await _context.SaveChangesAsync();

        _logger.LogInformation("✅ Aula criada: {LessonId} - {Title}", lesson.Id, lesson.Title);

        return _mapper.Map<LessonDto>(lesson);
    }

    public async Task<LessonDto?> UpdateLessonAsync(Guid id, UpdateLessonDto dto)
    {
        var lesson = await _context.TrainingLessons.FindAsync(id);
        if (lesson == null) return null;

        if (!string.IsNullOrEmpty(dto.Title))
            lesson.Title = dto.Title;

        if (dto.Description != null)
            lesson.Description = dto.Description;

        if (dto.OrderIndex.HasValue)
            lesson.OrderIndex = dto.OrderIndex.Value;

        if (dto.IsActive.HasValue)
            lesson.IsActive = dto.IsActive.Value;

        // Upload novo vídeo se fornecido
        if (dto.VideoFile != null)
        {
            var (videoUrl, objectName, size) = await _videoService.UploadVideoAsync(
                dto.VideoFile,
                lesson.CourseId,
                lesson.Id);

            lesson.VideoUrl = videoUrl;
            lesson.VideoObjectName = objectName;
            lesson.VideoSize = size;
            lesson.VideoMimeType = dto.VideoFile.ContentType;
        }

        lesson.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("✅ Aula atualizada: {LessonId}", id);

        return _mapper.Map<LessonDto>(lesson);
    }
}
```

### **4.4 - Training Enrollment Service**

#### **Arquivo: `back/Pregiato.Application/Services/TrainingEnrollmentService.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Data;

namespace Pregiato.Application.Services;

public class TrainingEnrollmentService : ITrainingEnrollmentService
{
    private readonly PregiatoDbContext _context;
    private readonly ITrainingEnrollmentRepository _enrollmentRepository;
    private readonly ILogger<TrainingEnrollmentService> _logger;

    public TrainingEnrollmentService(
        PregiatoDbContext context,
        ITrainingEnrollmentRepository enrollmentRepository,
        ILogger<TrainingEnrollmentService> logger)
    {
        _context = context;
        _enrollmentRepository = enrollmentRepository;
        _logger = logger;
    }

    public async Task<TrainingEnrollment> EnrollAsync(string userId, Guid courseId)
    {
        // Verificar se já está matriculado
        var existing = await _enrollmentRepository.GetByUserAndCourseAsync(userId, courseId);
        if (existing != null)
            return existing;

        var enrollment = new TrainingEnrollment
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CourseId = courseId,
            EnrolledAt = DateTime.UtcNow
        };

        var created = await _enrollmentRepository.CreateAsync(enrollment);

        _logger.LogInformation("✅ Usuário matriculado - User: {UserId}, Course: {CourseId}", 
            userId, courseId);

        return created;
    }

    public async Task<bool> UpdateProgressAsync(
        Guid enrollmentId,
        Guid lessonId,
        int watchedSeconds,
        int lastPositionSeconds)
    {
        var enrollment = await _enrollmentRepository.GetByIdAsync(enrollmentId);
        if (enrollment == null) return false;

        // Buscar ou criar progresso da aula
        var progress = await _context.TrainingLessonProgress
            .FirstOrDefaultAsync(p => p.EnrollmentId == enrollmentId && p.LessonId == lessonId);

        if (progress == null)
        {
            progress = new TrainingLessonProgress
            {
                Id = Guid.NewGuid(),
                EnrollmentId = enrollmentId,
                LessonId = lessonId,
                StartedAt = DateTime.UtcNow,
                WatchCount = 1
            };
            _context.TrainingLessonProgress.Add(progress);
        }

        progress.WatchedSeconds = watchedSeconds;
        progress.LastPositionSeconds = lastPositionSeconds;
        progress.LastWatchedAt = DateTime.UtcNow;

        // Atualizar último acesso do enrollment
        enrollment.LastAccessedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Recalcular progresso do curso
        await RecalculateEnrollmentProgressAsync(enrollmentId);

        return true;
    }

    public async Task<bool> CompleteLessonAsync(Guid enrollmentId, Guid lessonId)
    {
        var progress = await _context.TrainingLessonProgress
            .FirstOrDefaultAsync(p => p.EnrollmentId == enrollmentId && p.LessonId == lessonId);

        if (progress == null) return false;

        progress.IsCompleted = true;
        progress.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("✅ Aula concluída - Enrollment: {EnrollmentId}, Lesson: {LessonId}",
            enrollmentId, lessonId);

        // Recalcular progresso
        await RecalculateEnrollmentProgressAsync(enrollmentId);

        return true;
    }

    private async Task RecalculateEnrollmentProgressAsync(Guid enrollmentId)
    {
        var enrollment = await _enrollmentRepository.GetByIdAsync(enrollmentId);
        if (enrollment == null) return;

        var totalLessons = enrollment.Course.Lessons.Count(l => l.IsActive);
        var completedLessons = enrollment.LessonProgress.Count(p => p.IsCompleted);

        enrollment.CompletedLessons = completedLessons;
        enrollment.ProgressPercentage = totalLessons > 0 
            ? Math.Round((decimal)completedLessons / totalLessons * 100, 2)
            : 0;

        // Verificar se completou o curso
        if (enrollment.ProgressPercentage >= 100 && enrollment.CompletedAt == null)
        {
            enrollment.CompletedAt = DateTime.UtcNow;
            _logger.LogInformation("🎉 Curso concluído! Enrollment: {EnrollmentId}", enrollmentId);
        }

        await _enrollmentRepository.UpdateAsync(enrollment);
    }
}
```

---

<a name="fase-5"></a>
## 🎮 **FASE 5: CONTROLLERS**

### **5.1 - Training Courses Controller**

#### **Arquivo: `back/Pregiato.API/Controllers/TrainingCoursesController.cs`**

```csharp
using Microsoft.AspNetCore.Mvc;
using Pregiato.Application.DTOs;
using Pregiato.Application.DTOs.Training;
using Pregiato.Application.Interfaces;
using Pregiato.API.Attributes;
using FluentValidation;

namespace Pregiato.API.Controllers;

[ApiController]
[Route("api/training/courses")]
public class TrainingCoursesController : ControllerBase
{
    private readonly ITrainingCourseService _courseService;
    private readonly IValidator<CreateCourseDto> _createValidator;
    private readonly ILogger<TrainingCoursesController> _logger;

    public TrainingCoursesController(
        ITrainingCourseService courseService,
        IValidator<CreateCourseDto> createValidator,
        ILogger<TrainingCoursesController> logger)
    {
        _courseService = courseService;
        _createValidator = createValidator;
        _logger = logger;
    }

    /// <summary>
    /// Lista todos os cursos com paginação e filtros
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResponseDto<CourseDto>>> GetCourses(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] string? difficulty = null)
    {
        try
        {
            var userId = User.FindFirst("clerk_user_id")?.Value;
            
            var (items, total) = await _courseService.GetCoursesAsync(
                page, pageSize, search, category, difficulty, userId);

            var response = new PaginatedResponseDto<CourseDto>
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(total / (double)pageSize)
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar cursos");
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Obtém detalhes de um curso específico
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CourseDto>> GetCourse(Guid id)
    {
        try
        {
            var userId = User.FindFirst("clerk_user_id")?.Value;
            var course = await _courseService.GetCourseByIdAsync(id, userId);

            if (course == null)
                return NotFound(new { error = "Curso não encontrado" });

            return Ok(course);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar curso {Id}", id);
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Cria um novo curso (Admin/Instrutor)
    /// </summary>
    [HttpPost]
    [ClerkAuthorize(Roles = "admin,instructor")]
    public async Task<ActionResult<CourseDto>> CreateCourse([FromForm] CreateCourseDto dto)
    {
        try
        {
            var validation = await _createValidator.ValidateAsync(dto);
            if (!validation.IsValid)
                return BadRequest(new { errors = validation.Errors.Select(e => e.ErrorMessage) });

            var userId = User.FindFirst("clerk_user_id")?.Value!;
            var course = await _courseService.CreateCourseAsync(dto, userId);

            return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, course);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar curso");
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Atualiza um curso existente
    /// </summary>
    [HttpPut("{id}")]
    [ClerkAuthorize]
    public async Task<ActionResult<CourseDto>> UpdateCourse(Guid id, [FromForm] UpdateCourseDto dto)
    {
        try
        {
            var userId = User.FindFirst("clerk_user_id")?.Value!;
            var course = await _courseService.UpdateCourseAsync(id, dto, userId);

            if (course == null)
                return NotFound(new { error = "Curso não encontrado" });

            return Ok(course);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar curso {Id}", id);
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Deleta um curso (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    [ClerkAuthorize(Roles = "admin")]
    public async Task<ActionResult> DeleteCourse(Guid id)
    {
        try
        {
            var userId = User.FindFirst("clerk_user_id")?.Value!;
            var deleted = await _courseService.DeleteCourseAsync(id, userId);

            if (!deleted)
                return NotFound(new { error = "Curso não encontrado" });

            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao deletar curso {Id}", id);
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }
}
```

### **5.2 - Training Lessons Controller**

#### **Arquivo: `back/Pregiato.API/Controllers/TrainingLessonsController.cs`**

```csharp
using Microsoft.AspNetCore.Mvc;
using Pregiato.Application.DTOs.Training;
using Pregiato.Application.Interfaces;
using Pregiato.API.Attributes;
using Pregiato.API.Services;
using FluentValidation;

namespace Pregiato.API.Controllers;

[ApiController]
[Route("api/training/courses/{courseId}/lessons")]
public class TrainingLessonsController : ControllerBase
{
    private readonly ITrainingLessonService _lessonService;
    private readonly TrainingVideoService _videoService;
    private readonly IValidator<CreateLessonDto> _createValidator;
    private readonly ILogger<TrainingLessonsController> _logger;

    public TrainingLessonsController(
        ITrainingLessonService lessonService,
        TrainingVideoService videoService,
        IValidator<CreateLessonDto> createValidator,
        ILogger<TrainingLessonsController> logger)
    {
        _lessonService = lessonService;
        _videoService = videoService;
        _createValidator = createValidator;
        _logger = logger;
    }

    /// <summary>
    /// Cria uma nova aula com upload de vídeo
    /// </summary>
    [HttpPost]
    [ClerkAuthorize(Roles = "admin,instructor")]
    [RequestSizeLimit(500_000_000)] // 500MB
    public async Task<ActionResult<LessonDto>> CreateLesson(
        Guid courseId,
        [FromForm] CreateLessonDto dto)
    {
        try
        {
            var validation = await _createValidator.ValidateAsync(dto);
            if (!validation.IsValid)
                return BadRequest(new { errors = validation.Errors.Select(e => e.ErrorMessage) });

            var lesson = await _lessonService.CreateLessonAsync(courseId, dto);

            return CreatedAtAction("GetLesson", "TrainingLessons", new { id = lesson.Id }, lesson);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar aula no curso {CourseId}", courseId);
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Streaming de vídeo com suporte a Range Requests
    /// </summary>
    [HttpGet("{lessonId}/stream")]
    public async Task<IActionResult> StreamVideo(Guid courseId, Guid lessonId)
    {
        try
        {
            // TODO: Verificar se usuário tem acesso (matriculado ou admin)
            
            var lesson = await _lessonService.GetLessonByIdAsync(lessonId);
            if (lesson == null)
                return NotFound();

            var videoBytes = await _videoService.DownloadVideoAsync(lesson.VideoUrl);
            
            // Suporte a Range Requests para streaming progressivo
            var rangeHeader = Request.Headers["Range"].ToString();
            
            if (!string.IsNullOrEmpty(rangeHeader) && rangeHeader.StartsWith("bytes="))
            {
                var range = rangeHeader.Replace("bytes=", "").Split('-');
                var start = long.Parse(range[0]);
                var end = range.Length > 1 && !string.IsNullOrEmpty(range[1]) 
                    ? long.Parse(range[1]) 
                    : videoBytes.Length - 1;

                var length = end - start + 1;
                var rangeBytes = new byte[length];
                Array.Copy(videoBytes, start, rangeBytes, 0, length);

                Response.Headers.Add("Accept-Ranges", "bytes");
                Response.Headers.Add("Content-Range", $"bytes {start}-{end}/{videoBytes.Length}");
                Response.StatusCode = 206; // Partial Content

                return File(rangeBytes, lesson.VideoMimeType);
            }

            return File(videoBytes, lesson.VideoMimeType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao fazer streaming de vídeo {LessonId}", lessonId);
            return StatusCode(500);
        }
    }
}
```

### **5.3 - Training Enrollments Controller**

#### **Arquivo: `back/Pregiato.API/Controllers/TrainingEnrollmentsController.cs`**

```csharp
using Microsoft.AspNetCore.Mvc;
using Pregiato.Application.DTOs.Training;
using Pregiato.Application.Interfaces;
using Pregiato.API.Attributes;

namespace Pregiato.API.Controllers;

[ApiController]
[Route("api/training/enrollments")]
[ClerkAuthorize]
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

    /// <summary>
    /// Matricular-se em um curso
    /// </summary>
    [HttpPost("{courseId}/enroll")]
    public async Task<ActionResult> EnrollCourse(Guid courseId)
    {
        try
        {
            var userId = User.FindFirst("clerk_user_id")?.Value!;
            var enrollment = await _enrollmentService.EnrollAsync(userId, courseId);

            return Ok(new { enrollmentId = enrollment.Id, message = "Matrícula realizada com sucesso" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao matricular usuário no curso {CourseId}", courseId);
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Atualizar progresso de uma aula
    /// </summary>
    [HttpPost("{enrollmentId}/lessons/{lessonId}/progress")]
    public async Task<ActionResult> UpdateProgress(
        Guid enrollmentId,
        Guid lessonId,
        [FromBody] UpdateProgressDto dto)
    {
        try
        {
            var updated = await _enrollmentService.UpdateProgressAsync(
                enrollmentId,
                lessonId,
                dto.WatchedSeconds,
                dto.LastPositionSeconds);

            if (!updated)
                return NotFound();

            return Ok(new { message = "Progresso atualizado" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao atualizar progresso");
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Marcar aula como concluída
    /// </summary>
    [HttpPost("{enrollmentId}/lessons/{lessonId}/complete")]
    public async Task<ActionResult> CompleteLesson(Guid enrollmentId, Guid lessonId)
    {
        try
        {
            var completed = await _enrollmentService.CompleteLessonAsync(enrollmentId, lessonId);

            if (!completed)
                return NotFound();

            return Ok(new { message = "Aula concluída com sucesso" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao completar aula");
            return StatusCode(500, new { error = "Erro interno do servidor" });
        }
    }
}
```

---

<a name="fase-6"></a>
## 🎨 **FASE 6: FRONTEND INTEGRATION**

### **6.1 - API Client Configuration**

#### **Arquivo: `front/src/services/api-client.ts`**

```typescript
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pregiato-api-production.up.railway.app';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token Clerk
apiClient.interceptors.request.use(async (config) => {
  const { getToken } = useAuth();
  const token = await getToken();
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});
```

### **6.2 - Training Service**

#### **Arquivo: `front/src/services/training-service.ts`**

```typescript
import { apiClient } from './api-client';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  category?: string;
  difficulty?: string;
  isActive: boolean;
  totalLessons: number;
  totalDurationMinutes: number;
  totalLikes: number;
  totalDislikes: number;
  averageRating: number;
  createdBy: string;
  createdAt: string;
  userEnrollment?: {
    enrollmentId: string;
    progressPercentage: number;
    completedLessons: number;
    lastAccessedAt?: string;
    certificateIssued: boolean;
  };
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  videoUrl: string;
  videoSize: number;
  videoDurationSeconds?: number;
  videoMimeType: string;
  isActive: boolean;
  createdAt: string;
  userProgress?: {
    isCompleted: boolean;
    watchedSeconds: number;
    lastPositionSeconds: number;
    lastWatchedAt?: string;
  };
}

export const trainingService = {
  // Cursos
  async getCourses(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    difficulty?: string;
  }) {
    const { data } = await apiClient.get('/training/courses', { params });
    return data;
  },

  async getCourse(id: string) {
    const { data } = await apiClient.get(`/training/courses/${id}`);
    return data;
  },

  async createCourse(formData: FormData) {
    const { data } = await apiClient.post('/training/courses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async updateCourse(id: string, formData: FormData) {
    const { data } = await apiClient.put(`/training/courses/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteCourse(id: string) {
    await apiClient.delete(`/training/courses/${id}`);
  },

  // Aulas
  async createLesson(courseId: string, formData: FormData) {
    const { data } = await apiClient.post(
      `/training/courses/${courseId}/lessons`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
          );
          console.log(`Upload: ${percentCompleted}%`);
        },
      }
    );
    return data;
  },

  getVideoStreamUrl(courseId: string, lessonId: string) {
    return `${apiClient.defaults.baseURL}/training/courses/${courseId}/lessons/${lessonId}/stream`;
  },

  // Matrículas
  async enrollCourse(courseId: string) {
    const { data } = await apiClient.post(
      `/training/enrollments/${courseId}/enroll`
    );
    return data;
  },

  async updateProgress(
    enrollmentId: string,
    lessonId: string,
    dto: { watchedSeconds: number; lastPositionSeconds: number }
  ) {
    const { data } = await apiClient.post(
      `/training/enrollments/${enrollmentId}/lessons/${lessonId}/progress`,
      dto
    );
    return data;
  },

  async completeLesson(enrollmentId: string, lessonId: string) {
    const { data } = await apiClient.post(
      `/training/enrollments/${enrollmentId}/lessons/${lessonId}/complete`
    );
    return data;
  },
};
```

### **6.3 - Video Player Component**

#### **Arquivo: `front/src/components/training/video-player.tsx`**

```typescript
import React, { useRef, useEffect, useState } from 'react';
import { trainingService } from '@/services/training-service';
import { Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  courseId: string;
  lessonId: string;
  enrollmentId: string;
  autoSave?: boolean;
  onProgressUpdate?: (seconds: number) => void;
  onComplete?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  courseId,
  lessonId,
  enrollmentId,
  autoSave = true,
  onProgressUpdate,
  onComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  const streamUrl = trainingService.getVideoStreamUrl(courseId, lessonId);

  // Auto-save progress a cada 10 segundos
  useEffect(() => {
    if (!autoSave) return;

    const interval = setInterval(async () => {
      if (videoRef.current && !videoRef.current.paused) {
        const watchedSeconds = Math.floor(videoRef.current.currentTime);
        
        try {
          await trainingService.updateProgress(enrollmentId, lessonId, {
            watchedSeconds,
            lastPositionSeconds: watchedSeconds,
          });
          onProgressUpdate?.(watchedSeconds);
        } catch (error) {
          console.error('Erro ao salvar progresso:', error);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [enrollmentId, lessonId, autoSave]);

  // Detectar conclusão (85% assistido)
  useEffect(() => {
    if (duration > 0 && currentTime / duration >= 0.85) {
      handleComplete();
    }
  }, [currentTime, duration]);

  const handleComplete = async () => {
    try {
      await trainingService.completeLesson(enrollmentId, lessonId);
      onComplete?.();
    } catch (error) {
      console.error('Erro ao marcar como concluído:', error);
    }
  };

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}
      
      <video
        ref={videoRef}
        src={streamUrl}
        controls
        controlsList="nodownload"
        className="w-full h-full"
        onLoadStart={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
    </div>
  );
};
```

---

## ✅ **CONCLUSÃO**

Este refinamento fornece:

✅ **Entidades completas** com relacionamentos  
✅ **Migration SQL** pronta para aplicar  
✅ **DTOs e Validators** com FluentValidation  
✅ **Repositories** seguindo padrão existente  
✅ **Services** com lógica de negócio  
✅ **Controllers** com autorização Clerk  
✅ **Frontend Services** TypeScript  
✅ **Video Player** com auto-save  
✅ **Upload com progress** para vídeos  
✅ **Streaming com Range Requests**  

**Pronto para implementação!** 🚀

