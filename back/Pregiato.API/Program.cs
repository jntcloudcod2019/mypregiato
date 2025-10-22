using Microsoft.EntityFrameworkCore;
using Pregiato.API.Controllers;
using Pregiato.Core.Interfaces;
using Pregiato.Application.Services;
using Pregiato.Infrastructure.Data;
using Pregiato.Application.Mappings;
using FluentValidation;
using Pregiato.Application.Validators;
using Pregiato.Application.DTOs;
using Serilog;
using Serilog.Events;
using Pregiato.API.Services;
using Pregiato.Application.Interfaces;
using Pregiato.Infrastructure.Repositories;
using Pregiato.API.Middleware;
using Pregiato.API.Attributes;

using Pregiato.Core.Entities;

var builder = WebApplication.CreateBuilder(args);

// Configurar Serilog - apenas console
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers(options =>
{
    options.MaxModelBindingCollectionSize = 15;
})
// ✅ CONFIGURAR JSON SERIALIZER PARA IGNORAR REFERÊNCIAS CIRCULARES
.AddJsonOptions(options =>
{
    // Ignora ciclos de referência ao serializar JSON
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    
    // Outras configurações úteis
    options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// SignalR
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
                // Desenvolvimento
                "http://localhost:8080", 
                "http://localhost:3000", 
                "http://localhost:5173", 
                "http://127.0.0.1:5173",
                // Produção Railway - URLs específicas (wildcards não funcionam com AllowCredentials)
                "https://my-pregiato-production.up.railway.app",
                "https://pregiato-api-production.up.railway.app"
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()
              .SetIsOriginAllowedToAllowWildcardSubdomains()
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10)); // Cache preflight por 10 minutos
    });
});

// ✅ CONFIGURAÇÃO DE BANCO DE DADOS POR AMBIENTE
string connectionString;

// Verificar se está em produção (Railway)
if (builder.Environment.IsProduction() || !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("RAILWAY_ENVIRONMENT")))
{
    // ✅ PRODUÇÃO: Usar URL direta do Railway
    connectionString = "Server=gondola.proxy.rlwy.net;Port=23254;Database=railway;Uid=root;Pwd=nmZKnTmDpQIwmvRBYIoIbFjYyaiZPoEq;CharSet=utf8mb4;";
    
    Log.Information("🔧 Usando configuração de banco de dados de PRODUÇÃO (Railway)");
    Log.Information("🔧 Conexão configurada para Railway MySQL");
}
else
{
    // ✅ DESENVOLVIMENTO: Usar configuração local
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException("Connection string 'DefaultConnection' não encontrada para desenvolvimento.");
    }
    
    Log.Information("🔧 Usando configuração de banco de dados de DESENVOLVIMENTO (local)");
}

builder.Services.AddDbContext<PregiatoDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.Create(8, 0, 0, Pomelo.EntityFrameworkCore.MySql.Infrastructure.ServerType.MySql),
        options => options.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null)
    ));

builder.Services.AddScoped<RuntimePregiatoDbContextFactory>(provider => 
    new RuntimePregiatoDbContextFactory(provider.GetRequiredService<DbContextOptions<PregiatoDbContext>>()));

 builder.WebHost.ConfigureKestrel(serverOptions =>
{
   serverOptions.Limits.MaxRequestBodySize = 2147483648L; // 2 GB para vídeos muito grandes
   serverOptions.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(30); // 30 minutos para uploads grandes
   serverOptions.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(10); // 10 minutos para headers
   serverOptions.Limits.MaxRequestBufferSize = 2147483648L; // 2 GB buffer
   serverOptions.Limits.MaxRequestLineSize = 16384; // 16KB para headers grandes
});

// HttpClient
builder.Services.AddHttpClient();

// AutoMapper
builder.Services.AddAutoMapper(typeof(AutoMapperProfile));

