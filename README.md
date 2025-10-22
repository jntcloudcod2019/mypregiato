# 📋 ANÁLISE TÉCNICA E FUNCIONAL DO FLUXO DE CONTRATOS

## 🏗️ ARQUITETURA GERAL

O sistema de contratos possui uma **arquitetura híbrida** que combina processamento frontend e backend, com integração a serviços externos:

```
Frontend (React) → Backend (C#) → Serviços Externos (Autentique, WhatsApp)
```

---

## 🔧 COMPONENTES TÉCNICOS

### 1. FRONTEND (React/TypeScript)

**📁 Estrutura de Páginas:**
- `front/src/pages/contratos/` - Páginas de criação de contratos
- `front/src/components/contratos/` - Componentes reutilizáveis
- `front/src/services/` - Serviços de integração
- `front/src/templates/` - Templates HTML dos contratos

**🎯 Tipos de Contratos Suportados:**
1. **Super Fotos** (`novo-contrato-super-fotos/`)
2. **Agenciamento** (`agenciamento/novo/`)
3. **Comprometimento** (`comprometimento/`)
4. **Super Fotos Menor** (`super-fotos-menor/`)
5. **Agenciamento Menor** (`agenciamento-menor/`)

**⚙️ Componentes Principais:**
- `ContractAlert` - Alertas de sucesso/erro
- `LoadingSpinner` - Indicadores de carregamento
- `PaymentFields` - Campos de pagamento
- `PDFPreviewModal` - Preview e ações do PDF

### 2. BACKEND (C# .NET)

**📊 Entidades:**
- `Contract.cs` - Entidade principal do contrato
- `ContractTemplate.cs` - Templates de contratos
- `ContractDto.cs` - DTOs para transferência de dados

**🔗 Relacionamentos:**
- `Contract` → `Lead` (opcional)
- `Contract` → `Talent` (via TalentId)

**⚠️ OBSERVAÇÃO IMPORTANTE:**
- **NÃO existe um `ContractsController`** no backend
- A funcionalidade de contratos está **parcialmente implementada**
- Existe apenas a estrutura de dados (entidades/DTOs) mas sem endpoints REST

### 3. SERVIÇOS EXTERNOS

**🔐 Autentique (Assinatura Digital):**
- API GraphQL para envio de documentos
- Geração de links de assinatura
- Integração com WhatsApp para envio

**📱 WhatsApp Integration:**
- Envio de contratos via WhatsApp
- Links de assinatura digital
- Notificações de status

---

## 🔄 FLUXO FUNCIONAL COMPLETO

### 1. CRIAÇÃO DO CONTRATO (Frontend)

```typescript
// 1. Preenchimento do formulário
const [formData, setFormData] = useState({
  cidade: "",
  uf: "",
  dia: "",
  mes: "",
  duracaoContrato: "",
  modeloId: "",
  // ... outros campos
})

// 2. Validação dos dados
if (!formData.cidade || !formData.uf || !formData.dia) {
  setAlert({
    type: "error",
    title: "Campos Obrigatórios",
    message: "Por favor, preencha todos os campos obrigatórios."
  })
  return
}

// 3. Busca dos dados do modelo
const selectedModelo = talents.find(t => t.id === formData.modeloId)
```

### 2. GERAÇÃO DO PDF (Frontend)

```typescript
// 1. Preparação dos dados
const contractData: ContractData = {
  cidade: formData.cidade,
  uf: formData.uf,
  dia: formData.dia,
  mes: formData.mes,
  ano: new Date().getFullYear().toString(),
  modelo: {
    id: selectedModelo.id,
    fullName: selectedModelo.fullName,
    document: selectedModelo.document,
    // ... outros campos
  }
}

// 2. Geração do PDF usando jsPDF + html2canvas
const pdfBase64 = await generateContractPDF(contractData, 'super-fotos')

// 3. Exibição do preview
setPdfPreview({
  show: true,
  pdfBase64,
  contractData
})
```

### 3. TEMPLATES HTML

**📄 Estrutura dos Templates:**
- HTML com CSS inline para compatibilidade
- Interpolação de dados via template literals
- Estilos otimizados para impressão/PDF
- Seções específicas por tipo de contrato

