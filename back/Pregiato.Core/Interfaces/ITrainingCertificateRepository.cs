using Pregiato.Core.Entities;

namespace Pregiato.Core.Interfaces;

/// <summary>
/// Interface para repositório de certificados de treinamento
/// </summary>
public interface ITrainingCertificateRepository
{
    /// <summary>
    /// Criar um novo certificado
    /// </summary>
    Task<TrainingCertificate> CreateAsync(TrainingCertificate certificate);

    /// <summary>
    /// Buscar certificado por ID
    /// </summary>
    Task<TrainingCertificate?> GetByIdAsync(Guid id);

    /// <summary>
    /// Buscar certificado por ID da matrícula
    /// </summary>
    Task<TrainingCertificate?> GetByEnrollmentIdAsync(Guid enrollmentId);

    /// <summary>
    /// Buscar certificado por código de validação
    /// </summary>
    Task<TrainingCertificate?> GetByValidationCodeAsync(string validationCode);

    /// <summary>
    /// Buscar todos os certificados de um usuário
    /// </summary>
    Task<IEnumerable<TrainingCertificate>> GetByUserIdAsync(string userId);

    /// <summary>
    /// Buscar todos os certificados de um curso
    /// </summary>
    Task<IEnumerable<TrainingCertificate>> GetByCourseIdAsync(Guid courseId);

    /// <summary>
    /// Verificar se certificado existe para uma matrícula
    /// </summary>
    Task<bool> ExistsForEnrollmentAsync(Guid enrollmentId);

    /// <summary>
    /// Verificar se código de validação é único
    /// </summary>
    Task<bool> IsValidationCodeUniqueAsync(string validationCode);

    /// <summary>
    /// Atualizar certificado
    /// </summary>
    Task<TrainingCertificate> UpdateAsync(TrainingCertificate certificate);

    /// <summary>
    /// Deletar certificado
    /// </summary>
    Task<bool> DeleteAsync(Guid id);

    /// <summary>
    /// Buscar certificados com paginação
    /// </summary>
    Task<(IEnumerable<TrainingCertificate> certificates, int totalCount)> GetPagedAsync(
        int page, int pageSize, string? search = null, Guid? courseId = null);

    /// <summary>
    /// Contar certificados emitidos
    /// </summary>
    Task<int> GetCertificateCountAsync();

    /// <summary>
    /// Buscar estatísticas de certificados por curso
    /// </summary>
    Task<Dictionary<Guid, int>> GetCertificateStatsByCourseAsync();
}
