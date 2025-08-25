import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Badge } from "../../../components/ui/badge"
import { ArrowLeft, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { LoadingSpinner } from "../../../components/contratos/loading-spinner"
import { ContractAlert } from "../../../components/contratos/contract-alert"
import { PaymentFields } from "../../../components/contratos/payment-fields"

// Mock data - Em produção viria do banco
const mockProdutores = [
  { id: "1", name: "João Santos", email: "joao@example.com" },
  { id: "2", name: "Ana Costa", email: "ana@example.com" },
  { id: "3", name: "Carlos Oliveira", email: "carlos@example.com" }
]

const mockModelos = [
  { id: "1", fullName: "Maria Silva", document: "123.456.789-00", email: "maria@example.com" },
  { id: "2", fullName: "Pedro Lima", document: "987.654.321-00", email: "pedro@example.com" },
  { id: "3", fullName: "Laura Santos", document: "456.789.123-00", email: "laura@example.com" }
]

const metodosPagemento = [
  "Sem Custo",
  "PIX", 
  "Débito",
  "Dinheiro",
  "Cartão de Crédito",
  "Link de Pagamento"
]

const mesesPorExtenso = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
]

export default function NovoContratoSuperFotosMenor() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState<{
    type: "success" | "warning"
    title: string
    message: string
    show: boolean
  }>({ type: "success", title: "", message: "", show: false })
  
  const [formData, setFormData] = useState({
    cidade: "",
    uf: "",
    dia: "",
    mes: "",
    duracaoContrato: "",
    produtorId: "",
    modeloId: "",
    modeloSearch: "",
    nomeResponsavel: "",
    cpfResponsavel: "",
    metodoPagamento: [] as string[],
    paymentData: {}
  })

  const handleMetodoPagamentoChange = (metodo: string) => {
    setFormData(prev => {
      const metodos = prev.metodoPagamento.includes(metodo)
        ? prev.metodoPagamento.filter(m => m !== metodo)
        : [...prev.metodoPagamento, metodo]
      
      return { ...prev, metodoPagamento: metodos }
    })
  }

  const filteredModelos = mockModelos.filter(modelo =>
    modelo.fullName.toLowerCase().includes(formData.modeloSearch.toLowerCase()) ||
    modelo.document.includes(formData.modeloSearch) ||
    modelo.email.toLowerCase().includes(formData.modeloSearch.toLowerCase())
  )

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '')
    if (numbers.length !== 11) return false
    
    // Validação básica de CPF
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(numbers.charAt(9))) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    return remainder === parseInt(numbers.charAt(10))
  }

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value)
    setFormData(prev => ({ ...prev, cpfResponsavel: formatted }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar CPF
    if (!validateCPF(formData.cpfResponsavel)) {
      setAlert({
        type: "warning",
        title: "CPF Inválido",
        message: "Por favor, informe um CPF válido para o responsável.",
        show: true
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      // Simular verificação de contrato existente
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simular resposta da API
      const existeContrato = Math.random() > 0.7 // 30% chance de existir contrato
      
      if (existeContrato) {
        setAlert({
          type: "warning",
          title: "Contrato Existente",
          message: "Existe um contrato para este modelo. Para gerar outro é necessário excluir o anterior",
          show: true
        })
      } else {
        const selectedModelo = mockModelos.find(m => m.id === formData.modeloId)
        setAlert({
          type: "success", 
          title: "Contrato Gerado com Sucesso",
          message: `Contrato de Super Fotos (Menor Idade) para modelo ${selectedModelo?.fullName} gerado com sucesso.`,
          show: true
        })
      }
    } catch (error) {
      console.error("Erro ao gerar contrato:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteExistingContract = () => {
    setAlert({ ...alert, show: false })
    console.log("Deletando contrato existente...")
  }

  const handleKeepBothContracts = () => {
    setAlert({ ...alert, show: false })
    console.log("Mantendo ambos os contratos...")
  }

  const handleViewDocument = () => {
    setAlert({ ...alert, show: false })
    console.log("Abrindo documento...")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/contratos')}
          className="border-border"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Contrato Super Fotos - Menor Idade</h1>
          <p className="text-muted-foreground">
            Preencha os dados para gerar um novo contrato para menor de idade
          </p>
        </div>
      </div>

      {/* Alert */}
      {alert.show && (
        <div className="mb-6">
          <ContractAlert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onAction={alert.type === "warning" ? (alert.title === "CPF Inválido" ? () => setAlert({...alert, show: false}) : handleDeleteExistingContract) : handleViewDocument}
            actionLabel={alert.type === "warning" ? (alert.title === "CPF Inválido" ? "OK" : "Excluir Anterior") : "Ver Documento"}
            onSecondaryAction={alert.type === "warning" && alert.title !== "CPF Inválido" ? handleKeepBothContracts : undefined}
            secondaryActionLabel={alert.type === "warning" && alert.title !== "CPF Inválido" ? "Manter Ambos" : undefined}
          />
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner message="Gerando contrato..." />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Dados Básicos do Contrato</CardTitle>
              <CardDescription>Informações gerais sobre o contrato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input 
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                    className="bg-background border-border"
                    placeholder="Ex: São Paulo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">UF *</Label>
                  <Input 
                    id="uf"
                    value={formData.uf}
                    onChange={(e) => setFormData(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                    className="bg-background border-border"
                    placeholder="Ex: SP"
                    maxLength={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dia">Dia *</Label>
                  <Input 
                    id="dia"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia}
                    onChange={(e) => setFormData(prev => ({ ...prev, dia: e.target.value }))}
                    className="bg-background border-border"
                    placeholder="Ex: 15"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mes">Mês por Extenso *</Label>
                  <Select 
                    value={formData.mes} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, mes: value }))}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {mesesPorExtenso.map((mes) => (
                        <SelectItem key={mes} value={mes}>
                          {mes.charAt(0).toUpperCase() + mes.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duracao">Duração do Contrato (meses) *</Label>
                  <Input 
                    id="duracao"
                    type="number"
                    min="1"
                    value={formData.duracaoContrato}
                    onChange={(e) => setFormData(prev => ({ ...prev, duracaoContrato: e.target.value }))}
                    className="bg-background border-border"
                    placeholder="Ex: 12"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Responsável */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Dados do Responsável Legal</CardTitle>
              <CardDescription>Informações do responsável pelo menor de idade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeResponsavel">Nome do Responsável *</Label>
                  <Input 
                    id="nomeResponsavel"
                    value={formData.nomeResponsavel}
                    onChange={(e) => setFormData(prev => ({ ...prev, nomeResponsavel: e.target.value }))}
                    className="bg-background border-border"
                    placeholder="Ex: João Silva Santos"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpfResponsavel">CPF do Responsável *</Label>
                  <Input 
                    id="cpfResponsavel"
                    value={formData.cpfResponsavel}
                    onChange={(e) => handleCPFChange(e.target.value)}
                    className="bg-background border-border"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato: 000.000.000-00 (apenas números válidos)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Pessoas */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Seleção de Produtor e Modelo</CardTitle>
              <CardDescription>Escolha o produtor responsável e o modelo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Produtor Responsável *</Label>
                  <Select 
                    value={formData.produtorId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, produtorId: value }))}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Selecione um produtor" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProdutores.map((produtor) => (
                        <SelectItem key={produtor.id} value={produtor.id}>
                          {produtor.name} - {produtor.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Selecionar Modelo *</Label>
                  <div className="relative">
                    <Input
                      placeholder="Busque por nome, documento ou email"
                      value={formData.modeloSearch}
                      onChange={(e) => setFormData(prev => ({ ...prev, modeloSearch: e.target.value }))}
                      className="bg-background border-border pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <Select 
                    value={formData.modeloId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, modeloId: value }))}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Selecione um modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredModelos.map((modelo) => (
                        <SelectItem key={modelo.id} value={modelo.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{modelo.fullName}</span>
                            <span className="text-xs text-muted-foreground">
                              {modelo.document} • {modelo.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parâmetros de Pagamento */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Parâmetros de Pagamento</CardTitle>
              <CardDescription>Configure as formas de pagamento (múltipla seleção permitida)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Método de Pagamento *</Label>
                <div className="flex flex-wrap gap-2">
                  {metodosPagemento.map((metodo) => (
                    <Badge
                      key={metodo}
                      variant={formData.metodoPagamento.includes(metodo) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        formData.metodoPagamento.includes(metodo) 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : "bg-background border-border hover:bg-accent"
                      }`}
                      onClick={() => handleMetodoPagamentoChange(metodo)}
                    >
                      {metodo}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecione um ou mais métodos de pagamento. Para pagamentos combinados, selecione múltiplas opções.
                </p>
              </div>

              {/* Campos específicos para cada método de pagamento */}
              {formData.metodoPagamento.length > 0 && !formData.metodoPagamento.includes("Sem Custo") && (
                <PaymentFields 
                  paymentMethods={formData.metodoPagamento}
                  paymentData={formData.paymentData}
                  onPaymentDataChange={(data) => setFormData(prev => ({ ...prev, paymentData: data }))}
                />
              )}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/contratos')}
              className="border-border"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 min-w-[140px]"
              disabled={isLoading || formData.metodoPagamento.length === 0}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Gerando...
                </div>
              ) : (
                "Gerar Contrato"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}