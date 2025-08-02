import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, CalendarIcon, Plus, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"

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

export default function NovoContratoSuperFotos() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    cidade: "",
    uf: "",
    dia: "",
    mes: "",
    mesContrato: "",
    duracaoContrato: "",
    produtorId: "",
    modeloId: "",
    metodoPagamento: [] as string[],
    pagamentoCartao: {
      parcelas: "",
      valor: "",
      dataPagamento: undefined as Date | undefined,
      status: "pendente",
      provedor: "",
      dataAcordo: undefined as Date | undefined
    }
  })

  const handleMetodoPagamentoChange = (metodo: string) => {
    setFormData(prev => {
      const metodos = prev.metodoPagamento.includes(metodo)
        ? prev.metodoPagamento.filter(m => m !== metodo)
        : [...prev.metodoPagamento, metodo]
      
      return { ...prev, metodoPagamento: metodos }
    })
  }

  const showCartaoFields = formData.metodoPagamento.includes("Cartão de Crédito")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui integraria com a API para gerar o contrato
    console.log("Dados do contrato:", formData)
    alert("Contrato gerado com sucesso! (Função mock)")
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
          <h1 className="text-3xl font-bold tracking-tight">Novo Contrato Super Fotos</h1>
          <p className="text-muted-foreground">
            Preencha os dados para gerar um novo contrato
          </p>
        </div>
      </div>

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
                <Label htmlFor="cidade">Cidade</Label>
                <Input 
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                  className="bg-background border-border"
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf">UF</Label>
                <Input 
                  id="uf"
                  value={formData.uf}
                  onChange={(e) => setFormData(prev => ({ ...prev, uf: e.target.value }))}
                  className="bg-background border-border"
                  placeholder="Ex: SP"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dia">Dia</Label>
                <Input 
                  id="dia"
                  value={formData.dia}
                  onChange={(e) => setFormData(prev => ({ ...prev, dia: e.target.value }))}
                  className="bg-background border-border"
                  placeholder="Ex: 15"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mes">Mês por Extenso</Label>
                <Input 
                  id="mes"
                  value={formData.mes}
                  onChange={(e) => setFormData(prev => ({ ...prev, mes: e.target.value }))}
                  className="bg-background border-border"
                  placeholder="Ex: agosto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mesContrato">Mês do Contrato</Label>
                <Input 
                  id="mesContrato"
                  value={formData.mesContrato}
                  onChange={(e) => setFormData(prev => ({ ...prev, mesContrato: e.target.value }))}
                  className="bg-background border-border"
                  placeholder="Ex: 08/2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duracao">Duração do Contrato</Label>
                <Input 
                  id="duracao"
                  value={formData.duracaoContrato}
                  onChange={(e) => setFormData(prev => ({ ...prev, duracaoContrato: e.target.value }))}
                  className="bg-background border-border"
                  placeholder="Ex: 12 meses"
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
                <Label>Produtor Responsável</Label>
                <Select 
                  value={formData.produtorId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, produtorId: value }))}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecione um produtor" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {mockProdutores.map((produtor) => (
                      <SelectItem key={produtor.id} value={produtor.id}>
                        {produtor.name} - {produtor.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Selecionar Modelo</Label>
                <Select 
                  value={formData.modeloId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, modeloId: value }))}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Busque por nome, documento ou email" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {mockModelos.map((modelo) => (
                      <SelectItem key={modelo.id} value={modelo.id}>
                        <div className="flex flex-col">
                          <span>{modelo.fullName}</span>
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
            <CardDescription>Configure as formas de pagamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <div className="flex flex-wrap gap-2">
                {metodosPagemento.map((metodo) => (
                  <Badge
                    key={metodo}
                    variant={formData.metodoPagamento.includes(metodo) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      formData.metodoPagamento.includes(metodo) 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-background border-border hover:bg-accent"
                    }`}
                    onClick={() => handleMetodoPagamentoChange(metodo)}
                  >
                    {metodo}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Campos específicos para Cartão de Crédito */}
            {showCartaoFields && (
              <Card className="bg-background/50 border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Detalhes do Cartão de Crédito</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="parcelas">Quantidade de Parcelas</Label>
                      <Input 
                        id="parcelas"
                        type="number"
                        value={formData.pagamentoCartao.parcelas}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          pagamentoCartao: { ...prev.pagamentoCartao, parcelas: e.target.value }
                        }))}
                        className="bg-background border-border"
                        placeholder="Ex: 3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor</Label>
                      <Input 
                        id="valor"
                        value={formData.pagamentoCartao.valor}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          pagamentoCartao: { ...prev.pagamentoCartao, valor: e.target.value }
                        }))}
                        className="bg-background border-border"
                        placeholder="Ex: R$ 2.500,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status do Pagamento</Label>
                      <Select 
                        value={formData.pagamentoCartao.status} 
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          pagamentoCartao: { ...prev.pagamentoCartao, status: value }
                        }))}
                      >
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="pago">Pago</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Data do Pagamento</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-background border-border",
                              !formData.pagamentoCartao.dataPagamento && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.pagamentoCartao.dataPagamento ? (
                              format(formData.pagamentoCartao.dataPagamento, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecionar data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.pagamentoCartao.dataPagamento}
                            onSelect={(date) => setFormData(prev => ({ 
                              ...prev, 
                              pagamentoCartao: { ...prev.pagamentoCartao, dataPagamento: date }
                            }))}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="provedor">Provedor do Pagamento</Label>
                      <Input 
                        id="provedor"
                        value={formData.pagamentoCartao.provedor}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          pagamentoCartao: { ...prev.pagamentoCartao, provedor: e.target.value }
                        }))}
                        className="bg-background border-border"
                        placeholder="Ex: Mercado Pago"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Data do Acordo</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-background border-border",
                              !formData.pagamentoCartao.dataAcordo && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.pagamentoCartao.dataAcordo ? (
                              format(formData.pagamentoCartao.dataAcordo, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecionar data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.pagamentoCartao.dataAcordo}
                            onSelect={(date) => setFormData(prev => ({ 
                              ...prev, 
                              pagamentoCartao: { ...prev.pagamentoCartao, dataAcordo: date }
                            }))}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
          >
            Cancelar
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary-hover">
            Gerar Contrato
          </Button>
        </div>
      </form>
    </div>
  )
}