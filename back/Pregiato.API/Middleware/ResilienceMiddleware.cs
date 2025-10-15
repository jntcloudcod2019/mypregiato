using Microsoft.EntityFrameworkCore;
using Pregiato.API.Services;
using Pregiato.Core.Interfaces;
using System.Net;
using System.Net.Sockets;
using System.Text.Json;

namespace Pregiato.API.Middleware
{
    /// <summary>
    /// Classe para padronizar respostas de erro
    /// </summary>
    public class ErrorResponse
    {
        public string Error { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? OriginalError { get; set; }
        public DateTime Timestamp { get; set; }
        public string? Path { get; set; }
        public ResilienceInfo Resilience { get; set; } = new();
    }

    public class ResilienceInfo
    {
        public bool Applied { get; set; }
        public bool Retryable { get; set; }
        public string? Reason { get; set; }
    }

    /// <summary>
    /// Middleware que intercepta exceções e aplica resiliência automática
    /// </summary>
    public class ResilienceMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ResilienceMiddleware> _logger;
        private readonly IResilienceService _resilienceService;

        public ResilienceMiddleware(
            RequestDelegate next,
            ILogger<ResilienceMiddleware> logger,
            IResilienceService resilienceService)
        {
            _next = next;
            _logger = logger;
            _resilienceService = resilienceService;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "🛡️ Exceção interceptada pelo middleware de resiliência");
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception ex)
        {
            var response = context.Response;
            response.ContentType = "application/json";

            // Determinar mensagem de erro amigável baseada no tipo de exceção
            var (errorTitle, errorMessage) = GetUserFriendlyErrorMessage(ex);

            var errorResponse = new ErrorResponse
            {
                Error = errorTitle,
                Message = errorMessage,
                Timestamp = DateTime.UtcNow,
                Path = context.Request.Path.Value,
                Resilience = new ResilienceInfo
                {
                    Applied = false,
                    Retryable = IsRetryableException(ex)
                }
            };

            // Tentar aplicar resiliência se for uma exceção recuperável
            if (IsRetryableException(ex))
            {
                try
                {
                    _logger.LogInformation("🔄 Tentando aplicar resiliência para: {ExceptionType}", ex.GetType().Name);

                    // Executar a operação original com resiliência
                    await _resilienceService.ExecuteWithResilienceAsync(async () =>
                    {
                        // Recriar o contexto da requisição
                        await RecreateRequestContext(context);
                    }, $"HTTP {context.Request.Method} {context.Request.Path}");

                    _logger.LogInformation("✅ Resiliência aplicada com sucesso");
                    
                    errorResponse = new ErrorResponse
                    {
                        Error = "Erro temporário recuperado",
                        Message = "A operação foi recuperada automaticamente",
                        Timestamp = DateTime.UtcNow,
                        Path = context.Request.Path.Value,
                        Resilience = new ResilienceInfo
                        {
                            Applied = true,
                            Retryable = true
                        }
                    };

                    response.StatusCode = (int)HttpStatusCode.OK;
                }
                catch (Exception resilienceEx)
                {
                    _logger.LogError(resilienceEx, "❌ Falha na aplicação de resiliência");
                    
                    errorResponse = new ErrorResponse
                    {
                        Error = "Falha na recuperação automática",
                        Message = resilienceEx.Message,
                        OriginalError = ex.Message,
                        Timestamp = DateTime.UtcNow,
                        Path = context.Request.Path.Value,
                        Resilience = new ResilienceInfo
                        {
                            Applied = false,
                            Retryable = true,
                            Reason = "Resiliência falhou após múltiplas tentativas"
                        }
                    };

                    response.StatusCode = (int)HttpStatusCode.ServiceUnavailable;
                }
            }
            else
            {
                response.StatusCode = GetStatusCodeForException(ex);
            }

            var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            });

            await response.WriteAsync(jsonResponse);
        }

        private async Task RecreateRequestContext(HttpContext context)
        {
            // Reset o response se ainda não foi iniciado
            if (!context.Response.HasStarted)
            {
                context.Response.Clear();
            }

            // Tentar executar a requisição novamente
            var originalPosition = context.Request.Body.Position;
            context.Request.Body.Position = 0;

            try
            {
                await _next(context);
            }
            finally
            {
                context.Request.Body.Position = originalPosition;
            }
        }

        private static bool IsRetryableException(Exception ex)
        {
            return ex is DbUpdateException ||
                   ex is TimeoutException ||
                   ex is SocketException ||
                   ex is TaskCanceledException ||
                   ex is OperationCanceledException ||
                   ex is HttpRequestException ||
                   (ex.Message?.Contains("Field") == true && ex.Message?.Contains("doesn't have a default value") == true) ||
                   (ex.Message?.Contains("Connection") == true && ex.Message?.Contains("database") == true) ||
                   (ex.InnerException != null && IsRetryableException(ex.InnerException));
        }

        private static (string Title, string Message) GetUserFriendlyErrorMessage(Exception ex)
        {
            return ex switch
            {
                FileNotFoundException fileEx => 
                    ("Arquivo não encontrado", $"O recurso solicitado não foi encontrado: {Path.GetFileName(fileEx.FileName ?? "arquivo desconhecido")}"),
                
                UnauthorizedAccessException => 
                    ("Acesso negado", "Sem permissão para acessar este recurso"),
                
                IOException ioEx => 
                    ("Erro de leitura/escrita", "Erro ao acessar arquivo ou recurso do sistema"),
                
                ArgumentException argEx => 
                    ("Requisição inválida", argEx.Message),
                
                InvalidOperationException invalidEx => 
                    ("Operação inválida", invalidEx.Message),
                
                NotImplementedException => 
                    ("Funcionalidade não implementada", "Este recurso ainda não está disponível"),
                
                TimeoutException => 
                    ("Tempo esgotado", "A operação demorou muito tempo para ser concluída"),
                
                DbUpdateException dbEx => 
                    ("Erro de banco de dados", "Erro ao salvar dados. Por favor, tente novamente"),
                
                _ => 
                    ("Erro interno do servidor", ex.Message)
            };
        }

        private static int GetStatusCodeForException(Exception ex)
        {
            return ex switch
            {
                ArgumentException or ArgumentNullException => (int)HttpStatusCode.BadRequest,
                FileNotFoundException => (int)HttpStatusCode.NotFound,
                UnauthorizedAccessException => (int)HttpStatusCode.Forbidden,
                NotImplementedException => (int)HttpStatusCode.NotImplemented,
                TimeoutException => (int)HttpStatusCode.RequestTimeout,
                DbUpdateException => (int)HttpStatusCode.ServiceUnavailable,
                IOException => (int)HttpStatusCode.InternalServerError,
                InvalidOperationException => (int)HttpStatusCode.BadRequest,
                _ => (int)HttpStatusCode.InternalServerError
            };
        }
    }

    /// <summary>
    /// Extensão para registrar o middleware de resiliência
    /// </summary>
    public static class ResilienceMiddlewareExtensions
    {
        public static IApplicationBuilder UseResilience(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ResilienceMiddleware>();
        }
    }
}
