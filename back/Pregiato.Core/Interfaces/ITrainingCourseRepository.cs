using Pregiato.Core.Entities;

namespace Pregiato.Core.Interfaces
{
    public interface ITrainingCourseRepository
    {
        Task<TrainingCourse?> GetByIdAsync(Guid id);
        Task<TrainingCourse?> GetByIdWithEnrollmentsAsync(Guid id);
        Task<IEnumerable<TrainingCourse>> GetAllAsync();
        Task<IEnumerable<TrainingCourse>> GetByCategoryAsync(string category);
        Task<IEnumerable<TrainingCourse>> GetByCreatedByAsync(string createdBy);
        Task<IEnumerable<TrainingCourse>> SearchAsync(string searchTerm);
        Task<IEnumerable<TrainingCourse>> GetTopRatedAsync(int limit = 10);
        Task<IEnumerable<TrainingCourse>> GetMostPopularAsync(int limit = 10);
        Task<TrainingCourse> AddAsync(TrainingCourse course);
        Task<TrainingCourse> UpdateAsync(TrainingCourse course);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> ExistsAsync(Guid id);
        Task UpdateRatingStatsAsync(Guid courseId);
        Task<IEnumerable<string>> GetCategoriesAsync();
        Task<Dictionary<string, int>> GetCategoryStatsAsync();
        Task SaveChangesAsync(); // ✅ Método para salvar mudanças rastreadas pelo EF
    }
}
