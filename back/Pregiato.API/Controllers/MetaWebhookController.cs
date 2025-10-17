using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Pregiato.Application.DTOs.Meta;
using Pregiato.Application.Interfaces;
using System.Text.Json;

namespace Pregiato.API.Controllers
{
    /// <summary>
    /// Controller para receber webhooks da Meta Cloud API (WhatsApp Business)
    /// Endpoint configurado no Meta Business Manager
    /// Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
    /// </summary>
    [ApiController]
    [Route("api/webhooks/meta")]
    public class MetaWebhookController : ControllerBase
    {
        private readonly ILogger<MetaWebhookController> _logger;
        private readonly IConfiguration _configuration;
        private readonly IMetaWebhookProcessor _webhookProcessor;

        public MetaWebhookController(
            ILogger<MetaWebhookController> logger,
            IConfiguration configuration,
            IMetaWebhookProcessor webhookProcessor)
        {
            _logger = logger;
            _configuration = configuration;
            _webhookProcessor = webhookProcessor;
        }

        /// <summary>
        /// GET endpoint para verificação do webhook pela Meta
        /// A Meta faz esta chamada quando você configura o webhook no Business Manager
        /// </summary>
        /// <param name="mode">Deve ser "subscribe"</param>
        /// <param name="verifyToken">Token de verificação configurado</param>
        /// <param name="challenge">Challenge string enviado pela Meta</param>
        /// <returns>Echo do challenge se token válido, 403 caso contrário</returns>
        [HttpGet]
        public IActionResult VerifyWebhook(
            [FromQuery(Name = "hub.mode")] string? mode,
            [FromQuery(Name = "hub.verify_token")] string? verifyToken,
            [FromQuery(Name = "hub.challenge")] string? challenge)
        {
            _logger.LogInformation("📞 [META WEBHOOK] Verificação recebida - Mode: {Mode}, Token presente: {HasToken}",
                mode, !string.IsNullOrEmpty(verifyToken));

            // Obter token esperado da configuração
            var expectedToken = _configuration["Meta:WebhookVerifyToken"];

            if (string.IsNullOrEmpty(expectedToken))
            {
                _logger.LogError("❌ [META WEBHOOK] WebhookVerifyToken não configurado no appsettings.json");
                return StatusCode(500, new { error = "Webhook verify token not configured" });
            }

            // Verificar se mode e token estão corretos
            if (mode == "subscribe" && verifyToken == expectedToken)
            {
                _logger.LogInformation("✅ [META WEBHOOK] Verificação bem-sucedida - Retornando challenge");
                
                // Meta espera o challenge como resposta (plain text, não JSON)
                return Content(challenge ?? string.Empty, "text/plain");
            }

            _logger.LogWarning("⚠️ [META WEBHOOK] Verificação falhou - Mode: {Mode}, Token válido: {Valid}",
                mode, verifyToken == expectedToken);

            return Forbid();
        }

        /// <summary>
        /// POST endpoint para receber webhooks da Meta
        /// A Meta envia mensagens, status updates, etc via este endpoint
        /// </summary>
        /// <param name="payload">Payload do webhook</param>
        /// <returns>200 OK sempre (Meta exige resposta rápida)</returns>
        [HttpPost]
        public async Task<IActionResult> ReceiveWebhook([FromBody] MetaWebhookPayload payload)
        {
            try
            {
                // ✅ CRÍTICO: Log do payload completo para debug (apenas primeiras linhas)
                var payloadJson = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true });
                var payloadPreview = payloadJson.Length > 500 
                    ? payloadJson.Substring(0, 500) + "..." 
                    : payloadJson;

                _logger.LogInformation("📨 [META WEBHOOK] Webhook recebido - Object: {Object}, Entries: {Entries}",
                    payload.Object, payload.Entry?.Count ?? 0);
                
                _logger.LogDebug("📨 [META WEBHOOK] Payload completo:\n{Payload}", payloadPreview);

                // ✅ IMPORTANTE: Responder imediatamente para a Meta (< 5 segundos)
                // Processar webhook de forma assíncrona
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _webhookProcessor.ProcessWebhookAsync(payload);
                        _logger.LogInformation("✅ [META WEBHOOK] Processamento assíncrono concluído");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ [META WEBHOOK] Erro no processamento assíncrono");
                    }
                });

                // Retornar 200 OK imediatamente
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [META WEBHOOK] Erro ao receber webhook");
                
                // ✅ IMPORTANTE: Sempre retornar 200 OK mesmo em caso de erro
                // Se retornar erro, Meta vai reenviar o webhook múltiplas vezes
                return Ok();
            }
        }

        /// <summary>
        /// Endpoint de teste para simular webhook (desenvolvimento)
        /// </summary>
        [HttpPost("test")]
        public async Task<IActionResult> TestWebhook([FromBody] object testPayload)
        {
            _logger.LogInformation("🧪 [META WEBHOOK] Webhook de teste recebido");
            
            try
            {
                var payloadJson = JsonSerializer.Serialize(testPayload);
                _logger.LogInformation("📋 [META WEBHOOK] Test payload: {Payload}", payloadJson);

                return Ok(new { 
                    success = true, 
                    message = "Test webhook received",
                    receivedAt = DateTime.UtcNow.ToString("O")
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [META WEBHOOK] Erro no webhook de teste");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}

