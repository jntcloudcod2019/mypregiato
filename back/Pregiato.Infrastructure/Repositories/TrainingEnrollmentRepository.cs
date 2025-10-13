using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Data;

namespace Pregiato.Infrastructure.Repositories
{
    public class TrainingEnrollmentRepository : ITrainingEnrollmentRepository
    {
        private readonly PregiatoDbContext _context;

        public TrainingEnrollmentRepository(PregiatoDbContext context)
        {
            _context = context;
        }

        public async Task<TrainingEnrollment?> GetByIdAsync(Guid id)
        {
            return await _context.TrainingEnrollments
                .Include(e => e.Course)
                .Include(e => e.LessonProgress)
                .Include(e => e.Certificates)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<TrainingEnrollment?> GetByUserAndCourseAsync(string userId, Guid courseId)
        {
            return await _context.TrainingEnrollments
                .Include(e => e.Course)
                .Include(e => e.LessonProgress)
                .Include(e => e.Certificates)
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);
        }

        public async Task<IEnumerable<TrainingEnrollment>> GetByUserIdAsync(string userId)
        {
            return await _context.TrainingEnrollments
                .Include(e => e.Course)
                .Include(e => e.LessonProgress)
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.EnrolledAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainingEnrollment>> GetByCourseIdAsync(Guid courseId)
        {
            return await _context.TrainingEnrollments
                .Include(e => e.Course)
                .Include(e => e.LessonProgress)
                .Where(e => e.CourseId == courseId)
                .OrderByDescending(e => e.EnrolledAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainingEnrollment>> GetCompletedByUserIdAsync(string userId)
        {
            return await _context.TrainingEnrollments
                .Include(e => e.Course)
                .Include(e => e.LessonProgress)
                .Where(e => e.UserId == userId && e.CompletedAt.HasValue)
                .OrderByDescending(e => e.CompletedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainingEnrollment>> GetInProgressByUserIdAsync(string userId)
        {
            return await _context.TrainingEnrollments
                .Include(e => e.Course)
                .Include(e => e.LessonProgress)
                .Where(e => e.UserId == userId && 
                           e.CompletedAt == null && 
                           e.ProgressPercentage > 0)
                .OrderByDescending(e => e.LastAccessedAt)
                .ToListAsync();
        }

        public async Task<TrainingEnrollment> AddAsync(TrainingEnrollment enrollment)
        {
            _context.TrainingEnrollments.Add(enrollment);
            await _context.SaveChangesAsync();
            return enrollment;
        }

        public async Task<TrainingEnrollment> UpdateAsync(TrainingEnrollment enrollment)
        {
            _context.TrainingEnrollments.Update(enrollment);
            await _context.SaveChangesAsync();
            return enrollment;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var enrollment = await _context.TrainingEnrollments
                .FirstOrDefaultAsync(e => e.Id == id);

            if (enrollment == null)
                return false;

            _context.TrainingEnrollments.Remove(enrollment);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(string userId, Guid courseId)
        {
            return await _context.TrainingEnrollments
                .AnyAsync(e => e.UserId == userId && e.CourseId == courseId);
        }

        public async Task<bool> IsEnrolledAsync(string userId, Guid courseId)
        {
            return await _context.TrainingEnrollments
                .AnyAsync(e => e.UserId == userId && e.CourseId == courseId);
        }

        public async Task UpdateProgressAsync(Guid enrollmentId, decimal progressPercentage, int completedLessons)
        {
            var enrollment = await _context.TrainingEnrollments
                .FirstOrDefaultAsync(e => e.Id == enrollmentId);

            if (enrollment == null) return;

            enrollment.ProgressPercentage = progressPercentage;
            enrollment.CompletedLessons = completedLessons;
            enrollment.LastAccessedAt = DateTime.UtcNow;

            if (progressPercentage >= 100 && !enrollment.CompletedAt.HasValue)
            {
                enrollment.CompletedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        public async Task MarkAsCompletedAsync(Guid enrollmentId)
        {
            var enrollment = await _context.TrainingEnrollments
                .FirstOrDefaultAsync(e => e.Id == enrollmentId);

            if (enrollment == null) return;

            enrollment.CompletedAt = DateTime.UtcNow;
            enrollment.ProgressPercentage = 100;

            await _context.SaveChangesAsync();
        }

        public async Task<decimal> GetAverageProgressByCourseAsync(Guid courseId)
        {
            var enrollments = await _context.TrainingEnrollments
                .Where(e => e.CourseId == courseId)
                .Select(e => e.ProgressPercentage)
                .ToListAsync();

            return enrollments.Any() ? enrollments.Average() : 0;
        }

        public async Task<int> GetEnrollmentCountByCourseAsync(Guid courseId)
        {
            return await _context.TrainingEnrollments
                .CountAsync(e => e.CourseId == courseId);
        }

        public async Task<int> GetCompletionCountByCourseAsync(Guid courseId)
        {
            return await _context.TrainingEnrollments
                .CountAsync(e => e.CourseId == courseId && e.CompletedAt.HasValue);
        }

        public async Task<IEnumerable<TrainingEnrollment>> GetRecentEnrollmentsAsync(int days = 7)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-days);
            
            return await _context.TrainingEnrollments
                .Include(e => e.Course)
                .Where(e => e.EnrolledAt >= cutoffDate)
                .OrderByDescending(e => e.EnrolledAt)
                .ToListAsync();
        }

        public async Task<Dictionary<Guid, int>> GetEnrollmentStatsByCourseAsync()
        {
            return await _context.TrainingEnrollments
                .GroupBy(e => e.CourseId)
                .Select(g => new { CourseId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CourseId, x => x.Count);
        }

        public async Task<IEnumerable<TrainingEnrollment>> GetEnrollmentsNeedingCertificatesAsync()
        {
            return await _context.TrainingEnrollments
                .Include(e => e.Course)
                .Where(e => e.CompletedAt.HasValue && 
                           !e.CertificateIssued && 
                           !e.Certificates.Any())
                .ToListAsync();
        }

        public async Task UpdateCertificateInfoAsync(Guid enrollmentId, string certificateUrl, string certificateObjectName, DateTime issuedAt)
        {
            var enrollment = await _context.TrainingEnrollments.FindAsync(enrollmentId);
            if (enrollment != null)
            {
                enrollment.CertificateIssued = true;
                enrollment.CertificateIssuedAt = issuedAt;
                enrollment.CertificateUrl = certificateUrl;
                enrollment.CertificateObjectName = certificateObjectName;
                
                await _context.SaveChangesAsync();
            }
        }
    }
}
