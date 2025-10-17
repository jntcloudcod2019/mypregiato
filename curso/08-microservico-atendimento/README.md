# 🏗️ MÓDULO 8: MICROSERVIÇO DE ATENDIMENTO - ARQUITETURA EM CAMADAS

## 🎯 OBJETIVOS DE APRENDIZADO

Ao final deste módulo, você será capaz de:

- ✅ Arquitetar um microserviço completo de atendimento WhatsApp
- ✅ Separar responsabilidades em camadas bem definidas
- ✅ Implementar DUAS versões do mesmo serviço (Web Client e Meta API)
- ✅ Aplicar padrões de design e Clean Architecture
- ✅ Integrar microserviço com API principal
- ✅ Escolher a melhor solução baseado em recursos disponíveis

---

## ⏱️ DURAÇÃO ESTIMADA

**Total:** 16 horas

- Teoria: 4 horas
- Prática Opção 1 (Web Client): 5 horas
- Prática Opção 2 (Meta API): 5 horas
- Exercícios e Integração: 2 horas

---

## 🔀 DUAS OPÇÕES DE IMPLEMENTAÇÃO

### **Por que duas opções?**

Nem todos os alunos têm acesso à Meta Business Account. Este módulo oferece **duas implementações completas** do mesmo microserviço:

```
┌─────────────────────────────────────────────────┐
│         MICROSERVIÇO DE ATENDIMENTO             │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │   OPÇÃO 1        │  │   OPÇÃO 2        │   │
│  │   Web Client     │  │   Meta API       │   │
│  │   (whatsapp-     │  │   (Oficial)      │   │
│  │    web.js)       │  │                  │   │
│  │                  │  │                  │   │
│  │  ✅ Sem custo    │  │  ✅ Oficial      │   │
│  │  ✅ Rápido setup │  │  ✅ Estável      │   │
│  │  ⚠️ Instável     │  │  ⚠️ Requer conta │   │
│  │  ⚠️ Não oficial  │  │  💰 Pago após    │   │
│  │                  │  │     1k msgs      │   │
│  └──────────────────┘  └──────────────────┘   │
│           │                      │             │
│           └──────────┬───────────┘             │
│                      ▼                         │
│         ┌────────────────────────┐             │
│         │  INTERFACE COMUM       │             │
│         │  (Mesma API REST)      │             │
│         └────────────────────────┘             │
└─────────────────────────────────────────────────┘
```

---

## 📐 ARQUITETURA EM CAMADAS

### **Visão Geral da Arquitetura**

Ambas as opções seguem a **MESMA arquitetura em camadas**:

```
┌─────────────────────────────────────────────────┐
│              PRESENTATION LAYER                 │
│         (API REST - Express/Fastify)            │
│    • POST /messages/send                        │
│    • GET  /messages/status                      │
│    • GET  /health                               │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────┐
│              APPLICATION LAYER                  │
│         (Services - Business Logic)             │
│    • MessageService                             │
│    • MediaService                               │
│    • SessionService                             │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────┐
│              DOMAIN LAYER                       │
│         (Entities, Value Objects)               │
│    • Message                                    │
│    • Contact                                    │
│    • Media                                      │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────┐
│            INFRASTRUCTURE LAYER                 │
│         (Adapters, External Services)           │
│                                                 │
│    OPÇÃO 1:              OPÇÃO 2:              │
│    • WhatsAppWebAdapter  • MetaAPIAdapter      │
│    • QRCodeService       • WebhookHandler      │
│    • SessionManager      • TokenManager        │
│                                                 │
│    COMUM:                                       │
│    • RabbitMQAdapter                           │
│    • MinIOAdapter                              │
│    • MySQLAdapter                              │
└─────────────────────────────────────────────────┘
```

---

## 📁 ESTRUTURA DO MÓDULO

```
08-microservico-atendimento/
│
├── README.md                          # Este arquivo
│
├── comum/                             # Código compartilhado
│   ├── README.md                      # Camadas comuns explicadas
│   ├── domain/                        # Entidades de domínio
│   │   ├── Message.js
│   │   ├── Contact.js
│   │   └── Media.js
│   │
│   ├── application/                   # Serviços de aplicação
│   │   ├── MessageService.js
│   │   ├── MediaService.js
│   │   └── ValidationService.js
│   │
│   ├── infrastructure/                # Infraestrutura comum
│   │   ├── RabbitMQAdapter.js
│   │   ├── MinIOAdapter.js
│   │   └── MySQLAdapter.js
│   │
│   └── presentation/                  # API REST comum
│       ├── routes/
│       ├── controllers/
│       └── middleware/
│
├── opcao-1-webclient/                 # Implementação Web Client
│   ├── README.md                      # Guia completo Opção 1
│   ├── infrastructure/
│   │   ├── WhatsAppWebAdapter.js     # Adapter whatsapp-web.js
│   │   ├── QRCodeService.js          # Gerenciamento QR
│   │   └── SessionManager.js         # Sessões
│   │
│   ├── config/
│   │   └── whatsapp-config.js
│   │
│   └── app.js                         # Aplicação principal
│
└── opcao-2-meta-api/                  # Implementação Meta API
    ├── README.md                      # Guia completo Opção 2
    ├── infrastructure/
    │   ├── MetaAPIAdapter.js          # Adapter Meta Cloud API
    │   ├── WebhookHandler.js          # Processamento webhooks
    │   └── TokenManager.js            # Gerenciamento tokens
    │
    ├── config/
    │   └── meta-config.js
    │
    └── app.js                         # Aplicação principal
```

