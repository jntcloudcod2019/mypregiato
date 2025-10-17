# 🚀 GUIA DE INÍCIO RÁPIDO - META API IMPLEMENTAÇÃO

## ✅ ARQUIVOS CRIADOS

### **1. Interfaces e Contratos**
- ✅ `back/Pregiato.Application/Interfaces/IMetaAPIClient.cs`
- ✅ `back/Pregiato.Application/Interfaces/IMetaWebhookProcessor.cs`

### **2. DTOs (Modelos de Dados)**
- ✅ `back/Pregiato.Application/DTOs/Meta/MetaAPIModels.cs`
- ✅ `back/Pregiato.Application/DTOs/Meta/MetaWebhookModels.cs`

### **3. Implementações**
- ✅ `back/Pregiato.Infrastructure/Adapters/MetaAPIAdapter.cs`
- ✅ `back/Pregiato.Application/Services/MetaWebhookProcessor.cs`

### **4. Controllers**
- ✅ `back/Pregiato.API/Controllers/MetaWebhookController.cs`
- ✅ `back/Pregiato.API/Controllers/ChatsController.cs` (MODIFICADO - dual mode)

### **5. Configurações**
- ✅ `back/Pregiato.API/appsettings.json` (adicionada seção Meta)
- ✅ `back/Pregiato.API/Program.cs` (registrado serviços Meta)

---

## 📝 PASSO A PASSO PARA COMEÇAR

### **ETAPA 1: CONFIGURAR META BUSINESS MANAGER** (1-2 horas)

#### 1.1 - Acessar Meta Business Manager
```bash
# Abrir no navegador
https://business.facebook.com
```

#### 1.2 - Criar WhatsApp Business Account
1. Menu lateral: **"WhatsApp Accounts"**
2. Clique: **"Add WhatsApp Business Account"**
3. Preencha:
   - **Nome:** Pregiato Atendimento
   - **Categoria:** Serviços
   - **Descrição:** Sistema de atendimento ao cliente

#### 1.3 - Adicionar Número de Telefone
1. No WhatsApp Account criado, clique em **"Add Phone Number"**
2. Escolha uma opção:
   - **Opção A:** Usar número existente (recomendado)
   - **Opção B:** Obter número novo da Meta (+1 USA, grátis)

3. Se escolher número existente:
   ```
   Número: +55 11 98765-4321
   Método de verificação: SMS
   [Enviar código]
   
   Código recebido: ______
   [Verificar]
   ```

4. Aguarde aprovação (geralmente instantânea)

#### 1.4 - Obter Phone Number ID
1. Clique no número verificado
2. Vá em **"Settings"**
3. Copie o **Phone Number ID:**
   ```
   Phone Number ID: 123456789012345
   ```
   **📋 ANOTE ESTE NÚMERO!**

#### 1.5 - Criar System User e Token
1. Menu: **"Business Settings" → "Users" → "System Users"**
2. Clique **"Add"**
3. Preencha:
   - **Name:** Pregiato API
   - **Role:** Admin
4. Clique em **"Add Assets"**
   - Selecione seu WhatsApp Business Account
   - Permissão: **Full Control**
5. Clique em **"Generate New Token"**:
   ```
   App: [Selecione ou crie um app]
   
   Permissions:
   ✅ whatsapp_business_messaging
   ✅ whatsapp_business_management
   
   Token Expiration:
   🔘 Never expire  ← SELECIONE ESTA!
   
   [Generate Token]
   ```
6. **📋 COPIE O TOKEN IMEDIATAMENTE!**
   ```
   Access Token: EAABsbCS1iHgBO4ZBxZCXaGlkKJHGFkjhgkjHGjhgKJHgjhGJHgjhgJHGjhgkjHGkjhgKJHgjhgKJHGkjhgkjhGKJHgkjhgKJHGkjhgKJH
   ```
   ⚠️ **Não será exibido novamente!**

