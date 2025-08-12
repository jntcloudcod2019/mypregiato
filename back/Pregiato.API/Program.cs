using Microsoft.EntityFrameworkCore;
using Pregiato.API.Controllers;
using Pregiato.Application.Interfaces;
using Pregiato.Application.Services;
using Pregiato.Infrastructure.Data;
using Pregiato.Application.Mappings;
using FluentValidation;
using Pregiato.Application.Validators;
using Pregiato.Application.DTOs;
using Serilog;
using Serilog.Events;
using Pregiato.API.Services;

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
        policy.WithOrigins("http://localhost:8080", "http://localhost:3000", "http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// DbContext
builder.Services.AddDbContext<PregiatoDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    ));

// HttpClient
builder.Services.AddHttpClient();

// AutoMapper
builder.Services.AddAutoMapper(typeof(AutoMapperProfile));

// FluentValidation
builder.Services.AddScoped<IValidator<CreateTalentDto>, CreateTalentDtoValidator>();

// Services
builder.Services.AddScoped<ITalentService, TalentService>();
builder.Services.AddScoped<IContractService, ContractService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IWhatsAppService, WhatsAppService>();

// Chat services
builder.Services.AddScoped<ChatLogService>();
builder.Services.AddScoped<AttendanceService>();

// MemoryCache e RabbitMQ HostedService
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<RabbitBackgroundService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<RabbitBackgroundService>());

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
app.UseAuthorization();

app.MapControllers();
app.MapHub<Pregiato.API.Hubs.WhatsAppHub>("/whatsappHub");

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