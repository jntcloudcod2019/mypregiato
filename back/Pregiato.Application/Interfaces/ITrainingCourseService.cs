using Pregiato.Application.DTOs;

namespace Pregiato.Application.Interfaces
{
    public interface ITrainingCourseService
    {
        Task<TrainingCourseDto?> GetByIdAsync(Guid id);
        Task<TrainingCourseDto?> GetByIdWithEnrollmentsAsync(Guid id);
        Task<IEnumerable<TrainingCourseDto>> GetAllAsync();
        Task<IEnumerable<TrainingCourseDto>> GetByCategoryAsync(string category);
        Task<IEnumerable<TrainingCourseDto>> GetByCreatedByAsync(string createdBy);
        Task<IEnumerable<TrainingCourseDto>> SearchAsync(string searchTerm);
        Task<IEnumerable<TrainingCourseDto>> GetTopRatedAsync(int limit = 10);
        Task<IEnumerable<TrainingCourseDto>> GetMostPopularAsync(int limit = 10);
        Task<TrainingCourseDto> CreateAsync(CreateTrainingCourseDto createDto);
        Task<TrainingCourseDto?> UpdateAsync(Guid id, UpdateTrainingCourseDto updateDto);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> ExistsAsync(Guid id);
        Task<IEnumerable<string>> GetCategoriesAsync();
        Task<Dictionary<string, int>> GetCategoryStatsAsync();
        Task<TrainingCourseDto?> AddRatingAsync(Guid courseId, string userId, string ratingType, int stars = 0, string? comment = null);
        Task<Dictionary<string, object>> GetCourseStatsAsync(Guid courseId);
    }
}
