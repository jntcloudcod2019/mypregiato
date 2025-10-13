using AutoMapper;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;

namespace Pregiato.Application.Services
{
    public class TrainingCourseService : ITrainingCourseService
    {
        private readonly ITrainingCourseRepository _courseRepository;
        private readonly ITrainingEnrollmentRepository _enrollmentRepository;
        private readonly IMapper _mapper;

        public TrainingCourseService(
            ITrainingCourseRepository courseRepository,
            ITrainingEnrollmentRepository enrollmentRepository,
            IMapper mapper)
        {
            _courseRepository = courseRepository;
            _enrollmentRepository = enrollmentRepository;
            _mapper = mapper;
        }

        public async Task<TrainingCourseDto?> GetByIdAsync(Guid id)
        {
            var course = await _courseRepository.GetByIdAsync(id);
            return course != null ? _mapper.Map<TrainingCourseDto>(course) : null;
        }

        public async Task<TrainingCourseDto?> GetByIdWithEnrollmentsAsync(Guid id)
        {
            var course = await _courseRepository.GetByIdWithEnrollmentsAsync(id);
            return course != null ? _mapper.Map<TrainingCourseDto>(course) : null;
        }

        public async Task<IEnumerable<TrainingCourseDto>> GetAllAsync()
        {
            var courses = await _courseRepository.GetAllAsync();
            return _mapper.Map<IEnumerable<TrainingCourseDto>>(courses);
        }

        public async Task<IEnumerable<TrainingCourseDto>> GetByCategoryAsync(string category)
        {
            var courses = await _courseRepository.GetByCategoryAsync(category);
            return _mapper.Map<IEnumerable<TrainingCourseDto>>(courses);
        }

        public async Task<IEnumerable<TrainingCourseDto>> GetByCreatedByAsync(string createdBy)
        {
            var courses = await _courseRepository.GetByCreatedByAsync(createdBy);
            return _mapper.Map<IEnumerable<TrainingCourseDto>>(courses);
        }

        public async Task<IEnumerable<TrainingCourseDto>> SearchAsync(string searchTerm)
        {
            var courses = await _courseRepository.SearchAsync(searchTerm);
            return _mapper.Map<IEnumerable<TrainingCourseDto>>(courses);
        }

        public async Task<IEnumerable<TrainingCourseDto>> GetTopRatedAsync(int limit = 10)
        {
            var courses = await _courseRepository.GetTopRatedAsync(limit);
            return _mapper.Map<IEnumerable<TrainingCourseDto>>(courses);
        }

        public async Task<IEnumerable<TrainingCourseDto>> GetMostPopularAsync(int limit = 10)
        {
            var courses = await _courseRepository.GetMostPopularAsync(limit);
            return _mapper.Map<IEnumerable<TrainingCourseDto>>(courses);
        }

        public async Task<TrainingCourseDto> CreateAsync(CreateTrainingCourseDto createDto)
        {
            var course = _mapper.Map<TrainingCourse>(createDto);
            course.Id = Guid.NewGuid();
            course.CreatedAt = DateTime.UtcNow;
            course.UpdatedAt = DateTime.UtcNow;
            course.TotalLessons = createDto.Lessons?.Count ?? 0;
            course.TotalLikes = 0;
            course.TotalDislikes = 0;
            course.AverageRating = 0;

            // Adicionar as aulas se fornecidas
            if (createDto.Lessons != null && createDto.Lessons.Any())
            {
                foreach (var lessonDto in createDto.Lessons)
                {
                    var lesson = _mapper.Map<TrainingLesson>(lessonDto);
                    lesson.Id = Guid.NewGuid();
                    lesson.CourseId = course.Id;
                    lesson.CreatedAt = DateTime.UtcNow;
                    lesson.UpdatedAt = DateTime.UtcNow;
                    course.Lessons.Add(lesson);
                }
            }

            var createdCourse = await _courseRepository.AddAsync(course);
            return _mapper.Map<TrainingCourseDto>(createdCourse);
        }

        public async Task<TrainingCourseDto?> UpdateAsync(Guid id, UpdateTrainingCourseDto updateDto)
        {
            var course = await _courseRepository.GetByIdAsync(id);
            if (course == null) return null;

            _mapper.Map(updateDto, course);
            course.UpdatedAt = DateTime.UtcNow;

            var updatedCourse = await _courseRepository.UpdateAsync(course);
            return _mapper.Map<TrainingCourseDto>(updatedCourse);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            return await _courseRepository.DeleteAsync(id);
        }

        public async Task<bool> ExistsAsync(Guid id)
        {
            return await _courseRepository.ExistsAsync(id);
        }

        public async Task<IEnumerable<string>> GetCategoriesAsync()
        {
            return await _courseRepository.GetCategoriesAsync();
        }

        public async Task<Dictionary<string, int>> GetCategoryStatsAsync()
        {
            return await _courseRepository.GetCategoryStatsAsync();
        }

        public async Task<TrainingCourseDto?> AddRatingAsync(Guid courseId, string userId, string ratingType, int stars = 0, string? comment = null)
        {
            var course = await _courseRepository.GetByIdAsync(courseId);
            if (course == null) return null;

            // Verificar se o usuário já avaliou
            var existingRating = course.Ratings.FirstOrDefault(r => r.UserId == userId && r.RatingType == ratingType);
            
            if (existingRating != null)
            {
                // Atualizar avaliação existente
                existingRating.Stars = stars;
                existingRating.Comment = comment;
                existingRating.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Criar nova avaliação
                var newRating = new TrainingRating
                {
                    Id = Guid.NewGuid(),
                    CourseId = courseId,
                    UserId = userId,
                    RatingType = ratingType,
                    Stars = stars,
                    Comment = comment,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                course.Ratings.Add(newRating);
            }

            await _courseRepository.UpdateAsync(course);
            await _courseRepository.UpdateRatingStatsAsync(courseId);

            return await GetByIdAsync(courseId);
        }

        public async Task<Dictionary<string, object>> GetCourseStatsAsync(Guid courseId)
        {
            var course = await _courseRepository.GetByIdAsync(courseId);
            if (course == null) return new Dictionary<string, object>();

            var enrollmentCount = await _enrollmentRepository.GetEnrollmentCountByCourseAsync(courseId);
            var completionCount = await _enrollmentRepository.GetCompletionCountByCourseAsync(courseId);
            var averageProgress = await _enrollmentRepository.GetAverageProgressByCourseAsync(courseId);

            return new Dictionary<string, object>
            {
                { "enrollmentCount", enrollmentCount },
                { "completionCount", completionCount },
                { "completionRate", enrollmentCount > 0 ? (double)completionCount / enrollmentCount * 100 : 0 },
                { "averageProgress", averageProgress },
                { "totalLikes", course.TotalLikes },
                { "totalDislikes", course.TotalDislikes },
                { "averageRating", course.AverageRating },
                { "totalLessons", course.TotalLessons }
            };
        }
    }
}
