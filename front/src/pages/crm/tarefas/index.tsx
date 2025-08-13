import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Clock,
  CheckSquare,
  AlertCircle
} from "lucide-react"
import { Link } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"

export default function TarefasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("todas")
  const [filterResponsavel, setFilterResponsavel] = useState("todos")
  const { toast } = useToast()

  // Mock data - em uma aplicação real, viria do backend
  const tarefas = [
    {
      id: 1,
      titulo: "Ligar para João Silva",
      descricao: "Follow-up da proposta enviada",
      leadNome: "João Silva",
      leadId: 1,
      responsavel: "Maria Santos",
      dataVencimento: "2024-01-02",
      status: "pendente",
      prioridade: "alta",
      dataCriacao: "2023-12-30"
    },
    {
      id: 2,
      titulo: "Enviar proposta comercial",
      descricao: "Elaborar e enviar proposta para Ana Costa",
      leadNome: "Ana Costa",
      leadId: 2,
      responsavel: "Pedro Lima",
      dataVencimento: "2024-01-03",
      status: "pendente",
      prioridade: "media",
      dataCriacao: "2024-01-01"
    },
    {
      id: 3,
      titulo: "Reunião de apresentação",
      descricao: "Apresentar solução para Carlos Santos",
      leadNome: "Carlos Santos",
      leadId: 3,
      responsavel: "Maria Santos",
      dataVencimento: "2024-01-01",
      status: "concluida",
      prioridade: "alta",
      dataCriacao: "2023-12-28"
    },
    {
      id: 4,
      titulo: "Preparar documentação",
      descricao: "Documentos para fechamento do contrato",
      leadNome: "Fernanda Oliveira",
      leadId: 4,
      responsavel: "Pedro Lima",
      dataVencimento: "2024-01-04",
      status: "pendente",
      prioridade: "baixa",
      dataCriacao: "2024-01-02"
    }
  ]

  const responsaveis = ["Maria Santos", "Pedro Lima", "Ana Silva"]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="destructive">Pendente</Badge>
      case "concluida":
        return <Badge variant="default">Concluída</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Alta
        </Badge>
      case "media":
        return <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Média
        </Badge>
      case "baixa":
        return <Badge variant="outline" className="gap-1">
          <CheckSquare className="h-3 w-3" />
          Baixa
        </Badge>
      default:
        return <Badge variant="secondary">{prioridade}</Badge>
    }
  }

  const isVencida = (dataVencimento: string) => {
    const hoje = new Date()
    const vencimento = new Date(dataVencimento)
    return vencimento < hoje
  }

  const filteredTarefas = tarefas.filter(tarefa => {
    const matchesSearch = tarefa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tarefa.leadNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tarefa.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "todas" || tarefa.status === filterStatus
    const matchesResponsavel = filterResponsavel === "todos" || tarefa.responsavel === filterResponsavel

    return matchesSearch && matchesStatus && matchesResponsavel
  })

  const handleMarcarConcluida = (tarefaId: number) => {
    toast({
      title: "Tarefa concluída!",
      description: "A tarefa foi marcada como concluída."
    })
  }

  const estatisticas = {
    total: tarefas.length,
    pendentes: tarefas.filter(t => t.status === "pendente").length,
    concluidas: tarefas.filter(t => t.status === "concluida").length,
    vencidas: tarefas.filter(t => t.status === "pendente" && isVencida(t.dataVencimento)).length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Gestão de Tarefas
          </h1>
        </div>
        <Link to="/crm/tarefas/nova">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{estatisticas.pendentes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estatisticas.concluidas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estatisticas.vencidas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, lead ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="concluida">Concluídas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
              <SelectTrigger className="w-[200px]">
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
        </CardContent>
      </Card>

      {/* Tabela de Tarefas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tarefas ({filteredTarefas.length})</CardTitle>
          <CardDescription>
            Todas as tarefas registradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">✓</TableHead>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Lead Vinculado</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTarefas.map((tarefa) => (
                  <TableRow 
                    key={tarefa.id}
                    className={isVencida(tarefa.dataVencimento) && tarefa.status === "pendente" 
                      ? "bg-red-50 dark:bg-red-950/20" 
                      : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={tarefa.status === "concluida"}
                        onCheckedChange={() => handleMarcarConcluida(tarefa.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{tarefa.titulo}</p>
                        <p className="text-sm text-muted-foreground">{tarefa.descricao}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/crm/leads/${tarefa.leadId}`}
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <User className="h-3 w-3" />
                        {tarefa.leadNome}
                      </Link>
                    </TableCell>
                    <TableCell>{tarefa.responsavel}</TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${
                        isVencida(tarefa.dataVencimento) && tarefa.status === "pendente" 
                          ? "text-red-600 font-medium" 
                          : ""
                      }`}>
                        <Calendar className="h-3 w-3" />
                        {tarefa.dataVencimento}
                      </div>
                    </TableCell>
                    <TableCell>{getPrioridadeBadge(tarefa.prioridade)}</TableCell>
                    <TableCell>{getStatusBadge(tarefa.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}