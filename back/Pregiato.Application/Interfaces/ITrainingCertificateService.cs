using Pregiato.Application.DTOs;
using Pregiato.Core.Entities;

namespace Pregiato.Application.Interfaces;

/// <summary>
/// Interface para serviço de certificados de treinamento
/// </summary>
public interface ITrainingCertificateService
{
    /// <summary>
    /// Gerar certificado com dados diretos do usuário e curso
    /// </summary>
    Task<TrainingCertificateDto> GenerateCertificateAsync(string userId, string userFullName, string courseName, DateTime completionDate);

    /// <summary>
    /// Gerar PDF do certificado para download direto
    /// </summary>
    Task<byte[]> GenerateCertificatePdfAsync(Guid certificateId);

    /// <summary>
    /// Buscar certificado por ID
    /// </summary>
    Task<TrainingCertificateDto?> GetByIdAsync(Guid id);

    /// <summary>
    /// Buscar certificado por código de validação
    /// </summary>
    Task<CertificateValidationResultDto?> ValidateCertificateAsync(string validationCode);

    /// <summary>
    /// Buscar certificados de um usuário
    /// </summary>
    Task<IEnumerable<TrainingCertificateDto>> GetByUserIdAsync(string userId);

    /// <summary>
    /// Buscar certificados de um curso
    /// </summary>
    Task<IEnumerable<TrainingCertificateDto>> GetByCourseIdAsync(Guid courseId);

    /// <summary>
    /// Verificar se certificado existe para uma matrícula
    /// </summary>
    Task<bool> ExistsForEnrollmentAsync(Guid enrollmentId);

    /// <summary>
    /// Obter URL de download do certificado
    /// </summary>
    Task<string?> GetCertificateDownloadUrlAsync(Guid certificateId);

    /// <summary>
    /// Regenerar certificado (se necessário)
    /// </summary>
    Task<TrainingCertificateDto> RegenerateCertificateAsync(Guid enrollmentId, string userId);

    /// <summary>
    /// Obter estatísticas de certificados
    /// </summary>
    Task<Dictionary<string, object>> GetCertificateStatsAsync();
}
