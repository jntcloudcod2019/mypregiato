# 🔄 MÓDULO 13: MIGRAÇÃO PARA META CLOUD API

## 🎯 OBJETIVOS DE APRENDIZADO

Ao final deste módulo, você será capaz de:

- ✅ Configurar Meta Business Manager e WhatsApp Business API
- ✅ Implementar integração com Meta Cloud API
- ✅ Desenvolver sistema de webhooks
- ✅ Criar modo dual (Zap-Blaster + Meta API)
- ✅ Realizar migração gradual sem downtime
- ✅ Monitorar e otimizar a integração

---

## ⏱️ DURAÇÃO ESTIMADA

**Total:** 12 horas

- Teoria: 3 horas
- Prática: 7 horas
- Exercícios: 2 horas

---

## 📚 CONTEÚDO PROGRAMÁTICO

### **1. POR QUE MIGRAR?** (30 min)

#### Problemas do whatsapp-web.js

❌ **Instabilidade:**
- Sessão cai frequentemente
- Requer reautenticação (QR code)
- Não é API oficial (viola ToS)

❌ **Limitações:**
- Sem garantia de SLA
- Pode ser bloqueado pela Meta
- Difícil escalar para múltiplos números

❌ **Manutenção:**
- Requer browser headless (Puppeteer)
- Alto consumo de recursos
- Sessões corrompem frequentemente

#### Benefícios da Meta Cloud API

✅ **Oficial:**
- API oficial da Meta/Facebook
- Suporte oficial
- Não viola ToS

✅ **Estável:**
- SLA 99.9%
- Sem necessidade de QR code
- Token permanente (OAuth)

✅ **Escalável:**
- Múltiplos números facilmente
- Rate limits claros
- Infraestrutura da Meta

✅ **Features Adicionais:**
- Templates de mensagem
- Botões interativos
- Listas e quick replies
- Métricas e analytics

---

### **2. ARQUITETURA DA SOLUÇÃO** (45 min)

#### Dual Mode Architecture

Nossa estratégia: implementar **modo dual** que permite usar ambos.

```
┌────────────────────────────────────────┐
│         FRONTEND (React)               │
│         Não muda nada!                 │
└────────────┬───────────────────────────┘
             │ REST API
             │ SignalR
             ▼
┌────────────────────────────────────────┐
│        BACKEND API (.NET)              │
│  ┌──────────────────────────────────┐ │
│  │  ChatsController.Send()          │ │
│  │                                  │ │
│  │  if (UseMetaAPI) {               │ │
│  │    → Meta Cloud API              │ │
│  │  } else {                        │ │
│  │    → RabbitMQ → Zap-Blaster      │ │
│  │  }                               │ │
│  └──────────────────────────────────┘ │
└────────────┬───────────────────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
┌──────────┐   ┌──────────┐
│   META   │   │   ZAP    │
│   API    │   │ BLASTER  │
└──────────┘   └──────────┘
```

**Vantagens do Dual Mode:**

1. ✅ **Zero downtime**: Sistema continua funcionando
2. ✅ **Migração gradual**: Ativa Meta API aos poucos
3. ✅ **Fallback**: Se Meta falhar, usa Zap-Blaster
4. ✅ **Testes seguros**: Pode testar sem afetar produção
5. ✅ **Rollback fácil**: Basta mudar config

---

### **3. SETUP META BUSINESS MANAGER** (2 horas)

#### 3.1 Criar Conta Business

1. **Acessar Meta Business:**
   ```
   https://business.facebook.com
   ```

2. **Criar Business Account:**
   - Clique em "Create Account"
   - Nome do negócio: "Pregiato Atendimento"
   - Seu nome completo
   - Email de negócio

3. **Verificar Identidade:**
   - Upload de documento
   - Confirmação de email
   - Verificação de telefone

#### 3.2 Configurar WhatsApp Business

1. **Adicionar WhatsApp Product:**
   - Menu lateral: "WhatsApp Accounts"
   - Botão: "Add WhatsApp Business Account"

