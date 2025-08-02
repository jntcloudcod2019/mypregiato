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
import { CheckCircle, Edit, Plus, Trash2, Upload, Calendar as CalendarIcon, ArrowLeft, User, Mail, Phone, MapPin, CreditCard, Users, Plane, Camera, Home } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CompositeTemplates } from "@/components/composite-templates"

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
  availableForTravel: true,
  active: true,
  profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
  photos: [
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=600&h=800&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=800&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1567532900872-f4e906cbf06a?w=600&h=800&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop&crop=face"
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
        .select(`
          *,
          talent_photos(id, url, is_profile),
          talent_dna(*)
        `)
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
    // API route: PUT /api/talents/:id
    // Parameters to send: { full_name, cpf_cnpj, email, whatsapp, phone, birth_date, gender, cep, street, city, state, neighborhood, number, complement, available_for_travel, is_active, updated_at }
    const { error } = await supabase
      .from('talents')
      .update({
        full_name: updatedData.name,
        cpf_cnpj: updatedData.cpf,
        email: updatedData.email,
        whatsapp: updatedData.whatsapp,
        phone: updatedData.phone,
        birth_date: updatedData.birthDate,
        gender: updatedData.gender,
        cep: updatedData.cep,
        street: updatedData.street,
        city: updatedData.city,
        state: updatedData.state,
        neighborhood: updatedData.neighborhood,
        number: updatedData.number,
        complement: updatedData.complement,
        available_for_travel: updatedData.availableForTravel,
        is_active: updatedData.active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) {
      console.error('Error updating talent:', error)
      return false
    }
    
    return true
  }

  const saveDNA = async (dnaData: any) => {
    // API route: POST/PUT /api/talents/:id/dna
    // Parameters to send: { talent_id, physical_characteristics, facial_characteristics, other_characteristics }
    const { error } = await supabase
      .from('talent_dna')
      .upsert({ talent_id: id, ...dnaData })
    
    if (error) {
      console.error('Error saving DNA:', error)
      return false
    }
    
    return true
  }

  const uploadPhoto = async (file: File) => {
    // API route: POST /api/talents/:id/photos
    // Parameters to send: FormData with file and metadata
    const formData = new FormData()
    formData.append('photo', file)
    formData.append('talent_id', id)
    
    const { data, error } = await supabase.storage
      .from('talent-photos')
      .upload(`${id}/${Date.now()}-${file.name}`, file)
    
    if (error) {
      console.error('Error uploading photo:', error)
      return false
    }
    
    // Save photo reference in database
    const { error: dbError } = await supabase
      .from('talent_photos')
      .insert({
        talent_id: id,
        url: data.path,
        is_profile: false
      })
    
    return !dbError
  }

  const deletePhoto = async (photoId: string) => {
    // API route: DELETE /api/talents/:id/photos/:photoId
    const { error } = await supabase
      .from('talent_photos')
      .delete()
      .eq('id', photoId)
    
    if (error) {
      console.error('Error deleting photo:', error)
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

  // Handle photo upload simulation
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      // Simulate photo upload
      console.log('Uploading photos:', Array.from(files).map(f => f.name))
      // In real implementation, call uploadPhoto for each file
    }
  }

  // Handle photo deletion simulation  
  const handlePhotoDelete = (photoIndex: number) => {
    const updatedPhotos = talent.photos.filter((_, index) => index !== photoIndex)
    setTalent({ ...talent, photos: updatedPhotos })
    // In real implementation, call deletePhoto API
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
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200 shadow-elegant">
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
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Perfil do Talento
            </h1>
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
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {talent.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-primary/20 shadow-lg">
                    <img
                      src={talent.profileImage}
                      alt={talent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                    <Button 
                      variant="contained" 
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        // Funcionalidade para alterar foto
                        console.log('Alterar foto do perfil')
                      }}
                    >
                      <Camera className="h-3 w-3 mr-1" />
                      Alterar
                    </Button>
                  </div>
                </div>
                <div className="text-center">
                  <Badge variant={talent.active ? "default" : "secondary"} className="mt-1">
                    {talent.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>

              {/* Basic Information Grid */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground">Nome Completo</Label>
                    {isEditing ? (
                      <Input
                        value={editedTalent.name}
                        onChange={(e) => setEditedTalent({...editedTalent, name: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium truncate">{talent.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground">CPF</Label>
                    {isEditing ? (
                      <Input
                        value={editedTalent.cpf}
                        onChange={(e) => setEditedTalent({...editedTalent, cpf: formatCPF(e.target.value)})}
                        maxLength={14}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium">{talent.cpf}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editedTalent.email}
                        onChange={(e) => setEditedTalent({...editedTalent, email: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium truncate">{talent.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs text-muted-foreground">WhatsApp</Label>
                      {isEditing ? (
                        <Input
                          value={editedTalent.whatsapp}
                          onChange={(e) => setEditedTalent({...editedTalent, whatsapp: formatPhone(e.target.value)})}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{talent.whatsapp}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs text-muted-foreground">Telefone</Label>
                      {isEditing ? (
                        <Input
                          value={editedTalent.phone}
                          onChange={(e) => setEditedTalent({...editedTalent, phone: formatPhone(e.target.value)})}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{talent.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs text-muted-foreground">Nascimento</Label>
                      {isEditing ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal mt-1 h-8">
                              {editedTalent.birthDate ? format(editedTalent.birthDate, "dd/MM/yyyy") : "Selecionar"}
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
                        <p className="text-sm font-medium">
                          {format(talent.birthDate, "dd/MM/yyyy")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs text-muted-foreground">Gênero</Label>
                      {isEditing ? (
                        <Select
                          value={editedTalent.gender}
                          onValueChange={(value) => setEditedTalent({...editedTalent, gender: value})}
                        >
                          <SelectTrigger className="mt-1 h-8">
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
                        <p className="text-sm font-medium">{talent.gender}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground">CEP</Label>
                    {isEditing ? (
                      <Input
                        value={editedTalent.cep}
                        onChange={(e) => setEditedTalent({...editedTalent, cep: formatCEP(e.target.value)})}
                        maxLength={9}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium">{talent.cep}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                  <Home className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground">Endereço</Label>
                    {isEditing ? (
                      <div className="space-y-2 mt-1">
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
                      <div className="text-sm space-y-1 mt-1">
                        <p className="font-medium">{talent.street}</p>
                        <p className="text-muted-foreground">{talent.city}, {talent.state}</p>
                        <p className="text-muted-foreground">{talent.neighborhood}</p>
                        <p className="text-muted-foreground">Nº {talent.number} {talent.complement && `- ${talent.complement}`}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                  <Plane className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Disponível para viagem</Label>
                    {isEditing ? (
                      <div className="mt-2">
                        <Switch
                          checked={editedTalent.availableForTravel}
                          onCheckedChange={(checked) => setEditedTalent({...editedTalent, availableForTravel: checked})}
                        />
                      </div>
                    ) : (
                      <div className="mt-1">
                        <Badge variant={talent.availableForTravel ? "default" : "secondary"} className="text-xs">
                          {talent.availableForTravel ? "Sim" : "Não"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <Button onClick={handleSave} className="w-full mt-6">
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
              <Card className="shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Galeria de Fotos
                    </CardTitle>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <Button size="sm" asChild>
                        <label htmlFor="photo-upload" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          Adicionar Fotos
                        </label>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {talent.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted shadow-md">
                          <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs"
                            onClick={() => handlePhotoDelete(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group">
                      <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-2 p-4">
                        <Plus className="h-8 w-8 text-muted-foreground/50 group-hover:text-primary/50 transition-colors" />
                        <span className="text-xs text-muted-foreground">Adicionar Foto</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="composite" className="space-y-4">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Gerar Composite</CardTitle>
                </CardHeader>
                <CardContent>
                  <CompositeTemplates talent={talent} photos={talent.photos} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dna" className="space-y-4">
              <Card className="shadow-card">
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
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium text-lg text-primary">Medidas Corporais</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Altura</span>
                              <p className="font-semibold">{talent.dna.physicalCharacteristics.height}m</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Peso</span>
                              <p className="font-semibold">{talent.dna.physicalCharacteristics.weight}kg</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Manequim</span>
                              <p className="font-semibold">{talent.dna.physicalCharacteristics.dressSize}</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Calçado</span>
                              <p className="font-semibold">{talent.dna.physicalCharacteristics.shoeSize}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="font-medium text-lg text-primary">Características Faciais</h4>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Olhos</span>
                              <p className="font-semibold">{talent.dna.facialCharacteristics.eyeColor}</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Cabelo</span>
                              <p className="font-semibold">{talent.dna.facialCharacteristics.hairColor}</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Etnia</span>
                              <p className="font-semibold">{talent.dna.facialCharacteristics.ethnicity}</p>
                            </div>
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