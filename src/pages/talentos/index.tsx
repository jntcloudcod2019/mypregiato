import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Plus } from "lucide-react"
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

// Mock data - Replace with actual Supabase queries
const mockTalents = [
  {
    id: 1,
    name: "Ana Silva",
    age: 25,
    email: "ana.silva@email.com",
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400",
    gender: "Feminino",
    bodyType: "Fitness",
    city: "São Paulo",
    availableForTravel: true,
    hairColor: "Castanho",
    eyeColor: "Castanho",
    ethnicity: "Parda",
    height: "1.75",
    expressiveness: "Alta"
  },
  {
    id: 2,
    name: "Carlos Oliveira",
    age: 28,
    email: "carlos.oliveira@email.com",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    gender: "Masculino",
    bodyType: "Atlético",
    city: "Rio de Janeiro",
    availableForTravel: false,
    hairColor: "Preto",
    eyeColor: "Azul",
    ethnicity: "Branco",
    height: "1.82",
    expressiveness: "Média"
  },
  {
    id: 3,
    name: "Mariana Costa",
    age: 22,
    email: "mariana.costa@email.com",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    gender: "Feminino",
    bodyType: "Magro",
    city: "Belo Horizonte",
    availableForTravel: true,
    hairColor: "Loiro",
    eyeColor: "Verde",
    ethnicity: "Branco",
    height: "1.68",
    expressiveness: "Alta"
  },
  {
    id: 4,
    name: "Roberto Santos",
    age: 30,
    email: "roberto.santos@email.com",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    gender: "Masculino",
    bodyType: "Plus Size",
    city: "Salvador",
    availableForTravel: true,
    hairColor: "Preto",
    eyeColor: "Castanho",
    ethnicity: "Negro",
    height: "1.78",
    expressiveness: "Média"
  },
  {
    id: 5,
    name: "Sofia Mendes",
    age: 26,
    email: "sofia.mendes@email.com",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    gender: "Feminino",
    bodyType: "Fitness",
    city: "Recife",
    availableForTravel: false,
    hairColor: "Ruivo",
    eyeColor: "Verde",
    ethnicity: "Branco",
    height: "1.70",
    expressiveness: "Alta"
  },
  {
    id: 6,
    name: "Lucas Ferreira",
    age: 24,
    email: "lucas.ferreira@email.com",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    gender: "Masculino",
    bodyType: "Magro",
    city: "Porto Alegre",
    availableForTravel: true,
    hairColor: "Castanho",
    eyeColor: "Castanho",
    ethnicity: "Pardo",
    height: "1.76",
    expressiveness: "Baixa"
  }
]

