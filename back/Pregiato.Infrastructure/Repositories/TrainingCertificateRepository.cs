using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Data;

namespace Pregiato.Infrastructure.Repositories;

/// <summary>
/// Repositório para certificados de treinamento
/// </summary>
public class TrainingCertificateRepository : ITrainingCertificateRepository
{
    private readonly PregiatoDbContext _context;

    public TrainingCertificateRepository(PregiatoDbContext context)
    {
        _context = context;
    }

    public async Task<TrainingCertificate> CreateAsync(TrainingCertificate certificate)
    {
        _context.TrainingCertificates.Add(certificate);
        await _context.SaveChangesAsync();
        return certificate;
    }

    public async Task<TrainingCertificate?> GetByIdAsync(Guid id)
    {
        return await _context.TrainingCertificates
            .Include(c => c.Enrollment)
            .ThenInclude(e => e.Course)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<TrainingCertificate?> GetByEnrollmentIdAsync(Guid enrollmentId)
    {
        return await _context.TrainingCertificates
            .Include(c => c.Enrollment)
            .ThenInclude(e => e.Course)
            .FirstOrDefaultAsync(c => c.EnrollmentId == enrollmentId);
    }

    public async Task<TrainingCertificate?> GetByValidationCodeAsync(string validationCode)
    {
        return await _context.TrainingCertificates
            .Include(c => c.Enrollment)
            .ThenInclude(e => e.Course)
            .FirstOrDefaultAsync(c => c.ValidationCode == validationCode);
    }

    public async Task<IEnumerable<TrainingCertificate>> GetByUserIdAsync(string userId)
    {
        return await _context.TrainingCertificates
            .Include(c => c.Enrollment)
            .ThenInclude(e => e.Course)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.IssuedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<TrainingCertificate>> GetByCourseIdAsync(Guid courseId)
    {
        return await _context.TrainingCertificates
            .Include(c => c.Enrollment)
            .ThenInclude(e => e.Course)
            .Where(c => c.CourseId == courseId)
            .OrderByDescending(c => c.IssuedAt)
            .ToListAsync();
    }

    public async Task<bool> ExistsForEnrollmentAsync(Guid enrollmentId)
    {
        return await _context.TrainingCertificates
            .AnyAsync(c => c.EnrollmentId == enrollmentId);
    }

    public async Task<bool> IsValidationCodeUniqueAsync(string validationCode)
    {
        return !await _context.TrainingCertificates
            .AnyAsync(c => c.ValidationCode == validationCode);
    }

    public async Task<TrainingCertificate> UpdateAsync(TrainingCertificate certificate)
    {
        _context.TrainingCertificates.Update(certificate);
        await _context.SaveChangesAsync();
        return certificate;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var certificate = await _context.TrainingCertificates.FindAsync(id);
        if (certificate == null) return false;

        _context.TrainingCertificates.Remove(certificate);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<(IEnumerable<TrainingCertificate> certificates, int totalCount)> GetPagedAsync(
        int page, int pageSize, string? search = null, Guid? courseId = null)
    {
        var query = _context.TrainingCertificates
            .Include(c => c.Enrollment)
            .ThenInclude(e => e.Course)
            .AsQueryable();

        // Aplicar filtros
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(c => 
                c.UserFullName.Contains(search) ||
                c.CourseName.Contains(search) ||
                c.CertificateNumber.Contains(search));
        }

        if (courseId.HasValue)
        {
            query = query.Where(c => c.CourseId == courseId.Value);
        }

        // Contar total
        var totalCount = await query.CountAsync();

        // Aplicar paginação
        var certificates = await query
            .OrderByDescending(c => c.IssuedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (certificates, totalCount);
    }

    public async Task<int> GetCertificateCountAsync()
    {
        return await _context.TrainingCertificates.CountAsync();
    }

    public async Task<Dictionary<Guid, int>> GetCertificateStatsByCourseAsync()
    {
        return await _context.TrainingCertificates
            .GroupBy(c => c.CourseId)
            .Select(g => new { CourseId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CourseId, x => x.Count);
    }
}
