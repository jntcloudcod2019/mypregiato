import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CheckCircle, Edit, Plus, Trash2, Upload, Calendar as CalendarIcon, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Mock data - replace with Supabase queries
const mockTalent = {
  id: "1",
  name: "Ana Clara Silva",
  cpf: "123.456.789-00",
  email: "ana.clara@email.com",
  whatsapp: "(11) 99999-9999",
  phone: "(11) 3333-3333",
  birthDate: new Date("1995-06-15"),
  gender: "Feminino",
  cep: "01234-567",
  street: "Rua das Flores, 123",
  city: "São Paulo",
  state: "SP",
  neighborhood: "Centro",
  number: "123",
  complement: "Apto 45",
  active: true,
  photos: [
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg"
  ],
  dna: {
    physicalCharacteristics: {
      faceShape: "Oval",
      height: "1.75",
      weight: "65",
      bust: "90",
      waist: "65",
      hip: "95",
      shoeSize: "38",
      dressSize: "M"
    },
    facialCharacteristics: {
      eyeColor: "Castanho",
      hairColor: "Castanho",
      ethnicity: "Pardo",
      ethnicDetails: "Descendência italiana e africana"
    },
    otherCharacteristics: {
      tattoos: true,
      tattoosDescription: "Pequena tatuagem no pulso",
      piercings: false,
      piercingsDescription: "",
      skills: "Dança, atuação, yoga"
    }
  }
}