2. **Preencher Informações:**
   ```
   Nome da empresa: Pregiato
   Categoria: Serviços
   Descrição: Atendimento ao cliente via WhatsApp
   Website: https://pregiato.com
   ```

3. **Adicionar Número de Telefone:**
   
   **Opção A: Usar número existente**
   ```
   1. Clique em "Add Phone Number"
   2. Selecione "Use existing number"
   3. Digite: +55 11 98765-4321
   4. Escolha verificação: SMS
   5. Digite código recebido
   6. Confirmar
   ```
   
   **Opção B: Obter número novo (Meta)**
   ```
   1. Clique em "Add Phone Number"
   2. Selecione "Get a new number"
   3. Escolha país: Estados Unidos (+1)
   4. Número gratuito fornecido pela Meta
   ```

4. **Obter Phone Number ID:**
   ```
   WhatsApp Account → Settings → Phone Numbers
   
   Phone Number ID: 123456789012345
   
   📋 COPIE ESTE ID! Você vai precisar.
   ```

#### 3.3 Criar System User e Token

1. **Criar System User:**
   ```
   Business Settings → Users → System Users
   
   - Click "Add"
   - Name: "Pregiato API User"
   - Role: Admin
   ```

2. **Adicionar Assets:**
   ```
   - Clique no System User criado
   - Clique "Add Assets"
   - Selecione seu WhatsApp Business Account
   - Permissão: Full Control
   - Save
   ```

3. **Gerar Token:**
   ```
   - Clique "Generate New Token"
   
   App: [Selecione ou crie um app]
   
   Permissions (IMPORTANTE):
   ✅ whatsapp_business_messaging
   ✅ whatsapp_business_management
   
   Token Expiration:
   🔘 Never expire  ← SELECIONE ESTA OPÇÃO!
   
   [Generate Token]
   ```

4. **Copiar Token:**
   ```
   Access Token:
   EAABsbCS1iHgBO4ZBxZCXaGlkKJHGFkjhgkjHGjhgKJHgjhGJHgjhgJHGjhgkjHGkjhgKJHgjhgKJHGkjhgkjhGKJHgkjhgKJHGkjhgKJH
   
   ⚠️ COPIE AGORA! Não será exibido novamente!
   📋 Salve em local seguro!
   ```

#### 3.4 Configurar Webhook

1. **Acessar Webhook Settings:**
   ```
   WhatsApp Account → Configuration → Webhook
   ```

2. **Configurar Callback URL:**
   ```
   Callback URL:
   https://api.pregiato.com/api/webhooks/meta
   
   Verify Token:
   pregiato_webhook_secret_2025
   
   [Verify and Save]
   ```

3. **Subscribe to Fields:**
   ```
   Webhook Fields:
   ✅ messages
   ✅ message_status
   ✅ message_template_status_update
   
   [Save]
   ```

4. **Testar Webhook:**
   ```
   [Test] → [Send Test Message]
   
   Seu backend deve responder 200 OK
   ```

---

### **4. IMPLEMENTAÇÃO - BACKEND** (2.5 horas)

#### 4.1 Criar Interfaces

**Arquivo:** `Pregiato.Application/Interfaces/IMetaAPIClient.cs`

```csharp
public interface IMetaAPIClient
{
    Task<MetaSendMessageResult> SendTextMessageAsync(
        string to, 
        string body, 
        string? clientMessageId = null);
    
    Task<MetaSendMessageResult> SendMediaMessageAsync(
        string to,
        string mediaType,
        string mediaId,
        string? caption = null,
        string? clientMessageId = null);
    
    Task<MetaUploadMediaResult> UploadMediaAsync(
        byte[] buffer,
        string mimeType,
        string fileName);
    
    Task<MetaDownloadMediaResult> DownloadMediaAsync(string mediaId);
    
    Task<MetaPhoneNumberInfo> GetPhoneNumberInfoAsync();
    
    Task<bool> MarkMessageAsReadAsync(string messageId);
    
    Task<bool> IsHealthyAsync();
}
```

