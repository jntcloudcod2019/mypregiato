using Microsoft.EntityFrameworkCore;
using Pregiato.Infrastructure.Data;
using Pregiato.Application.Interfaces;
using Pregiato.Application.Services;
using Pregiato.Infrastructure.Repositories;
using Pregiato.Application.Validators;
using Pregiato.Core.Interfaces;
using FluentValidation;
using Serilog;
using Pregiato.API.Hubs;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Configurar Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/pregiato-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Adicionar serviços ao container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configurar Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Pregiato API", 
        Version = "v1",
        Description = "API do sistema PREGIATO MANAGEMENT",
        Contact = new OpenApiContact
        {
            Name = "Pregiato Team",
            Email = "contato@pregiato.com"
        }
    });
    
    // Incluir comentários XML se existirem
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// Configurar Entity Framework com SQLite (temporário para teste)
builder.Services.AddDbContext<PregiatoDbContext>(options =>
    options.UseSqlite("Data Source=pregiato.db"));

// Configurar AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Configurar FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<CreateTalentDtoValidator>();

// Configurar CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configurar SignalR
builder.Services.AddSignalR();

// Registrar serviços
builder.Services.AddScoped<ITalentService, TalentService>();
builder.Services.AddScoped<ITalentRepository, TalentRepository>();
builder.Services.AddScoped<IContractService, ContractService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IWhatsAppService, WhatsAppService>();

var app = builder.Build();

// Configurar pipeline de requisições HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Pregiato API v1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "Pregiato API Documentation";
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Configurar SignalR
app.MapHub<WhatsAppHub>("/hubs/whatsapp");

// Garantir que o banco de dados seja criado
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<PregiatoDbContext>();
    context.Database.EnsureCreated();
}

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