---

## 🎓 ABORDAGEM PEDAGÓGICA

### **Como estudar este módulo:**

**PASSO 1: Estudar Camadas Comuns** (2 horas)
```
📚 Ler: comum/README.md
💻 Implementar: Domain Layer
💻 Implementar: Application Layer
💻 Implementar: Presentation Layer (API REST)
```

**PASSO 2: Escolher sua opção**

**Se você NÃO tem Meta Business Account:**
```
📚 Ler: opcao-1-webclient/README.md
💻 Implementar: WhatsAppWebAdapter
💻 Implementar: QRCodeService
💻 Implementar: SessionManager
✅ Testar: Sistema funcionando com QR Code
```

**Se você TEM Meta Business Account:**
```
📚 Ler: opcao-2-meta-api/README.md
💻 Implementar: MetaAPIAdapter
💻 Implementar: WebhookHandler
💻 Implementar: TokenManager
✅ Testar: Sistema funcionando com webhooks
```

**PASSO 3: (Opcional) Implementar ambas** (5 horas)
```
💪 Desafio: Implemente as duas opções
🎯 Objetivo: Dual Mode (como no projeto real)
✅ Resultado: Expertise completa
```

---

## 🧩 COMPARAÇÃO TÉCNICA

### **Opção 1: Web Client (whatsapp-web.js)**

**Tecnologias:**
- whatsapp-web.js 1.25.0
- Puppeteer 22.10.0
- QRCode generation
- LocalAuth strategy

**Prós:**
- ✅ Sem custo
- ✅ Setup rápido (15 minutos)
- ✅ Não requer aprovação Meta
- ✅ Todas as features WhatsApp Web
- ✅ Desenvolvimento e testes locais

**Contras:**
- ❌ Instável (sessão cai)
- ❌ Requer QR Code periodicamente
- ❌ Não é oficial (viola ToS)
- ❌ Difícil escalar
- ❌ Alto consumo de recursos

**Ideal para:**
- 👨‍🎓 Estudantes/Aprendizado
- 🧪 Protótipos e MVPs
- 💻 Desenvolvimento local
- 🆓 Projetos sem orçamento

---

### **Opção 2: Meta Cloud API**

**Tecnologias:**
- Meta Cloud API v21.0
- Webhooks
- OAuth 2.0
- REST API

**Prós:**
- ✅ Oficial e suportado
- ✅ Estável (SLA 99.9%)
- ✅ Token permanente
- ✅ Escalável para múltiplos números
- ✅ Features enterprise (templates, botões)

**Contras:**
- ❌ Requer Meta Business Account
- ❌ Processo de aprovação
- ❌ Pago após 1.000 conversas/mês
- ❌ Setup mais complexo (2-4 horas)
- ❌ Webhook precisa HTTPS

**Ideal para:**
- 🏢 Produção enterprise
- 📈 Sistemas escaláveis
- 💰 Projetos com orçamento
- 🎯 Compliance e ToS

---

## 📊 MATRIZ DE DECISÃO

```
┌────────────────────┬──────────────────┬──────────────────┐
│    CRITÉRIO        │   WEB CLIENT     │    META API      │
├────────────────────┼──────────────────┼──────────────────┤
│ Custo              │ 🟢 Grátis        │ 🟡 Pago após 1k  │
│ Setup              │ 🟢 15 minutos    │ 🟡 2-4 horas     │
│ Estabilidade       │ 🔴 Baixa         │ 🟢 Alta (99.9%)  │
│ Oficial            │ 🔴 Não           │ 🟢 Sim           │
│ Escalabilidade     │ 🔴 Difícil       │ 🟢 Fácil         │
│ Manutenção         │ 🔴 Alta          │ 🟢 Baixa         │
│ Features           │ 🟡 Limitadas     │ 🟢 Completas     │
│ Aprendizado        │ 🟢 Excelente     │ 🟢 Excelente     │
│ Portfolio          │ 🟡 Bom           │ 🟢 Ótimo         │
└────────────────────┴──────────────────┴──────────────────┘
```

---

