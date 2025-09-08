using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Pregiato.Infrastructure.Data;
using Pregiato.Core.Interfaces;
using RabbitMQ.Client;
using RabbitMQ.Client.Exceptions;
using System.Net.Sockets;

namespace Pregiato.API.Services
{
    /// <summary>
    /// Serviço de resiliência que monitora e recupera automaticamente falhas de infraestrutura
    /// </summary>
    public class ResilienceService : BackgroundService, IResilienceService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ResilienceService> _logger;
        private readonly IConfiguration _configuration;
        private readonly SemaphoreSlim _recoverySemaphore = new(1, 1);
        
        // Estados de saúde dos serviços
        private bool _databaseHealthy = true;
        private bool _rabbitMQHealthy = true;
        private DateTime _lastDatabaseCheck = DateTime.MinValue;
        private DateTime _lastRabbitMQCheck = DateTime.MinValue;
        
        // Configurações de resiliência
        private readonly TimeSpan _healthCheckInterval = TimeSpan.FromSeconds(30);
        private readonly TimeSpan _recoveryTimeout = TimeSpan.FromMinutes(5);
        private readonly int _maxRetryAttempts = 3;
        private readonly TimeSpan _retryDelay = TimeSpan.FromSeconds(10);

        public ResilienceService(
            IServiceProvider serviceProvider,
            ILogger<ResilienceService> logger,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🛡️ Serviço de Resiliência iniciado");
            
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await PerformHealthChecks();
                    await Task.Delay(_healthCheckInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erro no monitoramento de resiliência");
                    await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
                }
            }
            
