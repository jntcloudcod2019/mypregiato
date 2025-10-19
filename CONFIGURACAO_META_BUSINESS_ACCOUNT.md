# 📱 CONFIGURAÇÃO COMPLETA - META WHATSAPP BUSINESS ACCOUNT

## 🎯 VISÃO GERAL

Este guia detalha como configurar uma conta WhatsApp Business na Meta para integração com o sistema Pregiato, incluindo webhooks, autenticação e produção.

---

## 🚀 PASSO 1: CRIAR CONTA BUSINESS META

### **1.1 Acessar Meta for Developers**
1. Acesse: https://developers.facebook.com/
2. Faça login com sua conta Facebook
3. Clique em **"Meus Apps"** → **"Criar App"**

### **1.2 Configurar App**
```
Tipo de App: Business
Nome do App: Pregiato WhatsApp Business
Email de contato: seu-email@empresa.com
```

### **1.3 Adicionar Produto WhatsApp**
1. No painel do app → **"Adicionar Produto"**
2. Selecione **"WhatsApp"**
3. Clique em **"Configurar"**

---

## 🔧 PASSO 2: CONFIGURAR WHATSAPP BUSINESS

### **2.1 Obter Número de Telefone**
1. **WhatsApp Business API** → **"Começar"**
2. Adicione um número de telefone (pode ser temporário)
3. Receba código de verificação via SMS
4. Confirme o número

### **2.2 Configurar Webhook**
```
URL do Webhook: https://pregiato-api-production.up.railway.app/api/whatsapp/webhook
Token de Verificação: [GERAR_TOKEN_SEGURO]
Campos de Webhook: messages, message_status
```

### **2.3 Obter Credenciais**
Após configuração, você terá:
```
Phone Number ID: [ID_DO_NUMERO]
Access Token: [TOKEN_DE_ACESSO]
App Secret: [SECRET_DO_APP]
Webhook Verify Token: [TOKEN_DE_VERIFICACAO]
```

---

## ⚙️ PASSO 3: CONFIGURAR BACKEND

### **3.1 Variáveis de Ambiente**
```json
// appsettings.Production.json
{
  "Meta": {
    "PhoneNumberId": "SEU_PHONE_NUMBER_ID",
    "AccessToken": "SEU_ACCESS_TOKEN",
    "ApiVersion": "v21.0",
    "WebhookVerifyToken": "SEU_WEBHOOK_VERIFY_TOKEN",
    "AppSecret": "SEU_APP_SECRET"
  }
}
```

### **3.2 Configurar Webhook Endpoint**
```csharp
// back/Pregiato.API/Controllers/WhatsAppController.cs
[HttpPost("webhook")]
public async Task<IActionResult> Webhook([FromBody] MetaWebhookPayload payload)
{
    // Verificar se é challenge do Meta
    if (Request.Query.ContainsKey("hub.mode") && 
        Request.Query["hub.mode"] == "subscribe")
    {
        var challenge = Request.Query["hub.challenge"];
        var verifyToken = Request.Query["hub.verify_token"];
        
        if (verifyToken == _configuration["Meta:WebhookVerifyToken"])
        {
            return Ok(challenge);
        }
    }
    
    // Processar webhook
    await _metaWebhookProcessor.ProcessWebhookAsync(payload);
    return Ok();
}
```

---

## 🔐 PASSO 4: CONFIGURAR AUTENTICAÇÃO

### **4.1 Configurar HttpClient**
```csharp
// back/Pregiato.API/Program.cs
builder.Services.AddHttpClient<IMetaAPIClient, MetaAPIAdapter>("MetaAPI", client =>
{
    client.BaseAddress = new Uri("https://graph.facebook.com/v21.0/");
    client.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", builder.Configuration["Meta:AccessToken"]);
    client.Timeout = TimeSpan.FromSeconds(30);
});
```

### **4.2 Configurar Serviços**
```csharp
// back/Pregiato.API/Program.cs
builder.Services.AddScoped<IMetaAPIClient, MetaAPIAdapter>();
builder.Services.AddScoped<IMetaWebhookProcessor, MetaWebhookProcessor>();
```

---

## 📤 PASSO 5: TESTAR ENVIO DE MENSAGENS

### **5.1 Teste Básico**
```csharp
// Teste via API
POST https://pregiato-api-production.up.railway.app/api/whatsapp/send-message
{
  "to": "5511999999999",
  "message": "Olá! Esta é uma mensagem de teste."
}
```

### **5.2 Verificar Logs**
```bash
# Verificar logs da aplicação
docker logs pregiato-api

# Procurar por:
# ✅ [META] Mensagem enviada - WhatsApp ID: wamid.xxx
# 📤 [META] Enviando mensagem de texto - To: 5511999999999
```

---

## 📥 PASSO 6: CONFIGURAR RECEBIMENTO

### **6.1 Webhook URL Pública**
```
URL: https://pregiato-api-production.up.railway.app/api/whatsapp/webhook
Método: POST
Content-Type: application/json
```

