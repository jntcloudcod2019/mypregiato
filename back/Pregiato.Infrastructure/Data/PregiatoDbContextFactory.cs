using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;

namespace Pregiato.Infrastructure.Data
{
    /// <summary>
    /// Factory para criação de instâncias do DbContext
    /// Implementa IDesignTimeDbContextFactory para suporte a migrations
    /// </summary>
    public class PregiatoDbContextFactory : IDesignTimeDbContextFactory<PregiatoDbContext>
    {
        /// <summary>
        /// Cria uma nova instância do DbContext para uso em design time (migrations)
        /// </summary>
        /// <param name="args">Argumentos de linha de comando</param>
        /// <returns>Instância do DbContext</returns>
        public PregiatoDbContext CreateDbContext(string[] args)
        {
            // Configuração para design time
            var configuration = new Microsoft.Extensions.Configuration.ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"}.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var optionsBuilder = new DbContextOptionsBuilder<PregiatoDbContext>();
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                // Fallback para InMemory em Dev se sem connection string
                // Não podemos usar InMemory aqui, pois é apenas para design time
                // Usamos uma string de conexão padrão para MySQL
                connectionString = "Server=localhost;Database=pregiato;User=root;Password=root;";
                optionsBuilder.UseMySql(
                    connectionString,
                    ServerVersion.AutoDetect(connectionString)
                );
            }
            else
            {
                optionsBuilder.UseMySql(
                    connectionString,
                    ServerVersion.AutoDetect(connectionString),
                    options => options.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorNumbersToAdd: null)
                );
            }

            return new PregiatoDbContext(optionsBuilder.Options);
        }
    }

    /// <summary>
    /// Factory para criação de instâncias do DbContext em runtime
    /// </summary>
    public class RuntimePregiatoDbContextFactory
    {
        private readonly DbContextOptions<PregiatoDbContext> _options;

        /// <summary>
        /// Construtor
        /// </summary>
        /// <param name="options">Opções do DbContext</param>
        public RuntimePregiatoDbContextFactory(DbContextOptions<PregiatoDbContext> options)
        {
            _options = options;
        }

        /// <summary>
        /// Cria uma nova instância do DbContext
        /// </summary>
        /// <returns>Instância do DbContext</returns>
        public PregiatoDbContext CreateDbContext()
        {
            return new PregiatoDbContext(_options);
        }
    }
}