            _logger.LogInformation("🛡️ Serviço de Resiliência finalizado");
        }

        /// <summary>
        /// Executa verificações de saúde de todos os serviços críticos
        /// </summary>
        private async Task PerformHealthChecks()
        {
            var tasks = new List<Task>
            {
                CheckDatabaseHealth(),
                CheckRabbitMQHealth()
            };

            await Task.WhenAll(tasks);
        }

        /// <summary>
        /// Verifica a saúde do banco de dados
        /// </summary>
        private async Task CheckDatabaseHealth()
        {
            try
            {
                if (DateTime.UtcNow - _lastDatabaseCheck < _healthCheckInterval)
                    return;

                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<PregiatoDbContext>();
                
                // Teste simples de conectividade
                await context.Database.ExecuteSqlRawAsync("SELECT 1");
                
                if (!_databaseHealthy)
                {
                    _logger.LogInformation("✅ Banco de dados recuperado");
                    _databaseHealthy = true;
                }
                
                _lastDatabaseCheck = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                if (_databaseHealthy)
                {
                    _logger.LogError(ex, "❌ Falha na conectividade do banco de dados");
                    _databaseHealthy = false;
                    _ = Task.Run(() => RecoverDatabaseConnection());
                }
            }
        }

        /// <summary>
        /// Verifica a saúde do RabbitMQ
        /// </summary>
        private async Task CheckRabbitMQHealth()
        {
            try
            {
                if (DateTime.UtcNow - _lastRabbitMQCheck < _healthCheckInterval)
                    return;

                using var scope = _serviceProvider.CreateScope();
                var rabbitService = scope.ServiceProvider.GetRequiredService<RabbitBackgroundService>();
                
                // Teste de conectividade
                await rabbitService.TestConnectionAsync();
                
                if (!_rabbitMQHealthy)
                {
                    _logger.LogInformation("✅ RabbitMQ recuperado");
                    _rabbitMQHealthy = true;
                }
                
                _lastRabbitMQCheck = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                if (_rabbitMQHealthy)
                {
                    _logger.LogError(ex, "❌ Falha na conectividade do RabbitMQ");
                    _rabbitMQHealthy = false;
                    _ = Task.Run(() => RecoverRabbitMQConnection());
                }
            }
        }

        /// <summary>
        /// Recupera a conexão do banco de dados
        /// </summary>
        private async Task RecoverDatabaseConnection()
        {
            if (!await _recoverySemaphore.WaitAsync(1000))
                return;

            try
            {
                _logger.LogInformation("🔄 Iniciando recuperação do banco de dados...");
                
                for (int attempt = 1; attempt <= _maxRetryAttempts; attempt++)
                {
                    try
                    {
                        using var scope = _serviceProvider.CreateScope();
                        var context = scope.ServiceProvider.GetRequiredService<PregiatoDbContext>();
                        
                        // Tentar reconectar
                        await context.Database.OpenConnectionAsync();
                        await context.Database.CloseConnectionAsync();
                        
                        // Teste de funcionalidade
                        await context.Database.ExecuteSqlRawAsync("SELECT 1");
                        
                        _logger.LogInformation("✅ Banco de dados recuperado com sucesso na tentativa {Attempt}", attempt);
                        _databaseHealthy = true;
                        return;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "⚠️ Tentativa {Attempt} de recuperação do banco falhou", attempt);
                        
                        if (attempt < _maxRetryAttempts)
                        {
                            await Task.Delay(_retryDelay);
                        }
                    }
                }
                
                _logger.LogError("❌ Falha em todas as tentativas de recuperação do banco de dados");
            }
            finally
            {
                _recoverySemaphore.Release();
            }
        }

        /// <summary>
        /// Recupera a conexão do RabbitMQ
        /// </summary>
        private async Task RecoverRabbitMQConnection()
        {
            if (!await _recoverySemaphore.WaitAsync(1000))
                return;

            try
            {
                _logger.LogInformation("🔄 Iniciando recuperação do RabbitMQ...");
                
                for (int attempt = 1; attempt <= _maxRetryAttempts; attempt++)
                {
                    try
                    {
                        using var scope = _serviceProvider.CreateScope();
                        var rabbitService = scope.ServiceProvider.GetRequiredService<RabbitBackgroundService>();
                        
                        // Tentar reconectar
                        await rabbitService.ReconnectAsync();
                        
                        // Teste de funcionalidade
                        await rabbitService.TestConnectionAsync();
                        
                        _logger.LogInformation("✅ RabbitMQ recuperado com sucesso na tentativa {Attempt}", attempt);
                        _rabbitMQHealthy = true;
                        return;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "⚠️ Tentativa {Attempt} de recuperação do RabbitMQ falhou", attempt);
                        
                        if (attempt < _maxRetryAttempts)
                        {
                            await Task.Delay(_retryDelay);
                        }
                    }
                }
                
                _logger.LogError("❌ Falha em todas as tentativas de recuperação do RabbitMQ");
            }
            finally
            {
                _recoverySemaphore.Release();
            }
        }

        /// <summary>
        /// Executa uma operação com resiliência automática
        /// </summary>
        public async Task<T> ExecuteWithResilienceAsync<T>(
            Func<Task<T>> operation,
            string operationName,
            CancellationToken cancellationToken = default)
        {
            for (int attempt = 1; attempt <= _maxRetryAttempts; attempt++)
            {
                try
                {
                    return await operation();
                }
                catch (Exception ex) when (IsRecoverableException(ex))
                {
                    _logger.LogWarning(ex, "⚠️ Falha na operação {OperationName} (tentativa {Attempt}/{MaxAttempts})", 
                        operationName, attempt, _maxRetryAttempts);
                    
                    if (attempt < _maxRetryAttempts)
                    {
                        await Task.Delay(_retryDelay, cancellationToken);
                        
                        // Tentar recuperar serviços se necessário
                        if (IsDatabaseException(ex))
                        {
                            await RecoverDatabaseConnection();
                        }
                        else if (IsRabbitMQException(ex))
                        {
                            await RecoverRabbitMQConnection();
                        }
                    }
                    else
                    {
                        _logger.LogError(ex, "❌ Falha definitiva na operação {OperationName} após {MaxAttempts} tentativas", 
                            operationName, _maxRetryAttempts);
                        throw;
                    }
                }
            }
            
            throw new InvalidOperationException($"Operação {operationName} falhou após {_maxRetryAttempts} tentativas");
        }

        /// <summary>
        /// Executa uma operação sem retorno com resiliência automática
        /// </summary>
        public async Task ExecuteWithResilienceAsync(
            Func<Task> operation,
            string operationName,
            CancellationToken cancellationToken = default)
        {
            await ExecuteWithResilienceAsync(async () =>
            {
                await operation();
                return true;
            }, operationName, cancellationToken);
        }

        /// <summary>
        /// Verifica se uma exceção é recuperável
        /// </summary>
        private static bool IsRecoverableException(Exception ex)
        {
            return ex is DbUpdateException ||
                   ex is SocketException ||
                   ex is TimeoutException ||
                   ex is TaskCanceledException ||
                   ex is OperationCanceledException ||
                   ex is BrokerUnreachableException ||
                   ex is ConnectFailureException ||
                   ex is HttpRequestException ||
                   (ex.InnerException != null && IsRecoverableException(ex.InnerException));
        }

        /// <summary>
        /// Verifica se é uma exceção de banco de dados
        /// </summary>
        private static bool IsDatabaseException(Exception ex)
        {
            return ex is DbUpdateException ||
                   ex is InvalidOperationException ||
                   ex.Message.Contains("Field") && ex.Message.Contains("doesn't have a default value") ||
                   ex.Message.Contains("Connection") && ex.Message.Contains("database") ||
                   (ex.InnerException != null && IsDatabaseException(ex.InnerException));
        }

        /// <summary>
        /// Verifica se é uma exceção do RabbitMQ
        /// </summary>
        private static bool IsRabbitMQException(Exception ex)
        {
            return ex is BrokerUnreachableException ||
                   ex is ConnectFailureException ||
                   ex is SocketException ||
                   ex.Message.Contains("RabbitMQ") ||
                   ex.Message.Contains("AMQP") ||
                   (ex.InnerException != null && IsRabbitMQException(ex.InnerException));
        }

        /// <summary>
        /// Obtém o status de saúde dos serviços
        /// </summary>
        public object GetHealthStatus()
        {
            return new
            {
                Database = new
                {
                    Healthy = _databaseHealthy,
                    LastCheck = _lastDatabaseCheck
                },
                RabbitMQ = new
                {
                    Healthy = _rabbitMQHealthy,
                    LastCheck = _lastRabbitMQCheck
                },
                Timestamp = DateTime.UtcNow
            };
        }

        public override void Dispose()
        {
            _recoverySemaphore?.Dispose();
            base.Dispose();
        }
    }
}