using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System.Text.Json;

namespace Pregiato.API.Services
{
    public interface IClerkAuthService
    {
        Task<bool> ValidateTokenAsync(string token);
        Task<string?> GetUserIdFromTokenAsync(string token);
        Task<string?> GetUserEmailFromTokenAsync(string token);
        Task<string?> GetUserNameFromTokenAsync(string token);
        bool IsAuthenticated(ClaimsPrincipal user);
        string? GetCurrentUserId(ClaimsPrincipal user);
        string? GetCurrentUserEmail(ClaimsPrincipal user);
        string? GetCurrentUserName(ClaimsPrincipal user);
    }

    public class ClerkAuthService : IClerkAuthService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ClerkAuthService> _logger;
        private readonly HttpClient _httpClient;

        public ClerkAuthService(
            IConfiguration configuration,
            ILogger<ClerkAuthService> logger,
            HttpClient httpClient)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task<bool> ValidateTokenAsync(string token)
        {
            try
            {
                var clerkSecretKey = _configuration["Clerk:SecretKey"];
                if (string.IsNullOrEmpty(clerkSecretKey))
                {
                    _logger.LogWarning("Clerk Secret Key não configurada");
                    return false;
                }

                // Para uma validação mais robusta, você pode fazer uma chamada para a API do Clerk
                // Por enquanto, vamos apenas verificar se o token não está vazio
                return !string.IsNullOrEmpty(token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao validar token do Clerk");
                return false;
            }
        }

        public async Task<string?> GetUserIdFromTokenAsync(string token)
        {
            try
            {
                var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                var jsonToken = handler.ReadJwtToken(token);

                var subClaim = jsonToken.Claims.FirstOrDefault(c => c.Type == "sub");
                return subClaim?.Value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao extrair User ID do token");
                return null;
            }
        }

        public async Task<string?> GetUserEmailFromTokenAsync(string token)
        {
            try
            {
                var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                var jsonToken = handler.ReadJwtToken(token);

                var emailClaim = jsonToken.Claims.FirstOrDefault(c => c.Type == "email");
                return emailClaim?.Value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao extrair email do token");
                return null;
            }
        }

        public async Task<string?> GetUserNameFromTokenAsync(string token)
        {
            try
            {
                var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                var jsonToken = handler.ReadJwtToken(token);

                var nameClaim = jsonToken.Claims.FirstOrDefault(c => c.Type == "name");
                return nameClaim?.Value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao extrair nome do token");
                return null;
            }
        }

        public bool IsAuthenticated(ClaimsPrincipal user)
        {
            return user?.Identity?.IsAuthenticated == true;
        }

        public string? GetCurrentUserId(ClaimsPrincipal user)
        {
            return user?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? user?.FindFirst("ClerkId")?.Value;
        }

        public string? GetCurrentUserEmail(ClaimsPrincipal user)
        {
            return user?.FindFirst(ClaimTypes.Email)?.Value;
        }

        public string? GetCurrentUserName(ClaimsPrincipal user)
        {
            return user?.FindFirst(ClaimTypes.Name)?.Value;
        }
    }
}