#### 1.6 - Configurar Webhook
1. WhatsApp Account → **"Configuration" → "Webhook"**
2. Preencha:
   ```
   Callback URL:
   https://api.pregiato.com/api/webhooks/meta
   
   Verify Token:
   pregiato_webhook_secret_2025
   
   [Verify and Save]
   ```
3. Selecione campos para assinar:
   - ✅ **messages**
   - ✅ **message_status**
   - ✅ **message_template_status_update**

4. Clique **"Verify and Save"**
   - Meta fará uma chamada GET para seu endpoint
   - Backend deve responder com o challenge
   - ✅ Webhook verificado!

---

### **ETAPA 2: CONFIGURAR BACKEND** (30 minutos)

#### 2.1 - Adicionar Configurações

**Arquivo:** `back/Pregiato.API/appsettings.json`

```json
{
  "Meta": {
    "PhoneNumberId": "123456789012345",
    "AccessToken": "EAABsbCS1iHgBO4ZBxZCXaGlkKJHGFkjhgkjHGjhgKJHgjhGJHgjhgJHGjhgkjHGkjhgKJHgjhgKJHGkjhgkjhGKJHgkjhgKJHGkjhgKJH",
    "WebhookVerifyToken": "pregiato_webhook_secret_2025",
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

**⚠️ IMPORTANTE:** 
- **NÃO COMMITE ESTES TOKENS NO GIT!**
- Use variáveis de ambiente em produção

#### 2.2 - Variáveis de Ambiente (Railway)

```bash
# No Railway Dashboard, adicione:

META_PHONE_NUMBER_ID=123456789012345
META_ACCESS_TOKEN=EAABsbCS1iHgBO4ZBxZCXaGlkKJHGFkjhgkjHGjhgKJHgjhGJHgjhgJHGjhgkjHGkjhgKJHgjhgKJHGkjhgkjhGKJHgkjhgKJHGkjhgKJH
META_WEBHOOK_VERIFY_TOKEN=pregiato_webhook_secret_2025
WHATSAPP_USE_META_API=false
WHATSAPP_FALLBACK_TO_ZAPBLASTER=true
```

#### 2.3 - Atualizar appsettings para usar variáveis de ambiente

**Arquivo:** `back/Pregiato.API/appsettings.json`

```json
{
  "Meta": {
    "PhoneNumberId": "${META_PHONE_NUMBER_ID}",
    "AccessToken": "${META_ACCESS_TOKEN}",
    "WebhookVerifyToken": "${META_WEBHOOK_VERIFY_TOKEN}",
    "ApiVersion": "v21.0",
    "BaseUrl": "https://graph.facebook.com/v21.0"
  },
  "WhatsApp": {
    "UseMetaAPI": "${WHATSAPP_USE_META_API:false}",
    "FallbackToZapBlaster": "${WHATSAPP_FALLBACK_TO_ZAPBLASTER:true}",
    "Provider": "ZapBlaster"
  }
}
```

---

### **ETAPA 3: TESTAR IMPLEMENTAÇÃO** (1 hora)

#### 3.1 - Compilar e Rodar Backend

```bash
cd back/Pregiato.API
dotnet build

# Verificar se compilou sem erros
# Se houver erros, corrija-os primeiro
```

#### 3.2 - Verificar Logs de Inicialização

```bash
dotnet run

# Aguarde logs:
# ✅ MetaAPIAdapter inicializado - Phone Number ID: 123456789012345
# ✅ Meta API services registered
```

#### 3.3 - Testar Webhook Verification

**Método 1: Via Meta Business Manager**
1. Vá em Webhook Configuration
2. Clique em **"Test"**
3. Meta enviará GET request
4. Verifique logs do backend:
   ```
   📞 [META WEBHOOK] Verificação recebida
   ✅ [META WEBHOOK] Verificação bem-sucedida
   ```

**Método 2: Via cURL**
```bash
curl -X GET "https://api.pregiato.com/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=pregiato_webhook_secret_2025&hub.challenge=test123"

