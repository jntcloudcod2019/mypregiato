using System.ComponentModel.DataAnnotations;

namespace Pregiato.Application.DTOs;

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string ClerkId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateUserDto
{
    public string ClerkId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string Role { get; set; } = string.Empty;
}

public class UpdateUserDto
{
   
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? ImageUrl { get; set; }
    public string? Role { get; set; }
}

/// <summary>
/// DTO para envio de convite via Clerk Invitations
/// </summary>
public class SendUserInvitationDto
{
    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Nome é obrigatório")]
    [StringLength(191, ErrorMessage = "Nome não pode exceder 191 caracteres")]
    public string FirstName { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Sobrenome é obrigatório")]
    [StringLength(191, ErrorMessage = "Sobrenome não pode exceder 191 caracteres")]
    public string LastName { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Role é obrigatória")]
    
    public string Role { get; set; } = string.Empty;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
} 