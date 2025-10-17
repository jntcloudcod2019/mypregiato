# 🐰 MÓDULO 6: MENSAGERIA COM RABBITMQ

## 🎯 OBJETIVOS DE APRENDIZADO

Ao final deste módulo, você será capaz de:

- ✅ Compreender conceitos de mensageria assíncrona
- ✅ Instalar e configurar RabbitMQ
- ✅ Criar exchanges, queues e bindings
- ✅ Implementar publishers e consumers
- ✅ Aplicar padrões de mensageria
- ✅ Gerenciar erros e dead letter queues
- ✅ Monitorar filas e mensagens

---

## ⏱️ DURAÇÃO ESTIMADA

**Total:** 10 horas

- Teoria: 2.5 horas
- Prática: 6 horas
- Exercícios: 1.5 horas

---

## 📚 CONTEÚDO PROGRAMÁTICO

### **1. INTRODUÇÃO À MENSAGERIA** (45 min)

#### O que é Mensageria?

Padrão de comunicação assíncrona entre sistemas desacoplados.

**Comunicação Síncrona vs Assíncrona:**

```
SÍNCRONA (REST API):
Frontend → [Request] → Backend → [Response] → Frontend
         ⏳ Aguarda resposta

ASSÍNCRONA (Mensageria):
Frontend → [Request] → Backend → [Aceito] → Frontend
                           ↓
                      [Processo em background]
                           ↓
                      [Notificação via SignalR]
```

**Vantagens da Mensageria:**

- ✅ **Desacoplamento**: Sistemas não precisam se conhecer
- ✅ **Escalabilidade**: Múltiplos consumers podem processar
- ✅ **Resiliência**: Mensagens não se perdem se consumer cair
- ✅ **Assíncrono**: Não bloqueia o cliente
- ✅ **Load Balancing**: Distribui carga entre workers

**Casos de Uso:**

- Envio de emails em background
- Processamento de imagens
- **Envio de mensagens WhatsApp** ← Nosso caso!
- Notificações push
- Geração de relatórios

---

### **2. CONCEITOS FUNDAMENTAIS DO RABBITMQ** (1 hora)

#### Arquitetura do RabbitMQ

```
┌──────────┐       ┌─────────────────┐       ┌──────────┐
│ Producer │──────►│    Exchange     │──────►│  Queue   │
└──────────┘       └─────────────────┘       └────┬─────┘
                                                   │
                                                   ▼
                                             ┌──────────┐
                                             │ Consumer │
                                             └──────────┘
```

#### Componentes Principais:

**1. Producer (Publicador)**
- Envia mensagens para o RabbitMQ
- Não conhece as queues diretamente
- Envia para um **exchange**

**2. Exchange**
- Recebe mensagens dos producers
- Roteia mensagens para queues baseado em **routing keys**
- Tipos: direct, topic, fanout, headers

**3. Queue (Fila)**
- Armazena mensagens até serem consumidas
- Garante ordem FIFO (First In, First Out)
- Pode ter múltiplos consumers

**4. Consumer (Consumidor)**
- Recebe mensagens das queues
- Processa a mensagem
- Confirma processamento (ACK) ou rejeita (NACK)

**5. Binding**
- Conexão entre exchange e queue
- Define regras de roteamento

#### Tipos de Exchange

```
1. DIRECT (padrão nosso projeto):
   Exchange: "direct"
   Routing Key: "whatsapp.incoming"
   
   Exchange ──[whatsapp.incoming]──► Queue: whatsapp.incoming

2. TOPIC (com patterns):
   Exchange: "logs"
   Pattern: "user.*.error"
   
   Exchange ──[user.login.error]────► Queue: user_errors
   Exchange ──[user.register.error]─► Queue: user_errors
   
3. FANOUT (broadcast):
   Exchange: "notifications"
   
   Exchange ──────────► Queue: email
            └─────────► Queue: sms
            └─────────► Queue: push

4. HEADERS (por headers da mensagem):
   Baseado em headers, não routing key
```

---

### **3. INSTALAÇÃO E SETUP** (1 hora)

#### 3.1 Instalação via Docker (Recomendado)

```bash
# Docker Compose
version: '3.8'
services:
  rabbitmq:
    image: rabbitmq:3.12-management
    ports:
      - "5672:5672"   # AMQP protocol
      - "15672:15672" # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  rabbitmq_data:
```

```bash
# Iniciar
docker-compose up -d

# Acessar Management UI
http://localhost:15672
# Login: admin / admin123
```

#### 3.2 Instalação Nativa (Linux)

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install rabbitmq-server

# Habilitar management plugin
sudo rabbitmq-plugins enable rabbitmq_management

# Iniciar serviço
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server

