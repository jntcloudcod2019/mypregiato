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
    private readonly IBrowserService _browserService;

    public TrainingCertificateService(
        ITrainingCertificateRepository certificateRepository,
        ITrainingEnrollmentRepository enrollmentRepository,
        ITrainingCourseRepository courseRepository,
        IMediaStoragePort mediaStorage,
        IMapper mapper,
        ILogger<TrainingCertificateService> logger,
        IBrowserService browserService)
    {
        _certificateRepository = certificateRepository;
        _enrollmentRepository = enrollmentRepository;
        _courseRepository = courseRepository;
        _mediaStorage = mediaStorage;
        _mapper = mapper;
        _logger = logger;
        _browserService = browserService;
    }

    public async Task<(TrainingCertificateDto certificate, byte[] pdfBytes)> GenerateCertificateAsync(string userId, string userFullName, string courseName, DateTime completionDate)
    {
        try
        {
            Console.WriteLine($"[CERTIFICATE] 🎓 Iniciando geração de certificado");
            Console.WriteLine($"[CERTIFICATE] 👤 Usuário: {userId}");
            Console.WriteLine($"[CERTIFICATE] 📚 Curso: {courseName}");
            Console.WriteLine($"[CERTIFICATE] 📅 Data: {completionDate:dd/MM/yyyy}");
            
            _logger.LogInformation("Gerando certificado para usuário {UserId} no curso {CourseName}", userId, courseName);

            Console.WriteLine($"[CERTIFICATE] 🔧 Criando objeto de certificado...");
            
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

            Console.WriteLine($"[CERTIFICATE] ✅ Certificado criado: {certificate.CertificateNumber}");
            Console.WriteLine($"[CERTIFICATE] 🔍 Código de validação: {certificate.ValidationCode}");

            Console.WriteLine($"[CERTIFICATE] 🎨 Gerando HTML do certificado...");
            // Gerar HTML do certificado
            certificate.HtmlContent = await GenerateCertificateHtmlAsync(certificate);
            Console.WriteLine($"[CERTIFICATE] ✅ HTML gerado com sucesso (tamanho: {certificate.HtmlContent?.Length ?? 0} caracteres)");

            Console.WriteLine($"[CERTIFICATE] 📄 Iniciando geração do PDF...");
            // Gerar PDF (sem upload para MinIO)
            var pdfBytes = await GeneratePdfFromHtmlAsync(certificate.HtmlContent);
            Console.WriteLine($"[CERTIFICATE] ✅ PDF gerado com sucesso (tamanho: {pdfBytes?.Length ?? 0} bytes)");
            
            Console.WriteLine($"[CERTIFICATE] 💾 Salvando certificado no banco de dados...");
            // Salvar no banco
            var savedCertificate = await _certificateRepository.CreateAsync(certificate);
            Console.WriteLine($"[CERTIFICATE] ✅ Certificado salvo no banco: {savedCertificate.Id}");

            _logger.LogInformation("Certificado gerado com sucesso: {CertificateId}", savedCertificate.Id);

            var certificateDto = _mapper.Map<TrainingCertificateDto>(savedCertificate);
            Console.WriteLine($"[CERTIFICATE] 🎉 Processo concluído com sucesso!");
            
            return (certificateDto, pdfBytes);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CERTIFICATE] ❌ Erro ao gerar certificado: {ex.Message}");
            Console.WriteLine($"[CERTIFICATE] 📋 Stack trace: {ex.StackTrace}");
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
            Console.WriteLine($"[HTML_GENERATION] 🎨 Iniciando geração de HTML");
            Console.WriteLine($"[HTML_GENERATION] 👤 Nome: {certificate.UserFullName}");
            Console.WriteLine($"[HTML_GENERATION] 📚 Curso: {certificate.CourseName}");
            Console.WriteLine($"[HTML_GENERATION] 📅 Data: {certificate.CompletionDate:dd/MM/yyyy}");
            Console.WriteLine($"[HTML_GENERATION] 🔍 Código: {certificate.ValidationCode}");
            
            var templatePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "certificates", "template.html");
            Console.WriteLine($"[HTML_GENERATION] 📁 Caminho do template: {templatePath}");
            Console.WriteLine($"[HTML_GENERATION] 📂 Diretório atual: {Directory.GetCurrentDirectory()}");
            
            if (!File.Exists(templatePath))
            {
                Console.WriteLine($"[HTML_GENERATION] ❌ Template não encontrado: {templatePath}");
                Console.WriteLine($"[HTML_GENERATION] 📂 Verificando diretório wwwroot...");
                var wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                Console.WriteLine($"[HTML_GENERATION] 📂 wwwroot existe: {Directory.Exists(wwwrootPath)}");
                
                if (Directory.Exists(wwwrootPath))
                {
                    var wwwrootContents = Directory.GetDirectories(wwwrootPath);
                    Console.WriteLine($"[HTML_GENERATION] 📂 Conteúdo do wwwroot: {string.Join(", ", wwwrootContents)}");
                }
                
                throw new FileNotFoundException($"Template não encontrado: {templatePath}");
            }

            Console.WriteLine($"[HTML_GENERATION] ✅ Template encontrado, lendo arquivo...");
            var template = await File.ReadAllTextAsync(templatePath, Encoding.UTF8);
            Console.WriteLine($"[HTML_GENERATION] ✅ Template lido: {template.Length} caracteres");

            Console.WriteLine($"[HTML_GENERATION] 🔄 Substituindo placeholders...");
            // Substituir placeholders
            var html = template
                .Replace("{{STUDENT_NAME}}", certificate.UserFullName)
                .Replace("{{COURSE_NAME}}", certificate.CourseName)
                .Replace("{{COMPLETION_DATE}}", certificate.CompletionDate.ToString("dd/MM/yyyy"))
                .Replace("{{VALIDATION_CODE}}", certificate.ValidationCode);

            Console.WriteLine($"[HTML_GENERATION] ✅ HTML gerado: {html.Length} caracteres");
            return html;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[HTML_GENERATION] ❌ Erro ao gerar HTML: {ex.Message}");
            _logger.LogError(ex, "Erro ao gerar HTML do certificado");
            throw;
        }
    }

    private async Task<byte[]> GeneratePdfFromHtmlAsync(string htmlContent)
    {
        try
        {
            Console.WriteLine($"[PDF_GENERATION] 🚀 Iniciando geração de PDF");
            Console.WriteLine($"[PDF_GENERATION] 📏 Tamanho do HTML: {htmlContent?.Length ?? 0} caracteres");
            
            Console.WriteLine($"[PDF_GENERATION] 🌐 Obtendo navegador do BrowserService...");
            var browser = await _browserService.GetBrowserAsync();
            Console.WriteLine($"[PDF_GENERATION] ✅ Navegador obtido com sucesso");

            Console.WriteLine($"[PDF_GENERATION] 📄 Criando nova página...");
            using var page = await browser.NewPageAsync();
            Console.WriteLine($"[PDF_GENERATION] ✅ Página criada");
            
            Console.WriteLine($"[PDF_GENERATION] 📝 Definindo conteúdo HTML...");
            await page.SetContentAsync(htmlContent, new NavigationOptions
            {
                WaitUntil = new[] { WaitUntilNavigation.Networkidle0 }
            });
            Console.WriteLine($"[PDF_GENERATION] ✅ Conteúdo HTML definido");
            
            Console.WriteLine($"[PDF_GENERATION] 🖨️ Gerando PDF em bytes...");
            var pdfBytes = await page.PdfDataAsync(new PdfOptions
            {
                Format = PuppeteerSharp.Media.PaperFormat.A4,
                Landscape = true,
                PrintBackground = true,
                MarginOptions = new PuppeteerSharp.Media.MarginOptions
                {
                    Top = "0",
                    Right = "0",
                    Bottom = "0",
                    Left = "0"
                }
            });
            Console.WriteLine($"[PDF_GENERATION] ✅ PDF gerado: {pdfBytes.Length} bytes");

            Console.WriteLine($"[PDF_GENERATION] 🎉 PDF gerado com sucesso!");
            return pdfBytes;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PDF_GENERATION] ❌ Erro ao gerar PDF: {ex.Message}");
            Console.WriteLine($"[PDF_GENERATION] 📋 Stack trace: {ex.StackTrace}");
            _logger.LogError(ex, "Erro ao gerar PDF do certificado");
            throw;
        }
    }

    #endregion
}
