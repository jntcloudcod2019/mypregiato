using Pregiato.Application.DTOs;

namespace Pregiato.Application.Interfaces
{
    public interface ITrainingEnrollmentService
    {
        Task<TrainingEnrollmentDto?> GetByIdAsync(Guid id);
        Task<TrainingEnrollmentDto?> GetByUserAndCourseAsync(string userId, Guid courseId);
        Task<IEnumerable<TrainingEnrollmentDto>> GetByUserIdAsync(string userId);
        Task<IEnumerable<TrainingEnrollmentDto>> GetByCourseIdAsync(Guid courseId);
        Task<IEnumerable<TrainingEnrollmentDto>> GetCompletedByUserIdAsync(string userId);
        Task<IEnumerable<TrainingEnrollmentDto>> GetInProgressByUserIdAsync(string userId);
        Task<TrainingEnrollmentDto> EnrollAsync(CreateTrainingEnrollmentDto createDto);
        Task<TrainingEnrollmentDto?> UpdateProgressAsync(Guid enrollmentId, UpdateTrainingProgressDto progressDto);
        Task<TrainingEnrollmentDto?> UpdateLessonProgressAsync(Guid enrollmentId, Guid lessonId, int timeWatchedSeconds, bool isCompleted);
        Task<TrainingProgressSummaryDto?> GetProgressSummaryAsync(string userId, Guid courseId);
        Task<IEnumerable<TrainingProgressSummaryDto>> GetUserProgressSummaryAsync(string userId);
        Task<bool> MarkAsCompletedAsync(Guid enrollmentId);
        Task<bool> IsEnrolledAsync(string userId, Guid courseId);
        Task<Dictionary<string, object>> GetEnrollmentStatsAsync(Guid courseId);
    }
}
