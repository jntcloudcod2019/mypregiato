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

// Configurar Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .WriteTo.Console()
    .WriteTo.File("logs/pregiato-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers();

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
        policy.WithOrigins("http://localhost:8080", "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// DbContext com MySQL Railway
var conn = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(conn))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' não encontrada.");
}

builder.Services.AddDbContext<PregiatoDbContext>(options =>
    options.UseMySql(
        conn,
        ServerVersion.Create(8, 0, 0, Pomelo.EntityFrameworkCore.MySql.Infrastructure.ServerType.MySql), // Especificar versão diretamente
        options => options.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null)
    ));

builder.Services.AddScoped<RuntimePregiatoDbContextFactory>(provider => 
    new RuntimePregiatoDbContextFactory(provider.GetRequiredService<DbContextOptions<PregiatoDbContext>>()));

// HttpClient
builder.Services.AddHttpClient();

// AutoMapper
builder.Services.AddAutoMapper(typeof(AutoMapperProfile));

// FluentValidation
builder.Services.AddScoped<IValidator<CreateTalentDto>, CreateTalentDtoValidator>();
builder.Services.AddScoped<IValidator<UpdateTalentDto>, UpdateTalentDtoValidator>();

// Services
builder.Services.AddScoped<ITalentService, TalentService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IWhatsAppService, WhatsAppService>();
builder.Services.AddScoped<ILeadService, LeadService>();
builder.Services.AddScoped<ILeadRepository, LeadRepository>();
builder.Services.AddScoped<IOperatorLeadsService, Pregiato.Application.Services.OperatorLeadsService>();

// Serviços de resiliência
builder.Services.AddScoped<IEmojiResilienceService, EmojiResilienceService>();

// Clerk Authentication Services
builder.Services.AddScoped<IClerkAuthService, ClerkAuthService>();

// Repositories
builder.Services.AddScoped<ITalentRepository, TalentRepository>();
builder.Services.AddScoped<IImportedFileRepository, ImportedFileRepository>();
builder.Services.AddScoped<IChatLogRepository, ChatLogRepository>();
builder.Services.AddScoped<IOperatorLeadsRepository, OperatorLeadsRepository>();

// Chat services
builder.Services.AddScoped<ChatLogService>();
builder.Services.AddScoped<AttendanceService>();
builder.Services.AddScoped<IConversationRepository, ConversationRepository>();
builder.Services.AddScoped<IConversationService, ConversationService>();
builder.Services.AddSingleton<ConversationService>();

// Media storage service
builder.Services.AddSingleton<MediaStorageService>();

// Serviços de importação
builder.Services.AddScoped<IImportService, Pregiato.Application.Services.ImportServiceWithRepo>();

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

// Clerk Authentication Middleware
app.UseClerkAuthentication();

app.UseAuthorization();

app.MapControllers();
app.MapHub<Pregiato.API.Hubs.WhatsAppHub>("/whatsappHub");

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