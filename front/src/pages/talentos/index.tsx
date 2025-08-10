import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { AdvancedFilters } from '@/components/advanced-filters'

import { AutoComplete } from 'primereact/autocomplete'
import { getTalentsPaginated, PaginatedTalentsResponse } from '@/lib/talent-service'
import { TalentData } from '@/types/talent'
import { Pagination } from '@/components/ui/pagination'
import { MoreVertical, Plus, Search, Filter } from 'lucide-react'

interface TalentCardProps {
  talent: TalentData
  navigate: any
}

function TalentCard({ talent, navigate }: TalentCardProps) {
  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer" onClick={() => navigate(`/talentos/perfil/${talent.id}`)}>
      <div className="aspect-[3/4] relative overflow-hidden bg-muted">
        {talent.files?.[0]?.url ? (
          <img 
            src={talent.files[0].url} 
            alt={talent.fullName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {talent.fullName.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                onClick={(e) => e.stopPropagation()} // Impede que o clique no dropdown acione o card
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => navigate(`/talentos/perfil/${talent.id}`)}
              >
                Ver perfil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-base leading-tight">{talent.fullName}</h3>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{talent.age} anos</span>
            {talent.gender && (
              <>
                <span>•</span>
                <span>{talent.gender}</span>
              </>
            )}
          </div>

          {talent.email && (
            <p className="text-sm text-muted-foreground truncate">{talent.email}</p>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <Badge 
              variant={talent.status ? "default" : "secondary"}
              className="text-xs"
            >
              {talent.status ? "Ativo" : "Inativo"}
            </Badge>
            
            <Badge 
              variant={
                talent.dnaStatus === 'COMPLETE' ? "default" : 
                talent.dnaStatus === 'PARTIAL' ? "secondary" : 
                "outline"
              }
              className="text-xs"
            >
              DNA {talent.dnaStatus === 'COMPLETE' ? "Completo" : 
                   talent.dnaStatus === 'PARTIAL' ? "Parcial" : "Pendente"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TalentosPage() {
  const navigate = useNavigate()
  const [talents, setTalents] = useState<TalentData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dnaFilter, setDnaFilter] = useState<string>('')
  const [advancedFilters, setAdvancedFilters] = useState<any>({})
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [executionTime, setExecutionTime] = useState<number>(0)

  useEffect(() => {
    loadTalents()
  }, [currentPage, pageSize, searchTerm])

  const loadTalents = async () => {
    try {
      setLoading(true)
      const data: PaginatedTalentsResponse = await getTalentsPaginated(
        currentPage,
        pageSize,
        searchTerm || undefined,
        'created',
        true
      )
      setTalents(data.data)
      setTotalRecords(data.total)
      setTotalPages(data.totalPages)
      setExecutionTime(data.executionTimeMs)
    } catch (error) {
      console.error('Erro ao carregar talentos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Memoized filtered talents
  const filteredTalents = useMemo(() => {
    return talents.filter(talent => {
      // Search filter
      const matchesSearch = !searchTerm || 
        talent.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Status filter
      const matchesStatus = !statusFilter || statusFilter === 'all' ||
        (statusFilter === 'active' && talent.status) ||
        (statusFilter === 'inactive' && !talent.status)
      
      // DNA filter
      const matchesDNA = !dnaFilter || dnaFilter === 'all' || talent.dnaStatus === dnaFilter
      
      // Advanced filters
      const matchesAdvanced = Object.keys(advancedFilters).length === 0 || 
        Object.entries(advancedFilters).every(([key, value]) => {
          if (!value) return true
          
          if (key === 'ageRange' && typeof value === 'object' && value !== null && 'min' in value && 'max' in value) {
            return talent.age >= (value as any).min && talent.age <= (value as any).max
          }
          
          if (key === 'gender') {
            return talent.gender === value
          }
          
          if (key === 'location' && typeof value === 'string') {
            return talent.city?.toLowerCase().includes(value.toLowerCase())
          }
          
          if (key === 'travelAvailability') {
            return talent.dna?.travelAvailability === value
          }
          
          // DNA specific filters
          if (talent.dna) {
            if (key === 'bodyType') return talent.dna.bodyType === value
            if (key === 'hairColor') return talent.dna.hairColor === value
            if (key === 'eyeColor') return talent.dna.eyeColor === value
            if (key === 'disabilities' && Array.isArray(value) && value.length > 0) {
              return value.some(disability => 
                talent.dna?.intellectualDisability?.includes(disability) ||
                talent.dna?.physicalDisability?.includes(disability) ||
                talent.dna?.visualDisability?.includes(disability)
              )
            }
          }
          
          return true
        })
      
      return matchesSearch && matchesStatus && matchesDNA && matchesAdvanced
    })
  }, [talents, searchTerm, statusFilter, dnaFilter, advancedFilters])

  // Handlers de paginação
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Voltar para primeira página
  }

  // Autocomplete search suggestions
  const searchTalents = (query: string) => {
    if (!query) {
      setSearchSuggestions([])
      return
    }
    
    const suggestions = talents
      .filter(talent => 
        talent.fullName.toLowerCase().includes(query.toLowerCase()) ||
        talent.email?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 10)
      .map(talent => talent.fullName)
    
    setSearchSuggestions(suggestions)
  }

  // Memoized stats
  const stats = useMemo(() => {
    return {
      total: talents.length,
      active: talents.filter(t => t.status).length
    }
  }, [talents])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Talentos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerencie todos os talentos cadastrados na plataforma
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Talentos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerencie todos os talentos cadastrados na plataforma
            </p>
          </div>
          <Button onClick={() => navigate('/talentos/novo')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Talento
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Talentos</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <AutoComplete
                value={searchTerm}
                suggestions={searchSuggestions}
                completeMethod={(e) => searchTalents(e.query)}
                onChange={(e) => setSearchTerm(e.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full"
                inputClassName="pl-9 w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dnaFilter} onValueChange={setDnaFilter}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="DNA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os DNA</SelectItem>
              <SelectItem value="COMPLETE">Completo</SelectItem>
              <SelectItem value="PARTIAL">Parcial</SelectItem>
              <SelectItem value="UNDEFINED">Indefinido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters 
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          onClearFilters={() => setAdvancedFilters({})}
        />

        {/* Talents Grid */}
        {talents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {talents.map((talent) => (
                <TalentCard key={talent.id} talent={talent} navigate={navigate} />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalRecords}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                isLoading={loading}
                executionTime={executionTime}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto max-w-md">
              <h3 className="text-lg font-semibold mb-2">Nenhum talento encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Não encontramos talentos que correspondam aos filtros aplicados.
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setDnaFilter('all')
                    setAdvancedFilters({})
                  }}
                >
                  Limpar filtros
                </Button>
                <Button onClick={() => navigate('/talentos/novo')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Talento
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}