#### 4.2 Implementar Adapter

**Arquivo:** `Pregiato.Infrastructure/Adapters/MetaAPIAdapter.cs`

```csharp
public class MetaAPIAdapter : IMetaAPIClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MetaAPIAdapter> _logger;
    private readonly string _phoneNumberId;
    private readonly string _accessToken;

    public MetaAPIAdapter(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<MetaAPIAdapter> logger)
    {
        _httpClient = httpClientFactory.CreateClient("MetaAPI");
        _logger = logger;
        _phoneNumberId = configuration["Meta:PhoneNumberId"];
        _accessToken = configuration["Meta:AccessToken"];

        _httpClient.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", _accessToken);
    }

    public async Task<MetaSendMessageResult> SendTextMessageAsync(
        string to, 
        string body, 
        string? clientMessageId = null)
    {
        try
        {
            var request = new MetaTextMessageRequest
            {
                To = to,
                Text = new MetaTextContent { Body = body }
            };

            var url = $"/{_phoneNumberId}/messages";
            var response = await _httpClient.PostAsJsonAsync(url, request);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"❌ Meta API error: {errorContent}");
                
                return new MetaSendMessageResult
                {
                    Success = false,
                    Error = errorContent
                };
            }

            var result = await response.Content
                .ReadFromJsonAsync<MetaMessageResponse>();

            return new MetaSendMessageResult
            {
                Success = true,
                WhatsAppMessageId = result.Messages[0].Id,
                ClientMessageId = clientMessageId
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Exception sending message");
            return new MetaSendMessageResult
            {
                Success = false,
                Error = ex.Message
            };
        }
    }
    
    // ... outros métodos
}
```

#### 4.3 Criar Webhook Controller

**Arquivo:** `Pregiato.API/Controllers/MetaWebhookController.cs`

```csharp
[ApiController]
[Route("api/webhooks/meta")]
public class MetaWebhookController : ControllerBase
{
    private readonly ILogger<MetaWebhookController> _logger;
    private readonly IConfiguration _configuration;
    private readonly IMetaWebhookProcessor _webhookProcessor;

    [HttpGet]
    public IActionResult VerifyWebhook(
        [FromQuery(Name = "hub.mode")] string? mode,
        [FromQuery(Name = "hub.verify_token")] string? verifyToken,
        [FromQuery(Name = "hub.challenge")] string? challenge)
    {
        var expectedToken = _configuration["Meta:WebhookVerifyToken"];

        if (mode == "subscribe" && verifyToken == expectedToken)
        {
            _logger.LogInformation("✅ Webhook verificado");
            return Content(challenge ?? string.Empty, "text/plain");
        }

        _logger.LogWarning("⚠️ Webhook verification failed");
        return Forbid();
    }

    [HttpPost]
    public async Task<IActionResult> ReceiveWebhook(
        [FromBody] MetaWebhookPayload payload)
    {
        try
        {
            _logger.LogInformation("📨 Webhook recebido");

            // Processar assincronamente
            _ = Task.Run(async () =>
            {
                await _webhookProcessor.ProcessWebhookAsync(payload);
            });

            // Retornar 200 OK imediatamente
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro no webhook");
            return Ok(); // Sempre retornar OK para Meta
        }
    }
}
```

#### 4.4 Implementar Dual Mode

**Arquivo:** `Pregiato.API/Controllers/ChatsController.cs`