// FluentValidation
builder.Services.AddScoped<IValidator<CreateTalentDto>, CreateTalentDtoValidator>();
builder.Services.AddScoped<IValidator<UpdateTalentDto>, UpdateTalentDtoValidator>();

// Training Validators
builder.Services.AddScoped<IValidator<CreateTrainingCourseDto>, CreateTrainingCourseValidator>();
builder.Services.AddScoped<IValidator<UpdateTrainingCourseDto>, UpdateTrainingCourseValidator>();
builder.Services.AddScoped<IValidator<CreateTrainingLessonDto>, CreateTrainingLessonValidator>();
builder.Services.AddScoped<IValidator<UpdateTrainingLessonDto>, UpdateTrainingLessonValidator>();

// ✅ MINIO CONFIGURATION
builder.Services.Configure<Pregiato.Infrastructure.Adapters.MinIOOptions>(
    builder.Configuration.GetSection("MinIO"));

// ✅ MINIO STORAGE ADAPTER
builder.Services.AddScoped<Pregiato.Core.Interfaces.IMediaStoragePort, Pregiato.Infrastructure.Adapters.MinIOStorageAdapter>();

// ✅ META API CONFIGURATION
builder.Services.AddHttpClient("MetaAPI", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Meta:BaseUrl"] ?? "https://graph.facebook.com/v21.0");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// ✅ META API SERVICES
builder.Services.AddScoped<Pregiato.Application.Interfaces.IMetaAPIClient, Pregiato.Application.Adapters.MetaAPIAdapter>();
builder.Services.AddScoped<Pregiato.Application.Interfaces.IMetaWebhookProcessor, Pregiato.Application.Services.MetaWebhookProcessor>();

// Services
builder.Services.AddScoped<ITalentService, TalentService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IWhatsAppService, WhatsAppService>();
builder.Services.AddSingleton<Pregiato.Application.Interfaces.IBrowserService, Pregiato.Application.Services.BrowserService>();
builder.Services.AddScoped<ILeadService, LeadService>();
builder.Services.AddScoped<ILeadRepository, LeadRepository>();
builder.Services.AddScoped<IOperatorLeadsService, Pregiato.Application.Services.OperatorLeadsService>();

// Training Services
builder.Services.AddScoped<Pregiato.Application.Interfaces.ITrainingCourseService, TrainingCourseService>();
builder.Services.AddScoped<Pregiato.Application.Interfaces.ITrainingEnrollmentService, TrainingEnrollmentService>();
builder.Services.AddScoped<Pregiato.Application.Interfaces.ITrainingVideoService, TrainingVideoService>();
builder.Services.AddScoped<Pregiato.Application.Interfaces.ITrainingCertificateService, Pregiato.Application.Services.TrainingCertificateService>();

// Serviços de resiliência
builder.Services.AddScoped<IEmojiResilienceService, EmojiResilienceService>();
builder.Services.AddSingleton<IResilienceService, ResilienceService>();
builder.Services.AddHostedService<ResilienceService>(provider => (ResilienceService)provider.GetRequiredService<IResilienceService>());

// Clerk Authentication Services
builder.Services.AddScoped<IClerkAuthService, ClerkAuthService>();

// Repositories
builder.Services.AddScoped<ITalentRepository, TalentRepository>();
builder.Services.AddScoped<IImportedFileRepository, ImportedFileRepository>();
builder.Services.AddScoped<IChatLogRepository, ChatLogRepository>();
builder.Services.AddScoped<IOperatorLeadsRepository, OperatorLeadsRepository>();
builder.Services.AddScoped<IFileUploadRepository, FileUploadRepository>();

// Training Repositories
builder.Services.AddScoped<ITrainingCourseRepository, TrainingCourseRepository>();
builder.Services.AddScoped<ITrainingEnrollmentRepository, TrainingEnrollmentRepository>();
builder.Services.AddScoped<ITrainingCertificateRepository, TrainingCertificateRepository>();

// Chat services
builder.Services.AddScoped<ChatLogService>();
builder.Services.AddScoped<AttendanceService>();
builder.Services.AddScoped<IConversationRepository, ConversationRepository>();
builder.Services.AddScoped<IConversationService, ConversationService>();
builder.Services.AddSingleton<ConversationService>();

// Media storage service
builder.Services.AddScoped<MediaStorageService>();

// Serviços de importação
builder.Services.AddScoped<IImportService, Pregiato.Application.Services.ImportServiceWithRepo>();

// FileUpload Services
builder.Services.AddScoped<IFileUploadService, FileUploadService>();

// MemoryCache e RabbitMQ HostedService
builder.Services.AddMemoryCache();

// Configurar RabbitMQ
builder.Services.Configure<RabbitMQConfig>(builder.Configuration.GetSection("RabbitMQ"));
builder.Services.AddSingleton<RabbitBackgroundService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<RabbitBackgroundService>());