## 🎯 OBJETIVOS DE CADA CAMADA

### **1. Domain Layer** (Camada de Domínio)

**Responsabilidade:** Entidades de negócio puras, sem dependências externas.

**O que você vai criar:**
```javascript
// Message.js
class Message {
  constructor(id, from, to, body, type, timestamp) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.body = body;
    this.type = type;
    this.timestamp = timestamp;
    this.status = 'pending';
  }

  validate() {
    // Validações de negócio
  }

  markAsSent() {
    this.status = 'sent';
  }
}
```

**Conceitos Aprendidos:**
- Value Objects
- Entidades ricas (não anêmicas)
- Validações de domínio
- Invariantes de negócio

---

### **2. Application Layer** (Camada de Aplicação)

**Responsabilidade:** Orquestração de casos de uso, lógica de aplicação.

**O que você vai criar:**
```javascript
// MessageService.js
class MessageService {
  constructor(whatsappAdapter, mediaService, rabbitMQ) {
    this.whatsappAdapter = whatsappAdapter;
    this.mediaService = mediaService;
    this.rabbitMQ = rabbitMQ;
  }

  async sendMessage(messageDto) {
    // 1. Validar
    // 2. Processar mídia se necessário
    // 3. Enviar via adapter
    // 4. Publicar status no RabbitMQ
    // 5. Retornar resultado
  }
}
```

**Conceitos Aprendidos:**
- Use Cases
- DTOs (Data Transfer Objects)
- Orquestração de serviços
- Transações e consistência

---

### **3. Infrastructure Layer** (Camada de Infraestrutura)

**Responsabilidade:** Implementação de adapters, integração com serviços externos.

**O que você vai criar:**

**Opção 1:**
```javascript
// WhatsAppWebAdapter.js
class WhatsAppWebAdapter {
  async sendTextMessage(to, body) {
    return await this.client.sendMessage(to, body);
  }

  async sendMediaMessage(to, media, caption) {
    // Implementação específica whatsapp-web.js
  }
}
```

**Opção 2:**
```javascript
// MetaAPIAdapter.js
class MetaAPIAdapter {
  async sendTextMessage(to, body) {
    return await axios.post(`${this.baseUrl}/messages`, {
      messaging_product: 'whatsapp',
      to,
      text: { body }
    });
  }

  async sendMediaMessage(to, mediaId, caption) {
    // Implementação específica Meta API
  }
}
```

**Conceitos Aprendidos:**
- Adapter Pattern
- Inversão de Dependência
- Interface Segregation
- Testabilidade (mocks)

---

### **4. Presentation Layer** (Camada de Apresentação)

**Responsabilidade:** API REST, validação de entrada, serialização.

**O que você vai criar:**
```javascript
// routes/messages.js
router.post('/send', async (req, res) => {
  try {
    const messageDto = req.body;
    const result = await messageService.sendMessage(messageDto);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**Conceitos Aprendidos:**
- REST API design
- HTTP status codes
- Validação de entrada
- Error handling
- CORS e segurança

---

## 🔄 FLUXO COMPLETO DO MICROSERVIÇO

### **Exemplo: Envio de Mensagem**

```
1. PRESENTATION LAYER
   └─> POST /messages/send
       └─> MessageController.send()

2. APPLICATION LAYER
   └─> MessageService.sendMessage(dto)
       ├─> Validar entrada
       ├─> Criar entidade Message (Domain)
       ├─> Processar mídia se necessário
       └─> Chamar adapter

3. INFRASTRUCTURE LAYER
   └─> WhatsAppAdapter.sendTextMessage()
       │
       ├─> OPÇÃO 1: client.sendMessage() (whatsapp-web.js)
       └─> OPÇÃO 2: axios.post() (Meta API)

4. EXTERNAL SERVICE
   └─> WhatsApp entrega mensagem

5. CALLBACK
   └─> Status update (enviado/entregue/lido)
       └─> Publicar no RabbitMQ
           └─> Backend principal consome
               └─> SignalR notifica frontend
```

---

## 📚 ROTEIRO DE ESTUDO DETALHADO

### **Semana 1: Fundamentos e Camadas Comuns**

**Dia 1-2: Domain Layer** (4 horas)
```
📖 Teoria:
- Domain-Driven Design basics
- Entidades vs Value Objects
- Agregados e raízes

💻 Prática:
- Implementar Message entity
- Implementar Contact entity
- Implementar Media entity
- Testes unitários das entidades
```

**Dia 3-4: Application Layer** (4 horas)
```
📖 Teoria:
- Use Cases e Application Services
- DTOs e Mapping
- Validações de aplicação

💻 Prática:
- Implementar MessageService
- Implementar MediaService
- Implementar ValidationService
- Testes de serviços
```

**Dia 5: Presentation Layer** (4 horas)
```
📖 Teoria:
- REST API design
- Express.js/Fastify
- Middleware e error handling

