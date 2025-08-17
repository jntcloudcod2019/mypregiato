
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Search, Plus, Filter, FileText, Eye, Download, ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ContractsService, ContractRecord } from "@/services/contracts-service"

export default function Contratos() {
  const [contratos, setContratos] = useState<ContractRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    loadContratos()
  }, [])

  const loadContratos = async () => {
    const savedContratos = await ContractsService.getAll()
    setContratos(savedContratos)
  }

  const filteredContratos = contratos.filter(contrato =>
    contrato.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contrato.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contrato.produtor.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      "Ativo": "bg-green-500/20 text-green-300",
      "Pendente": "bg-yellow-500/20 text-yellow-300",
      "Concluído": "bg-blue-500/20 text-blue-300",
      "Enviado": "bg-purple-500/20 text-purple-300"
    }
    return variants[status] || "bg-gray-500/20 text-gray-300"
  }

  const handleWhatsAppOpen = (whatsappLink: string) => {
    window.open(whatsappLink, '_blank')
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return dateString
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">Contratos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus contratos de agenciamento
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="mr-2 h-4 w-4" />
              Novo Contrato
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
            <DropdownMenuItem 
              onClick={() => navigate('/contratos/novo-super-fotos')}
              className="cursor-pointer hover:bg-accent"
            >
              <FileText className="mr-2 h-4 w-4" />
              Contrato Super Fotos
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate('/contratos/agenciamento')}
              className="cursor-pointer hover:bg-accent"
            >
              <FileText className="mr-2 h-4 w-4" />
              Contrato de Agenciamento
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate('/contratos/super-fotos-menor')}
              className="cursor-pointer hover:bg-accent"
            >
              <FileText className="mr-2 h-4 w-4" />
              Contrato Super Fotos (Menor Idade)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate('/contratos/agenciamento-menor')}
              className="cursor-pointer hover:bg-accent"
            >
              <FileText className="mr-2 h-4 w-4" />
              Contrato Agenciamento (Menor Idade)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => navigate('/contratos/comprometimento')}
              className="cursor-pointer hover:bg-accent"
            >
              <FileText className="mr-2 h-4 w-4" />
              Contrato de Comprometimento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar contratos por cliente, tipo ou produtor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Button variant="outline" className="border-border">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContratos.map((contrato) => (
          <Card key={contrato.id} className="bg-gradient-card border-border/50 shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {ContractsService.getContractTypeDisplayName(contrato.tipo)}
                  </CardTitle>
                  <CardDescription>
                    Cliente: {contrato.cliente} • Produtor: {contrato.produtor}
                  </CardDescription>
                </div>
                <Badge className={getStatusBadge(contrato.status)}>
                  {contrato.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Data: {formatDate(contrato.data)}
                  </p>
                  <p className="font-semibold text-lg">{contrato.valor}</p>
                  {contrato.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Criado em: {formatDate(contrato.createdAt)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-border">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="border-border">
                    <Download className="h-4 w-4" />
                  </Button>
                  {contrato.whatsappLink && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-border text-green-600 hover:text-green-700"
                      onClick={() => handleWhatsAppOpen(contrato.whatsappLink!)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContratos.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum contrato encontrado</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Tente ajustar sua busca" : "Comece criando seu primeiro contrato"}
          </p>
        </div>
      )}
    </div>
  )
}
