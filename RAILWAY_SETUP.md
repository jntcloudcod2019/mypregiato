# Configuração dos Projetos no Railway

## 🚨 PROBLEMA IDENTIFICADO

O Railway estava usando o Dockerfile do Zap Bot (Node.js) para a API (.NET) porque o `railway.json` na raiz estava configurado para o Zap Bot.

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. **Estrutura Final Organizada:**

```
mypregiato/
├── RAILWAY_SETUP.md (Documentação)
├── front/ (Frontend React)
├── zap-blaster-projeto/
│   ├── Dockerfile (Zap Bot - Node.js)
│   ├── railway.json (Zap Bot)
│   ├── package.json
│   └── zap.js
└── back/
    ├── Dockerfile (API - .NET)
    ├── railway.json (API)
    ├── docker-compose.yml
    └── Pregiato.API/
        ├── Program.cs
        ├── Pregiato.API.csproj
        └── Controllers/
```

**✅ Arquivos removidos da raiz:**
- `railway.json` (estava causando conflito)
- `Dockerfile` (era do Zap Bot, movido para pasta específica)

### 2. **Configuração no Railway:**

#### **Para a API (.NET):**
- **Root Directory**: `/back/`
- **Dockerfile**: `back/Dockerfile`
- **Porta**: 5656

#### **Para o Zap Bot (Node.js):**
- **Root Directory**: `/zap-blaster-projeto/`
- **Dockerfile**: `zap-blaster-projeto/Dockerfile`
- **Porta**: 3000

## 🔧 **Passos para Configurar no Railway:**

### **1. Projeto API (Pregiato.API):**

1. **Conectar Repositório:**
   - Repositório: `jntcloudcod2019/mypregiato`
   - **Root Directory**: `/back/`

2. **Configurar Variáveis de Ambiente:**
   ```bash
   ASPNETCORE_ENVIRONMENT=Production
   ASPNETCORE_URLS=http://+:${PORT:-5656}
   MYSQL_DATABASE=railway
   MYSQL_ROOT_PASSWORD=nmZKnTmDpQIwmvRBYIoIbFjYyaiZPoEq
   MYSQLDATABASE=railway
   MYSQLHOST=${{RAILWAY_PRIVATE_DOMAIN}}
   MYSQLPASSWORD=nmZKnTmDpQIwmvRBYIoIbFjYyaiZPoEq
   MYSQLPORT=3306
   MYSQLUSER=root
   RABBITMQ_URL=amqp://maqItSI6EBLd3Nmy:faLY4tAuA93tNFysRsigQ6VtBkmf2WoF@${{RAILWAY_TCP_PROXY_DOMAIN}}:${{RAILWAY_TCP_PROXY_PORT}}
   ```

### **2. Projeto Zap Bot:**

1. **Conectar Repositório:**
   - Repositório: `jntcloudcod2019/mypregiato`
   - **Root Directory**: `/zap-blaster-projeto/`

2. **Configurar Variáveis de Ambiente:**
   ```bash
   NODE_ENV=production
   INSTANCE_ID=zap-prod
   API_BASE=https://[sua-api].up.railway.app
   DEBUG=false
   MYSQL_DATABASE=railway
   MYSQL_ROOT_PASSWORD=nmZKnTmDpQIwmvRBYIoIbFjYyaiZPoEq
   MYSQLDATABASE=railway
   MYSQLHOST=${{RAILWAY_PRIVATE_DOMAIN}}
   MYSQLPASSWORD=nmZKnTmDpQIwmvRBYIoIbFjYyaiZPoEq
   MYSQLPORT=3306
   MYSQLUSER=root
   RABBITMQ_URL=amqp://maqItSI6EBLd3Nmy:faLY4tAuA93tNFysRsigQ6VtBkmf2WoF@${{RAILWAY_TCP_PROXY_DOMAIN}}:${{RAILWAY_TCP_PROXY_PORT}}
   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
   ```

## 🌐 **URLs de Produção:**

### **API:**
- **Base URL**: `https://[sua-api].up.railway.app`
- **Swagger**: `https://[sua-api].up.railway.app/swagger`
- **Health**: `https://[sua-api].up.railway.app/health`

### **Zap Bot:**
- **Status**: `https://[seu-zap-bot].up.railway.app/status`
- **QR Code**: `https://[seu-zap-bot].up.railway.app/qr`

## ⚠️ **IMPORTANTE:**

1. **Root Directory** deve ser configurado corretamente para cada projeto
2. **API_BASE** no Zap Bot deve apontar para a URL da API
3. **CORS** na API já está configurado para aceitar requisições do Railway
4. **Portas** estão configuradas corretamente (API: 5656, Zap Bot: 3000)

## 🔄 **Próximos Passos:**

1. **Configurar Root Directory** correto para cada projeto
2. **Fazer Deploy** da API primeiro
3. **Configurar API_BASE** no Zap Bot com a URL da API
4. **Fazer Deploy** do Zap Bot
5. **Testar** conectividade entre os serviços
