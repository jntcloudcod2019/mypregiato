import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Download, 
  FileText, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  DollarSign,
  Phone
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function RelatoriosPage() {
  const { toast } = useToast()

  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    etapa: "todas",
    responsavel: "todos",
    tipoRelatorio: "geral"
  })

  const responsaveis = ["Maria Santos", "Pedro Lima", "Ana Silva"]
  const etapas = ["Novo Lead", "Em Contato", "Proposta Enviada", "Fechado Ganho", "Perdido"]

  const tiposRelatorio = [
    { value: "geral", label: "Relatório Geral", descricao: "Visão completa de leads e vendas" },
    { value: "funil", label: "Funil de Vendas", descricao: "Análise das etapas do funil" },
    { value: "produtividade", label: "Produtividade", descricao: "Performance por responsável" },
    { value: "conversao", label: "Taxa de Conversão", descricao: "Análise de conversões" },
    { value: "atividades", label: "Atividades", descricao: "Relatório de tarefas e interações" }
  ]

  // Mock data para prévia dos relatórios
  const estatisticas = {
    totalLeads: 127,
    leadsGanhos: 30,
    leadsPerdidos: 15,
    taxaConversao: 23.6,
    ticketMedio: 28500,
    tempoMedioFechamento: 18,
    totalTarefas: 85,
    tarefasConcluidas: 72
  }

  const handleInputChange = (field: string, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGerarRelatorio = (formato: string) => {
    if (!filtros.dataInicio || !filtros.dataFim) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione o período do relatório",
        variant: "destructive"
      })
      return
    }

    toast({
      title: `Relatório ${formato.toUpperCase()} gerado!`,
      description: "O download iniciará em instantes."
    })

    // Aqui você faria a chamada para a API para gerar o relatório
    console.log("Gerando relatório:", { ...filtros, formato })
  }

  const tipoSelecionado = tiposRelatorio.find(tipo => tipo.value === filtros.tipoRelatorio)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Relatórios e Análises
        </h1>
        <p className="text-muted-foreground mt-1">
          Gere relatórios detalhados sobre sua performance de vendas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações do Relatório */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Relatório</CardTitle>
              <CardDescription>
                Configure os filtros para gerar seu relatório personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Relatório</Label>
                <Select value={filtros.tipoRelatorio} onValueChange={(value) => handleInputChange("tipoRelatorio", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposRelatorio.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div className="flex flex-col">
                          <span>{tipo.label}</span>
                          <span className="text-sm text-muted-foreground">{tipo.descricao}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tipoSelecionado && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="font-medium">{tipoSelecionado.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{tipoSelecionado.descricao}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dataInicio"
                      type="date"
                      value={filtros.dataInicio}
                      onChange={(e) => handleInputChange("dataInicio", e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data de Fim *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dataFim"
                      type="date"
                      value={filtros.dataFim}
                      onChange={(e) => handleInputChange("dataFim", e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Etapa do Funil</Label>
                  <Select value={filtros.etapa} onValueChange={(value) => handleInputChange("etapa", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as etapas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as etapas</SelectItem>
                      {etapas.map(etapa => (
                        <SelectItem key={etapa} value={etapa}>
                          {etapa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select value={filtros.responsavel} onValueChange={(value) => handleInputChange("responsavel", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos responsáveis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos responsáveis</SelectItem>
                      {responsaveis.map(responsavel => (
                        <SelectItem key={responsavel} value={responsavel}>
                          {responsavel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prévia das Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Prévia das Estatísticas</CardTitle>
              <CardDescription>
                Dados resumidos baseados nos filtros selecionados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{estatisticas.totalLeads}</div>
                  <div className="text-sm text-muted-foreground">Total Leads</div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Target className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{estatisticas.leadsGanhos}</div>
                  <div className="text-sm text-muted-foreground">Ganhos</div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold">{estatisticas.taxaConversao}%</div>
                  <div className="text-sm text-muted-foreground">Conversão</div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">R$ {estatisticas.ticketMedio.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Ticket Médio</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações e Formatos */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Relatório</CardTitle>
              <CardDescription>
                Escolha o formato para download
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => handleGerarRelatorio("pdf")} 
                className="w-full gap-2"
                variant="contained"
              >
                <FileText className="h-4 w-4" />
                Gerar PDF
              </Button>

              <Button 
                onClick={() => handleGerarRelatorio("csv")} 
                variant="outline" 
                className="w-full gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>

              <Button 
                onClick={() => handleGerarRelatorio("excel")} 
                variant="outline" 
                className="w-full gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Período</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tempo médio para fechamento:</span>
                <span className="text-sm font-medium">{estatisticas.tempoMedioFechamento} dias</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total de tarefas:</span>
                <span className="text-sm font-medium">{estatisticas.totalTarefas}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tarefas concluídas:</span>
                <span className="text-sm font-medium">{estatisticas.tarefasConcluidas}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Taxa de conclusão:</span>
                <span className="text-sm font-medium text-green-600">
                  {Math.round((estatisticas.tarefasConcluidas / estatisticas.totalTarefas) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <BarChart3 className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-primary">Dicas para Relatórios</p>
                  <ul className="text-muted-foreground mt-1 space-y-1 text-xs">
                    <li>• Use períodos de 30-90 dias para análises precisas</li>
                    <li>• Compare dados com períodos anteriores</li>
                    <li>• Analise por responsável para identificar padrões</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}