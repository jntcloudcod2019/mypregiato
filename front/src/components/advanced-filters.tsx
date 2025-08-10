
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Filter, X } from "lucide-react"

export interface AdvancedFilters {
  gender?: string
  bodyType?: string
  minAge?: number
  maxAge?: number
  city?: string
  travelAvailable?: boolean
  hairColor?: string
  eyeColor?: string
  disabilities?: string[]
}

interface AdvancedFiltersProps {
  filters: AdvancedFilters
  onFiltersChange: (filters: AdvancedFilters) => void
  onClearFilters: () => void
}

export function AdvancedFilters({ filters, onFiltersChange, onClearFilters }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateFilter = (key: keyof AdvancedFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const toggleDisability = (disability: string, checked: boolean) => {
    const currentDisabilities = filters.disabilities || []
    const updatedDisabilities = checked
      ? [...currentDisabilities, disability]
      : currentDisabilities.filter(d => d !== disability)
    
    updateFilter('disabilities', updatedDisabilities)
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== '' && value !== 'all' &&
    (Array.isArray(value) ? value.length > 0 : true)
  )

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros Avançados
                {hasActiveFilters && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    Ativo
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onClearFilters()
                    }}
                  >
                    <X className="h-4 w-4" />
                    Limpar
                  </Button>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="physical">Físico</TabsTrigger>
                <TabsTrigger value="characteristics">Características</TabsTrigger>
                <TabsTrigger value="accessibility">Acessibilidade</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Gênero</Label>
                    <Select value={filters.gender || "all"} onValueChange={(value) => updateFilter('gender', value === 'all' ? undefined : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar gênero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="nao-binario">Não binário</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      placeholder="Digite a cidade"
                      value={filters.city || ""}
                      onChange={(e) => updateFilter('city', e.target.value || undefined)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Disponível para viagem</Label>
                    <Select 
                      value={filters.travelAvailable === undefined ? "all" : filters.travelAvailable.toString()} 
                      onValueChange={(value) => updateFilter('travelAvailable', value === "all" ? undefined : value === "true")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Idade mínima</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 18"
                      min="0"
                      max="100"
                      value={filters.minAge || ""}
                      onChange={(e) => updateFilter('minAge', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Idade máxima</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 65"
                      min="0"
                      max="100"
                      value={filters.maxAge || ""}
                      onChange={(e) => updateFilter('maxAge', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="physical" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo Corporal</Label>
                    <Select value={filters.bodyType || "all"} onValueChange={(value) => updateFilter('bodyType', value === 'all' ? undefined : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="magro">Magro</SelectItem>
                        <SelectItem value="plus-size">Plus Size</SelectItem>
                        <SelectItem value="fitness">Fitness</SelectItem>
                        <SelectItem value="atletico">Atlético</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cor do Cabelo</Label>
                    <Select value={filters.hairColor || "all"} onValueChange={(value) => updateFilter('hairColor', value === 'all' ? undefined : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar cor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="loiro">Loiro</SelectItem>
                        <SelectItem value="castanho">Castanho</SelectItem>
                        <SelectItem value="preto">Preto</SelectItem>
                        <SelectItem value="ruivo">Ruivo</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cor dos Olhos</Label>
                    <Select value={filters.eyeColor || "all"} onValueChange={(value) => updateFilter('eyeColor', value === 'all' ? undefined : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar cor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="azul">Azul</SelectItem>
                        <SelectItem value="verde">Verde</SelectItem>
                        <SelectItem value="castanho">Castanho</SelectItem>
                        <SelectItem value="preto">Preto</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="characteristics" className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Filtros adicionais baseados em características específicas serão implementados conforme necessário.
                </div>
              </TabsContent>

              <TabsContent value="accessibility" className="space-y-4">
                <div className="space-y-4">
                  <Label className="text-base font-medium">Deficiências</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'Deficiência Visual',
                      'Deficiência Auditiva', 
                      'Deficiência Física',
                      'Deficiência Intelectual',
                      'Deficiência Múltipla',
                      'Transtorno do Espectro Autista'
                    ].map((disability) => (
                      <div key={disability} className="flex items-center space-x-2">
                        <Checkbox
                          id={disability}
                          checked={(filters.disabilities || []).includes(disability)}
                          onCheckedChange={(checked) => toggleDisability(disability, checked as boolean)}
                        />
                        <Label htmlFor={disability} className="text-sm font-normal">
                          {disability}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
