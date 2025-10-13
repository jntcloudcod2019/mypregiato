using System.ComponentModel.DataAnnotations;

namespace Pregiato.Application.DTOs
{
    public class TrainingRatingDto
    {
        public Guid Id { get; set; }
        public Guid CourseId { get; set; }
        public string UserId { get; set; } = string.Empty;
        
        [MaxLength(50)]
        public string RatingType { get; set; } = string.Empty; // "LIKE", "DISLIKE", "STAR_RATING"
        
        public int Stars { get; set; } // 1-5 para star rating
        public string? Comment { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // Navegação
        public TrainingCourseDto? Course { get; set; }
    }

    public class CreateTrainingRatingDto
    {
        [Required]
        public Guid CourseId { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string RatingType { get; set; } = string.Empty;
        
        [Range(1, 5)]
        public int Stars { get; set; }
        
        [MaxLength(1000)]
        public string? Comment { get; set; }
    }

    public class UpdateTrainingRatingDto
    {
        [Range(1, 5)]
        public int Stars { get; set; }
        
        [MaxLength(1000)]
        public string? Comment { get; set; }
    }

    public class TrainingRatingSummaryDto
    {
        public Guid CourseId { get; set; }
        public int TotalLikes { get; set; }
        public int TotalDislikes { get; set; }
        public decimal AverageStars { get; set; }
        public int TotalStarRatings { get; set; }
        public int TotalComments { get; set; }
        
        public List<TrainingRatingDto>? RecentComments { get; set; }
    }
}
