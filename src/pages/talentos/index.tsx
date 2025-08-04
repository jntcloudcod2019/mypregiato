import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Plus, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllTalents } from "@/lib/talent-service"
import { TalentData } from "@/types/talent"
import { useToast } from "@/hooks/use-toast"

const TalentCard = ({ talent, navigate }: { talent: TalentData; navigate: any }) => {
  const photo = talent.files?.[0]?.url || "/placeholder.svg"
  const inviteStatus = talent.inviteSent ? (talent.clerkInviteId ? "Ativo" : "Pendente") : "Não Enviado"
  
  return (
    <Card className="w-full h-96 overflow-hidden group hover-lift hover-glow shadow-card bg-gradient-card border-border/50">
      <div className="relative h-64 overflow-hidden">
        <img 
          src={photo} 
          alt={talent.fullName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="font-semibold text-lg mb-1">{talent.fullName}</h3>
          <p className="text-sm opacity-90">{talent.age} anos</p>
        </div>
        <div className="absolute top-4 right-4 flex flex-col gap-1">
          {talent.dna?.travelAvailability && (
            <Badge className="bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">
              Viagens
            </Badge>
          )}
          <Badge 
            variant={inviteStatus === "Ativo" ? "default" : inviteStatus === "Pendente" ? "secondary" : "outline"}
            className="text-xs backdrop-blur-sm"
          >
            {inviteStatus}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs bg-secondary/20 text-secondary-foreground border border-secondary/30">
              {talent.city || "Não informado"}
            </Badge>
            <Badge variant="outline" className={`text-xs ${talent.dnaStatus === 'COMPLETE' ? 'text-green-600' : talent.dnaStatus === 'PARTIAL' ? 'text-yellow-600' : 'text-gray-600'}`}>
              DNA: {talent.dnaStatus === 'COMPLETE' ? 'Completo' : talent.dnaStatus === 'PARTIAL' ? 'Parcial' : 'Indefinido'}
            </Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="group relative overflow-hidden border-primary/50 text-primary hover:text-white hover:border-primary transition-all duration-300"
            onClick={() => navigate(`/talentos/perfil/${talent.id}`)}
          >
            <span className="relative z-10 flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Ver mais
            </span>
            <div className="absolute inset-0 bg-gradient-primary translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const TalentSkeleton = () => (
  <Card className="w-full h-96 overflow-hidden">
    <div className="relative h-64">
      <Skeleton className="w-full h-full" />
    </div>
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </CardContent>
  </Card>
)

export default function Talentos() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [talents, setTalents] = useState<TalentData[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const itemsPerPage = 12

  // Filters state
  const [selectedGender, setSelectedGender] = useState<string[]>([])
  const [selectedBodyType, setSelectedBodyType] = useState<string[]>([])
  const [ageMin, setAgeMin] = useState("")
  const [ageMax, setAgeMax] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [availableForTravel, setAvailableForTravel] = useState<boolean | undefined>(undefined)

  // Filter options
  const genderOptions = ["masculino", "feminino", "nao-binario", "outros"]
  const bodyTypeOptions = ["Magro", "Plus Size", "Fitness", "Atlético"]
  const hairColorOptions = ["Loiro", "Castanho", "Preto", "Ruivo", "Outro"]
  const eyeColorOptions = ["Azul", "Verde", "Castanho", "Preto", "Outro"]
  const ethnicityOptions = ["Branco", "Negro", "Pardo", "Amarelo", "Indígena", "Outro"]
  const expressivenessOptions = ["Baixa", "Média", "Alta"]
  const disabilityOptions = ["Nenhuma", "Visual", "Auditiva", "Física", "Intelectual", "Múltipla"]

  // Fetch talents from database
  const fetchTalents = async () => {
    try {
      setLoading(true)
      const filters = {
        gender: selectedGender.length > 0 ? selectedGender[0] : undefined,
        bodyType: selectedBodyType.length > 0 ? selectedBodyType[0] : undefined,
        ageMin: ageMin ? parseInt(ageMin) : undefined,
        ageMax: ageMax ? parseInt(ageMax) : undefined,
        city: selectedCity || undefined,
        travelAvailability: availableForTravel
      }
      
      const result = await getAllTalents(currentPage, itemsPerPage, searchTerm, filters)
      setTalents(result.talents)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      console.error('Erro ao buscar talentos:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar talentos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch talents when filters change
  useEffect(() => {
    fetchTalents()
  }, [currentPage, searchTerm, selectedGender, selectedBodyType, ageMin, ageMax, selectedCity, availableForTravel])

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchTerm, selectedGender, selectedBodyType, ageMin, ageMax, selectedCity, availableForTravel])

  const handleGenderChange = (gender: string, checked: boolean) => {
    if (checked) {
      setSelectedGender([gender])
    } else {
      setSelectedGender([])
    }
  }

  const handleBodyTypeChange = (bodyType: string, checked: boolean) => {
    if (checked) {
      setSelectedBodyType([bodyType])
    } else {
      setSelectedBodyType([])
    }
  }

  const clearAllFilters = () => {
    setSelectedGender([])
    setSelectedBodyType([])
    setAgeMin("")
    setAgeMax("")
    setSelectedCity("")
    setAvailableForTravel(undefined)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">
            Gestão de Talentos
          </h1>
          <p className="text-muted-foreground">
            Gerencie o banco de talentos da agência, adicione novos perfis e acompanhe os cadastros. ({total} talentos)
          </p>
        </div>
        <Button 
          onClick={() => navigate('/talentos/novo')}
          className="bg-primary hover:bg-primary/90 shadow-elegant hover:shadow-glow border border-primary/20 backdrop-blur-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Talento
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Talentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros Avançados
            </Button>
            {(selectedGender.length > 0 || selectedBodyType.length > 0 || ageMin || ageMax || selectedCity || availableForTravel) && (
              <>
                <Badge variant="secondary">
                  {[selectedGender.length, selectedBodyType.length, ageMin ? 1 : 0, ageMax ? 1 : 0, selectedCity ? 1 : 0, availableForTravel ? 1 : 0]
                    .reduce((a, b) => a + b, 0)} filtros ativos
                </Badge>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={clearAllFilters}
                   className="text-muted-foreground hover:text-foreground"
                 >
                   Limpar filtros
                 </Button>
              </>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <Tabs defaultValue="gender" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="gender">Gênero</TabsTrigger>
                <TabsTrigger value="body">Corpo</TabsTrigger>
                <TabsTrigger value="age">Idade</TabsTrigger>
                <TabsTrigger value="location">Local</TabsTrigger>
                 <TabsTrigger value="travel">Viagem</TabsTrigger>
              </TabsList>

              <TabsContent value="gender" className="space-y-3">
                <h4 className="font-medium">Gênero</h4>
                 <div className="grid grid-cols-2 gap-3">
                   {genderOptions.map((gender) => (
                     <div key={gender} className="flex items-center space-x-2">
                       <Checkbox
                         id={gender}
                         checked={selectedGender.includes(gender)}
                         onCheckedChange={(checked) => handleGenderChange(gender, checked as boolean)}
                       />
                       <Label htmlFor={gender}>
                         {gender === 'masculino' ? 'Masculino' : 
                          gender === 'feminino' ? 'Feminino' : 
                          gender === 'nao-binario' ? 'Não Binário' : 'Outros'}
                       </Label>
                     </div>
                   ))}
                 </div>
              </TabsContent>

              <TabsContent value="body" className="space-y-3">
                <h4 className="font-medium">Tipo Corporal</h4>
                <div className="grid grid-cols-2 gap-3">
                  {bodyTypeOptions.map((bodyType) => (
                    <div key={bodyType} className="flex items-center space-x-2">
                      <Checkbox
                        id={bodyType}
                        checked={selectedBodyType.includes(bodyType)}
                        onCheckedChange={(checked) => handleBodyTypeChange(bodyType, checked as boolean)}
                      />
                      <Label htmlFor={bodyType}>{bodyType}</Label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="age" className="space-y-3">
                <h4 className="font-medium">Idade</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="ageMin">Idade Mínima</Label>
                    <Input
                      id="ageMin"
                      type="number"
                      placeholder="18"
                      value={ageMin}
                      onChange={(e) => setAgeMin(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ageMax">Idade Máxima</Label>
                    <Input
                      id="ageMax"
                      type="number"
                      placeholder="65"
                      value={ageMax}
                      onChange={(e) => setAgeMax(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="location" className="space-y-3">
                <h4 className="font-medium">Cidade</h4>
                <Input
                  placeholder="Digite a cidade..."
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                />
              </TabsContent>


                  <div className="space-y-3">
                    <h4 className="font-medium">Cor dos Olhos</h4>
                    <div className="space-y-2">
                      {eyeColorOptions.map((color) => (
                        <div key={color} className="flex items-center space-x-2">
                          <Checkbox id={`eye-${color}`} />
                          <Label htmlFor={`eye-${color}`}>{color}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Etnia/Raça</h4>
                    <div className="space-y-2">
                      {ethnicityOptions.map((ethnicity) => (
                        <div key={ethnicity} className="flex items-center space-x-2">
                          <Checkbox id={`ethnicity-${ethnicity}`} />
                          <Label htmlFor={`ethnicity-${ethnicity}`}>{ethnicity}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Nível de Expressividade</h4>
                    <div className="space-y-2">
                      {expressivenessOptions.map((level) => (
                        <div key={level} className="flex items-center space-x-2">
                          <Checkbox id={`expr-${level}`} />
                          <Label htmlFor={`expr-${level}`}>{level}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Métricas Físicas (Biometria)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label htmlFor="height">Altura (m)</Label>
                      <Input id="height" placeholder="1.75" />
                    </div>
                    <div>
                      <Label htmlFor="bust">Busto (cm)</Label>
                      <Input id="bust" placeholder="90" />
                    </div>
                    <div>
                      <Label htmlFor="waist">Cintura (cm)</Label>
                      <Input id="waist" placeholder="60" />
                    </div>
                    <div>
                      <Label htmlFor="hip">Quadril (cm)</Label>
                      <Input id="hip" placeholder="90" />
                    </div>
                    <div>
                      <Label htmlFor="shoeSize">Sapato</Label>
                      <Input id="shoeSize" placeholder="38" />
                    </div>
                    <div>
                      <Label htmlFor="size">Manequim</Label>
                      <Input id="size" placeholder="M" />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Talent Cards */}
      <Card className="shadow-modern bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-gradient-primary">Talentos Cadastrados ({filteredTalents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedTalents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedTalents.map((talent) => (
                <TalentCard key={talent.id} talent={talent} navigate={navigate} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Nenhum talento encontrado com os filtros aplicados.</p>
              <p className="text-muted-foreground/70 text-sm mt-2">Tente ajustar os filtros ou limpar a busca.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}