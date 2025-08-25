using Microsoft.AspNetCore.Mvc;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { 
                status = "OK", 
                timestamp = DateTime.UtcNow,
                version = "1.0.0"
            });
        }
    }
}
