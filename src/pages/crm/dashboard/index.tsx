import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, UserPlus, CheckSquare, TrendingUp, Plus, Eye, Calendar, Phone } from "lucide-react"
import { Link } from "react-router-dom"

export default function CRMDashboard() {
  // Mock data - em uma aplicação real, viria do backend
  const stats = {
    totalLeads: 127,
    tarefasPendentes: 8,
    ultimasInteracoes: 15,
    conversao: 23.5
  }

  const funnelData = [
    { etapa: "Novo Lead", quantidade: 45, cor: "bg-blue-500" },
    { etapa: "Em Contato", quantidade: 32, cor: "bg-yellow-500" },
    { etapa: "Proposta Enviada", quantidade: 18, cor: "bg-orange-500" },
    { etapa: "Fechado Ganho", quantidade: 12, cor: "bg-green-500" },
  ]

  const ultimasInteracoes = [
    { id: 1, lead: "João Silva", acao: "Ligação", data: "2024-01-02", responsavel: "Maria" },
    { id: 2, lead: "Ana Costa", acao: "Email", data: "2024-01-02", responsavel: "Pedro" },
    { id: 3, lead: "Carlos Santos", acao: "Reunião", data: "2024-01-01", responsavel: "Maria" },
  ]

  const tarefasHoje = [
    { id: 1, titulo: "Ligar para João Silva", lead: "João Silva", hora: "14:00" },
    { id: 2, titulo: "Enviar proposta", lead: "Ana Costa", hora: "16:30" },
    { id: 3, titulo: "Follow-up reunião", lead: "Carlos Santos", hora: "18:00" },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">
            Dashboard CRM
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral das suas vendas e relacionamentos
          </p>
        </div>
        <Link to="/crm/leads/novo">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        </Link>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tarefasPendentes}</div>
            <p className="text-xs text-muted-foreground">
              Para hoje e próximos dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Últimas Interações</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ultimasInteracoes}</div>
            <p className="text-xs text-muted-foreground">
              Nos últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversao}%</div>
            <p className="text-xs text-muted-foreground">
              +3.2% este mês
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funil de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Funil de Vendas</CardTitle>
            <CardDescription>Distribuição dos leads por etapa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {funnelData.map((etapa, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{etapa.etapa}</span>
                  <span className="font-medium">{etapa.quantidade}</span>
                </div>
                <Progress 
                  value={(etapa.quantidade / funnelData[0].quantidade) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Últimas Interações */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Interações</CardTitle>
            <CardDescription>Atividades recentes com leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ultimasInteracoes.map((interacao) => (
                <div key={interacao.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{interacao.lead}</p>
                    <p className="text-sm text-muted-foreground">
                      {interacao.acao} • {interacao.responsavel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{interacao.data}</p>
                    <Link to={`/crm/leads/${interacao.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link to="/crm/leads">
                <Button variant="outline" className="w-full">
                  Ver Todos os Leads
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tarefas de Hoje */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tarefas de Hoje
          </CardTitle>
          <CardDescription>Suas atividades programadas para hoje</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tarefasHoje.map((tarefa) => (
              <div key={tarefa.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium">{tarefa.titulo}</p>
                  <p className="text-sm text-muted-foreground">Lead: {tarefa.lead}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{tarefa.hora}</Badge>
                  <Button variant="ghost" size="sm">
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Link to="/crm/tarefas" className="flex-1">
              <Button variant="outline" className="w-full">
                Ver Todas as Tarefas
              </Button>
            </Link>
            <Link to="/crm/tarefas/nova">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}