# Criar usuário
sudo rabbitmqctl add_user admin admin123
sudo rabbitmqctl set_user_tags admin administrator
sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
```

#### 3.3 Configuração no Projeto

**Backend (.NET Core):**

```csharp
// appsettings.json
{
  "RabbitMQ": {
    "Host": "localhost",
    "Port": 5672,
    "Username": "admin",
    "Password": "admin123",
    "VirtualHost": "/"
  }
}
```

**Zap-Blaster (Node.js):**

```javascript
// .env
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin123
RABBITMQ_VHOST=/
```

---

### **4. ARQUITETURA DO SISTEMA** (45 min)

#### Filas do Projeto Pregiato

```
┌─────────────────────────────────────────────────────────┐
│                    RABBITMQ TOPOLOGY                     │
└─────────────────────────────────────────────────────────┘

Exchange: "direct"
├── Binding: whatsapp.incoming
│   └─► Queue: whatsapp.incoming
│       └─► Consumer: Backend (RabbitBackgroundService.cs)
│
├── Binding: whatsapp.outgoing
│   └─► Queue: whatsapp.outgoing
│       └─► Consumer: Zap-Blaster (zap.js)
│
├── Binding: out.qrcode
│   └─► Queue: out.qrcode
│       └─► Consumer: Backend (RabbitBackgroundService.cs)
│
├── Binding: session.status
│   └─► Queue: session.status
│       └─► Consumer: Backend (RabbitBackgroundService.cs)
│
└── Binding: whatsapp.message-status
    └─► Queue: whatsapp.message-status
        └─► Consumer: Backend (RabbitBackgroundService.cs)
```

#### Fluxo de Mensagens

**1. Mensagem Inbound (Cliente → Sistema):**

```
WhatsApp Client
      ↓
Zap-Blaster (onInbound)
      ↓
RabbitMQ [whatsapp.incoming]
      ↓
Backend (RabbitBackgroundService)
      ↓
Database (ChatLog)
      ↓
SignalR Hub
      ↓
Frontend (atendimento/index.tsx)
```

**2. Mensagem Outbound (Sistema → Cliente):**

```
Frontend (sendMessage)
      ↓
Backend (ChatsController.Send)
      ↓
RabbitMQ [whatsapp.outgoing]
      ↓
Zap-Blaster (sendOne)
      ↓
WhatsApp Web.js
      ↓
WhatsApp Client
```

---

### **5. IMPLEMENTAÇÃO - BACKEND (.NET)** (1.5 horas)

#### 5.1 Setup da Conexão

```csharp
// Services/RabbitBackgroundService.cs
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

public class RabbitBackgroundService : BackgroundService
{
    private IConnection? _connection;
    private IModel? _channel;
    private readonly ILogger<RabbitBackgroundService> _logger;
    private readonly IConfiguration _configuration;

