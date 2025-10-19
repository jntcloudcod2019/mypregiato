using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Pregiato.Infrastructure.Data;

namespace Pregiato.Infrastructure.Repositories
{
    public class TrainingCourseRepository : ITrainingCourseRepository
    {
        private readonly PregiatoDbContext _context;

        public TrainingCourseRepository(PregiatoDbContext context)
        {
            _context = context;
        }

        public async Task<TrainingCourse?> GetByIdAsync(Guid id)
        {
            return await _context.TrainingCourses
                .Include(c => c.Lessons.Where(l => l.IsActive))
                .Include(c => c.Ratings)
                .FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null);
        }

        public async Task<TrainingCourse?> GetByIdWithEnrollmentsAsync(Guid id)
        {
            return await _context.TrainingCourses
                .Include(c => c.Lessons.Where(l => l.IsActive))
                .Include(c => c.Enrollments)
                .Include(c => c.Ratings)
                .FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null);
        }

        public async Task<IEnumerable<TrainingCourse>> GetAllAsync()
        {
            return await _context.TrainingCourses
                .Include(c => c.Lessons.Where(l => l.IsActive))
                .Where(c => c.DeletedAt == null && c.IsActive)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainingCourse>> GetByCategoryAsync(string category)
        {
            return await _context.TrainingCourses
                .Include(c => c.Lessons.Where(l => l.IsActive))
                .Where(c => c.DeletedAt == null && c.IsActive && c.Category == category)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainingCourse>> GetByCreatedByAsync(string createdBy)
        {
            return await _context.TrainingCourses
                .Include(c => c.Lessons.Where(l => l.IsActive))
                .Where(c => c.DeletedAt == null && c.CreatedBy == createdBy)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainingCourse>> SearchAsync(string searchTerm)
        {
            return await _context.TrainingCourses
                .Include(c => c.Lessons.Where(l => l.IsActive))
                .Where(c => c.DeletedAt == null && c.IsActive &&
                    (c.Title.Contains(searchTerm) || 
                     c.Description.Contains(searchTerm) ||
                     c.Category!.Contains(searchTerm)))
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainingCourse>> GetTopRatedAsync(int limit = 10)
        {
            return await _context.TrainingCourses
                .Include(c => c.Lessons.Where(l => l.IsActive))
                .Where(c => c.DeletedAt == null && c.IsActive)
                .OrderByDescending(c => c.AverageRating)
                .ThenByDescending(c => c.TotalLikes)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<IEnumerable<TrainingCourse>> GetMostPopularAsync(int limit = 10)
        {
            return await _context.TrainingCourses
                .Include(c => c.Lessons.Where(l => l.IsActive))
                .Where(c => c.DeletedAt == null && c.IsActive)
                .OrderByDescending(c => c.TotalLikes)
                .ThenByDescending(c => c.AverageRating)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<TrainingCourse> AddAsync(TrainingCourse course)
        {
            Console.WriteLine($"💾 [REPOSITORY] Adicionando curso ao contexto - ID: {course.Id}, Título: {course.Title}");
            Console.WriteLine($"💾 [REPOSITORY] Aulas a serem salvas: {course.Lessons?.Count ?? 0}");
            
            _context.TrainingCourses.Add(course);
            
            // ✅ ADICIONAR AULAS EXPLICITAMENTE AO CONTEXTO
            if (course.Lessons?.Any() == true)
            {
                Console.WriteLine($"📚 [REPOSITORY] Adicionando {course.Lessons.Count} aulas ao contexto");
                foreach (var lesson in course.Lessons)
                {
                    Console.WriteLine($"📝 [REPOSITORY] Adicionando aula - ID: {lesson.Id}, Título: {lesson.Title}, CourseId: {lesson.CourseId}");
                    _context.TrainingLessons.Add(lesson);
                }
            }
            
            Console.WriteLine("💾 [REPOSITORY] Salvando alterações no banco de dados...");
            await _context.SaveChangesAsync();
            
            Console.WriteLine($"✅ [REPOSITORY] Curso salvo com sucesso - ID: {course.Id}");
            return course;
        }

        public async Task<TrainingCourse> UpdateAsync(TrainingCourse course)
        {
            // ✅ NÃO atualizar UpdatedAt manualmente - MySQL faz via trigger ON UPDATE CURRENT_TIMESTAMP
            // course.UpdatedAt = DateTime.UtcNow; // ❌ REMOVIDO para evitar conflito de concorrência
            
            _context.TrainingCourses.Update(course);
            await _context.SaveChangesAsync();
            
            // ✅ Recarregar entidade para obter UpdatedAt gerado pelo banco
            await _context.Entry(course).ReloadAsync();
            
            return course;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var course = await _context.TrainingCourses
                .FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null);

            if (course == null)
                return false;

            course.DeletedAt = DateTime.UtcNow;
            // ✅ NÃO atualizar UpdatedAt manualmente - MySQL faz via trigger
            // course.UpdatedAt = DateTime.UtcNow; // ❌ REMOVIDO
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(Guid id)
        {
            return await _context.TrainingCourses
                .AnyAsync(c => c.Id == id && c.DeletedAt == null);
        }

        public async Task UpdateRatingStatsAsync(Guid courseId)
        {
            var course = await _context.TrainingCourses
                .Include(c => c.Ratings)
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null) return;

            var ratings = course.Ratings.ToList();
            
            course.TotalLikes = ratings.Count(r => r.RatingType == "LIKE");
            course.TotalDislikes = ratings.Count(r => r.RatingType == "DISLIKE");
            
            var starRatings = ratings.Where(r => r.RatingType == "STAR_RATING" && r.Stars > 0).ToList();
            course.AverageRating = starRatings.Any() ? 
                (decimal)starRatings.Average(r => r.Stars) : 0;

            course.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<string>> GetCategoriesAsync()
        {
            return await _context.TrainingCourses
                .Where(c => c.DeletedAt == null && c.IsActive && !string.IsNullOrEmpty(c.Category))
                .Select(c => c.Category!)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();
        }

        public async Task<Dictionary<string, int>> GetCategoryStatsAsync()
        {
            return await _context.TrainingCourses
                .Where(c => c.DeletedAt == null && c.IsActive && !string.IsNullOrEmpty(c.Category))
                .GroupBy(c => c.Category!)
                .Select(g => new { Category = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Category, x => x.Count);
        }

        // ✅ Método para salvar mudanças rastreadas pelo Entity Framework
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