**🎨 Exemplo de Template:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .title { font-size: 18px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>
  </div>
  <div class="content">
    <p>Pelo presente instrumento, celebrado em <strong>${data.cidade}/${data.uf}</strong>...</p>
    <p><strong>MODELO:</strong> ${data.modelo.fullName}</p>
    <!-- ... mais conteúdo -->
  </div>
</body>
</html>
```

### 4. INTEGRAÇÃO COM AUTENTIQUE

```typescript
// 1. Conversão do PDF para blob
const blob = this.base64ToBlob(pdfBase64)

// 2. Criação do FormData para GraphQL
const formData = this.createFormData(blob, contractData, contractType)

// 3. Envio para API do Autentique
const response = await this.sendRequest(formData)

// 4. Processamento da resposta
if (response.data?.createDocument) {
  const document = response.data.createDocument
  const whatsappLink = document.signatures?.[0]?.link?.short_link
  return { success: true, whatsappLink, documentId: document.id }
}
```

### 5. ENVIO VIA WHATSAPP

```typescript
// 1. Geração do link de assinatura
const whatsappLink = modeloSignature?.link?.short_link

// 2. Envio via WhatsApp (integração com sistema existente)
await sendWhatsAppMessage(contractData.modelo.phone, {
  message: `Olá! Você recebeu um contrato para assinatura digital.`,
  link: whatsappLink
})
```

---

## 📊 DADOS E ESTRUTURAS

### 1. ContractData (Frontend)
```typescript
interface ContractData {
  cidade: string
  uf: string
  dia: string
  mes: string
  ano: string
  duracaoContrato?: string
  modelo: {
    id: string
    fullName: string
    document: string
    email: string
    phone: string
    // ... endereço completo
  }
  valorContrato: string
  metodoPagamento: string[]
  paymentData: any
}
```

### 2. Contract (Backend)
```csharp
public class Contract {
    public Guid ContractId { get; set; }
    public string? City { get; set; }
    public string? Uf { get; set; }
    public string? Day { get; set; }
    public string? Month { get; set; }
    public string? Year { get; set; }
    public string? DurationContract { get; set; }
    public string? ContractType { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public StatusPayment PaymentStatus { get; set; }
    public string ContractFilePath { get; set; }
    public byte[]? Content { get; set; }
    public StatusContratc StatusContratc { get; set; }
    public Guid? TalentId { get; set; }
    public string? TalentName { get; set; }
    public Guid? LeadId { get; set; }
}
```

---

## 🔧 RECURSOS TÉCNICOS UTILIZADOS

### 1. Frontend
- **React Hooks** (useState, useEffect)
- **React Router** (navegação)
- **jsPDF + html2canvas** (geração de PDF)
- **Base64 encoding** (conversão de arquivos)
- **GraphQL** (integração com Autentique)
- **WhatsApp API** (envio de mensagens)

### 2. Backend
- **Entity Framework Core** (ORM)
- **AutoMapper** (mapeamento de objetos)
- **MySQL** (banco de dados)
- **SignalR** (comunicação em tempo real)
- **RabbitMQ** (mensageria)

### 3. Serviços Externos
- **Autentique API** (assinatura digital)
- **WhatsApp Business API** (envio de mensagens)
- **MinIO** (armazenamento de arquivos)

---

## ⚠️ LIMITAÇÕES IDENTIFICADAS

### 1. Backend Incompleto
- **Não existe `ContractsController`** - sem endpoints REST
- **Sem serviços de negócio** para contratos
- **Sem validações** no backend
- **Sem persistência** real dos contratos

### 2. Dependência do Frontend
- **Toda lógica de negócio** está no frontend
- **Geração de PDF** no cliente (performance)
- **Sem validação** de dados no backend
- **Sem auditoria** de contratos

### 3. Integração Limitada
- **Autentique** funciona apenas para assinatura
- **WhatsApp** apenas para envio
- **Sem sincronização** com banco de dados
- **Sem rastreamento** de status

---

## 🎯 RECOMENDAÇÕES TÉCNICAS

### 1. Implementar Backend Completo
```csharp
[ApiController]
[Route("api/[controller]")]
public class ContractsController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContractDto dto)
    
    [HttpGet]
    public async Task<IActionResult> GetAll()
    
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateContractDto dto)
}
```

### 2. Mover Lógica para Backend
- **Validações** de dados
- **Geração de PDF** no servidor
- **Integração** com Autentique
- **Persistência** no banco de dados

### 3. Implementar Auditoria
- **Logs** de criação/atualização
- **Rastreamento** de status
- **Histórico** de alterações
- **Notificações** de eventos

---

## 📈 FLUXO DE DADOS ATUAL

```
1. Frontend (Formulário) 
   ↓
2. Frontend (Validação)
   ↓
3. Frontend (Geração PDF)
   ↓
4. Frontend (Preview)
   ↓
5. Autentique API (Assinatura)
   ↓
6. WhatsApp API (Envio)
   ↓
7. [SEM PERSISTÊNCIA NO BACKEND]
```

## 🎯 FLUXO IDEAL RECOMENDADO

```
1. Frontend (Formulário)
   ↓
2. Backend API (Validação)
   ↓
3. Backend (Geração PDF)
   ↓
4. Backend (Persistência)
   ↓
5. Autentique API (Assinatura)
   ↓
6. WhatsApp API (Envio)
   ↓
7. Backend (Atualização Status)
```

O sistema atual funciona **parcialmente** mas precisa de implementação completa do backend para ser robusto e escalável.
