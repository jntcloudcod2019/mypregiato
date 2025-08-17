using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;
using System.Text.Json;

namespace Pregiato.API.Middleware
{
    public class ClerkAuthenticationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ClerkAuthenticationMiddleware> _logger;
        private readonly HttpClient _httpClient;

        public ClerkAuthenticationMiddleware(
            RequestDelegate next,
            IConfiguration configuration,
            ILogger<ClerkAuthenticationMiddleware> logger,
            HttpClient httpClient)
        {
            _next = next;
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                var token = ExtractTokenFromHeader(context.Request);
                
                if (!string.IsNullOrEmpty(token))
                {
                    var claims = await ValidateClerkToken(token);
                    if (claims != null)
                    {
                        var identity = new ClaimsIdentity(claims, "Clerk");
                        context.User = new ClaimsPrincipal(identity);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro durante autenticação do Clerk");
            }

            await _next(context);
        }

        private string? ExtractTokenFromHeader(HttpRequest request)
        {
            var authHeader = request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return null;
            }

            return authHeader.Substring("Bearer ".Length);
        }

        private async Task<List<Claim>?> ValidateClerkToken(string token)
        {
            try
            {
                var clerkSecretKey = _configuration["Clerk:SecretKey"];
                if (string.IsNullOrEmpty(clerkSecretKey))
                {
                    _logger.LogWarning("Clerk Secret Key não configurada");
                    return null;
                }

                // Decodificar o token JWT para extrair claims
                var handler = new JwtSecurityTokenHandler();
                var jsonToken = handler.ReadJwtToken(token);

                var claims = new List<Claim>();

                // Extrair claims básicas
                if (jsonToken.Claims.Any(c => c.Type == "sub"))
                {
                    claims.Add(new Claim(ClaimTypes.NameIdentifier, jsonToken.Claims.First(c => c.Type == "sub").Value));
                }

                if (jsonToken.Claims.Any(c => c.Type == "email"))
                {
                    claims.Add(new Claim(ClaimTypes.Email, jsonToken.Claims.First(c => c.Type == "email").Value));
                }

                if (jsonToken.Claims.Any(c => c.Type == "name"))
                {
                    claims.Add(new Claim(ClaimTypes.Name, jsonToken.Claims.First(c => c.Type == "name").Value));
                }

                // Adicionar claim personalizada para Clerk ID
                if (jsonToken.Claims.Any(c => c.Type == "sub"))
                {
                    claims.Add(new Claim("ClerkId", jsonToken.Claims.First(c => c.Type == "sub").Value));
                }

                return claims;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao validar token do Clerk");
                return null;
            }
        }
    }

    public static class ClerkAuthenticationMiddlewareExtensions
    {
        public static IApplicationBuilder UseClerkAuthentication(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ClerkAuthenticationMiddleware>();
        }
    }
}