# Resposta esperada:
test123
```

#### 3.4 - Testar Envio de Mensagem (Modo ZapBlaster ainda ativo)

```bash
# Via Postman ou cURL

POST https://api.pregiato.com/api/chats/5511987654321/send
Content-Type: application/json

{
  "Contact": {
    "Name": "Cliente Teste",
    "PhoneE164": "5511987654321",
    "ProfilePic": null
  },
  "Messages": [{
    "Id": "test-msg-001",
    "body": "Olá! Este é um teste.",
    "Type": "text",
    "Direction": "outbound",
    "timestamp": "2025-10-17T10:00:00.000Z",
    "from": "5511999999999@c.us"
  }]
}

# Resposta esperada:
{
  "success": true,
  "messageId": "test-msg-001",
  "provider": "zapblaster"
}
```

#### 3.5 - Ativar Meta API Mode (TESTE)

**Arquivo:** `appsettings.json`
```json
{
  "WhatsApp": {
    "UseMetaAPI": true,    ← MUDAR PARA TRUE
    "FallbackToZapBlaster": true
  }
}
```

Reinicie o backend e envie a mesma mensagem de teste.

**Resposta esperada agora:**
```json
{
  "success": true,
  "messageId": "test-msg-001",
  "whatsappMessageId": "wamid.HBgNNTUxMTk4NzY1NDMyMRUCABIYIDNBMjBGRjdGMjU4RjQxOTZBQzI3MzNCQUJDRkY5RTFEAA==",
  "provider": "meta_api"
}
```

**Verifique logs:**
```
🆕 [META API MODE] Enviando via Meta Cloud API
📤 [META] Enviando mensagem de texto - To: 5511987654321
✅ [META] Mensagem de texto enviada - WhatsApp ID: wamid.xxx
```

---

## 🔍 VALIDAÇÃO DA IMPLEMENTAÇÃO

### **Checklist de Validação:**

- [ ] ✅ Backend compila sem erros
- [ ] ✅ Serviços Meta registrados no DI
- [ ] ✅ Webhook verificado pela Meta
- [ ] ✅ Envio de texto funciona em modo ZapBlaster
- [ ] ✅ Envio de texto funciona em modo Meta API
- [ ] ✅ Logs mostram provider correto (zapblaster ou meta_api)
- [ ] ✅ Fallback funciona (se Meta falhar, usa ZapBlaster)

---

## 🐛 TROUBLESHOOTING

### **Problema 1: Erro de compilação**

**Erro:**
```
error CS0246: The type or namespace name 'IMetaAPIClient' could not be found
```

**Solução:**
```bash
# Certifique-se de que os arquivos foram criados:
ls back/Pregiato.Application/Interfaces/IMetaAPIClient.cs
ls back/Pregiato.Application/DTOs/Meta/

# Adicione referência se necessário:
cd back/Pregiato.API
dotnet add reference ../Pregiato.Application
dotnet add reference ../Pregiato.Infrastructure

# Limpe e recompile:
dotnet clean
dotnet build
```

### **Problema 2: Webhook verification falha**

**Erro:**
```
⚠️ [META WEBHOOK] Verificação falhou
```

**Solução:**
1. Verificar se `Meta:WebhookVerifyToken` está configurado
2. Verificar se o token no Meta Business Manager é o mesmo
3. Verificar logs para ver qual token foi recebido
4. Endpoint deve estar acessível via HTTPS

**Debug:**
```csharp
// Adicione log temporário em MetaWebhookController.cs:

_logger.LogInformation("DEBUG - Expected: {Expected}, Received: {Received}",
    expectedToken, verifyToken);
