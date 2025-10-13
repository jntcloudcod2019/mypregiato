using AutoMapper;
using Microsoft.Extensions.Logging;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using System.Text;
using PuppeteerSharp;

namespace Pregiato.Application.Services;

/// <summary>
/// Serviço para gerenciamento de certificados de treinamento
/// </summary>
public class TrainingCertificateService : ITrainingCertificateService
{
    private readonly ITrainingCertificateRepository _certificateRepository;
    private readonly ITrainingEnrollmentRepository _enrollmentRepository;
    private readonly ITrainingCourseRepository _courseRepository;
    private readonly IMediaStoragePort _mediaStorage;
    private readonly IMapper _mapper;
    private readonly ILogger<TrainingCertificateService> _logger;

    public TrainingCertificateService(
        ITrainingCertificateRepository certificateRepository,
        ITrainingEnrollmentRepository enrollmentRepository,
        ITrainingCourseRepository courseRepository,
        IMediaStoragePort mediaStorage,
        IMapper mapper,
        ILogger<TrainingCertificateService> logger)
    {
        _certificateRepository = certificateRepository;
        _enrollmentRepository = enrollmentRepository;
        _courseRepository = courseRepository;
        _mediaStorage = mediaStorage;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<TrainingCertificateDto> GenerateCertificateAsync(string userId, string userFullName, string courseName, DateTime completionDate)
    {
        try
        {
            _logger.LogInformation("Gerando certificado para usuário {UserId} no curso {CourseName}", userId, courseName);

            // Gerar dados do certificado diretamente
            var certificate = new TrainingCertificate
            {
                Id = Guid.NewGuid(),
                EnrollmentId = Guid.Empty, // Não temos enrollment específico
                CourseId = Guid.Empty, // Não temos course ID específico
                UserId = userId,
                CertificateNumber = GenerateCertificateNumber(),
                UserFullName = userFullName,
                CourseName = courseName,
                CompletionDate = completionDate,
                TotalHours = 10, // Valor padrão ou calcular baseado no curso
                ValidationCode = GenerateValidationCode(),
                IsValid = true,
                IssuedAt = DateTime.UtcNow
            };

            // Gerar HTML do certificado
            certificate.HtmlContent = await GenerateCertificateHtmlAsync(certificate);

            // Gerar PDF (sem upload para MinIO)
            var pdfBytes = await GeneratePdfFromHtmlAsync(certificate.HtmlContent);
            
            // Salvar no banco
            var savedCertificate = await _certificateRepository.CreateAsync(certificate);

            _logger.LogInformation("Certificado gerado com sucesso: {CertificateId}", savedCertificate.Id);

            return _mapper.Map<TrainingCertificateDto>(savedCertificate);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao gerar certificado para usuário {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Gerar PDF do certificado para download direto
    /// </summary>
    public async Task<byte[]> GenerateCertificatePdfAsync(Guid certificateId)
    {
        try
        {
            var certificate = await _certificateRepository.GetByIdAsync(certificateId);
            if (certificate == null)
            {
                throw new ArgumentException($"Certificado não encontrado: {certificateId}");
            }

            if (string.IsNullOrEmpty(certificate.HtmlContent))
            {
                throw new InvalidOperationException("Conteúdo HTML do certificado não encontrado");
            }

            var pdfBytes = await GeneratePdfFromHtmlAsync(certificate.HtmlContent);
            return pdfBytes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao gerar PDF do certificado {CertificateId}", certificateId);
            throw;
        }
    }

    public async Task<TrainingCertificateDto?> GetByIdAsync(Guid id)
    {
        var certificate = await _certificateRepository.GetByIdAsync(id);
        return certificate != null ? _mapper.Map<TrainingCertificateDto>(certificate) : null;
    }

    public async Task<CertificateValidationResultDto?> ValidateCertificateAsync(string validationCode)
    {
        var certificate = await _certificateRepository.GetByValidationCodeAsync(validationCode);
        if (certificate == null)
        {
            return new CertificateValidationResultDto
            {
                IsValid = false,
                ErrorMessage = "Código de validação inválido"
            };
        }

        return new CertificateValidationResultDto
        {
            IsValid = certificate.IsValid,
            UserFullName = certificate.UserFullName,
            CourseName = certificate.CourseName,
            CompletionDate = certificate.CompletionDate,
            TotalHours = certificate.TotalHours,
            IssuedAt = certificate.IssuedAt,
            ErrorMessage = certificate.IsValid ? null : "Certificado foi revogado"
        };
    }

    public async Task<IEnumerable<TrainingCertificateDto>> GetByUserIdAsync(string userId)
    {
        var certificates = await _certificateRepository.GetByUserIdAsync(userId);
        return _mapper.Map<IEnumerable<TrainingCertificateDto>>(certificates);
    }

    public async Task<IEnumerable<TrainingCertificateDto>> GetByCourseIdAsync(Guid courseId)
    {
        var certificates = await _certificateRepository.GetByCourseIdAsync(courseId);
        return _mapper.Map<IEnumerable<TrainingCertificateDto>>(certificates);
    }

    public async Task<bool> ExistsForEnrollmentAsync(Guid enrollmentId)
    {
        return await _certificateRepository.ExistsForEnrollmentAsync(enrollmentId);
    }

    public async Task<string?> GetCertificateDownloadUrlAsync(Guid certificateId)
    {
        var certificate = await _certificateRepository.GetByIdAsync(certificateId);
        return certificate?.PdfUrl;
    }

    public async Task<TrainingCertificateDto> RegenerateCertificateAsync(Guid enrollmentId, string userId)
    {
        // Deletar certificado existente se houver
        var existingCertificate = await _certificateRepository.GetByEnrollmentIdAsync(enrollmentId);
        if (existingCertificate != null)
        {
            await _certificateRepository.DeleteAsync(existingCertificate.Id);
        }

        // Gerar novo certificado (precisamos buscar os dados do usuário e curso)
        // TODO: Implementar busca dos dados necessários
        throw new NotImplementedException("Regenerar certificado precisa ser implementado com os dados corretos");
    }

    public async Task<Dictionary<string, object>> GetCertificateStatsAsync()
    {
        var totalCertificates = await _certificateRepository.GetCertificateCountAsync();
        var statsByCourse = await _certificateRepository.GetCertificateStatsByCourseAsync();

        return new Dictionary<string, object>
        {
            { "totalCertificates", totalCertificates },
            { "certificatesByCourse", statsByCourse },
            { "lastUpdated", DateTime.UtcNow }
        };
    }

    #region Private Methods

    private string GenerateCertificateNumber()
    {
        var year = DateTime.UtcNow.Year;
        var month = DateTime.UtcNow.Month.ToString("D2");
        var random = new Random().Next(1000, 9999);
        return $"CERT-{year}{month}-{random}";
    }

    private string GenerateValidationCode()
    {
        var random = new Random();
        var code = new StringBuilder();
        
        // Gerar código no formato: CERT-YYYY-MMDD-XXXX
        var year = DateTime.UtcNow.Year;
        var month = DateTime.UtcNow.Month.ToString("D2");
        var day = DateTime.UtcNow.Day.ToString("D2");
        var suffix = random.Next(1000, 9999);
        
        code.Append($"CERT-{year}-{month}{day}-{suffix}");
        
        return code.ToString();
    }

    private async Task<string> GetUserFullNameAsync(string userId)
    {
        // TODO: Implementar busca do nome do usuário
        // Por enquanto, retornar um nome genérico
        return $"Usuário {userId.Substring(0, Math.Min(8, userId.Length))}";
    }

    private decimal CalculateTotalHours(TrainingCourse course)
    {
        // Calcular horas baseado na duração das aulas
        // Por enquanto, retornar um valor estimado
        return Math.Round(course.TotalLessons * 0.5m, 1); // 30 min por aula em média
    }

    private async Task<string> GenerateCertificateHtmlAsync(TrainingCertificate certificate)
    {
        try
        {
            var templatePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "certificates", "template.html");
            
            if (!File.Exists(templatePath))
            {
                throw new FileNotFoundException($"Template não encontrado: {templatePath}");
            }

            var template = await File.ReadAllTextAsync(templatePath, Encoding.UTF8);

            // Substituir placeholders
            var html = template
                .Replace("{{STUDENT_NAME}}", certificate.UserFullName)
                .Replace("{{COURSE_NAME}}", certificate.CourseName)
                .Replace("{{COMPLETION_DATE}}", certificate.CompletionDate.ToString("dd/MM/yyyy"))
                .Replace("{{VALIDATION_CODE}}", certificate.ValidationCode);

            return html;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao gerar HTML do certificado");
            throw;
        }
    }

    private async Task<byte[]> GeneratePdfFromHtmlAsync(string htmlContent)
    {
        try
        {
            // Baixar Chromium se necessário
            await new BrowserFetcher().DownloadAsync();
            
            using var browser = await Puppeteer.LaunchAsync(new LaunchOptions
            {
                Headless = true,
                Args = new[] { "--no-sandbox", "--disable-setuid-sandbox" }
            });

            using var page = await browser.NewPageAsync();
            
            await page.SetContentAsync(htmlContent);
            
            // Gerar PDF usando caminho temporário
            var tempPath = Path.GetTempFileName() + ".pdf";
            await page.PdfAsync(tempPath);
            var pdfBytes = await File.ReadAllBytesAsync(tempPath);
            File.Delete(tempPath); // Limpar arquivo temporário

            return pdfBytes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao gerar PDF do certificado");
            throw;
        }
    }

    #endregion
}
