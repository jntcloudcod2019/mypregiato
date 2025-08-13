import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { modules } from "@/pages/modules/data"
import { Link } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import LeadsPage from '@/pages/crm/leads'
import LeadsKanban from '@/pages/crm/leads/kanban'
import NovoLead from '@/pages/crm/leads/novo'
import EventosPage from '@/pages/crm/eventos'
import RecordsTable from "@/components/modules/records-table"
import { useState } from "react"

export default function CRMDashboard() {
  const [selected, setSelected] = useState(modules[0])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">CRM Suite</h1>
        <p className="text-muted-foreground mt-1">Centralize aqui Financeiro, Assinaturas, Vendas, Projetos e demais ferramentas</p>
      </div>

      {/* Grade de ferramentas dentro do CRM */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {modules.map(m => (
          <button key={m.slug} onClick={()=>setSelected(m)} className={`text-left`}>
            <Card className={`hover:shadow-md transition-shadow ${selected.slug===m.slug? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="items-center text-center pb-2">
                <CardTitle className="text-sm font-semibold">{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Detalhe da ferramenta selecionada + CRUD genérico */}
      <Card>
        <CardHeader>
          <CardTitle>{selected.title}</CardTitle>
          <CardDescription>{selected.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc ml-6 space-y-1 text-sm">
            {selected.features.map((f, i) => (<li key={i}>{f}</li>))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link to="/crm/leads"><span className="underline cursor-pointer">Leads (lista)</span></Link>
            <Link to="/crm/leads/kanban"><span className="underline cursor-pointer">Leads (Kanban)</span></Link>
            <Link to="/crm/leads/novo"><span className="underline cursor-pointer">Novo Lead</span></Link>
            <Link to="/crm/eventos"><span className="underline cursor-pointer">Eventos/Seletivas</span></Link>
          </div>
        </CardContent>
      </Card>

      <RecordsTable moduleSlug={selected.slug} title={`Registros de ${selected.title}`} />
    </div>
  )
}