const TalentCard = ({ talent, navigate }: { talent: any; navigate: any }) => {
  return (
    <Card className="w-72 h-96 mx-3 overflow-hidden group hover-lift hover-glow shadow-lg bg-gradient-card border-border/50">
      <div className="relative h-64 overflow-hidden">
        <img 
          src={talent.photo} 
          alt={talent.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="font-semibold text-lg mb-1">{talent.name}</h3>
          <p className="text-sm opacity-90">{talent.age} anos</p>
        </div>
        <div className="absolute top-4 right-4">
          {talent.availableForTravel && (
            <Badge className="bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">
              Viagens
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs bg-secondary/20 text-secondary-foreground border border-secondary/30">
              {talent.city}
            </Badge>
          </div>
          <Button 
            variant="contained" 
            size="sm"
            onClick={() => navigate(`/talentos/perfil/${talent.id}`)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Ver mais
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Talentos() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Filters state
  const [selectedGender, setSelectedGender] = useState<string[]>([])
  const [selectedBodyType, setSelectedBodyType] = useState<string[]>([])
  const [ageMin, setAgeMin] = useState("")
  const [ageMax, setAgeMax] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [availableForTravel, setAvailableForTravel] = useState<string>("")

  // Filter options
  const genderOptions = ["Masculino", "Feminino", "Não Binário", "Outros"]
  const bodyTypeOptions = ["Magro", "Plus Size", "Fitness", "Atlético"]
  const hairColorOptions = ["Loiro", "Castanho", "Preto", "Ruivo", "Outro"]
  const eyeColorOptions = ["Azul", "Verde", "Castanho", "Preto", "Outro"]
  const ethnicityOptions = ["Branco", "Negro", "Pardo", "Amarelo", "Indígena", "Outro"]
  const expressivenessOptions = ["Baixa", "Média", "Alta"]
  const disabilityOptions = ["Nenhuma", "Visual", "Auditiva", "Física", "Intelectual", "Múltipla"]

  // Commented out Supabase queries - Uncomment when Supabase is connected
  /*
  const fetchTalents = async () => {
    const { data, error } = await supabase
      .from('talents')
      .select('*')
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)
    
    if (error) {
      console.error('Error fetching talents:', error)
      return
    }
    
    setTalents(data || [])
  }

  const searchTalents = async (query: string) => {
    const { data, error } = await supabase
      .from('talents')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    
    if (error) {
      console.error('Error searching talents:', error)
      return
    }
    
    setTalents(data || [])
  }

  const filterTalents = async (filters: any) => {
    let query = supabase.from('talents').select('*')
    
    if (filters.gender?.length > 0) {
      query = query.in('gender', filters.gender)
    }
    
    if (filters.bodyType?.length > 0) {
      query = query.in('body_type', filters.bodyType)
    }
    
    if (filters.ageMin) {
      query = query.gte('age', filters.ageMin)
    }
    
    if (filters.ageMax) {
      query = query.lte('age', filters.ageMax)
    }
    
    if (filters.city) {
      query = query.eq('city', filters.city)
    }
    
    if (filters.availableForTravel !== '') {
      query = query.eq('available_for_travel', filters.availableForTravel === 'sim')
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error filtering talents:', error)
      return
    }
    
    setTalents(data || [])
  }
  */

  // Filter talents based on current filters (using mock data)
  const filteredTalents = mockTalents.filter(talent => {
    const matchesSearch = talent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         talent.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGender = selectedGender.length === 0 || selectedGender.includes(talent.gender)
    const matchesBodyType = selectedBodyType.length === 0 || selectedBodyType.includes(talent.bodyType)
    const matchesAgeMin = !ageMin || talent.age >= parseInt(ageMin)
    const matchesAgeMax = !ageMax || talent.age <= parseInt(ageMax)
    const matchesCity = !selectedCity || talent.city.toLowerCase().includes(selectedCity.toLowerCase())
    const matchesTravel = !availableForTravel || 
                         (availableForTravel === "sim" ? talent.availableForTravel : !talent.availableForTravel)
    
    return matchesSearch && matchesGender && matchesBodyType && matchesAgeMin && 
           matchesAgeMax && matchesCity && matchesTravel
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredTalents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTalents = filteredTalents.slice(startIndex, startIndex + itemsPerPage)

  const handleGenderChange = (gender: string, checked: boolean) => {
    if (checked) {
      setSelectedGender([...selectedGender, gender])
    } else {
      setSelectedGender(selectedGender.filter(g => g !== gender))
    }
  }

  const handleBodyTypeChange = (bodyType: string, checked: boolean) => {
    if (checked) {
      setSelectedBodyType([...selectedBodyType, bodyType])
    } else {
      setSelectedBodyType(selectedBodyType.filter(bt => bt !== bodyType))
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with fixed position for New Talent button */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 p-4 -m-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">
              Gestão de Talentos
            </h1>
            <p className="text-muted-foreground">
              Gerencie o banco de talentos da agência, adicione novos perfis e acompanhe os cadastros.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/talentos/novo')}
            variant="contained"
            className="shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Talento
          </Button>
        </div>
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
              variant="contained"
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
                  onClick={() => {
                    setSelectedGender([])
                    setSelectedBodyType([])
                    setAgeMin("")
                    setAgeMax("")
                    setSelectedCity("")
                    setAvailableForTravel("")
                  }}
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
              <TabsList className="grid w-full grid-cols-7 gap-1">
                <TabsTrigger value="gender" className="text-xs px-2">Gênero</TabsTrigger>
                <TabsTrigger value="body" className="text-xs px-2">Corpo</TabsTrigger>
                <TabsTrigger value="age" className="text-xs px-2">Idade</TabsTrigger>
                <TabsTrigger value="location" className="text-xs px-2">Local</TabsTrigger>
                <TabsTrigger value="travel" className="text-xs px-2">Viagem</TabsTrigger>
                <TabsTrigger value="disability" className="text-xs px-2">Deficiências</TabsTrigger>
                <TabsTrigger value="features" className="text-xs px-2">Características</TabsTrigger>
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
                      <Label htmlFor={gender}>{gender}</Label>
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

              <TabsContent value="travel" className="space-y-3">
                <h4 className="font-medium">Disponível para Viagem</h4>
                <RadioGroup value={availableForTravel} onValueChange={setAvailableForTravel}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="" id="any" />
                    <Label htmlFor="any">Qualquer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="yes" />
                    <Label htmlFor="yes">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="no" />
                    <Label htmlFor="no">Não</Label>
                  </div>
                </RadioGroup>
              </TabsContent>

              <TabsContent value="disability" className="space-y-3">
                <h4 className="font-medium">Deficiências</h4>
                <div className="grid grid-cols-2 gap-3">
                  {disabilityOptions.map((disability) => (
                    <div key={disability} className="flex items-center space-x-2">
                      <Checkbox id={disability} />
                      <Label htmlFor={disability}>{disability}</Label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Cor do Cabelo</h4>
                    <div className="space-y-2">
                      {hairColorOptions.map((color) => (
                        <div key={color} className="flex items-center space-x-2">
                          <Checkbox id={`hair-${color}`} />
                          <Label htmlFor={`hair-${color}`}>{color}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

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
            <Carousel
              opts={{
                align: "start",
                loop: true,
                skipSnaps: false,
                containScroll: "trimSnaps",
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-3">
                {paginatedTalents.map((talent) => (
                  <CarouselItem key={talent.id} className="pl-3 basis-auto">
                    <TalentCard talent={talent} navigate={navigate} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-4 mt-6">
                <CarouselPrevious className="relative left-0 translate-y-0 bg-card border-primary/30 hover:bg-primary hover:text-primary-foreground" />
                <CarouselNext className="relative right-0 translate-y-0 bg-card border-primary/30 hover:bg-primary hover:text-primary-foreground" />
              </div>
            </Carousel>
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