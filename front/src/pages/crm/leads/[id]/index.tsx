import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  Building, 
  User, 
  Calendar, 
  Plus,
  MessageSquare,
  CheckSquare,
  Send,
  TrendingUp,
  Clock
} from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"

export default function DetalheLead() {
  const { id } = useParams()
  const { toast } = useToast()

  // Mock data - em uma aplicação real, viria do backend baseado no ID
  const lead = {
    id: 1,
    nome: "João Silva",
    email: "joao@empresa.com",
    telefone: "(11) 99999-1111",
    empresa: "Tech Solutions",
    cargo: "Diretor de TI",
    etapa: "contato",
    responsavel: "Maria Santos",
    dataUltimoContato: "2024-01-02",
    valor: "R$ 15.000",
    origem: "LinkedIn",
    dataCriacao: "2023-12-15",
    observacoes: "Interessado em soluções de automação para o setor de TI."
  }

  const [novaEtapa, setNovaEtapa] = useState(lead.etapa)
  const [novaNota, setNovaNota] = useState("")
  const [novaTarefa, setNovaTarefa] = useState({ titulo: "", descricao: "", data: "" })

  const etapas = [
    { value: "novo", label: "Novo Lead", cor: "bg-blue-500" },
    { value: "contato", label: "Em Contato", cor: "bg-yellow-500" },
    { value: "proposta", label: "Proposta Enviada", cor: "bg-orange-500" },
    { value: "fechado", label: "Fechado Ganho", cor: "bg-green-500" },
    { value: "perdido", label: "Perdido", cor: "bg-red-500" }
  ]

  const historico = [
    {
      id: 1,
      tipo: "nota",
      titulo: "Primeira ligação realizada",
      descricao: "Lead demonstrou interesse no produto. Agendar reunião.",
      data: "2024-01-02 14:30",
      usuario: "Maria Santos"
    },
    {
      id: 2,
      tipo: "email",
      titulo: "E-mail de apresentação enviado",
      descricao: "Enviado material institucional e proposta inicial.",
      data: "2024-01-01 09:15",
      usuario: "Maria Santos"
    },
    {
      id: 3,
      tipo: "tarefa",
      titulo: "Tarefa criada: Follow-up",
      descricao: "Ligar para o lead em 3 dias",
      data: "2023-12-30 16:00",
      usuario: "Maria Santos"
    }
  ]

  const getEtapaBadge = (etapa: string) => {
    const etapaInfo = etapas.find(e => e.value === etapa)
    return etapaInfo ? etapaInfo : { label: etapa, cor: "bg-gray-500" }
  }

  const getIconeHistorico = (tipo: string) => {
    switch (tipo) {
      case "nota": return <MessageSquare className="h-4 w-4" />
      case "email": return <Mail className="h-4 w-4" />
      case "tarefa": return <CheckSquare className="h-4 w-4" />
      case "ligacao": return <Phone className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const handleMoverEtapa = () => {
    toast({
      title: "Etapa atualizada!",
      description: `Lead movido para: ${getEtapaBadge(novaEtapa).label}`
    })
  }

  const handleAdicionarNota = () => {
    if (!novaNota.trim()) return
    
    toast({
      title: "Nota adicionada!",
      description: "Nova interação registrada no histórico do lead."
    })
    setNovaNota("")
  }

  const handleCriarTarefa = () => {
    if (!novaTarefa.titulo.trim()) return
    
    toast({
      title: "Tarefa criada!",
      description: `Tarefa "${novaTarefa.titulo}" foi adicionada.`
    })
    setNovaTarefa({ titulo: "", descricao: "", data: "" })
  }

  const etapaBadge = getEtapaBadge(lead.etapa)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/crm/leads">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {lead.nome}
            </h1>
            <p className="text-muted-foreground mt-1">
              {lead.empresa} • {lead.cargo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/crm/leads/${lead.id}/editar`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Lead */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{lead.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                      {lead.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${lead.telefone}`} className="text-primary hover:underline">
                      {lead.telefone}
                    </a>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.empresa}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{lead.valor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Criado em {lead.dataCriacao}</span>
                  </div>
                </div>
              </div>
              
              {lead.observacoes && (
                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium">Observações</Label>
                  <p className="text-sm text-muted-foreground mt-1">{lead.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Interações */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Interações</CardTitle>
              <CardDescription>Timeline de todas as atividades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {historico.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      {getIconeHistorico(item.tipo)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{item.titulo}</p>
                      <p className="text-sm text-muted-foreground">{item.descricao}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {item.data} • {item.usuario}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="space-y-6">
          {/* Status Atual */}
          <Card>
            <CardHeader>
              <CardTitle>Status Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Etapa do Funil</Label>
                <Badge variant="secondary" className="gap-2 p-2">
                  <div className={`w-3 h-3 rounded-full ${etapaBadge.cor}`} />
                  {etapaBadge.label}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <p className="text-sm">{lead.responsavel}</p>
              </div>
              <div className="space-y-2">
                <Label>Último Contato</Label>
                <p className="text-sm">{lead.dataUltimoContato}</p>
              </div>
            </CardContent>
          </Card>

          {/* Mover Etapa */}
          <Card>
            <CardHeader>
              <CardTitle>Mover para Etapa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={novaEtapa} onValueChange={setNovaEtapa}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map(etapa => (
                    <SelectItem key={etapa.value} value={etapa.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${etapa.cor}`} />
                        {etapa.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleMoverEtapa} className="w-full">
                Atualizar Etapa
              </Button>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Adicionar Nota */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Adicionar Nota
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Nota</DialogTitle>
                    <DialogDescription>
                      Registre uma nova interação ou observação
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Descreva a interação..."
                      value={novaNota}
                      onChange={(e) => setNovaNota(e.target.value)}
                      rows={4}
                    />
                    <Button onClick={handleAdicionarNota} className="w-full">
                      Salvar Nota
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Agendar Tarefa */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Agendar Tarefa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Tarefa</DialogTitle>
                    <DialogDescription>
                      Crie uma tarefa relacionada a este lead
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        placeholder="Ex: Ligar para follow-up"
                        value={novaTarefa.titulo}
                        onChange={(e) => setNovaTarefa(prev => ({ ...prev, titulo: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        placeholder="Detalhes da tarefa..."
                        value={novaTarefa.descricao}
                        onChange={(e) => setNovaTarefa(prev => ({ ...prev, descricao: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Vencimento</Label>
                      <Input
                        type="date"
                        value={novaTarefa.data}
                        onChange={(e) => setNovaTarefa(prev => ({ ...prev, data: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleCriarTarefa} className="w-full">
                      Criar Tarefa
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Enviar E-mail */}
              <Button variant="outline" className="w-full gap-2">
                <Send className="h-4 w-4" />
                Enviar E-mail
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}