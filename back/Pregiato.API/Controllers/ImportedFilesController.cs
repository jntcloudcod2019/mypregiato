using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using System.Text.Json;

namespace Pregiato.API.Controllers
{
    [ApiController]
    [Route("api/imports")]
    public class ImportedFilesController : ControllerBase
    {
        private readonly PregiatoDbContext _db;
        private readonly ILeadService _leadService;
        private readonly IImportService _importService;
        
        public ImportedFilesController(
            PregiatoDbContext db, 
            ILeadService leadService,
            IImportService importService)
        { 
            _db = db;
            _leadService = leadService;
            _importService = importService;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var q = _db.Set<ImportedFile>().AsQueryable();
            var total = await q.CountAsync();
            var items = await q.OrderByDescending(x => x.CreatedAtUtc).Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
            return Ok(new { items, total });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var rec = await _db.Set<ImportedFile>().FindAsync(id);
            return rec == null ? NotFound() : Ok(rec);
        }

        public class ImportDto
        {
            public string FileName { get; set; } = string.Empty;
            public string PayloadJson { get; set; } = string.Empty;
            public int? RowCount { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ImportDto dto)
        {
            var rec = new ImportedFile
            {
                Id = Guid.NewGuid(),
                FileName = dto.FileName,
                PayloadJson = dto.PayloadJson,
                RowCount = dto.RowCount,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow
            };
            _db.Add(rec);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = rec.Id }, rec);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ImportDto dto)
        {
            var rec = await _db.Set<ImportedFile>().FindAsync(id);
            if (rec == null) return NotFound();
            rec.FileName = dto.FileName;
            rec.PayloadJson = dto.PayloadJson;
            rec.RowCount = dto.RowCount;
            rec.UpdatedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(rec);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var rec = await _db.Set<ImportedFile>().FindAsync(id);
            if (rec == null) return NotFound();
            _db.Remove(rec);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        public class ProcessResult
        {
            public int Created { get; set; }
            public int Skipped { get; set; }
            public int Errors { get; set; }
            public List<string> ErrorMessages { get; set; } = new();
            public List<ProcessItem> Items { get; set; } = new();
        }

        public class ProcessItem
        {
            public int Index { get; set; }
            public string Outcome { get; set; } = string.Empty; // created | skipped | error
            public string Name { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string Source { get; set; } = string.Empty;
            public string Status { get; set; } = string.Empty;
            public string? Error { get; set; }
        }

        [HttpPost("{id:guid}/process")]
        public async Task<IActionResult> Process(Guid id, [FromQuery] string entity = "Lead", [FromBody] Dictionary<string, string>? columnMapping = null)
        {
            var rec = await _db.Set<ImportedFile>().FindAsync(id);
            if (rec == null) return NotFound(new { message = "Importação não encontrada" });

            try
            {
                // Normalizar o nome da entidade para minúsculas para facilitar comparações
                var normalizedEntity = entity.Trim().ToLowerInvariant();
                
                // Deserializar o payload do arquivo importado
                var payload = JsonSerializer.Deserialize<Payload>(rec.PayloadJson ?? "{}", new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new Payload();

                var headers = payload.Headers ?? new List<string>();
                var rows = payload.Rows ?? new List<List<object?>>();
                
                if (headers.Count == 0 || rows.Count == 0)
                    return BadRequest(new { message = "Payload vazio ou inválido" });

                // Processar a importação usando o serviço genérico
                var result = await _importService.ProcessImportAsync(normalizedEntity, headers, rows, columnMapping);
                
                // Atualizar o registro de importação com informações de processamento
                rec.ProcessedAt = DateTime.UtcNow;
                rec.ProcessingResult = JsonSerializer.Serialize(result);
                rec.EntityType = normalizedEntity;
                await _db.SaveChangesAsync();
                
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Falha ao processar importação", error = ex.Message });
            }
        }
        
        [HttpGet("entities")]
        public IActionResult GetSupportedEntities()
        {
            return Ok(_importService.GetSupportedEntities());
        }
        
        [HttpGet("entities/{entityType}/fields")]
        public IActionResult GetEntityFields(string entityType)
        {
            return Ok(_importService.GetEntityFields(entityType));
        }

        private class Payload
        {
            public List<string>? Headers { get; set; }
            public List<List<object?>>? Rows { get; set; }
            public object? Meta { get; set; }
        }
    }
}


