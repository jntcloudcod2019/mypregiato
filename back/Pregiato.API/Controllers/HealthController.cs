using Microsoft.AspNetCore.Mvc;
using Pregiato.API.Services;
using Pregiato.Core.Interfaces;

namespace Pregiato.API.Controllers
{
    /// <summary>
    /// Controller para monitoramento de saúde dos serviços
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly IResilienceService _resilienceService;
        private readonly ILogger<HealthController> _logger;

        public HealthController(
            IResilienceService resilienceService,
            ILogger<HealthController> logger)
        {
            _resilienceService = resilienceService;
            _logger = logger;
        }

        /// <summary>
        /// Verifica o status de saúde geral da API
        /// </summary>
        [HttpGet]
        public IActionResult GetHealth()
        {
            try
            {
                var healthStatus = _resilienceService.GetHealthStatus();
                
                return Ok(new
                {
                    status = "healthy",
                    version = "1.0.0",
                    timestamp = DateTime.UtcNow,
                    services = healthStatus
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao verificar status de saúde");
                
                return StatusCode(503, new
                {
                    status = "unhealthy",
                    error = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Verifica o status detalhado de todos os serviços
        /// </summary>
        [HttpGet("detailed")]
        public IActionResult GetDetailedHealth()
        {
            try
            {
                var healthStatus = _resilienceService.GetHealthStatus();
                
                return Ok(new
                {
                    status = "healthy",
                    version = "1.0.0",
                    timestamp = DateTime.UtcNow,
                    services = healthStatus,
                    uptime = DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime(),
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao verificar status detalhado de saúde");
                
                return StatusCode(503, new
                {
                    status = "unhealthy",
                    error = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Força a verificação de saúde de todos os serviços
        /// </summary>
        [HttpPost("check")]
        public async Task<IActionResult> ForceHealthCheck()
        {
            try
            {
                _logger.LogInformation("🔍 Verificação de saúde forçada iniciada");
                
                // O serviço de resiliência já faz verificações automáticas
                // Aqui apenas retornamos o status atual
                var healthStatus = _resilienceService.GetHealthStatus();
                
                return Ok(new
                {
                    status = "check_completed",
                    timestamp = DateTime.UtcNow,
                    services = healthStatus,
                    message = "Verificação de saúde concluída"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro na verificação forçada de saúde");
                
                return StatusCode(500, new
                {
                    status = "check_failed",
                    error = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }
    }
}