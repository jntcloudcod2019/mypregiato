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
        
        /// <summary>
        /// Envia convite via Clerk (Clerk envia email automaticamente)
        /// </summary>
        Task<ClerkInvitationResult> SendInvitationAsync(SendClerkInvitationRequest request);
        
        /// <summary>
        /// Revoga (cancela) um convite pendente
        /// </summary>
        Task<bool> RevokeInvitationAsync(string invitationId);
        
        /// <summary>
        /// Lista convites pendentes de um email
        /// </summary>
        Task<List<ClerkInvitationInfo>> GetInvitationsByEmailAsync(string email);
    }

    public class SendClerkInvitationRequest
    {
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string RedirectUrl { get; set; } = string.Empty;
    }

    public class ClerkInvitationResult
    {
        public bool Success { get; set; }
        public string? InvitationId { get; set; }
        public string? Status { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class ClerkInvitationInfo
    {
        public string Id { get; set; } = string.Empty;
        public string EmailAddress { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
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

        public async Task<ClerkInvitationResult> SendInvitationAsync(SendClerkInvitationRequest request)
        {
            try
            {
                // ✅ Verificar qual ambiente usar (Test ou Production)
                var clerkEnvironment = _configuration["Clerk:Environment"] ?? "Test";
                Console.WriteLine($"🔧 [CLERK] Ambiente configurado: {clerkEnvironment}");

                string clerkSecretKey;
                string clerkPublishableKey;

                if (clerkEnvironment.Equals("Production", StringComparison.OrdinalIgnoreCase))
                {
                    // Usar chaves de produção
                    clerkSecretKey = _configuration["Clerk:ProductionSecretKey"];
                    clerkPublishableKey = _configuration["Clerk:ProductionPublishableKey"];
                    Console.WriteLine($"🔐 [CLERK] Usando chaves de PRODUÇÃO");
                }
                else
                {
                    // Usar chaves de teste
                    clerkSecretKey = _configuration["Clerk:SecretKey"];
                    clerkPublishableKey = _configuration["Clerk:PublishableKey"];
                    Console.WriteLine($"🔐 [CLERK] Usando chaves de TESTE");
                }

                if (string.IsNullOrEmpty(clerkSecretKey))
                {
                    Console.WriteLine($"❌ [CLERK] Clerk Secret Key não configurada para ambiente {clerkEnvironment}!");
                    return new ClerkInvitationResult 
                    { 
                        Success = false, 
                        ErrorMessage = $"Clerk Secret Key não configurada para ambiente {clerkEnvironment}" 
                    };
                }

                Console.WriteLine($"✅ [CLERK] Secret Key encontrada (length: {clerkSecretKey.Length}, prefix: {clerkSecretKey.Substring(0, Math.Min(7, clerkSecretKey.Length))})");

                // ✅ ID da Organização Pregiato
                const string ORGANIZATION_ID = "org_30i5ExFclW4l6UNqp8F9ZzOfQ4D";
                Console.WriteLine($"🏢 [CLERK] Organization ID: {ORGANIZATION_ID}");

                // Configurar HttpClient com autenticação
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {clerkSecretKey}");

                // 📧 Clerk Organization Invitations API Payload
                var payload = new
                {
                    email_address = request.Email,                 // obrigatório
                    role = $"org:{request.Role.ToLower()}",       // role da organização (ex: org:admin, org:member)
                    public_metadata = new 
                    { 
                        firstName = request.FirstName,
                        lastName = request.LastName,
                        originalRole = request.Role
                    },
                    redirect_url = request.RedirectUrl,            // URL após aceitar convite
                    notify = true,                                 // Clerk envia email automaticamente
                    ignore_existing = false                        // Não ignorar se já existir
                };

                var jsonContent = JsonSerializer.Serialize(payload);
                Console.WriteLine($"📦 [CLERK] Payload JSON: {jsonContent}");

                var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

                // ✅ Clerk Organization Invitations API
                var apiUrl = $"https://api.clerk.com/v1/organizations/{ORGANIZATION_ID}/invitations";
                Console.WriteLine($"🌐 [CLERK] Enviando request para: {apiUrl}");
                var response = await _httpClient.PostAsync(apiUrl, content);
                
                Console.WriteLine($"📊 [CLERK] Status Code: {(int)response.StatusCode} ({response.StatusCode})");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"❌ [CLERK] Erro Response: {errorContent}");
                    _logger.LogError($"Erro ao enviar convite pelo Clerk: {errorContent}");
                    
                    return new ClerkInvitationResult 
                    { 
                        Success = false, 
                        ErrorMessage = $"Clerk API error: {errorContent}" 
                    };
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"✅ [CLERK] Success Response: {responseContent}");

                var invitation = JsonSerializer.Deserialize<JsonElement>(responseContent);
                
                var invitationId = invitation.GetProperty("id").GetString();
                var status = invitation.GetProperty("status").GetString();

                Console.WriteLine($"🎉 [CLERK] Convite criado com sucesso!");
                Console.WriteLine($"🆔 [CLERK] Invitation ID: {invitationId}");
                Console.WriteLine($"📊 [CLERK] Status: {status}");
                Console.WriteLine($"🎯 [CLERK] ==================== FIM ====================\n");

                _logger.LogInformation($"Convite enviado com sucesso: {invitationId}");

                return new ClerkInvitationResult
                {
                    Success = true,
                    InvitationId = invitationId,
                    Status = status
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [CLERK] Exception: {ex.Message}");
                Console.WriteLine($"❌ [CLERK] Stack: {ex.StackTrace}");
                _logger.LogError(ex, "Exceção ao enviar convite pelo Clerk");
                return new ClerkInvitationResult 
                { 
                    Success = false, 
                    ErrorMessage = ex.Message 
                };
            }
        }

        public async Task<bool> RevokeInvitationAsync(string invitationId)
        {
            try
            {
                var clerkSecretKey = _configuration["Clerk:SecretKey"];
                if (string.IsNullOrEmpty(clerkSecretKey))
                {
                    _logger.LogWarning("Clerk Secret Key não configurada");
                    return false;
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {clerkSecretKey}");

                // DELETE /v1/invitations/{invitation_id}
                var response = await _httpClient.DeleteAsync($"https://api.clerk.com/v1/invitations/{invitationId}");
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Erro ao revogar convite {invitationId}: {errorContent}");
                    return false;
                }

                _logger.LogInformation($"Convite {invitationId} revogado com sucesso");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Exceção ao revogar convite {invitationId}");
                return false;
            }
        }

        public async Task<List<ClerkInvitationInfo>> GetInvitationsByEmailAsync(string email)
        {
            try
            {
                var clerkSecretKey = _configuration["Clerk:SecretKey"];
                if (string.IsNullOrEmpty(clerkSecretKey))
                {
                    _logger.LogWarning("Clerk Secret Key não configurada");
                    return new List<ClerkInvitationInfo>();
                }

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {clerkSecretKey}");

                // GET /v1/invitations?status=pending
                var response = await _httpClient.GetAsync("https://api.clerk.com/v1/invitations?status=pending");
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Erro ao buscar convites: {errorContent}");
                    return new List<ClerkInvitationInfo>();
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var invitations = JsonSerializer.Deserialize<JsonElement>(responseContent);
                
                var result = new List<ClerkInvitationInfo>();
                
                if (invitations.TryGetProperty("data", out var data))
                {
                    foreach (var invitation in data.EnumerateArray())
                    {
                        var invitationEmail = invitation.GetProperty("email_address").GetString();
                        
                        // Filtrar por email
                        if (invitationEmail?.ToLower() == email.ToLower())
                        {
                            var info = new ClerkInvitationInfo
                            {
                                Id = invitation.GetProperty("id").GetString() ?? "",
                                EmailAddress = invitationEmail ?? "",
                                Status = invitation.GetProperty("status").GetString() ?? "",
                                CreatedAt = DateTime.UnixEpoch.AddMilliseconds(invitation.GetProperty("created_at").GetInt64())
                            };
                            
                            if (invitation.TryGetProperty("expires_at", out var expiresAt))
                            {
                                info.ExpiresAt = DateTime.UnixEpoch.AddMilliseconds(expiresAt.GetInt64());
                            }
                            
                            result.Add(info);
                        }
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exceção ao buscar convites");
                return new List<ClerkInvitationInfo>();
            }
        }
    }
}
