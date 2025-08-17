using System.Collections.Generic;
using System.Threading.Tasks;

namespace Pregiato.Application.Interfaces
{
    public interface IImportService
    {
        Task<object> ProcessImportAsync(string entity, List<string> headers, List<List<object?>> rows, Dictionary<string, string>? columnMapping = null);
        List<string> GetSupportedEntities();
        Dictionary<string, object> GetEntityFields(string entityType);
    }
}
