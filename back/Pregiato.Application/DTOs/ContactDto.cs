namespace Pregiato.Application.DTOs
{
    public class ContactDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? OriginCRM { get; set; }
        public string? Tags { get; set; }
        public string? BusinessName { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateContactDto
    {
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? OriginCRM { get; set; }
        public string? Tags { get; set; }
        public string? BusinessName { get; set; }
    }

    public class UpdateContactDto
    {
        public string? Name { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? OriginCRM { get; set; }
        public string? Tags { get; set; }
        public string? BusinessName { get; set; }
        public bool? IsActive { get; set; }
    }
} 