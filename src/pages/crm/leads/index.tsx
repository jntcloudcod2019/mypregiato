import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Eye, 
  Trash2, 
  Mail, 
  Phone,
  Building,
  User
} from "lucide-react"
import { Link } from "react-router-dom"

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEtapa, setFilterEtapa] = useState("todas")
  const [filterResponsavel, setFilterResponsavel] = useState("todos")

  // Mock data - em uma aplicação real, viria do backend
  const leads = [
    {
      id: 1,
      nome: "João Silva",
      email: "joao@empresa.com",
      telefone: "(11) 99999-1111",
      empresa: "Tech Solutions",
      etapa: "novo",
      responsavel: "Maria Santos",
      dataUltimoContato: "2024-01-02",
      valor: "R$ 15.000"
    },
    {
      id: 2,
      nome: "Ana Costa",
      email: "ana@startup.com",
      telefone: "(11) 99999-2222",
      empresa: "Startup Inovadora",
      etapa: "contato",
      responsavel: "Pedro Lima",
      dataUltimoContato: "2024-01-01",
      valor: "R$ 25.000"
    },
    {
      id: 3,
      nome: "Carlos Santos",
      email: "carlos@corp.com",
      telefone: "(11) 99999-3333",
      empresa: "Corporação ABC",
      etapa: "proposta",
      responsavel: "Maria Santos",
      dataUltimoContato: "2023-12-30",
      valor: "R$ 50.000"
    },
    {
      id: 4,
      nome: "Fernanda Oliveira",
      email: "fernanda@negocio.com",
      telefone: "(11) 99999-4444",
      empresa: "Negócio Digital",
      etapa: "fechado",
      responsavel: "Pedro Lima",
      dataUltimoContato: "2023-12-28",
      valor: "R$ 35.000"
    }
  ]

  const etapas = [
    { value: "novo", label: "Novo Lead", cor: "bg-blue-500" },
    { value: "contato", label: "Em Contato", cor: "bg-yellow-500" },
    { value: "proposta", label: "Proposta Enviada", cor: "bg-orange-500" },
    { value: "fechado", label: "Fechado Ganho", cor: "bg-green-500" },
    { value: "perdido", label: "Perdido", cor: "bg-red-500" }
  ]

  const responsaveis = ["Maria Santos", "Pedro Lima", "Ana Silva"]

  const getEtapaBadge = (etapa: string) => {
    const etapaInfo = etapas.find(e => e.value === etapa)
    return etapaInfo ? etapaInfo : { label: etapa, cor: "bg-gray-500" }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.empresa.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEtapa = filterEtapa === "todas" || lead.etapa === filterEtapa
    const matchesResponsavel = filterResponsavel === "todos" || lead.responsavel === filterResponsavel

    return matchesSearch && matchesEtapa && matchesResponsavel
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Gestão de Leads
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os seus leads e oportunidades de vendas
          </p>
        </div>
        <Link to="/crm/leads/novo">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        </Link>
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
                  placeholder="Buscar por nome, email ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterEtapa} onValueChange={setFilterEtapa}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todas as etapas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as etapas</SelectItem>
                {etapas.map(etapa => (
                  <SelectItem key={etapa.value} value={etapa.value}>
                    {etapa.label}
                  </SelectItem>
                ))}
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

      {/* Tabela de Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads ({filteredLeads.length})</CardTitle>
          <CardDescription>
            Todos os leads registrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Último Contato</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const etapaBadge = getEtapaBadge(lead.etapa)
                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{lead.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {lead.telefone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {lead.empresa}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <div className={`w-2 h-2 rounded-full ${etapaBadge.cor}`} />
                          {etapaBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.responsavel}</TableCell>
                      <TableCell>{lead.dataUltimoContato}</TableCell>
                      <TableCell className="font-medium">{lead.valor}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/crm/leads/${lead.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to={`/crm/leads/${lead.id}/editar`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}