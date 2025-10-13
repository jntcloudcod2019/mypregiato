using Pregiato.Core.Entities;

namespace Pregiato.Core.Interfaces
{
    public interface ITrainingEnrollmentRepository
    {
        Task<TrainingEnrollment?> GetByIdAsync(Guid id);
        Task<TrainingEnrollment?> GetByUserAndCourseAsync(string userId, Guid courseId);
        Task<IEnumerable<TrainingEnrollment>> GetByUserIdAsync(string userId);
        Task<IEnumerable<TrainingEnrollment>> GetByCourseIdAsync(Guid courseId);
        Task<IEnumerable<TrainingEnrollment>> GetCompletedByUserIdAsync(string userId);
        Task<IEnumerable<TrainingEnrollment>> GetInProgressByUserIdAsync(string userId);
        Task<TrainingEnrollment> AddAsync(TrainingEnrollment enrollment);
        Task<TrainingEnrollment> UpdateAsync(TrainingEnrollment enrollment);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> ExistsAsync(string userId, Guid courseId);
        Task<bool> IsEnrolledAsync(string userId, Guid courseId);
        Task UpdateProgressAsync(Guid enrollmentId, decimal progressPercentage, int completedLessons);
        Task MarkAsCompletedAsync(Guid enrollmentId);
        Task<decimal> GetAverageProgressByCourseAsync(Guid courseId);
        Task<int> GetEnrollmentCountByCourseAsync(Guid courseId);
        Task<int> GetCompletionCountByCourseAsync(Guid courseId);
        Task<IEnumerable<TrainingEnrollment>> GetRecentEnrollmentsAsync(int days = 7);
        Task<Dictionary<Guid, int>> GetEnrollmentStatsByCourseAsync();
        Task<IEnumerable<TrainingEnrollment>> GetEnrollmentsNeedingCertificatesAsync();
    }
}
