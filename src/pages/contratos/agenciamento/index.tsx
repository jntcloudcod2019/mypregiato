import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Search, Filter, FileText, Calendar, User } from "lucide-react"
import { useNavigate } from "react-router-dom"

// Mock data para contratos de agenciamento
const mockContratosAgenciamento = [
  {
    id: "1",
    modeloNome: "Ana Silva",
    produtorNome: "João Producer",
    cidade: "São Paulo",
    uf: "SP",
    dataContrato: "15 de Janeiro de 2024",
    duracao: 12,
    status: "Ativo"
  },
  {
    id: "2",
    modeloNome: "Carlos Santos",
    produtorNome: "Maria Producer",
    cidade: "Rio de Janeiro",
    uf: "RJ",
    dataContrato: "20 de Dezembro de 2023",
    duracao: 6,
    status: "Expirado"
  },
  {
    id: "3",
    modeloNome: "Fernanda Costa",
    produtorNome: "Pedro Producer",
    cidade: "Belo Horizonte",
    uf: "MG",
    dataContrato: "10 de Fevereiro de 2024",
    duracao: 24,
    status: "Ativo"
  }
]

export default function ContratosAgenciamento() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredContratos = mockContratosAgenciamento.filter(contrato =>
    contrato.modeloNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contrato.produtorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contrato.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ativo":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Ativo</Badge>
      case "Expirado":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Expirado</Badge>
      case "Pendente":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pendente</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/contratos')}
            className="border-border"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contratos de Agenciamento</h1>
            <p className="text-muted-foreground">
              Gerencie contratos de agenciamento de modelos
            </p>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/contratos/agenciamento/novo')}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por modelo, produtor ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>
        <Button variant="outline" className="border-border">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Lista de Contratos */}
      <div className="grid gap-4">
        {filteredContratos.length > 0 ? (
          filteredContratos.map((contrato) => (
            <Card key={contrato.id} className="bg-card border-border hover:bg-muted/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{contrato.modeloNome}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Produtor: {contrato.produtorNome}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {contrato.dataContrato}
                      </div>
                      <div>
                        {contrato.cidade}, {contrato.uf}
                      </div>
                      <div>
                        Duração: {contrato.duracao} meses
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(contrato.status)}
                    <Button variant="outline" size="sm" className="border-border">
                      <FileText className="h-4 w-4 mr-1" />
                      Ver Contrato
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">Nenhum contrato encontrado</CardTitle>
              <CardDescription>
                {searchTerm 
                  ? "Tente ajustar sua busca ou limpar os filtros."
                  : "Comece criando seu primeiro contrato de agenciamento."
                }
              </CardDescription>
              {!searchTerm && (
                <Button 
                  onClick={() => navigate('/contratos/agenciamento/novo')}
                  className="mt-4 bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Contrato
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}