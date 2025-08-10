
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, Calendar, TrendingUp } from "lucide-react"
import { AttendanceDashboard } from "@/components/whatsapp/attendance-dashboard"

export default function Dashboard() {
  const stats = [
    {
      title: "Contratos Ativos",
      value: "24",
      description: "Contratos em andamento",
      icon: FileText,
      trend: "+12%"
    },
    {
      title: "Modelos Cadastrados",
      value: "156",
      description: "Total de talentos",
      icon: Users,
      trend: "+8%"
    },
    {
      title: "Sessões Este Mês",
      value: "42",
      description: "Sessões de fotos",
      icon: Calendar,
      trend: "+23%"
    },
    {
      title: "Receita Mensal",
      value: "R$ 45.2k",
      description: "Faturamento atual",
      icon: TrendingUp,
      trend: "+15%"
    }
  ]

  const handleStartAttendance = (talentId: string, talentName: string, talentPhone: string) => {
    console.log(`Iniciando atendimento para ${talentName} (${talentPhone})`)
    // Aqui você pode adicionar lógica adicional se necessário
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu sistema de contratos Pregiato
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-gradient-card border-border/50 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-400">{stat.trend}</span> {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Central de Atendimento Integrada */}
      <div className="space-y-4">
        <AttendanceDashboard onStartAttendance={handleStartAttendance} />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas ações realizadas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {[
                "Contrato Super Fotos gerado para Maria Silva",
                "Novo modelo cadastrado: João Santos",
                "Pagamento recebido - Contrato #1234",
                "Sessão de fotos agendada para 15/08"
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <p className="text-sm">{activity}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Próximas Sessões</CardTitle>
            <CardDescription>
              Agenda das próximas sessões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { date: "15 Ago", client: "Ana Costa", type: "Super Fotos" },
                { date: "16 Ago", client: "Pedro Lima", type: "Agenciamento" },
                { date: "18 Ago", client: "Laura Santos", type: "Super Fotos" }
              ].map((session, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{session.client}</p>
                    <p className="text-xs text-muted-foreground">{session.type}</p>
                  </div>
                  <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {session.date}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