```csharp
[HttpPost("{id}/send")]
public async Task<IActionResult> Send(string id, [FromBody] SendRequest request)
{
    // ... validações e preparação ...

    // DUAL MODE: Verificar qual provider usar
    var useMetaAPI = _configuration.GetValue<bool>("WhatsApp:UseMetaAPI", false);

    if (useMetaAPI)
    {
        _logger.LogInformation("🆕 [META API MODE] Enviando via Meta");

        try
        {
            // Upload de mídia se necessário
            string? metaMediaId = null;
            
            if (isMediaMessage && attachment != null)
            {
                var mediaBuffer = await _minIOStorageAdapter
                    .DownloadMediaAsync(mediaUrl.MediaUrl);

                var uploadResult = await _metaClient.UploadMediaAsync(
                    mediaBuffer,
                    attachment.MimeType,
                    attachment.FileName
                );

                if (uploadResult.Success)
                {
                    metaMediaId = uploadResult.MediaId;
                }
            }

            // Enviar mensagem
            MetaSendMessageResult sendResult;

            if (isMediaMessage && !string.IsNullOrEmpty(metaMediaId))
            {
                sendResult = await _metaClient.SendMediaMessageAsync(
                    to: toNormalized,
                    mediaType: message.Type,
                    mediaId: metaMediaId,
                    caption: body,
                    clientMessageId: message.Id
                );
            }
            else
            {
                sendResult = await _metaClient.SendTextMessageAsync(
                    to: toNormalized,
                    body: body,
                    clientMessageId: message.Id
                );
            }

            if (sendResult.Success)
            {
                return Ok(new
                {
                    success = true,
                    messageId = message.Id,
                    whatsappMessageId = sendResult.WhatsAppMessageId,
                    provider = "meta_api"
                });
            }
            else
            {
                // Fallback para Zap-Blaster
                var fallbackEnabled = _configuration
                    .GetValue<bool>("WhatsApp:FallbackToZapBlaster", false);

                if (fallbackEnabled)
                {
                    _logger.LogWarning("🔄 [FALLBACK] Usando Zap-Blaster");
                    await _rabbit.PublishAsync("whatsapp.outgoing", cmd);
                    return Ok(new { success = true, provider = "zapblaster_fallback" });
                }

                return StatusCode(500, new { error = sendResult.Error });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Exception na Meta API");
            
            // Fallback
            var fallbackEnabled = _configuration
                .GetValue<bool>("WhatsApp:FallbackToZapBlaster", false);

            if (fallbackEnabled)
            {
                await _rabbit.PublishAsync("whatsapp.outgoing", cmd);
                return Ok(new { success = true, provider = "zapblaster_fallback" });
            }

            return StatusCode(500, new { error = ex.Message });
        }
    }
    else
    {
        // Modo legado: Zap-Blaster
        _logger.LogInformation("📤 [ZAPBLASTER MODE]");
        await _rabbit.PublishAsync("whatsapp.outgoing", cmd);
        return Ok(new { success = true, provider = "zapblaster" });
    }
}
```

---

### **5. CONFIGURAÇÃO** (30 min)

#### 5.1 appsettings.json

```json
{
  "Meta": {
    "PhoneNumberId": "",
    "AccessToken": "",
    "WebhookVerifyToken": "",
    "ApiVersion": "v21.0",
    "BaseUrl": "https://graph.facebook.com/v21.0"
  },
  "WhatsApp": {
    "UseMetaAPI": false,
    "FallbackToZapBlaster": true,
    "Provider": "ZapBlaster"
  }
}
```

#### 5.2 Program.cs

```csharp
// Meta API Configuration
builder.Services.AddHttpClient("MetaAPI", client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["Meta:BaseUrl"] ?? 
        "https://graph.facebook.com/v21.0"
    );
    client.Timeout = TimeSpan.FromSeconds(30);
});

// Meta API Services
builder.Services.AddScoped<IMetaAPIClient, MetaAPIAdapter>();
builder.Services.AddScoped<IMetaWebhookProcessor, MetaWebhookProcessor>();
```

---

### **6. ESTRATÉGIA DE MIGRAÇÃO** (45 min)

#### Semana 1: Preparação

```
✅ Configurar Meta Business Manager
✅ Obter credenciais (Phone ID + Token)
✅ Adicionar configurações ao appsettings.json
✅ Compilar e testar localmente
✅ Deploy das alterações (com UseMetaAPI=false)
```