    public RabbitBackgroundService(
        ILogger<RabbitBackgroundService> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Conectar ao RabbitMQ
        await ConnectAsync();

        // Declarar exchanges e queues
        SetupTopology();

        // Iniciar consumers
        StartConsumers();

        // Aguardar cancelamento
        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task ConnectAsync()
    {
        var factory = new ConnectionFactory
        {
            HostName = _configuration["RabbitMQ:Host"],
            Port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672"),
            UserName = _configuration["RabbitMQ:Username"],
            Password = _configuration["RabbitMQ:Password"],
            VirtualHost = _configuration["RabbitMQ:VirtualHost"] ?? "/",
            
            // Configurações de resiliência
            AutomaticRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(10),
            RequestedHeartbeat = TimeSpan.FromSeconds(60)
        };

        try
        {
            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();
            
            _logger.LogInformation("✅ Conectado ao RabbitMQ");
            
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro ao conectar ao RabbitMQ");
            throw;
        }
    }

    private void SetupTopology()
    {
        if (_channel == null) return;

        // Declarar exchange
        _channel.ExchangeDeclare(
            exchange: "direct",
            type: ExchangeType.Direct,
            durable: true,
            autoDelete: false
        );

        // Declarar queues e bindings
        var queues = new[]
        {
            "whatsapp.incoming",
            "whatsapp.outgoing",
            "out.qrcode",
            "session.status",
            "whatsapp.message-status"
        };

        foreach (var queue in queues)
        {
            _channel.QueueDeclare(
                queue: queue,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null
            );

            _channel.QueueBind(
                queue: queue,
                exchange: "direct",
                routingKey: queue
            );

            _logger.LogInformation($"✅ Queue criada: {queue}");
        }
    }
}
```

#### 5.2 Consumer de Mensagens

```csharp
private void StartConsumers()
{
    if (_channel == null) return;

    // Consumer para mensagens inbound
    var consumer = new EventingBasicConsumer(_channel);
    
    consumer.Received += async (model, ea) =>
    {
        try
        {
            var body = ea.Body.ToArray();
            var message = Encoding.UTF8.GetString(body);
            
            _logger.LogInformation($"📨 Mensagem recebida - Queue: {ea.RoutingKey}");
            
            // Processar mensagem
            await ProcessIncomingMessage(message);
            
            // ACK - confirma processamento
            _channel.BasicAck(ea.DeliveryTag, multiple: false);
            
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Erro ao processar mensagem");
            
            // NACK - rejeita sem requeue (vai para DLQ se configurado)
            _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
        }
    };

    // Iniciar consumo
    _channel.BasicConsume(
        queue: "whatsapp.incoming",
        autoAck: false, // Manual ACK
        consumer: consumer
    );

    _logger.LogInformation("✅ Consumer iniciado: whatsapp.incoming");
}
```

#### 5.3 Publisher (Envio de Mensagens)

```csharp
public async Task PublishAsync(string routingKey, object payload)
{
    if (_channel == null)
    {
        throw new InvalidOperationException("RabbitMQ não está conectado");
    }

    try
    {
        var json = JsonSerializer.Serialize(payload);
        var body = Encoding.UTF8.GetBytes(json);

        var properties = _channel.CreateBasicProperties();
        properties.Persistent = true; // Garante persistência
        properties.ContentType = "application/json";
        properties.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());

        _channel.BasicPublish(
            exchange: "direct",
            routingKey: routingKey,
            basicProperties: properties,
            body: body
        );

        _logger.LogInformation($"📤 Mensagem publicada - Queue: {routingKey}");
        
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "❌ Erro ao publicar mensagem");
        throw;
    }
}
```

---

### **6. IMPLEMENTAÇÃO - ZAP-BLASTER (NODE.JS)** (1.5 horas)

#### 6.1 Setup da Conexão

```javascript
// zap.js
const amqp = require('amqplib');

let amqpConn = null;
let amqpChan = null;

async function connectRabbitMQ() {
  try {
    const rabbitUrl = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
    
    amqpConn = await amqp.connect(rabbitUrl, {
      heartbeat: 60,
      connectionTimeout: 30000
    });
    
    amqpChan = await amqpConn.createChannel();
    
    // Declarar topology
    await amqpChan.assertExchange('direct', 'direct', { durable: true });
    
    const queues = [
      'whatsapp.incoming',
      'whatsapp.outgoing',
      'out.qrcode',
      'session.status',
      'whatsapp.message-status'
    ];
    
    for (const queue of queues) {
      await amqpChan.assertQueue(queue, { durable: true });
      await amqpChan.bindQueue(queue, 'direct', queue);
    }
    
    Log.success('✅ Conectado ao RabbitMQ');
    
    // Configurar reconexão
    amqpConn.on('error', (err) => {
      Log.error('❌ Erro na conexão RabbitMQ:', err.message);
      setTimeout(connectRabbitMQ, 5000);
    });
    
    amqpConn.on('close', () => {
      Log.warn('⚠️ Conexão RabbitMQ fechada. Reconectando...');
      setTimeout(connectRabbitMQ, 5000);
    });
    
  } catch (error) {
    Log.error('❌ Falha ao conectar RabbitMQ:', error.message);
    setTimeout(connectRabbitMQ, 5000);
  }
}
```

#### 6.2 Consumer

```javascript
async function startConsumers() {
  // Consumer para mensagens outgoing
  await amqpChan.consume('whatsapp.outgoing', async (msg) => {
    if (!msg) return;
    
    try {
      const cmd = JSON.parse(msg.content.toString());
      
      Log.info(`📨 Mensagem recebida - Command: ${cmd.command}`);
      
      if (cmd.command === 'send_message') {
        await sendOne(cmd);
      } else if (cmd.command === 'generate_qr') {
        await handleGenerateQR();
      } else if (cmd.command === 'disconnect') {
        await handleDisconnect();
      }
      
      // ACK
      amqpChan.ack(msg);
      
    } catch (error) {
      Log.error('❌ Erro ao processar mensagem:', error);
      
      // NACK sem requeue
      amqpChan.nack(msg, false, false);
    }
  }, { noAck: false });
  
  Log.success('✅ Consumer iniciado: whatsapp.outgoing');
}
```

#### 6.3 Publisher

```javascript
async function publishMessage(queue, payload) {
  try {
    const buffer = Buffer.from(JSON.stringify(payload));
    
    amqpChan.publish(
      'direct',
      queue,
      buffer,
      {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now()
      }
    );
    
    Log.success(`📤 Mensagem publicada - Queue: ${queue}`);
    
  } catch (error) {
    Log.error(`❌ Erro ao publicar mensagem:`, error);
    throw error;
  }
}
```

---

### **7. PADRÕES AVANÇADOS** (1 hora)

#### 7.1 Dead Letter Queue (DLQ)

Fila para mensagens que falharam repetidamente.

```csharp
// Criar queue principal com DLQ
_channel.QueueDeclare(
    queue: "whatsapp.incoming",
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: new Dictionary<string, object>
    {
        {"x-dead-letter-exchange", "dlx"},
        {"x-dead-letter-routing-key", "whatsapp.incoming.failed"}
    }
);