### **6.2 Verificar Webhook**
```bash
# Testar webhook localmente
curl -X POST https://pregiato-api-production.up.railway.app/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[]}'
```

---

## 🎵 PASSO 7: CONFIGURAR MÍDIA

### **7.1 Upload de Mídia**
```csharp
// Exemplo de upload
var mediaResult = await _metaClient.UploadMediaAsync(
    fileBuffer, 
    "image/jpeg", 
    "foto.jpg"
);

// Enviar mídia
var messageResult = await _metaClient.SendMediaMessageAsync(
    "5511999999999",
    "image",
    mediaResult.MediaId,
    "Legenda da foto"
);
```

### **7.2 Download de Mídia**
```csharp
// Download automático via webhook
var mediaData = await _metaClient.DownloadMediaAsync(mediaId);
// mediaData.DataUrl contém o base64
```

---

## 🔍 PASSO 8: MONITORAMENTO E LOGS

### **8.1 Health Check**
```csharp
// Verificar saúde da API
var isHealthy = await _metaClient.IsHealthyAsync();
if (!isHealthy)
{
    _logger.LogError("❌ Meta API não está funcionando");
}
```

### **8.2 Logs Estruturados**
```csharp
_logger.LogInformation("📤 [META] Mensagem enviada - To: {To}, ID: {Id}", 
    to, whatsappMessageId);

_logger.LogInformation("📥 [META] Mensagem recebida - From: {From}, Type: {Type}", 
    message.From, message.Type);
```

---

## 🚨 PASSO 9: TROUBLESHOOTING

### **9.1 Problemas Comuns**

#### **Erro 401 - Unauthorized**
```bash
# Verificar Access Token
curl -X GET "https://graph.facebook.com/v21.0/SEU_PHONE_NUMBER_ID" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

#### **Erro 400 - Bad Request**
```json
// Verificar formato do número
{
  "to": "5511999999999",  // ✅ Correto (sem +)
  "to": "+5511999999999" // ❌ Incorreto (com +)
}
```

#### **Webhook não recebe dados**
```bash
# Verificar se webhook está ativo
curl -X GET "https://graph.facebook.com/v21.0/SEU_APP_ID/subscriptions" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

### **9.2 Debug de Webhook**
```csharp
// Adicionar logs detalhados
_logger.LogInformation("🔄 [WEBHOOK] Payload recebido: {Payload}", 
    JsonSerializer.Serialize(payload));
```

---

## 📊 PASSO 10: CONFIGURAÇÃO DE PRODUÇÃO

### **10.1 Rate Limits**
```
Mensagens por segundo: 80
Mensagens por dia: 1.000 (gratuito)
Mensagens por mês: 1.000 (gratuito)
```

### **10.2 Templates de Mensagem**
```json
// Para mensagens em massa, usar templates
{
  "messaging_product": "whatsapp",
  "to": "5511999999999",
  "type": "template",
  "template": {
    "name": "hello_world",
    "language": {
      "code": "pt_BR"
    }
  }
}
```

### **10.3 Configuração de Segurança**
```csharp
// Validar webhook sempre
if (!IsValidWebhookSignature(payload, signature))
{
    return Unauthorized();
}
```

---

## 🎯 RESUMO DA CONFIGURAÇÃO

### **Credenciais Necessárias:**
1. ✅ **Phone Number ID** - ID do número WhatsApp
2. ✅ **Access Token** - Token de acesso da API
3. ✅ **Webhook Verify Token** - Token para validar webhook
4. ✅ **App Secret** - Secret da aplicação

### **URLs Configuradas:**
1. ✅ **Webhook URL** - `https://pregiato-api-production.up.railway.app/api/whatsapp/webhook`
2. ✅ **API Base** - `https://graph.facebook.com/v21.0/`

### **Testes Obrigatórios:**
1. ✅ **Envio de texto** - Mensagem simples
2. ✅ **Envio de mídia** - Imagem/áudio
3. ✅ **Recebimento** - Webhook funcionando
4. ✅ **Status updates** - Delivered/Read

---

## 🔧 COMANDOS ÚTEIS

### **Verificar Status da API:**
```bash
curl -X GET "https://graph.facebook.com/v21.0/SEU_PHONE_NUMBER_ID" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

### **Enviar Mensagem de Teste:**
```bash
curl -X POST "https://graph.facebook.com/v21.0/SEU_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "text",
    "text": {
      "body": "Teste de integração"
    }
  }'
```

### **Verificar Webhook:**
```bash
curl -X GET "https://graph.facebook.com/v21.0/SEU_APP_ID/subscriptions" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

---

## ✅ CHECKLIST FINAL

- [ ] Conta Business Meta criada
- [ ] WhatsApp Business API configurada
- [ ] Número de telefone verificado
- [ ] Webhook configurado e testado
- [ ] Credenciais adicionadas ao backend
- [ ] Teste de envio funcionando
- [ ] Teste de recebimento funcionando
- [ ] Logs de monitoramento ativos
- [ ] Rate limits configurados
- [ ] Segurança implementada

**🎉 Sistema pronto para produção!**
