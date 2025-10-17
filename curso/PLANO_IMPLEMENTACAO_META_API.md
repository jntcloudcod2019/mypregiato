# 🚀 PLANO DE IMPLEMENTAÇÃO - MIGRAÇÃO META API

## 📋 ORDEM DE IMPLEMENTAÇÃO

### **PRINCÍPIO: Implementar sem quebrar o sistema atual**

---

## 🎯 FASE 1: INFRAESTRUTURA BASE (Dia 1-2)

### **1.1 - Criar Interfaces e Modelos**
- [ ] `back/Pregiato.Application/Interfaces/IMetaAPIClient.cs`
- [ ] `back/Pregiato.Application/DTOs/Meta/` (request/response models)

### **1.2 - Implementar Adapter Meta API**
- [ ] `back/Pregiato.Infrastructure/Adapters/MetaAPIAdapter.cs`

### **1.3 - Criar Webhook Endpoint**
- [ ] `back/Pregiato.API/Controllers/MetaWebhookController.cs`

### **1.4 - Criar Processador de Webhooks**
- [ ] `back/Pregiato.Application/Services/MetaWebhookProcessor.cs`

### **1.5 - Configurações**
- [ ] `back/Pregiato.API/appsettings.json` (adicionar seção Meta)
- [ ] `back/Pregiato.API/Program.cs` (registrar serviços)

---

## 🔧 FASE 2: DUAL MODE (Dia 3-4)

### **2.1 - Modificar ChatsController**
- [ ] Adicionar flag `UseMetaAPI`
- [ ] Implementar lógica condicional em `Send()`

### **2.2 - Health Check Meta API**
- [ ] Criar serviço de health check
- [ ] Emitir status via SignalR

### **2.3 - Testes Iniciais**
- [ ] Testar envio texto via Meta
- [ ] Testar envio imagem via Meta
- [ ] Testar recebimento via webhook

---

## 🎨 FASE 3: AJUSTES FRONTEND (Dia 5)

### **3.1 - Atualizar BotStatusCard**
- [ ] Remover lógica de QR Code (manter código comentado)
- [ ] Adicionar exibição de info Meta

### **3.2 - Simplificar useWhatsAppConnection**
- [ ] Remover funções de QR
- [ ] Adicionar campos Meta

---

## ✅ FASE 4: VALIDAÇÃO E MIGRAÇÃO (Semana 2)

### **4.1 - Testes Extensivos**
- [ ] Todos os tipos de mensagem
- [ ] Status updates
- [ ] Performance e latência

### **4.2 - Migração Gradual**
- [ ] Ativar Meta API 50%
- [ ] Ativar Meta API 100%

---

## 🔨 COMEÇANDO A IMPLEMENTAÇÃO AGORA

Vou criar os arquivos na ordem correta:

1. ✅ Interfaces e DTOs
2. ✅ MetaAPIAdapter
3. ✅ MetaWebhookController
4. ✅ MetaWebhookProcessor
5. ✅ Configurações
6. ✅ Modificar ChatsController (dual mode)

