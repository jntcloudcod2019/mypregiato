import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { LoadingSpinner } from "@/components/contratos/loading-spinner"
import { ContractAlert } from "@/components/contratos/contract-alert"

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

const mesesPorExtenso = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
]

export default function NovoContratoComprometimento() {
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
    objetivoContrato: "",
    observacoes: ""
  })

  const filteredModelos = mockModelos.filter(modelo =>
    modelo.fullName.toLowerCase().includes(formData.modeloSearch.toLowerCase()) ||
    modelo.document.includes(formData.modeloSearch) ||
    modelo.email.toLowerCase().includes(formData.modeloSearch.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const existeContrato = Math.random() > 0.7
      
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
          message: `Contrato de Comprometimento para modelo ${selectedModelo?.fullName} gerado com sucesso.`,
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
          <h1 className="text-3xl font-bold tracking-tight">Novo Contrato de Comprometimento</h1>
          <p className="text-muted-foreground">
            Preencha os dados para gerar um novo contrato de comprometimento
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
            onAction={alert.type === "warning" ? handleDeleteExistingContract : handleViewDocument}
            actionLabel={alert.type === "warning" ? "Excluir Anterior" : "Ver Documento"}
            onSecondaryAction={alert.type === "warning" ? handleKeepBothContracts : undefined}
            secondaryActionLabel={alert.type === "warning" ? "Manter Ambos" : undefined}
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
              <CardDescription>Informações gerais sobre o contrato de comprometimento</CardDescription>
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

          {/* Detalhes do Comprometimento */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Detalhes do Comprometimento</CardTitle>
              <CardDescription>Especifique os objetivos e observações do contrato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="objetivo">Objetivo do Contrato *</Label>
                <Textarea 
                  id="objetivo"
                  value={formData.objetivoContrato}
                  onChange={(e) => setFormData(prev => ({ ...prev, objetivoContrato: e.target.value }))}
                  className="bg-background border-border min-h-[100px]"
                  placeholder="Descreva os objetivos e metas do contrato de comprometimento..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Adicionais</Label>
                <Textarea 
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="bg-background border-border min-h-[80px]"
                  placeholder="Observações complementares sobre o contrato..."
                />
              </div>
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
              disabled={isLoading}
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