#### Semana 2: Testes Iniciais

```
⚙️ Configurar:
{
  "UseMetaAPI": true,
  "FallbackToZapBlaster": true
}

📅 Ativar em horários específicos:
- Segunda 9h-12h: Meta API
- Segunda 13h-18h: Zap-Blaster
- Terça: Repetir

📊 Monitorar:
- Logs do backend
- Taxa de sucesso
- Latência
- Erros
```

#### Semana 3: Meta API 50%

```
📅 Distribuição:
- Manhã (8h-12h): Meta API
- Tarde (13h-18h): Zap-Blaster

📊 Comparar métricas:
- Taxa de entrega
- Tempo de resposta
- Satisfação dos operadores
```

#### Semana 4: Meta API 100%

```
⚙️ Configurar:
{
  "UseMetaAPI": true,
  "FallbackToZapBlaster": false
}

✅ Desativar Zap-Blaster
✅ Remover QR Code button do frontend
✅ Limpar código legado (opcional)
```

---

### **7. TESTES E VALIDAÇÃO** (1 hora)

#### Teste 1: Compilação

```bash
cd back/Pregiato.API
dotnet build

# Esperado: 0 errors
```

#### Teste 2: Webhook Verification

```bash
curl -X GET "https://api.pregiato.com/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=pregiato_webhook_secret_2025&hub.challenge=test123"

# Esperado: test123
```

#### Teste 3: Envio de Mensagem

```bash
# Via Postman
POST /api/chats/5511987654321/send

# Body:
{
  "Contact": {"Name": "Teste", "PhoneE164": "5511987654321"},
  "Messages": [{
    "Id": "test-1",
    "body": "Teste Meta API",
    "Type": "text",
    "Direction": "outbound",
    "timestamp": "2025-10-17T10:00:00Z"
  }]
}

# Resposta esperada:
{
  "success": true,
  "messageId": "test-1",
  "whatsappMessageId": "wamid.xxx",
  "provider": "meta_api"
}
```

#### Teste 4: Recebimento via Webhook

```
1. Envie mensagem do WhatsApp para o número
2. Meta chama /api/webhooks/meta
3. Backend processa
4. SignalR emite evento
5. Frontend recebe mensagem
```

---

## 🔨 EXERCÍCIOS PRÁTICOS

### **Exercício 1: Setup Meta Business** (2 horas)

1. Crie conta Meta Business Manager
2. Configure WhatsApp Business Account
3. Verifique número de telefone
4. Obtenha Phone Number ID
5. Gere Access Token
6. Configure Webhook

### **Exercício 2: Testar Meta API** (1 hora)

Use Postman para:

1. Enviar mensagem de texto
2. Enviar imagem
3. Obter informações do número
4. Marcar mensagem como lida

### **Exercício 3: Implementar Dual Mode** (2 horas)

1. Adicione flag UseMetaAPI
2. Implemente lógica condicional no ChatsController
3. Teste com flag true e false
4. Implemente fallback
5. Monitore logs

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] Meta Business Manager configurado
- [ ] WhatsApp Business Account criado
- [ ] Número verificado
- [ ] Phone Number ID obtido
- [ ] Access Token gerado (nunca expira)
- [ ] Webhook configurado e verificado
- [ ] IMetaAPIClient implementado
- [ ] MetaAPIAdapter criado
- [ ] MetaWebhookController implementado
- [ ] Dual Mode implementado em ChatsController
- [ ] Fallback funcionando
- [ ] Testes de envio OK
- [ ] Testes de recebimento OK
- [ ] Documentação atualizada

---

## 🎯 RESULTADO FINAL

Ao final deste módulo, você terá:

✅ **Sistema funcionando com ambas APIs**
✅ **Migração sem downtime**
✅ **Fallback automático**
✅ **Frontend 100% preservado**
✅ **Lógica de negócio intacta**

**Parabéns! Você migrou para a API oficial do WhatsApp! 🎉**

