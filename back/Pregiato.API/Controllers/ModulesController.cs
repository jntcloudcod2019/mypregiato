using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/modules")] 
    public class ModulesController : ControllerBase
    {
        private readonly PregiatoDbContext _db;
        public ModulesController(PregiatoDbContext db) { _db = db; }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? module, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var q = _db.Set<ModuleRecord>().AsQueryable();
            if (!string.IsNullOrWhiteSpace(module)) q = q.Where(x => x.ModuleSlug == module);
            var total = await q.CountAsync();
            var items = await q.OrderByDescending(x => x.UpdatedAtUtc).Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
            return Ok(new { items, total });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var rec = await _db.Set<ModuleRecord>().FindAsync(id);
            return rec == null ? NotFound() : Ok(rec);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ModuleRecord record)
        {
            record.Id = Guid.NewGuid();
            record.CreatedAtUtc = DateTime.UtcNow;
            record.UpdatedAtUtc = DateTime.UtcNow;
            _db.Add(record);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = record.Id }, record);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ModuleRecord record)
        {
            var rec = await _db.Set<ModuleRecord>().FindAsync(id);
            if (rec == null) return NotFound();
            rec.ModuleSlug = record.ModuleSlug;
            rec.Title = record.Title;
            rec.Status = record.Status;
            rec.Tags = record.Tags;
            rec.PayloadJson = record.PayloadJson;
            rec.UpdatedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(rec);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var rec = await _db.Set<ModuleRecord>().FindAsync(id);
            if (rec == null) return NotFound();
            _db.Remove(rec);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}


