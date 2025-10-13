using Microsoft.AspNetCore.Mvc;
using Pregiato.Application.Interfaces;
using Pregiato.Application.DTOs;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Pregiato.API.Attributes;
using Pregiato.API.Services;
using System.Security.Claims;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
   // [ClerkAuthorize]
    public class UsersController : ControllerBase
    {
        private readonly PregiatoDbContext _context;
        private readonly IClerkAuthService _clerkAuthService;

        public UsersController(PregiatoDbContext context, IClerkAuthService clerkAuthService)
        {
            _context = context;
            _clerkAuthService = clerkAuthService;
        }

        [HttpGet("by-email/{email}")]
        public async Task<ActionResult<UserDto>> GetUserByEmail(string email)
        {
            try
            {
                // Decodificar o email da URL
                var decodedEmail = Uri.UnescapeDataString(email);
                Console.WriteLine($"Email original: {email}");
                Console.WriteLine($"Email decodificado: {decodedEmail}");
                
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == decodedEmail.ToLower());

                if (user == null)
                {
                    return NotFound($"Usuário com email {decodedEmail} não encontrado");
                }

                var userDto = new UserDto
                {
                    Id = user.Id,
                    ClerkId = user.ClerkId,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    ImageUrl = user.ImageUrl,
                    Role = user.Role,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("by-clerk-id/{clerkId}")]
        public async Task<ActionResult<UserDto>> GetUserByClerkId(string clerkId)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.ClerkId == clerkId);

                if (user == null)
                {
                    return NotFound($"Usuário com Clerk ID {clerkId} não encontrado");
                }

                var userDto = new UserDto
                {
                    Id = user.Id,
                    ClerkId = user.ClerkId,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    ImageUrl = user.ImageUrl,
                    Role = user.Role,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("check-admin/{email}")]
        public async Task<ActionResult<bool>> CheckAdminRole(string email)
        {
            try
            {
                var decodedEmail = Uri.UnescapeDataString(email);
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == decodedEmail.ToLower());

                if (user == null)
                {
                    return NotFound($"Usuário com email {decodedEmail} não encontrado");
                }

                return Ok(user.Role == "ADMIN");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("operators")]
        public async Task<ActionResult<List<UserDto>>> GetOperators()
        {
            try
            {
                var operators = await _context.Users
                    .Where(u => u.Role == "OPERATOR")
                    .OrderBy(u => u.FirstName)
                    .ThenBy(u => u.LastName)
                    .Select(u => new UserDto
                    {
                        Id = u.Id,
                        ClerkId = u.ClerkId,
                        Email = u.Email,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        ImageUrl = u.ImageUrl,
                        Role = u.Role,
                        CreatedAt = u.CreatedAt,
                        UpdatedAt = u.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(operators);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            try
            {
                var currentUserId = _clerkAuthService.GetCurrentUserId(User);
                var currentUserEmail = _clerkAuthService.GetCurrentUserEmail(User);
                var currentUserName = _clerkAuthService.GetCurrentUserName(User);

                if (string.IsNullOrEmpty(currentUserEmail))
                {
                    return Unauthorized("Usuário não autenticado");
                }

                // Buscar usuário no banco de dados
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == currentUserEmail.ToLower());

                if (user == null)
                {
                    // Se o usuário não existe no banco, criar um novo
                    var nameParts = currentUserName?.Split(' ') ?? new[] { "Usuário" };
                    var firstName = nameParts[0];
                    var lastName = nameParts.Length > 1 ? string.Join(" ", nameParts.Skip(1)) : "";

                    user = new User
                    {
                        Id = Guid.NewGuid().ToString(),
                        ClerkId = currentUserId ?? Guid.NewGuid().ToString(),
                        Email = currentUserEmail,
                        FirstName = firstName,
                        LastName = lastName,
                        Role = "USER", // Valor padrão para novos usuários
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }

                var userDto = new UserDto
                {
                    Id = user.Id,
                    ClerkId = user.ClerkId,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    ImageUrl = user.ImageUrl,
                    Role = user.Role,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("producers")]
        public async Task<ActionResult<List<UserDto>>> GetProducers()
        {
            try
            {
                var producers = await _context.Users
                    .Where(u => u.Role == "PRODUCER")
                    .OrderBy(u => u.CreatedAt)
                    .ThenBy(u => u.FirstName)
                    .ThenBy(u => u.LastName)
                    .Select(u => new UserDto
                    {
                        Id = u.Id,
                        ClerkId = u.ClerkId,
                        Email = u.Email,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        ImageUrl = u.ImageUrl,
                        Role = u.Role,
                        CreatedAt = u.CreatedAt,
                        UpdatedAt = u.UpdatedAt
                    })
                    .ToListAsync();

                Console.WriteLine($"Produtores encontrados: {producers.Count}");
                foreach (var p in producers)
                {
                    Console.WriteLine($"- {p.FirstName} {p.LastName} ({p.Email})");
                }

                return Ok(producers);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao buscar produtores: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet]
        public async Task<ActionResult<List<UserDto>>> GetAllUsers([FromQuery] string? role = null)
        {
            try
            {
                var query = _context.Users.AsQueryable();

                // Filtrar por role se fornecido
                if (!string.IsNullOrEmpty(role))
                {
                    query = query.Where(u => u.Role == role.ToUpper());
                }

                var users = await query
                    .OrderBy(u => u.CreatedAt)
                    .ThenBy(u => u.FirstName)
                    .Select(u => new UserDto
                    {
                        Id = u.Id,
                        ClerkId = u.ClerkId,
                        Email = u.Email,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        ImageUrl = u.ImageUrl,
                        Role = u.Role,
                        CreatedAt = u.CreatedAt,
                        UpdatedAt = u.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto createUserDto)
        {
            try
            {
                // Verificar se o email já existe
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == createUserDto.Email.ToLower());

                if (existingUser != null)
                {
                    return BadRequest("Já existe um usuário com este email");
                }

                var user = new User
                {
                    Id = Guid.NewGuid().ToString(),
                    ClerkId = createUserDto.ClerkId ?? Guid.NewGuid().ToString(),
                    Email = createUserDto.Email,
                    FirstName = createUserDto.FirstName,
                    LastName = createUserDto.LastName,
                    ImageUrl = createUserDto.ImageUrl,
                    Role = createUserDto.Role.ToUpper(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var userDto = new UserDto
                {
                    Id = user.Id,
                    ClerkId = user.ClerkId,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    ImageUrl = user.ImageUrl,
                    Role = user.Role,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt
                };

                return CreatedAtAction(nameof(GetUserByEmail), new { email = user.Email }, userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> UpdateUser(string id, [FromBody] UpdateUserDto updateUserDto)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound($"Usuário com ID {id} não encontrado");
                }

                // Atualizar campos
                if (!string.IsNullOrEmpty(updateUserDto.FirstName))
                    user.FirstName = updateUserDto.FirstName;

                if (!string.IsNullOrEmpty(updateUserDto.LastName))
                    user.LastName = updateUserDto.LastName;

                if (!string.IsNullOrEmpty(updateUserDto.Email))
                    user.Email = updateUserDto.Email;

                if (!string.IsNullOrEmpty(updateUserDto.Role))
                    user.Role = updateUserDto.Role.ToUpper();

                if (updateUserDto.ImageUrl != null)
                    user.ImageUrl = updateUserDto.ImageUrl;

                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var userDto = new UserDto
                {
                    Id = user.Id,
                    ClerkId = user.ClerkId,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    ImageUrl = user.ImageUrl,
                    Role = user.Role,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteUser(string id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound($"Usuário com ID {id} não encontrado");
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Usuário removido com sucesso" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }
    }
} 