export default function TalentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [talent, setTalent] = useState(mockTalent)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTalent, setEditedTalent] = useState(mockTalent)
  const [showAlert, setShowAlert] = useState(false)
  const [activeTab, setActiveTab] = useState("fotos")
  const [showDNADialog, setShowDNADialog] = useState(false)
  const [activeDNATab, setActiveDNATab] = useState("physical")
  const [selectedDate, setSelectedDate] = useState<Date>()

  // Commented out Supabase queries - Uncomment when Supabase is connected
  /*
  useEffect(() => {
    const fetchTalent = async () => {
      const { data, error } = await supabase
        .from('talents')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching talent:', error)
        return
      }
      
      setTalent(data)
      setEditedTalent(data)
    }
    
    fetchTalent()
  }, [id])

  const updateTalent = async (updatedData: any) => {
    const { error } = await supabase
      .from('talents')
      .update(updatedData)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating talent:', error)
      return false
    }
    
    return true
  }

  const saveDNA = async (dnaData: any) => {
    const { error } = await supabase
      .from('talent_dna')
      .upsert({ talent_id: id, ...dnaData })
    
    if (error) {
      console.error('Error saving DNA:', error)
      return false
    }
    
    return true
  }
  */

  const handleSave = async () => {
    // Simulate API call
    setTimeout(() => {
      setTalent(editedTalent)
      setIsEditing(false)
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
    }, 500)
  }

  const handleDNASave = async () => {
    // Simulate API call
    setTimeout(() => {
      setShowDNADialog(false)
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
    }, 500)
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})/, '$1-$2')
  }

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Alert */}
      {showAlert && (
        <div className="animate-fade-in">
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Informações de {talent.name} atualizadas com sucesso.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Perfil do Talento</h1>
            <p className="text-muted-foreground">
              Visualize e edite as informações do talento
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "default" : "outline"}
        >
          <Edit className="mr-2 h-4 w-4" />
          {isEditing ? "Cancelar" : "Editar"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {talent.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Nome Completo</Label>
                  {isEditing ? (
                    <Input
                      value={editedTalent.name}
                      onChange={(e) => setEditedTalent({...editedTalent, name: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{talent.name}</p>
                  )}
                </div>

                <div>
                  <Label>CPF</Label>
                  {isEditing ? (
                    <Input
                      value={editedTalent.cpf}
                      onChange={(e) => setEditedTalent({...editedTalent, cpf: formatCPF(e.target.value)})}
                      maxLength={14}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{talent.cpf}</p>
                  )}
                </div>

                <div>
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedTalent.email}
                      onChange={(e) => setEditedTalent({...editedTalent, email: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{talent.email}</p>
                  )}
                </div>

                <div>
                  <Label>WhatsApp</Label>
                  {isEditing ? (
                    <Input
                      value={editedTalent.whatsapp}
                      onChange={(e) => setEditedTalent({...editedTalent, whatsapp: formatPhone(e.target.value)})}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{talent.whatsapp}</p>
                  )}
                </div>

                <div>
                  <Label>Telefone</Label>
                  {isEditing ? (
                    <Input
                      value={editedTalent.phone}
                      onChange={(e) => setEditedTalent({...editedTalent, phone: formatPhone(e.target.value)})}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{talent.phone}</p>
                  )}
                </div>

                <div>
                  <Label>Data de Nascimento</Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editedTalent.birthDate ? format(editedTalent.birthDate, "dd/MM/yyyy") : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editedTalent.birthDate}
                          onSelect={(date) => setEditedTalent({...editedTalent, birthDate: date || new Date()})}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {format(talent.birthDate, "dd/MM/yyyy")}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Gênero</Label>
                  {isEditing ? (
                    <Select
                      value={editedTalent.gender}
                      onValueChange={(value) => setEditedTalent({...editedTalent, gender: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Não Binário">Não Binário</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">{talent.gender}</p>
                  )}
                </div>

                <div>
                  <Label>CEP</Label>
                  {isEditing ? (
                    <Input
                      value={editedTalent.cep}
                      onChange={(e) => setEditedTalent({...editedTalent, cep: formatCEP(e.target.value)})}
                      maxLength={9}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{talent.cep}</p>
                  )}
                </div>

                <div>
                  <Label>Endereço</Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Rua"
                        value={editedTalent.street}
                        onChange={(e) => setEditedTalent({...editedTalent, street: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Cidade"
                          value={editedTalent.city}
                          onChange={(e) => setEditedTalent({...editedTalent, city: e.target.value})}
                        />
                        <Input
                          placeholder="UF"
                          value={editedTalent.state}
                          onChange={(e) => setEditedTalent({...editedTalent, state: e.target.value})}
                          maxLength={2}
                        />
                      </div>
                      <Input
                        placeholder="Bairro"
                        value={editedTalent.neighborhood}
                        onChange={(e) => setEditedTalent({...editedTalent, neighborhood: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Número"
                          value={editedTalent.number}
                          onChange={(e) => setEditedTalent({...editedTalent, number: e.target.value})}
                        />
                        <Input
                          placeholder="Complemento"
                          value={editedTalent.complement}
                          onChange={(e) => setEditedTalent({...editedTalent, complement: e.target.value})}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{talent.street}</p>
                      <p>{talent.city}, {talent.state}</p>
                      <p>{talent.neighborhood}</p>
                      <p>Número: {talent.number} {talent.complement && `- ${talent.complement}`}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label>Ativo</Label>
                  {isEditing ? (
                    <Switch
                      checked={editedTalent.active}
                      onCheckedChange={(checked) => setEditedTalent({...editedTalent, active: checked})}
                    />
                  ) : (
                    <Badge variant={talent.active ? "default" : "secondary"}>
                      {talent.active ? "Ativo" : "Inativo"}
                    </Badge>
                  )}
                </div>
              </div>

              {isEditing && (
                <Button onClick={handleSave} className="w-full mt-4">
                  Salvar Alterações
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fotos">Fotos</TabsTrigger>
              <TabsTrigger value="composite">Gerar Composite</TabsTrigger>
              <TabsTrigger value="dna">DNA</TabsTrigger>
            </TabsList>

            <TabsContent value="fotos" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Galeria de Fotos</CardTitle>
                    <Button size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Adicionar Fotos
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {talent.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                      <Plus className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="composite" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gerar Composite</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Funcionalidade de geração de composite em desenvolvimento
                    </p>
                    <Button disabled>
                      Gerar Composite
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dna" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>DNA do Talento</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Características e medidas do talento
                      </p>
                    </div>
                    <Dialog open={showDNADialog} onOpenChange={setShowDNADialog}>
                      <DialogTrigger asChild>
                        <Button>
                          Completar DNA
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>DNA do Talento - {talent.name}</DialogTitle>
                        </DialogHeader>
                        
                        <Tabs value={activeDNATab} onValueChange={setActiveDNATab}>
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="physical">Características Físicas</TabsTrigger>
                            <TabsTrigger value="body">Medidas Corporais</TabsTrigger>
                            <TabsTrigger value="facial">Características Faciais</TabsTrigger>
                            <TabsTrigger value="other">Outras Características</TabsTrigger>
                          </TabsList>

                          <TabsContent value="physical" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Formato do Rosto</Label>
                                <Select defaultValue={talent.dna.physicalCharacteristics.faceShape}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Oval">Oval</SelectItem>
                                    <SelectItem value="Redondo">Redondo</SelectItem>
                                    <SelectItem value="Quadrado">Quadrado</SelectItem>
                                    <SelectItem value="Triangular">Triangular</SelectItem>
                                    <SelectItem value="Coração">Coração</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="body" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Altura (m)</Label>
                                <Input defaultValue={talent.dna.physicalCharacteristics.height} placeholder="1.75" />
                              </div>
                              <div>
                                <Label>Peso (kg)</Label>
                                <Input defaultValue={talent.dna.physicalCharacteristics.weight} placeholder="65" />
                              </div>
                              <div>
                                <Label>Busto (cm)</Label>
                                <Input defaultValue={talent.dna.physicalCharacteristics.bust} placeholder="90" />
                              </div>
                              <div>
                                <Label>Cintura (cm)</Label>
                                <Input defaultValue={talent.dna.physicalCharacteristics.waist} placeholder="65" />
                              </div>
                              <div>
                                <Label>Quadril (cm)</Label>
                                <Input defaultValue={talent.dna.physicalCharacteristics.hip} placeholder="95" />
                              </div>
                              <div>
                                <Label>Tamanho do Sapato</Label>
                                <Input defaultValue={talent.dna.physicalCharacteristics.shoeSize} placeholder="38" />
                              </div>
                              <div>
                                <Label>Manequim</Label>
                                <Input defaultValue={talent.dna.physicalCharacteristics.dressSize} placeholder="M" />
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="facial" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Cor dos Olhos</Label>
                                <Select defaultValue={talent.dna.facialCharacteristics.eyeColor}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Azul">Azul</SelectItem>
                                    <SelectItem value="Verde">Verde</SelectItem>
                                    <SelectItem value="Castanho">Castanho</SelectItem>
                                    <SelectItem value="Preto">Preto</SelectItem>
                                    <SelectItem value="Outro">Outro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Cor do Cabelo</Label>
                                <Select defaultValue={talent.dna.facialCharacteristics.hairColor}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Loiro">Loiro</SelectItem>
                                    <SelectItem value="Castanho">Castanho</SelectItem>
                                    <SelectItem value="Preto">Preto</SelectItem>
                                    <SelectItem value="Ruivo">Ruivo</SelectItem>
                                    <SelectItem value="Outro">Outro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Etnia</Label>
                                <Select defaultValue={talent.dna.facialCharacteristics.ethnicity}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Branco">Branco</SelectItem>
                                    <SelectItem value="Negro">Negro</SelectItem>
                                    <SelectItem value="Pardo">Pardo</SelectItem>
                                    <SelectItem value="Amarelo">Amarelo</SelectItem>
                                    <SelectItem value="Indígena">Indígena</SelectItem>
                                    <SelectItem value="Outro">Outro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-2">
                                <Label>Características Étnicas</Label>
                                <Textarea 
                                  defaultValue={talent.dna.facialCharacteristics.ethnicDetails}
                                  placeholder="Descreva características específicas..."
                                />
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="other" className="space-y-4">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Switch id="tattoos" defaultChecked={talent.dna.otherCharacteristics.tattoos} />
                                <Label htmlFor="tattoos">Possui Tatuagens</Label>
                              </div>
                              <div>
                                <Label>Descrição das Tatuagens</Label>
                                <Textarea 
                                  defaultValue={talent.dna.otherCharacteristics.tattoosDescription}
                                  placeholder="Descreva as tatuagens..."
                                />
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Switch id="piercings" defaultChecked={talent.dna.otherCharacteristics.piercings} />
                                <Label htmlFor="piercings">Possui Piercings</Label>
                              </div>
                              <div>
                                <Label>Descrição dos Piercings</Label>
                                <Textarea 
                                  defaultValue={talent.dna.otherCharacteristics.piercingsDescription}
                                  placeholder="Descreva os piercings..."
                                />
                              </div>
                              
                              <div>
                                <Label>Habilidades</Label>
                                <Textarea 
                                  defaultValue={talent.dna.otherCharacteristics.skills}
                                  placeholder="Dança, atuação, esportes, etc..."
                                />
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>

                        <div className="flex justify-end space-x-2 pt-4">
                          <Button variant="outline" onClick={() => setShowDNADialog(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleDNASave}>
                            Salvar DNA
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {talent.dna && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Medidas Corporais</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Altura:</span>
                            <p>{talent.dna.physicalCharacteristics.height}m</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Peso:</span>
                            <p>{talent.dna.physicalCharacteristics.weight}kg</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Manequim:</span>
                            <p>{talent.dna.physicalCharacteristics.dressSize}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Calçado:</span>
                            <p>{talent.dna.physicalCharacteristics.shoeSize}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Características Faciais</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Olhos:</span>
                            <p>{talent.dna.facialCharacteristics.eyeColor}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cabelo:</span>
                            <p>{talent.dna.facialCharacteristics.hairColor}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Etnia:</span>
                            <p>{talent.dna.facialCharacteristics.ethnicity}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}