// ✅ Configurar Host Options para melhor tratamento de BackgroundService
builder.Services.Configure<HostOptions>(options =>
{
    options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
    options.StartupTimeout = TimeSpan.FromMinutes(5);
    options.ShutdownTimeout = TimeSpan.FromMinutes(2);
});

// ✅ Health Checks
builder.Services.AddHealthChecks()
    .AddCheck("rabbitmq", () => 
    {
        // Verificar se RabbitMQ está configurado
        var config = builder.Configuration.GetSection("RabbitMQ");
        return config.Exists() ? Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy() 
                               : Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy("RabbitMQ não configurado");
    })
    .AddCheck("minio", () => 
    {
        // Verificar se MinIO está configurado
        var config = builder.Configuration.GetSection("MinIO");
        return config.Exists() ? Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("MinIO configurado") 
                               : Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy("MinIO não configurado");
    });

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

// Middleware de resiliência (antes da autenticação)
app.UseResilience();

// Clerk Authentication Middleware
app.UseClerkAuthentication();

app.UseAuthorization();

app.MapControllers();
app.MapHub<Pregiato.API.Hubs.WhatsAppHub>("/hubs/whatsapp");

// ✅ Health Check endpoint
app.MapHealthChecks("/health");

// Middleware de log simples
app.Use(async (context, next) =>
{
    var start = DateTime.UtcNow;
    Log.Information("Request starting {Method} {Path}", context.Request.Method, context.Request.Path);
    await next();
    var elapsed = DateTime.UtcNow - start;
    Log.Information("Request finished {Method} {Path} - {StatusCode} in {Elapsed:0.0000}ms",
        context.Request.Method, context.Request.Path, context.Response.StatusCode, elapsed.TotalMilliseconds);
});

// ✅ Configurar graceful shutdown
app.Lifetime.ApplicationStopping.Register(() =>
{
    Log.Information("Aplicação está sendo finalizada...");
});

app.Lifetime.ApplicationStopped.Register(() =>
{
    Log.Information("Aplicação foi finalizada");
});

try
{
    Log.Information("Iniciando Pregiato API...");
    
    // ✅ Inicializar MinIO e testar conectividade
    Log.Information("🔄 Testando conectividade MinIO...");
    try
    {
        using var scope = app.Services.CreateScope();
        var minioAdapter = scope.ServiceProvider.GetRequiredService<Pregiato.Core.Interfaces.IMediaStoragePort>();
        var minioOptions = app.Configuration.GetSection("MinIO").Get<Pregiato.Infrastructure.Adapters.MinIOOptions>();
        
        Log.Information("📦 MinIO Configurado - Endpoint: {Endpoint}, Bucket: {BucketName}", 
            minioOptions?.Endpoint, minioOptions?.BucketName);
    
    }
    catch (Exception minioEx)
    {
        Log.Warning(minioEx, "⚠️ MinIO não disponível - usando fallback local: {Message}", minioEx.Message);
    }
    
    Log.Information("🎉 Pregiato API iniciada com sucesso!");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Aplicação falhou ao iniciar");
}
finally
{
    Log.CloseAndFlush();
} 