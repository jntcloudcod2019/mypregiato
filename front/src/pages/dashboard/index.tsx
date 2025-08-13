
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceDashboard } from "@/components/whatsapp/attendance-dashboard"
import { Link } from "react-router-dom"
import { modules } from "@/pages/modules/data"

export default function Dashboard() {
  const handleStartAttendance = (conversationId: string, operatorId: string) => {
    console.log('Iniciar atendimento', { conversationId, operatorId })
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

      {/* Apps */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {modules.map(m => (
          <Link key={m.slug} to={m.slug==='crm' ? '/crm' : `/apps/${m.slug}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="items-center text-center pb-2">
                <CardTitle className="text-sm font-semibold">{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Central de Atendimento Integrada */}
      <div className="space-y-4">
        <AttendanceDashboard onStartAttendance={handleStartAttendance} />
      </div>

      {/* Central de Atendimento Integrada */}
    </div>
  )
}
