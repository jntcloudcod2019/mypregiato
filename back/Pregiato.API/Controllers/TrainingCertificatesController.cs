using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.API.Services;
using Pregiato.Infrastructure.Data;

namespace Pregiato.API.Controllers;

/// <summary>
/// Controller para gerenciamento de certificados de treinamento
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TrainingCertificatesController : ControllerBase
{
    private readonly ITrainingCertificateService _certificateService;
    private readonly IClerkAuthService _clerkAuthService;
    private readonly PregiatoDbContext _context;
    private readonly ILogger<TrainingCertificatesController> _logger;

    public TrainingCertificatesController(
        ITrainingCertificateService certificateService,
        IClerkAuthService clerkAuthService,
        PregiatoDbContext context,
        ILogger<TrainingCertificatesController> logger)
    {
        _certificateService = certificateService;
        _clerkAuthService = clerkAuthService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Gerar certificado para um usuário e curso e retornar PDF para download
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> GenerateCertificate([FromBody] GenerateCertificateRequest request)
    {
        try
        {
            Console.WriteLine($"[CONTROLLER] 🎓 Iniciando geração de certificado via API");
            Console.WriteLine($"[CONTROLLER] 📧 Email recebido: {request.UserEmail}");
            Console.WriteLine($"[CONTROLLER] 🆔 Course ID: {request.CourseId}");
            Console.WriteLine($"[CONTROLLER] 📅 Data de conclusão: {request.CompletionDate:dd/MM/yyyy}");
            
            // Decodificar o email da URL
            var decodedEmail = Uri.UnescapeDataString(request.UserEmail);
            Console.WriteLine($"[CONTROLLER] 📧 Email decodificado: {decodedEmail}");
            
            _logger.LogInformation("Gerando certificado para email: {Email} e curso ID: {CourseId}", 
                decodedEmail, request.CourseId);

            Console.WriteLine($"[CONTROLLER] 🔍 Buscando usuário no banco de dados...");
            // Buscar dados do usuário
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == decodedEmail.ToLower());

            if (user == null)
            {
                Console.WriteLine($"[CONTROLLER] ❌ Usuário não encontrado: {decodedEmail}");
                _logger.LogWarning("Usuário com email {Email} não encontrado", decodedEmail);
                return NotFound(new { message = $"Usuário com email {decodedEmail} não encontrado" });
            }

            Console.WriteLine($"[CONTROLLER] ✅ Usuário encontrado: {user.FirstName} {user.LastName} (ID: {user.Id})");

            Console.WriteLine($"[CONTROLLER] 🔍 Buscando curso no banco de dados...");
            // Buscar dados do curso
            var course = await _context.TrainingCourses
                .FirstOrDefaultAsync(c => c.Id == request.CourseId);

            if (course == null)
            {
                Console.WriteLine($"[CONTROLLER] ❌ Curso não encontrado: {request.CourseId}");
                _logger.LogWarning("Curso com ID {CourseId} não encontrado", request.CourseId);
                return NotFound(new { message = $"Curso com ID {request.CourseId} não encontrado" });
            }

            Console.WriteLine($"[CONTROLLER] ✅ Curso encontrado: {course.Title}");

            // Montar nome completo do usuário
            var userFullName = $"{user.FirstName} {user.LastName}".Trim();
            Console.WriteLine($"[CONTROLLER] 👤 Nome completo: {userFullName}");
            
            _logger.LogInformation("Usuário encontrado: {UserFullName} (ID: {UserId}) - Curso: {CourseName}", 
                userFullName, user.Id, course.Title);

            Console.WriteLine($"[CONTROLLER] 🚀 Chamando serviço de geração de certificado...");
            // Gerar certificado com os dados do usuário e curso
            var result = await _certificateService.GenerateCertificateAsync(
                user.Id, 
                userFullName, 
                course.Title, 
                request.CompletionDate);

            Console.WriteLine($"[CONTROLLER] ✅ Certificado gerado com sucesso!");
            Console.WriteLine($"[CONTROLLER] 📄 Tamanho do PDF: {result.pdfBytes.Length} bytes");
            Console.WriteLine($"[CONTROLLER] 🆔 Número do certificado: {result.certificate.CertificateNumber}");

            // Retornar PDF como arquivo para download
            var fileName = $"Certificado_{result.certificate.CertificateNumber}_{userFullName.Replace(" ", "_")}.pdf";
            Console.WriteLine($"[CONTROLLER] 📁 Nome do arquivo: {fileName}");
            Console.WriteLine($"[CONTROLLER] 🎉 Retornando PDF para download...");
            
            return File(result.pdfBytes, "application/pdf", fileName);
        }
        catch (ArgumentException ex)
        {
            Console.WriteLine($"[CONTROLLER] ❌ Erro de validação: {ex.Message}");
            _logger.LogWarning(ex, "Erro de validação ao gerar certificado");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CONTROLLER] ❌ Erro interno: {ex.Message}");
            Console.WriteLine($"[CONTROLLER] 📋 Stack trace: {ex.StackTrace}");
            _logger.LogError(ex, "Erro interno ao gerar certificado");
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Buscar certificado por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TrainingCertificateDto>> GetById(Guid id)
    {
        try
        {
            var certificate = await _certificateService.GetByIdAsync(id);
            if (certificate == null)
            {
                return NotFound(new { message = "Certificado não encontrado" });
            }

            return Ok(certificate);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar certificado {CertificateId}", id);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Validar certificado por código
    /// </summary>
    [HttpPost("validate")]
    public async Task<ActionResult<CertificateValidationResultDto>> ValidateCertificate([FromBody] ValidateCertificateRequest request)
    {
        try
        {
            var result = await _certificateService.ValidateCertificateAsync(request.ValidationCode);
            if (result == null)
            {
                return NotFound(new { message = "Código de validação não encontrado" });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao validar certificado");
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Buscar certificados do usuário atual
    /// </summary>
    [HttpGet("my-certificates")]
    public async Task<ActionResult<IEnumerable<TrainingCertificateDto>>> GetMyCertificates()
    {
        try
        {
            var currentUserId = _clerkAuthService.GetCurrentUserId(User);
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("Usuário não autenticado");
            }

            var certificates = await _certificateService.GetByUserIdAsync(currentUserId);
            return Ok(certificates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar certificados do usuário");
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Buscar certificados de um curso
    /// </summary>
    [HttpGet("course/{courseId}")]
    public async Task<ActionResult<IEnumerable<TrainingCertificateDto>>> GetByCourse(Guid courseId)
    {
        try
        {
            var certificates = await _certificateService.GetByCourseIdAsync(courseId);
            return Ok(certificates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar certificados do curso {CourseId}", courseId);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Download direto do certificado em PDF
    /// </summary>
    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadCertificate(Guid id)
    {
        try
        {
            var pdfBytes = await _certificateService.GenerateCertificatePdfAsync(id);
            
            // Buscar dados do certificado para o nome do arquivo
            var certificate = await _certificateService.GetByIdAsync(id);
            var fileName = certificate != null 
                ? $"certificado-{certificate.UserFullName?.Replace(" ", "-")}-{certificate.CourseName?.Replace(" ", "-")}.pdf"
                : $"certificado-{id}.pdf";

            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Certificado não encontrado: {CertificateId}", id);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao gerar download do certificado {CertificateId}", id);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Regenerar certificado
    /// </summary>
    [HttpPost("{enrollmentId}/regenerate")]
    public async Task<ActionResult<TrainingCertificateDto>> RegenerateCertificate(Guid enrollmentId)
    {
        try
        {
            var currentUserId = _clerkAuthService.GetCurrentUserId(User);
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("Usuário não autenticado");
            }

            _logger.LogInformation("Regenerando certificado para enrollment {EnrollmentId} pelo usuário {UserId}", 
                enrollmentId, currentUserId);

            var certificate = await _certificateService.RegenerateCertificateAsync(enrollmentId, currentUserId);
            
            return Ok(certificate);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Erro de validação ao regenerar certificado");
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Usuário não autorizado para regenerar certificado");
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro interno ao regenerar certificado");
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Verificar se certificado existe para uma matrícula
    /// </summary>
    [HttpGet("enrollment/{enrollmentId}/exists")]
    public async Task<ActionResult<object>> CheckCertificateExists(Guid enrollmentId)
    {
        try
        {
            var exists = await _certificateService.ExistsForEnrollmentAsync(enrollmentId);
            return Ok(new { exists });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao verificar existência de certificado para enrollment {EnrollmentId}", enrollmentId);
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }

    /// <summary>
    /// Obter estatísticas de certificados
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<Dictionary<string, object>>> GetStats()
    {
        try
        {
            var stats = await _certificateService.GetCertificateStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao obter estatísticas de certificados");
            return StatusCode(500, new { message = "Erro interno do servidor" });
        }
    }
}

/// <summary>
/// Request para gerar certificado
/// </summary>
public class GenerateCertificateRequest
{
    public string UserEmail { get; set; } = string.Empty;
    public Guid CourseId { get; set; }
    public DateTime CompletionDate { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Request para validar certificado
/// </summary>
public class ValidateCertificateRequest
{
    public string ValidationCode { get; set; } = string.Empty;
}