💻 Prática:
- Setup Express
- Criar rotas
- Implementar controllers
- Testar API com Postman
```

---

### **Semana 2: Escolha sua Opção**

**Opção A: Web Client** (20 horas)
```
Dia 1-2: Setup e Configuração
- whatsapp-web.js installation
- Puppeteer configuration
- QR Code generation
- LocalAuth strategy

Dia 3-4: WhatsAppWebAdapter
- Implementar métodos de envio
- Implementar recebimento
- Download de mídia
- Conversão de áudio

Dia 5: Integração
- Conectar todas as camadas
- Testes end-to-end
- Deploy local
```

**Opção B: Meta API** (20 horas)
```
Dia 1-2: Setup Meta Business
- Criar conta
- Verificar número
- Obter tokens
- Configurar webhook

Dia 3-4: MetaAPIAdapter
- Implementar envio via API
- Upload de mídia
- Webhook handler
- Download de mídia

Dia 5: Integração
- Conectar todas as camadas
- Testes end-to-end
- Deploy com HTTPS
```

---

## 🧪 TESTES E VALIDAÇÃO

### **Testes por Camada:**

**Domain Layer:**
```javascript
// Message.test.js
describe('Message Entity', () => {
  it('should create valid message', () => {
    const msg = new Message('1', '5511999999999', '5511888888888', 'Hello', 'text');
    expect(msg.validate()).toBe(true);
  });

  it('should reject invalid phone', () => {
    expect(() => {
      new Message('1', 'invalid', '5511888888888', 'Hello', 'text');
    }).toThrow();
  });
});
```

**Application Layer:**
```javascript
// MessageService.test.js
describe('MessageService', () => {
  it('should send message successfully', async () => {
    const mockAdapter = { sendTextMessage: jest.fn() };
    const service = new MessageService(mockAdapter);
    
    await service.sendMessage({ to: '5511999999999', body: 'Test' });
    
    expect(mockAdapter.sendTextMessage).toHaveBeenCalled();
  });
});
```

**Integration Tests:**
```javascript
// integration.test.js
describe('Full Flow', () => {
  it('should send message end-to-end', async () => {
    const response = await request(app)
      .post('/messages/send')
      .send({ to: '5511999999999', body: 'Test' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

---

## 📦 ENTREGÁVEIS DO MÓDULO

Ao final, você terá:

### **Código:**
- ✅ Microserviço completo (sua opção escolhida)
- ✅ Todas as camadas implementadas
- ✅ Testes automatizados (>70% coverage)
- ✅ Documentação API (Swagger/OpenAPI)

### **Conhecimento:**
- ✅ Clean Architecture na prática
- ✅ Separação de responsabilidades
- ✅ Adapter Pattern
- ✅ Dependency Injection
- ✅ REST API design
- ✅ Integração WhatsApp (sua opção)

### **Portfolio:**
- ✅ Microserviço production-ready
- ✅ Código no GitHub
- ✅ README técnico detalhado
- ✅ Diagramas de arquitetura

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Leia `comum/README.md` para entender as camadas
2. ✅ Escolha sua opção (Web Client ou Meta API)
3. ✅ Leia o README da opção escolhida
4. ✅ Implemente camada por camada
5. ✅ Teste cada camada isoladamente
6. ✅ Integre tudo e teste end-to-end
7. ✅ (Opcional) Implemente a outra opção também!

---

## 💡 DICAS IMPORTANTES

**Para todos os alunos:**
- 📖 Leia toda a teoria antes de codificar
- 💻 Implemente camada por camada
- ✅ Teste cada camada isoladamente
- 🔄 Refatore conforme aprende
- 📝 Documente suas decisões

**Para Opção 1 (Web Client):**
- ⚡ Setup é rápido, aproveite!
- 🐛 Sessão vai cair, é normal
- 💾 Backup da sessão regularmente
- 🔧 Use em desenvolvimento, não produção

**Para Opção 2 (Meta API):**
- ⏰ Reserve tempo para setup Meta (2-4h)
- 🔐 Guarde tokens com segurança
- 🌐 Webhook precisa HTTPS (use ngrok em dev)
- 💰 Fique de olho no uso (1k grátis/mês)

---

## 🏆 DESAFIO FINAL

**Implemente Dual Mode!**

Se você completar ambas as opções, implemente um sistema que:
- ✅ Permite escolher qual adapter usar via config
- ✅ Fallback automático se um falhar
- ✅ Monitoramento de ambos
- ✅ Switch entre opções em runtime

**Isso é exatamente o que fazemos no projeto real! 🚀**

---

**Vamos começar a construir seu microserviço de atendimento WhatsApp!**

**Próximo passo:** Leia `comum/README.md` para entender as camadas compartilhadas.

**Boa sorte! 💪**

