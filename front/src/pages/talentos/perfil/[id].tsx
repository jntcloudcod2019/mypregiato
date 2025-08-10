
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
import { CheckCircle, Edit, Plus, Trash2, Upload, Calendar as CalendarIcon, ArrowLeft, User, Mail, Phone, MapPin, CreditCard, Users, Plane, Camera, Home, Loader2 } from "lucide-react"
import { format, differenceInYears } from "date-fns"
import { cn } from "@/lib/utils"
import { CompositeTemplates } from "@/components/composite-templates"
import { getTalentById, updateTalent } from "@/lib/talent-service"
import { getTalentDNA, createOrUpdateTalentDNA } from "@/lib/dna-service"
import { uploadPhoto, getTalentPhotos, deletePhoto } from "@/lib/file-service"
import { TalentData } from "@/types/talent"
import { useToast } from "@/hooks/use-toast"
import { compressImage, validateImageFile, fileToBase64 } from "@/utils/image-compression"

export default function TalentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [talent, setTalent] = useState<TalentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTalent, setEditedTalent] = useState<any>({})
  const [showAlert, setShowAlert] = useState(false)
  const [activeTab, setActiveTab] = useState("fotos")
  const [showDNADialog, setShowDNADialog] = useState(false)
  const [activeDNATab, setActiveDNATab] = useState("physical")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [dnaData, setDnaData] = useState<any>({})
  const [savingDNA, setSavingDNA] = useState(false)

  // Fetch talent data on component mount
  useEffect(() => {
    const fetchTalentData = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        const talentData = await getTalentById(id)
        
        if (!talentData) {
          toast({
            title: "Erro",
            description: "Talento não encontrado",
            variant: "destructive"
          })
          navigate('/talentos')
          return
        }

        setTalent(talentData)
        setEditedTalent({
          fullName: talentData.fullName,
          email: talentData.email || '',
          phone: talentData.phone || '',
          document: talentData.document || '',
          birthDate: talentData.birthDate ? new Date(talentData.birthDate) : undefined,
          gender: talentData.gender || '',
          postalcode: talentData.postalcode || '',
          street: talentData.street || '',
          city: talentData.city || '',
          uf: talentData.uf || '',
          neighborhood: talentData.neighborhood || '',
          numberAddress: talentData.numberAddress || '',
          complement: talentData.complement || '',
          status: talentData.status
        })

        // Load DNA data if exists
        if (talentData.dna) {
          setDnaData(talentData.dna)
        }
        
      } catch (error) {
        console.error('Erro ao carregar talento:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do talento",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchTalentData()
  }, [id])

  const handleSave = async () => {
    if (!talent || !id) return
    
    try {
      // Calculate age if birthDate changed
      let age = talent.age
      if (editedTalent.birthDate) {
        age = differenceInYears(new Date(), editedTalent.birthDate)
      }

      const updateData = {
        fullName: editedTalent.fullName,
        email: editedTalent.email || undefined,
        phone: editedTalent.phone,
        document: editedTalent.document,
        birthDate: editedTalent.birthDate,
        age,
        gender: editedTalent.gender,
        postalcode: editedTalent.postalcode,
        street: editedTalent.street,
        city: editedTalent.city,
        uf: editedTalent.uf,
        neighborhood: editedTalent.neighborhood,
        numberAddress: editedTalent.numberAddress,
        complement: editedTalent.complement
      }

      const updatedTalent = await updateTalent(id, updateData)
      setTalent(updatedTalent)
      setIsEditing(false)
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
      
      toast({
        title: "Sucesso",
        description: "Informações atualizadas com sucesso",
      })
    } catch (error) {
      console.error('Erro ao atualizar talento:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar informações",
        variant: "destructive"
      })
    }
  }

  const handleDNASave = async () => {
    if (!id) return
    
    try {
      setSavingDNA(true)
      await createOrUpdateTalentDNA(id, dnaData)
      setShowDNADialog(false)
      
      // Refresh talent data to get updated DNA status
      const updatedTalent = await getTalentById(id)
      if (updatedTalent) {
        setTalent(updatedTalent)
      }
      
      toast({
        title: "Sucesso",
        description: "DNA atualizado com sucesso",
      })
    } catch (error) {
      console.error('Erro ao salvar DNA:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar DNA",
        variant: "destructive"
      })
    } finally {
      setSavingDNA(false)
    }
  }

  // Handle photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !id) return
    
    try {
      setUploadingPhoto(true)
      
      for (const file of Array.from(files)) {
        // Validate file
        validateImageFile(file)
        
        // Compress image
        const compressedFile = await compressImage(file)
        
        // Upload photo
        await uploadPhoto(id, compressedFile)
      }
      
      // Refresh talent data to show new photos
      const updatedTalent = await getTalentById(id)
      if (updatedTalent) {
        setTalent(updatedTalent)
      }
      
      toast({
        title: "Sucesso",
        description: `${files.length} foto(s) carregada(s) com sucesso`,
      })
      
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload da foto",
        variant: "destructive"
      })
    } finally {
      setUploadingPhoto(false)
    }
    
    // Reset input
    event.target.value = ''
  }

  // Handle photo deletion
  const handlePhotoDelete = async (photoId: string) => {
    if (!id) return
    
    try {
      await deletePhoto(photoId)
      
      // Refresh talent data
      const updatedTalent = await getTalentById(id)
      if (updatedTalent) {
        setTalent(updatedTalent)
      }
      
      toast({
        title: "Sucesso",
        description: "Foto excluída com sucesso",
      })
    } catch (error) {
      console.error('Erro ao deletar foto:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir foto",
        variant: "destructive"
      })
    }
  }

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
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

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando perfil do talento...</span>
        </div>
      </div>
    )
  }

  if (!talent) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <p>Talento não encontrado</p>
        </div>
      </div>
    )
  }

  const inviteStatus = talent.inviteSent ? (talent.clerkInviteId ? "Ativo" : "Pendente") : "Não Enviado"

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Alert */}
      {showAlert && (
        <div className="animate-fade-in">
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200 shadow-elegant">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Informações de {talent.fullName} atualizadas com sucesso.
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-variant))] bg-clip-text text-transparent">
              {talent.fullName}
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
              <CardTitle>
                {talent.fullName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-primary/20 shadow-lg">
                    <img
                      src={talent.files?.[0]?.url || "/placeholder.svg"}
                      alt={talent.fullName}
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
                <div className="text-center space-y-2">
                  <Badge variant={talent.status ? "default" : "secondary"} className="mt-1">
                    {talent.status ? "Ativo" : "Inativo"}
                  </Badge>
                  <Badge 
                    variant={talent.dnaStatus === 'COMPLETE' ? "default" : talent.dnaStatus === 'PARTIAL' ? "secondary" : "outline"}
                    className="block"
                  >
                    DNA: {talent.dnaStatus === 'COMPLETE' ? 'Completo' : talent.dnaStatus === 'PARTIAL' ? 'Parcial' : 'Indefinido'}
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
                        value={editedTalent.fullName}
                        onChange={(e) => setEditedTalent({...editedTalent, fullName: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium truncate">{talent.fullName}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground">CPF/CNPJ</Label>
                    {isEditing ? (
                      <Input
                        value={editedTalent.document}
                        onChange={(e) => setEditedTalent({...editedTalent, document: formatDocument(e.target.value)})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium">{talent.document || "Não informado"}</p>
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
                      <p className="text-sm font-medium truncate">{talent.email || "Não informado"}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
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
                      <p className="text-sm font-medium">{talent.phone || "Não informado"}</p>
                    )}
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
                          {talent.birthDate ? format(new Date(talent.birthDate), "dd/MM/yyyy") : "Não informado"} ({talent.age} anos)
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
                        value={editedTalent.postalcode}
                        onChange={(e) => setEditedTalent({...editedTalent, postalcode: formatCEP(e.target.value)})}
                        maxLength={9}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium">{talent.postalcode}</p>
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
                            value={editedTalent.uf}
                            onChange={(e) => setEditedTalent({...editedTalent, uf: e.target.value})}
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
                            value={editedTalent.numberAddress}
                            onChange={(e) => setEditedTalent({...editedTalent, numberAddress: e.target.value})}
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
                        <p className="text-muted-foreground">{talent.city}, {talent.uf}</p>
                        <p className="text-muted-foreground">{talent.neighborhood}</p>
                        <p className="text-muted-foreground">Nº {talent.numberAddress} {talent.complement && `- ${talent.complement}`}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                  <Plane className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Disponível para viagem</Label>
                    <div className="mt-1">
                      <Badge variant={talent.dna?.travelAvailability ? "default" : "secondary"} className="text-xs">
                        {talent.dna?.travelAvailability ? "Sim" : "Não"}
                      </Badge>
                    </div>
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
                      <Button size="sm" asChild disabled={uploadingPhoto}>
                        <label htmlFor="photo-upload" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          {uploadingPhoto ? 'Carregando...' : 'Adicionar Fotos'}
                        </label>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingPhotos ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Aguarde um instante...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {talent.files?.filter(file => file.type === 'PHOTO').map((file, index) => (
                        <div key={file.id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted shadow-md">
                            <img
                              src={file.url}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs"
                              onClick={() => handlePhotoDelete(file.id)}
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="composite" className="space-y-4">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Gerar Composite</CardTitle>
                </CardHeader>
                <CardContent>
                  <CompositeTemplates 
                    talent={talent} 
                    photos={talent.files?.filter(file => file.type === 'PHOTO').map(file => file.url) || []} 
                  />
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
                          <DialogTitle>DNA do Talento - {talent.fullName}</DialogTitle>
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
                                <Label>Altura (m)</Label>
                                <Input 
                                  value={dnaData.height || ''}
                                  onChange={(e) => setDnaData({...dnaData, height: e.target.value})}
                                  placeholder="1.75" 
                                />
                              </div>
                              <div>
                                <Label>Peso (kg)</Label>
                                <Input 
                                  value={dnaData.weight || ''}
                                  onChange={(e) => setDnaData({...dnaData, weight: e.target.value})}
                                  placeholder="65" 
                                />
                              </div>
                              <div>
                                <Label>Cor do Cabelo</Label>
                                <Select 
                                  value={dnaData.hairColor || ''} 
                                  onValueChange={(value) => setDnaData({...dnaData, hairColor: value})}
                                >
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
                                <Label>Cor dos Olhos</Label>
                                <Select 
                                  value={dnaData.eyeColor || ''} 
                                  onValueChange={(value) => setDnaData({...dnaData, eyeColor: value})}
                                >
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
                            </div>
                          </TabsContent>

                          <TabsContent value="body" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Busto/Peito (cm)</Label>
                                <Input 
                                  value={dnaData.chestSize || ''}
                                  onChange={(e) => setDnaData({...dnaData, chestSize: e.target.value})}
                                  placeholder="90" 
                                />
                              </div>
                              <div>
                                <Label>Cintura (cm)</Label>
                                <Input 
                                  value={dnaData.waistSize || ''}
                                  onChange={(e) => setDnaData({...dnaData, waistSize: e.target.value})}
                                  placeholder="65" 
                                />
                              </div>
                              <div>
                                <Label>Quadril (cm)</Label>
                                <Input 
                                  value={dnaData.hipSize || ''}
                                  onChange={(e) => setDnaData({...dnaData, hipSize: e.target.value})}
                                  placeholder="95" 
                                />
                              </div>
                              <div>
                                <Label>Tamanho do Sapato</Label>
                                <Input 
                                  value={dnaData.shoeSize || ''}
                                  onChange={(e) => setDnaData({...dnaData, shoeSize: e.target.value})}
                                  placeholder="38" 
                                />
                              </div>
                              <div>
                                <Label>Manequim</Label>
                                <Input 
                                  value={dnaData.dressSize || ''}
                                  onChange={(e) => setDnaData({...dnaData, dressSize: e.target.value})}
                                  placeholder="M" 
                                />
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="facial" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Formato do Rosto</Label>
                                <Select 
                                  value={dnaData.faceShape || ''} 
                                  onValueChange={(value) => setDnaData({...dnaData, faceShape: value})}
                                >
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
                              <div>
                                <Label>Características Étnicas</Label>
                                <Textarea 
                                  value={dnaData.ethnicFeatures || ''}
                                  onChange={(e) => setDnaData({...dnaData, ethnicFeatures: e.target.value})}
                                  placeholder="Descreva características específicas..."
                                />
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="other" className="space-y-4">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Switch 
                                  id="travel" 
                                  checked={dnaData.travelAvailability || false}
                                  onCheckedChange={(checked) => setDnaData({...dnaData, travelAvailability: checked})}
                                />
                                <Label htmlFor="travel">Disponível para viagem</Label>
                              </div>
                              
                              <div>
                                <Label>Idiomas</Label>
                                <Textarea 
                                  value={dnaData.languages || ''}
                                  onChange={(e) => setDnaData({...dnaData, languages: e.target.value})}
                                  placeholder="Português, Inglês, Espanhol..."
                                />
                              </div>
                              
                              <div>
                                <Label>Características Especiais</Label>
                                <Textarea 
                                  value={dnaData.specialFeatures || ''}
                                  onChange={(e) => setDnaData({...dnaData, specialFeatures: e.target.value})}
                                  placeholder="Tatuagens, piercings, cicatrizes..."
                                />
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>

                        <div className="flex justify-end space-x-2 pt-4">
                          <Button variant="outline" onClick={() => setShowDNADialog(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleDNASave} disabled={savingDNA}>
                            {savingDNA ? 'Salvando...' : 'Salvar DNA'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {talent.dna ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium text-lg text-primary">Medidas Corporais</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Altura</span>
                              <p className="font-semibold">{talent.dna.height || '-'}</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Peso</span>
                              <p className="font-semibold">{talent.dna.weight || '-'}</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Manequim</span>
                              <p className="font-semibold">{talent.dna.dressSize || '-'}</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Calçado</span>
                              <p className="font-semibold">{talent.dna.shoeSize || '-'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="font-medium text-lg text-primary">Características Faciais</h4>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Olhos</span>
                              <p className="font-semibold">{talent.dna.eyeColor || '-'}</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Cabelo</span>
                              <p className="font-semibold">{talent.dna.hairColor || '-'}</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Formato do Rosto</span>
                              <p className="font-semibold">{talent.dna.faceShape || '-'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhuma informação de DNA cadastrada.</p>
                      <p className="text-sm">Clique em "Completar DNA" para começar.</p>
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