```

### **Problema 3: Meta API retorna erro 401**

**Erro:**
```
❌ [META] Erro ao enviar mensagem - Status: 401 Unauthorized
```

**Solução:**
1. Verificar se `Meta:AccessToken` está correto
2. Verificar se token não expirou
3. Verificar permissões do System User
4. Gerar novo token se necessário

**Testar token manualmente:**
```bash
curl -X GET "https://graph.facebook.com/v21.0/123456789012345" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Resposta esperada:
{
  "verified_name": "Pregiato",
  "display_phone_number": "+55 11 98765-4321",
  "quality_rating": "GREEN"
}
```

### **Problema 4: Webhook não recebe mensagens**

**Erro:**
```
Envio mensagem pelo WhatsApp mas webhook não é chamado
```

**Solução:**
1. Verificar se webhook está ativo no Meta Business Manager
2. Verificar se campos estão assinados (messages, message_status)
3. Testar endpoint manualmente:

```bash
# Simular webhook da Meta
curl -X POST "https://api.pregiato.com/api/webhooks/meta" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "123456",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "5511987654321",
            "phone_number_id": "123456789012345"
          },
          "messages": [{
            "from": "5511999999999",
            "id": "wamid.test123",
            "timestamp": "1697551234",
            "type": "text",
            "text": {
              "body": "Teste de mensagem"
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

---

## 🔐 SEGURANÇA - PROTEGER TOKENS

### **NUNCA COMMITE TOKENS NO GIT!**

#### Criar arquivo `.env` (local)

**Arquivo:** `back/Pregiato.API/.env`
```bash
META_PHONE_NUMBER_ID=123456789012345
META_ACCESS_TOKEN=EAABsbCS1iHgBO4ZBxZCXaGlkKJHGFkjhgkjHGjhgKJHgjhGJHgjhgJHGjhgkjHGkjhgKJHgjhgKJHGkjhgkjhGKJHgkjhgKJHGkjhgKJH
META_WEBHOOK_VERIFY_TOKEN=pregiato_webhook_secret_2025
```

#### Atualizar `.gitignore`
```bash
# Adicione ao .gitignore:
.env
appsettings.Production.json
appsettings.*.json
!appsettings.json
```

#### Usar User Secrets (desenvolvimento)

```bash
cd back/Pregiato.API

dotnet user-secrets init
dotnet user-secrets set "Meta:PhoneNumberId" "123456789012345"
dotnet user-secrets set "Meta:AccessToken" "SEU_TOKEN_AQUI"
dotnet user-secrets set "Meta:WebhookVerifyToken" "pregiato_webhook_secret_2025"

# Listar secrets:
dotnet user-secrets list
```

---

## 🧪 TESTES PASSO A PASSO

### **TESTE 1: Compilação e Inicialização**

```bash
cd back/Pregiato.API
dotnet clean
dotnet build

# Verificar output:
# ✅ Build succeeded
# 0 Error(s)
```

### **TESTE 2: Verificação de Webhook**

```bash
# Iniciar backend
dotnet run

# Em outro terminal, testar endpoint:
curl -X GET "http://localhost:5656/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=pregiato_webhook_secret_2025&hub.challenge=test123"

# Resposta esperada:
test123
```

### **TESTE 3: Health Check Meta API**

Crie endpoint de teste temporário:

**Arquivo:** `back/Pregiato.API/Controllers/MetaWebhookController.cs`

Adicione método:
```csharp
[HttpGet("test/health")]
public async Task<IActionResult> TestMetaAPIHealth()
{
    try
    {
        var isHealthy = await _metaClient.IsHealthyAsync();
        
        if (isHealthy)
        {
            var info = await _metaClient.GetPhoneNumberInfoAsync();
            
            return Ok(new
            {
                healthy = true,
                phoneNumber = info.DisplayPhoneNumber,
                verifiedName = info.VerifiedName,
                quality = info.QualityRating
            });
        }
        
        return Ok(new { healthy = false, error = "Meta API não respondeu" });
    }
    catch (Exception ex)
    {
        return Ok(new { healthy = false, error = ex.Message });
    }
}
```

Teste:
```bash
curl http://localhost:5656/api/webhooks/meta/test/health
```

### **TESTE 4: Envio de Mensagem em Dual Mode**

**Com UseMetaAPI = false (ZapBlaster):**
```bash
# Enviar mensagem
curl -X POST "http://localhost:5656/api/chats/5511987654321/send" \
  -H "Content-Type: application/json" \
  -d '{
    "Contact": {"Name": "Teste", "PhoneE164": "5511987654321"},
    "Messages": [{
      "Id": "test-1",
      "body": "Teste ZapBlaster",
      "Type": "text",
      "Direction": "outbound",
      "timestamp": "2025-10-17T10:00:00Z"
    }]
  }'

# Resposta esperada:
{
  "success": true,
  "messageId": "test-1",
  "provider": "zapblaster"
}
```

**Com UseMetaAPI = true (Meta API):**
```bash
# Mudar configuração:
# "UseMetaAPI": true

# Reiniciar backend

# Enviar mesma mensagem
# Resposta esperada:
{
  "success": true,
  "messageId": "test-1",
  "whatsappMessageId": "wamid.HBgNNTUxMTk4NzY1NDMyMRUCABIYIDNBMjBGRjdGMjU4RjQxOTZBQzI3MzNCQUJDRkY5RTFEAA==",
  "provider": "meta_api"
}
```

---

## 📊 MONITORAMENTO

### **Logs para Acompanhar:**

#### Durante Envio:
```log
🆕 [META API MODE] Enviando via Meta Cloud API
📤 [META] Enviando mensagem de texto - To: 5511987654321, Length: 10
✅ [META] Mensagem de texto enviada - WhatsApp ID: wamid.xxx
```

#### Durante Recebimento:
```log
📨 [META WEBHOOK] Webhook recebido - Object: whatsapp_business_account, Entries: 1
📥 [META WEBHOOK] Processando 1 mensagens
📨 [META] Processando mensagem inbound - From: 5511999999999, Type: text
✅ [META] Mensagem convertida com sucesso
📤 [META] Evento message.inbound emitido via SignalR
```

---

## ⚡ ATIVAÇÃO GRADUAL

### **SEMANA 1: Modo ZapBlaster (atual)**

```json
{
  "WhatsApp": {
    "UseMetaAPI": false,
    "FallbackToZapBlaster": true
  }
}
```

**Status:** ✅ Sistema funcionando normalmente

---

### **SEMANA 2: Testes com Meta API**

```json
{
  "WhatsApp": {
    "UseMetaAPI": true,
    "FallbackToZapBlaster": true  ← Fallback ativo
  }
}
```

**Ações:**
- [ ] Ativar apenas em horário de teste (manhã)
- [ ] Enviar 10-20 mensagens de teste
- [ ] Validar recebimento de respostas
- [ ] Verificar latência
- [ ] Comparar com ZapBlaster

**Se algo der errado:**
- Fallback para ZapBlaster ativa automaticamente
- Ou reverta manualmente: `"UseMetaAPI": false`

---

### **SEMANA 3: Meta API 50%**

```json
{
  "WhatsApp": {
    "UseMetaAPI": true,
    "FallbackToZapBlaster": true
  }
}
```

**Estratégia:**
- Manhã (8h-12h): Meta API
- Tarde (13h-18h): ZapBlaster
- Comparar métricas

---

### **SEMANA 4: Meta API 100%**

```json
{
  "WhatsApp": {
    "UseMetaAPI": true,
    "FallbackToZapBlaster": false  ← Sem fallback
  }
}
```

**Validar:**
- [ ] Taxa de entrega 99%+
- [ ] Latência < 2s
- [ ] Zero erros críticos
- [ ] Frontend funciona igual

---

## 📈 MÉTRICAS PARA ACOMPANHAR

### **Dashboard de Monitoramento:**

```sql
-- Mensagens enviadas por provider
SELECT 
    JSON_EXTRACT(PayloadJson, '$.Messages[0].provider') as provider,
    COUNT(*) as total,
    DATE(LastMessageAt) as dia
FROM ChatLogs
WHERE LastMessageAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY provider, dia
ORDER BY dia DESC;

-- Taxa de sucesso
SELECT 
    JSON_EXTRACT(PayloadJson, '$.Messages[*].Status') as status,
    COUNT(*) as total
FROM ChatLogs
WHERE LastMessageAt >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY status;
```

### **Métricas Meta API (via Meta Business Manager):**

1. **Throughput:** Mensagens/dia
2. **Quality Rating:** Verde/Amarelo/Vermelho
3. **Delivery Rate:** % entregues
4. **Cost:** Conversas cobradas

---

## 🎯 PRÓXIMOS PASSOS

### **1. Implementar Funcionalidades Adicionais**

- [ ] Health check service (background)
- [ ] Rate limiting Meta API
- [ ] Cache de media IDs
- [ ] Retry strategy específica Meta
- [ ] Webhook signature validation

### **2. Ajustar Frontend**

- [ ] Atualizar `BotStatusCard` (remover QR code button)
- [ ] Adicionar exibição de info Meta
- [ ] Simplificar `useWhatsAppConnection`

### **3. Documentação**

- [ ] Guia de configuração Meta Business Manager
- [ ] Guia de troubleshooting
- [ ] Guia de migração para equipe

---

## 📞 SUPORTE

### **Se precisar de ajuda:**

1. **Documentação Meta:**
   - https://developers.facebook.com/docs/whatsapp/cloud-api
   - https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages

2. **Logs Detalhados:**
   ```json
   {
     "Logging": {
       "LogLevel": {
         "Pregiato.Infrastructure.Adapters.MetaAPIAdapter": "Debug",
         "Pregiato.Application.Services.MetaWebhookProcessor": "Debug"
       }
     }
   }
   ```

3. **Testes na Meta:**
   - Meta Business Manager → API Setup → Send Test Message

---

## ✅ RESUMO DO QUE FOI IMPLEMENTADO

### **Backend:**
1. ✅ Interface `IMetaAPIClient` com todos os métodos necessários
2. ✅ `MetaAPIAdapter` - Cliente HTTP para Meta Cloud API
3. ✅ `MetaWebhookController` - Endpoint para receber webhooks
4. ✅ `MetaWebhookProcessor` - Processa webhooks e emite SignalR
5. ✅ `ChatsController` - DUAL MODE implementado
6. ✅ Configurações em `appsettings.json`
7. ✅ Registro de serviços em `Program.cs`

### **Funcionalidades:**
- ✅ Envio de mensagens de texto via Meta API
- ✅ Envio de mensagens com mídia via Meta API
- ✅ Upload de mídia para Meta API
- ✅ Download de mídia recebida
- ✅ Recebimento de webhooks
- ✅ Processamento de status updates
- ✅ Health check Meta API
- ✅ Fallback para ZapBlaster
- ✅ Logs detalhados

### **Compatibilidade:**
- ✅ Frontend NÃO PRECISA MUDAR
- ✅ SignalR events permanecem iguais
- ✅ ChatLog/PayloadJson preservado
- ✅ Leads/Tickets funcionam igual
- ✅ Sistema de autorização preservado

---

## 🎉 VOCÊ ESTÁ PRONTO PARA COMEÇAR!

### **Próximo comando:**

```bash
cd /Users/worldgames/Documents/PREGIATO/My_pregiato\ /mypregiato/back/Pregiato.API
dotnet build

# Se compilar sem erros:
dotnet run

# Aguarde os logs e siga os testes acima!
```

---

**Documento criado em:** 2025-10-17  
**Versão:** 1.0  
**Status:** 🟢 Pronto para uso

