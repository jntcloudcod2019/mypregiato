namespace Pregiato.Application.DTOs;

public class TalentDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int Age { get; set; }
    public string? Document { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Instagram { get; set; }
    public string? TikTok { get; set; }
    public string? YouTube { get; set; }
    public string? OtherSocialMedia { get; set; }
    public string? Height { get; set; }
    public string? Weight { get; set; }
    public string? Bust { get; set; }
    public string? Waist { get; set; }
    public string? Hip { get; set; }
    public string? ShoeSize { get; set; }
    public string? HairColor { get; set; }
    public string? EyeColor { get; set; }
    public string? SkinTone { get; set; }
    public string? Ethnicity { get; set; }
    public string? Nationality { get; set; }
    public string? Languages { get; set; }
    public string? Skills { get; set; }
    public string? Experience { get; set; }
    public string? Availability { get; set; }
    public string? TravelAvailability { get; set; }
    public string? Rate { get; set; }
    public string? Notes { get; set; }
    public bool Status { get; set; }
    public bool InviteSent { get; set; }
    public string? DnaStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateTalentDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int Age { get; set; }
    public string? Document { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Instagram { get; set; }
    public string? TikTok { get; set; }
    public string? YouTube { get; set; }
    public string? OtherSocialMedia { get; set; }
    public string? Height { get; set; }
    public string? Weight { get; set; }
    public string? Bust { get; set; }
    public string? Waist { get; set; }
    public string? Hip { get; set; }
    public string? ShoeSize { get; set; }
    public string? HairColor { get; set; }
    public string? EyeColor { get; set; }
    public string? SkinTone { get; set; }
    public string? Ethnicity { get; set; }
    public string? Nationality { get; set; }
    public string? Languages { get; set; }
    public string? Skills { get; set; }
    public string? Experience { get; set; }
    public string? Availability { get; set; }
    public string? TravelAvailability { get; set; }
    public string? Rate { get; set; }
    public string? Notes { get; set; }
}

public class UpdateTalentDto
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public int? Age { get; set; }
    public string? Document { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Instagram { get; set; }
    public string? TikTok { get; set; }
    public string? YouTube { get; set; }
    public string? OtherSocialMedia { get; set; }
    public string? Height { get; set; }
    public string? Weight { get; set; }
    public string? Bust { get; set; }
    public string? Waist { get; set; }
    public string? Hip { get; set; }
    public string? ShoeSize { get; set; }
    public string? HairColor { get; set; }
    public string? EyeColor { get; set; }
    public string? SkinTone { get; set; }
    public string? Ethnicity { get; set; }
    public string? Nationality { get; set; }
    public string? Languages { get; set; }
    public string? Skills { get; set; }
    public string? Experience { get; set; }
    public string? Availability { get; set; }
    public string? TravelAvailability { get; set; }
    public string? Rate { get; set; }
    public string? Notes { get; set; }
    public bool? Status { get; set; }
    public bool? InviteSent { get; set; }
    public string? DnaStatus { get; set; }
} 