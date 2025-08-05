using Microsoft.AspNetCore.Mvc;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { 
                status = "healthy", 
                timestamp = DateTime.UtcNow,
                message = "Pregiato API está funcionando!"
            });
        }
    }
} 