// Criar DLX (Dead Letter Exchange)
_channel.ExchangeDeclare(
    exchange: "dlx",
    type: ExchangeType.Direct,
    durable: true
);

// Criar DLQ (Dead Letter Queue)
_channel.QueueDeclare(
    queue: "whatsapp.incoming.failed",
    durable: true,
    exclusive: false,
    autoDelete: false
);

_channel.QueueBind(
    queue: "whatsapp.incoming.failed",
    exchange: "dlx",
    routingKey: "whatsapp.incoming.failed"
);
```

**Como funciona:**

```
1. Mensagem chega em whatsapp.incoming
2. Consumer processa e falha
3. Consumer envia NACK (sem requeue)
4. RabbitMQ move para DLX
5. DLX roteia para whatsapp.incoming.failed (DLQ)
6. Mensagem fica na DLQ para análise manual
```

#### 7.2 Prefetch Count

Controla quantas mensagens não-ACK um consumer pode ter.

```csharp
// Permite apenas 1 mensagem não-ACK por vez
_channel.BasicQos(
    prefetchSize: 0,
    prefetchCount: 1,
    global: false
);
```

**Por que usar:**

- Evita sobrecarga de um único consumer
- Distribui melhor a carga entre múltiplos consumers
- Garante que consumer lento não acumule mensagens

#### 7.3 Priority Queue

Mensagens com prioridade.

```csharp
_channel.QueueDeclare(
    queue: "whatsapp.outgoing",
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: new Dictionary<string, object>
    {
        {"x-max-priority", 10}
    }
);

// Publicar com prioridade
var properties = _channel.CreateBasicProperties();
properties.Priority = 5; // 0-10

_channel.BasicPublish("direct", "whatsapp.outgoing", properties, body);
```

---

### **8. MONITORAMENTO** (45 min)

#### 8.1 Management UI

Acessar: `http://localhost:15672`

**Recursos:**
- Visualizar exchanges, queues, connections
- Ver mensagens na fila
- Monitorar taxa de publicação/consumo
- Purgar filas
- Declarar topology manualmente

#### 8.2 Métricas Importantes

- **Ready**: Mensagens prontas para consumo
- **Unacked**: Mensagens entregues mas sem ACK
- **Total**: Total de mensagens na fila
- **Incoming rate**: Taxa de entrada (msg/s)
- **Outgoing rate**: Taxa de saída (msg/s)
- **Consumers**: Número de consumers ativos

#### 8.3 Health Check

```csharp
public async Task<bool> IsHealthy()
{
    if (_connection == null || !_connection.IsOpen)
        return false;

    if (_channel == null || !_channel.IsOpen)
        return false;

    return true;
}
```

---

## 🔨 EXERCÍCIOS PRÁTICOS

### **Exercício 1: Setup RabbitMQ** (30 min)

1. Instale RabbitMQ via Docker
2. Acesse Management UI
3. Crie manualmente:
   - Exchange "test"
   - Queue "test.queue"
   - Binding entre eles

### **Exercício 2: Publisher Simples** (45 min)

Crie um script Node.js que:
1. Conecta ao RabbitMQ
2. Publica 10 mensagens em "test.queue"
3. Fecha a conexão

### **Exercício 3: Consumer Simples** (45 min)

Crie um script Node.js que:
1. Conecta ao RabbitMQ
2. Consome mensagens de "test.queue"
3. Imprime no console
4. Envia ACK

---

## ✅ CHECKLIST DE CONCLUSÃO

- [ ] RabbitMQ instalado e rodando
- [ ] Management UI acessível
- [ ] Entendo conceitos de exchange, queue, binding
- [ ] Implementei publisher no backend
- [ ] Implementei consumer no backend
- [ ] Implementei publisher no Zap-Blaster
- [ ] Implementei consumer no Zap-Blaster
- [ ] Testei fluxo de mensagem completo
- [ ] Configurei Dead Letter Queue
- [ ] Monitorei métricas no Management UI

---

## 🎯 PRÓXIMO MÓDULO

**Módulo 7: Real-Time com SignalR**

Vamos aprender comunicação real-time entre backend e frontend!

**Vamos lá! 🚀**

