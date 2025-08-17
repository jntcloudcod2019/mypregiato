namespace Pregiato.Application.DTOs;

public class TalentDto
{
    public Guid Id { get; set; }
    public string? ProducerId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Postalcode { get; set; }
    public string? Street { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? NumberAddress { get; set; }
    public string? Complement { get; set; }
    public string? Uf { get; set; }
    public string? Document { get; set; }
    public DateTime? BirthDate { get; set; }
    public int Age { get; set; }
    public string? Gender { get; set; }
    public bool InviteSent { get; set; }
    public bool Status { get; set; }
    public string DnaStatus { get; set; } = "UNDEFINED";
    public string? InviteToken { get; set; }
    public string? ClerkInviteId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateTalentDto
{
    public string? ProducerId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Postalcode { get; set; }
    public string? Street { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? NumberAddress { get; set; }
    public string? Complement { get; set; }
    public string? Uf { get; set; }
    public string? Document { get; set; }
    public DateTime? BirthDate { get; set; }
    public int Age { get; set; }
    public string? Gender { get; set; }
}

public class UpdateTalentDto
{
    public string? ProducerId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Postalcode { get; set; }
    public string? Street { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? NumberAddress { get; set; }
    public string? Complement { get; set; }
    public string? Uf { get; set; }
    public string? Document { get; set; }
    public DateTime? BirthDate { get; set; }
    public int Age { get; set; }
    public string? Gender { get; set; }
} 