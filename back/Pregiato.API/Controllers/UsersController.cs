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
    [ClerkAuthorize] // Requer autenticação para todos os endpoints
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
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

                if (user == null)
                {
                    return NotFound($"Usuário com email {email} não encontrado");
                }

                var userDto = new UserDto
                {
                    Id = user.Id.ToString(),
                    Email = user.Email,
                    Name = user.Name,
                    Role = user.Role ?? "USER",
                    IsActive = user.IsActive
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
                // Por enquanto, vamos simular a busca por Clerk ID
                // Em uma implementação real, você teria uma tabela de mapeamento
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.Contains("@") && u.IsActive);

                if (user == null)
                {
                    return NotFound($"Usuário com Clerk ID {clerkId} não encontrado");
                }

                var userDto = new UserDto
                {
                    Id = user.Id.ToString(),
                    Email = user.Email,
                    Name = user.Name,
                    Role = user.Role ?? "USER",
                    IsActive = user.IsActive
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("check-admin/{email}")]
        public async Task<ActionResult<bool>> CheckIfUserIsAdmin(string email)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

                if (user == null)
                {
                    return NotFound($"Usuário com email {email} não encontrado");
                }

                var isAdmin = user.Role?.ToUpper() == "ADMIN";
                return Ok(isAdmin);
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
                    user = new User
                    {
                        Email = currentUserEmail,
                        Name = currentUserName ?? "Usuário",
                        Role = "USER",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }

                var userDto = new UserDto
                {
                    Id = user.Id.ToString(),
                    Email = user.Email,
                    Name = user.Name,
                    Role = user.Role ?? "USER",
                    IsActive = user.IsActive
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }
    }
} 