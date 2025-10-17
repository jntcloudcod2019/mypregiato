using Microsoft.AspNetCore.Mvc;
using Pregiato.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WebhooksController : ControllerBase
    {
        private readonly PregiatoDbContext _context;
        private readonly ILogger<WebhooksController> _logger;
        private readonly IConfiguration _configuration;

        public WebhooksController(
            PregiatoDbContext context,
            ILogger<WebhooksController> logger,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Webhook do Clerk para sincronizar dados de usuários
        /// Documentação: https://clerk.com/docs/integrations/webhooks/overview
        /// </summary>
        [HttpPost("clerk")]
        public async Task<IActionResult> ClerkWebhook()
        {
            try
            {
                using var reader = new StreamReader(Request.Body);
                var requestBody = await reader.ReadToEndAsync();
                
                _logger.LogInformation($"📥 Webhook Clerk recebido: {requestBody}");

                // Parse do payload
                var webhookEvent = JsonSerializer.Deserialize<JsonElement>(requestBody);
                
                if (!webhookEvent.TryGetProperty("type", out var eventType))
                {
                    _logger.LogWarning("Webhook sem tipo de evento");
                    return BadRequest("Event type is required");
                }

                var type = eventType.GetString();
                _logger.LogInformation($"🔔 Tipo de evento: {type}");

                switch (type)
                {
                    case "user.created":
                        await HandleUserCreated(webhookEvent);
                        break;
                    
                    case "user.updated":
                        await HandleUserUpdated(webhookEvent);
                        break;
                    
                    case "user.deleted":
                        await HandleUserDeleted(webhookEvent);
                        break;
                    
                    default:
                        _logger.LogInformation($"ℹ️ Evento não tratado: {type}");
                        break;
                }

                return Ok(new { received = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao processar webhook do Clerk");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private async Task HandleUserCreated(JsonElement webhookEvent)
        {
            try
            {
                var data = webhookEvent.GetProperty("data");
                var clerkId = data.GetProperty("id").GetString();
                
                var emailAddresses = data.GetProperty("email_addresses");
                var primaryEmailId = data.GetProperty("primary_email_address_id").GetString();
                
                string? email = null;
                foreach (var emailObj in emailAddresses.EnumerateArray())
                {
                    if (emailObj.GetProperty("id").GetString() == primaryEmailId)
                    {
                        email = emailObj.GetProperty("email_address").GetString();
                        break;
                    }
                }

                if (string.IsNullOrEmpty(clerkId) || string.IsNullOrEmpty(email))
                {
                    _logger.LogWarning("❌ ClerkId ou email não encontrado no webhook");
                    return;
                }

                // Buscar usuário pelo email (criado quando convite foi enviado)
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

                if (user != null)
                {
                    // Atualizar ClerkId (usuário aceitou o convite)
                    user.ClerkId = clerkId;
                    user.UpdatedAt = DateTime.UtcNow;
                    
                    // Atualizar nome se fornecido
                    if (data.TryGetProperty("first_name", out var firstName))
                    {
                        var firstNameStr = firstName.GetString();
                        if (!string.IsNullOrEmpty(firstNameStr))
                            user.FirstName = firstNameStr;
                    }
                    
                    if (data.TryGetProperty("last_name", out var lastName))
                    {
                        var lastNameStr = lastName.GetString();
                        if (!string.IsNullOrEmpty(lastNameStr))
                            user.LastName = lastNameStr;
                    }
                    
                    if (data.TryGetProperty("image_url", out var imageUrl))
                    {
                        user.ImageUrl = imageUrl.GetString();
                    }

                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation($"✅ ClerkId atualizado para usuário {email}: {clerkId}");
                }
                else
                {
                    _logger.LogWarning($"⚠️ Usuário com email {email} não encontrado no banco");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao processar user.created");
            }
        }

        private async Task HandleUserUpdated(JsonElement webhookEvent)
        {
            try
            {
                var data = webhookEvent.GetProperty("data");
                var clerkId = data.GetProperty("id").GetString();

                if (string.IsNullOrEmpty(clerkId))
                {
                    _logger.LogWarning("❌ ClerkId não encontrado no webhook");
                    return;
                }

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.ClerkId == clerkId);

                if (user != null)
                {
                    // Atualizar dados do usuário
                    if (data.TryGetProperty("first_name", out var firstName))
                    {
                        var firstNameStr = firstName.GetString();
                        if (!string.IsNullOrEmpty(firstNameStr))
                            user.FirstName = firstNameStr;
                    }
                    
                    if (data.TryGetProperty("last_name", out var lastName))
                    {
                        var lastNameStr = lastName.GetString();
                        if (!string.IsNullOrEmpty(lastNameStr))
                            user.LastName = lastNameStr;
                    }
                    
                    if (data.TryGetProperty("image_url", out var imageUrl))
                    {
                        user.ImageUrl = imageUrl.GetString();
                    }

                    user.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation($"✅ Usuário atualizado via webhook: {clerkId}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao processar user.updated");
            }
        }

        private async Task HandleUserDeleted(JsonElement webhookEvent)
        {
            try
            {
                var data = webhookEvent.GetProperty("data");
                var clerkId = data.GetProperty("id").GetString();

                if (string.IsNullOrEmpty(clerkId))
                {
                    _logger.LogWarning("❌ ClerkId não encontrado no webhook");
                    return;
                }

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.ClerkId == clerkId);

                if (user != null)
                {
                    _context.Users.Remove(user);
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation($"✅ Usuário deletado via webhook: {clerkId}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao processar user.deleted");
            }
        }
    }
}

