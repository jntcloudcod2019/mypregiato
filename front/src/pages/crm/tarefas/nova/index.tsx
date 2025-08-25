import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { Textarea } from "../../../../components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select"
import { ArrowLeft, Save, X, Calendar, User, AlertCircle } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useToast } from "../../../../hooks/use-toast"

export default function NovaTarefa() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    leadId: "",
    responsavel: "",
    dataVencimento: "",
    prioridade: "media",
    tipo: "geral"
  })

  // Mock data - em uma aplicação real, viria do backend
  const leads = [
    { id: 1, nome: "João Silva", empresa: "Tech Solutions" },
    { id: 2, nome: "Ana Costa", empresa: "Startup Inovadora" },
    { id: 3, nome: "Carlos Santos", empresa: "Corporação ABC" },
    { id: 4, nome: "Fernanda Oliveira", empresa: "Negócio Digital" }
  ]

  const responsaveis = [
    { value: "maria", label: "Maria Santos" },
    { value: "pedro", label: "Pedro Lima" },
    { value: "ana", label: "Ana Silva" }
  ]

  const prioridades = [
    { value: "baixa", label: "Baixa", cor: "text-green-600" },
    { value: "media", label: "Média", cor: "text-yellow-600" },
    { value: "alta", label: "Alta", cor: "text-red-600" }
  ]

  const tiposTarefa = [
    { value: "geral", label: "Geral" },
    { value: "ligacao", label: "Ligação" },
    { value: "email", label: "E-mail" },
    { value: "reuniao", label: "Reunião" },
    { value: "proposta", label: "Proposta" },
    { value: "followup", label: "Follow-up" }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.titulo || !formData.responsavel || !formData.dataVencimento) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha Título, Responsável e Data de Vencimento",
        variant: "destructive"
      })
      return
    }

    // Aqui você faria a chamada para a API para salvar a tarefa
    console.log("Dados da nova tarefa:", formData)
    
    toast({
      title: "Tarefa criada com sucesso!",
      description: `Tarefa "${formData.titulo}" foi adicionada.`
    })

    // Redirecionar para a lista de tarefas
    navigate("/crm/tarefas")
  }

  const leadSelecionado = leads.find(lead => lead.id.toString() === formData.leadId)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/crm/tarefas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Nova Tarefa
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie uma nova tarefa no sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações da Tarefa */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Tarefa</CardTitle>
                <CardDescription>
                  Detalhes principais da tarefa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => handleInputChange("titulo", e.target.value)}
                    placeholder="Ex: Ligar para João Silva"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleInputChange("descricao", e.target.value)}
                    placeholder="Descreva os detalhes da tarefa..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Tarefa</Label>
                    <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposTarefa.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Lead Vinculado</Label>
                    <Select value={formData.leadId} onValueChange={(value) => handleInputChange("leadId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um lead" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum lead</SelectItem>
                        {leads.map(lead => (
                          <SelectItem key={lead.id} value={lead.id.toString()}>
                            <div className="flex flex-col">
                              <span>{lead.nome}</span>
                              <span className="text-sm text-muted-foreground">{lead.empresa}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {leadSelecionado && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{leadSelecionado.nome}</span>
                      <span className="text-sm text-muted-foreground">• {leadSelecionado.empresa}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Configurações da Tarefa */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>
                  Responsável, prazo e prioridade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Responsável *</Label>
                  <Select value={formData.responsavel} onValueChange={(value) => handleInputChange("responsavel", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {responsaveis.map(responsavel => (
                        <SelectItem key={responsavel.value} value={responsavel.value}>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {responsavel.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dataVencimento"
                      type="date"
                      value={formData.dataVencimento}
                      onChange={(e) => handleInputChange("dataVencimento", e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={formData.prioridade} onValueChange={(value) => handleInputChange("prioridade", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      {prioridades.map(prioridade => (
                        <SelectItem key={prioridade.value} value={prioridade.value}>
                          <div className={`flex items-center gap-2 ${prioridade.cor}`}>
                            <AlertCircle className="h-3 w-3" />
                            {prioridade.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button type="submit" className="w-full gap-2">
                    <Save className="h-4 w-4" />
                    Criar Tarefa
                  </Button>
                  <Link to="/crm/tarefas" className="block">
                    <Button type="button" variant="outline" className="w-full gap-2">
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Dica */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-primary">Dica</p>
                    <p className="text-muted-foreground">
                      Tarefas vinculadas a leads aparecerão no histórico do lead automaticamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}