import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Filter, Eye, MoreHorizontal, UserPlus, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { getTalents } from '@/lib/talent-service'
import { TalentData } from "@/types/talent"
import { useToast } from "@/hooks/use-toast"
import { AdvancedFilters, AdvancedFilters as AdvancedFiltersType } from "@/components/advanced-filters"

const TalentCard = ({ talent, navigate }: { talent: TalentData; navigate: any }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const getStatusBadge = () => {
    if (!talent.status) {
      return <Badge variant="secondary">Inativo</Badge>
    }
    return <Badge variant="outline">Ativo</Badge>
  }

  const getDNAStatus = () => {
    switch (talent.dnaStatus) {
      case 'COMPLETE':
        return <Badge variant="default" className="bg-blue-500">DNA Completo</Badge>
      case 'PARTIAL':
        return <Badge variant="secondary">DNA Parcial</Badge>
      default:
        return <Badge variant="outline">DNA Pendente</Badge>
    }
  }

  const profileImage = talent.files?.[0]?.url || "/placeholder.svg"

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-primary/20 hover:border-primary/40 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={profileImage} alt={talent.fullName} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(talent.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {talent.fullName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {talent.age} anos • {talent.gender}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/talentos/perfil/${talent.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Perfil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">Contato</span>
            <p className="text-sm">{talent.email || 'Email não informado'}</p>
            <p className="text-sm">{talent.phone || 'Telefone não informado'}</p>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">Localização</span>
            <p className="text-sm">
              {talent.city && talent.uf ? `${talent.city}, ${talent.uf}` : 'Não informado'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {getStatusBadge()}
            {getDNAStatus()}
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/talentos/perfil/${talent.id}`)}
              className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            >
              Ver mais
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TalentosPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [talents, setTalents] = useState<TalentData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDNA, setFilterDNA] = useState("all")
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersType>({})

  useEffect(() => {
    loadTalents()
  }, [])

  const loadTalents = async () => {
    try {
      setLoading(true)
      const data = await getTalents()
      setTalents(data)
    } catch (error) {
      console.error('Erro ao carregar talentos:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar talentos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTalents = useMemo(() => {
    return talents.filter(talent => {
      const matchesSearch = talent.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (talent.email && talent.email.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = filterStatus === "all" || 
                           (filterStatus === "active" && talent.status) ||
                           (filterStatus === "inactive" && !talent.status) ||
                           (filterStatus === "invited" && talent.inviteSent)
      
      const matchesDNA = filterDNA === "all" ||
                        (filterDNA === "complete" && talent.dnaStatus === 'COMPLETE') ||
                        (filterDNA === "partial" && talent.dnaStatus === 'PARTIAL') ||
                        (filterDNA === "pending" && talent.dnaStatus === 'UNDEFINED')

      // Advanced filters
      const matchesGender = !advancedFilters.gender || talent.gender === advancedFilters.gender
      const matchesAge = (!advancedFilters.minAge || talent.age >= advancedFilters.minAge) &&
                        (!advancedFilters.maxAge || talent.age <= advancedFilters.maxAge)
      const matchesCity = !advancedFilters.city || 
                         (talent.city && talent.city.toLowerCase().includes(advancedFilters.city.toLowerCase()))
      const matchesTravel = advancedFilters.travelAvailable === undefined || 
                           (talent.dna?.travelAvailability === advancedFilters.travelAvailable)
      const matchesHairColor = !advancedFilters.hairColor || 
                              (talent.dna?.hairColor?.toLowerCase() === advancedFilters.hairColor.toLowerCase())
      const matchesEyeColor = !advancedFilters.eyeColor || 
                             (talent.dna?.eyeColor?.toLowerCase() === advancedFilters.eyeColor.toLowerCase())
      const matchesBodyType = !advancedFilters.bodyType || 
                             (talent.dna?.bodyType?.toLowerCase() === advancedFilters.bodyType.toLowerCase())
      
      return matchesSearch && matchesStatus && matchesDNA && matchesGender && 
             matchesAge && matchesCity && matchesTravel && matchesHairColor && 
             matchesEyeColor && matchesBodyType
    })
  }, [talents, searchTerm, filterStatus, filterDNA, advancedFilters])

  const stats = useMemo(() => {
    return {
      total: talents.length,
      active: talents.filter(t => t.status).length,
      invited: talents.filter(t => t.inviteSent).length,
      dnaComplete: talents.filter(t => t.dnaStatus === 'COMPLETE').length
    }
  }, [talents])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">
            Talentos
          </h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe todos os talentos cadastrados
          </p>
        </div>
        <Button 
          onClick={() => navigate('/talentos/novo')}
          className="bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground shadow-elegant hover:shadow-glow transition-all duration-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Talento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-subtle border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Talentos</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convites Enviados</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.invited}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DNA Completo</CardTitle>
            <Filter className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.dnaComplete}</div>
          </CardContent>
        </Card>
      </div>

      {/* Basic Filters */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Filtros Básicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50 border-primary/20 focus:border-primary/40"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 bg-background/50 border-primary/20">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="invited">Convite Enviado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterDNA} onValueChange={setFilterDNA}>
              <SelectTrigger className="w-full md:w-48 bg-background/50 border-primary/20">
                <SelectValue placeholder="DNA Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos DNA</SelectItem>
                <SelectItem value="complete">DNA Completo</SelectItem>
                <SelectItem value="partial">DNA Parcial</SelectItem>
                <SelectItem value="pending">DNA Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        onClearFilters={() => setAdvancedFilters({})}
      />

      {/* Talents Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {filteredTalents.length} {filteredTalents.length === 1 ? 'talento encontrado' : 'talentos encontrados'}
          </h2>
        </div>

        {filteredTalents.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <UserPlus className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum talento encontrado</h3>
              <p className="text-muted-foreground text-center mb-6">
                {searchTerm || filterStatus !== "all" || filterDNA !== "all" 
                  ? "Tente ajustar os filtros de busca ou adicione um novo talento."
                  : "Comece adicionando seu primeiro talento ao sistema."
                }
              </p>
              <Button 
                onClick={() => navigate('/talentos/novo')}
                className="bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground shadow-elegant hover:shadow-glow transition-all duration-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Talento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTalents.map((talent) => (
              <TalentCard 
                key={talent.id} 
                talent={talent} 
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}