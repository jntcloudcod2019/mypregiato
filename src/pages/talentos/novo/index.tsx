
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format, differenceInYears } from "date-fns"
import { CalendarIcon, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createTalent, checkTalentExists } from "@/lib/talent-service"
import { getProducers } from "@/lib/user-service"
import { sendClerkInvite } from "@/lib/clerk-service"
import { ProducerData } from "@/types/talent"
import { useToast } from "@/hooks/use-toast"

// CEP validation
const validateCEP = async (cep: string) => {
  const cleanCEP = cep.replace(/\D/g, "")
  if (cleanCEP.length !== 8) return false
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
    const data = await response.json()
    return !data.erro
  } catch {
    return false
  }
}

// Get address from CEP
const getAddressFromCEP = async (cep: string) => {
  const cleanCEP = cep.replace(/\D/g, "")
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
    const data = await response.json()
    if (!data.erro) {
      return {
        street: data.logradouro || "",
        city: data.localidade || "",
        uf: data.uf || "",
        neighborhood: data.bairro || ""
      }
    }
  } catch {
    return null
  }
  return null
}

// Form validation schema - updated to match database fields
const formSchema = z.object({
  fullName: z.string().min(2, "Nome completo é obrigatório"),
  document: z.string().min(11, "CPF/CNPJ é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(10, "Telefone é obrigatório"),
  birthDate: z.date({
    required_error: "Data de nascimento é obrigatória",
  }),
  gender: z.string().min(1, "Gênero é obrigatório"),
  postalcode: z.string().min(8, "CEP é obrigatório"),
  street: z.string().min(1, "Rua é obrigatória"),
  city: z.string().min(1, "Cidade é obrigatória"),
  uf: z.string().min(1, "UF é obrigatório"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  numberAddress: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  producerId: z.string().min(1, "Produtor é obrigatório"),
})

type FormData = z.infer<typeof formSchema>

// Alert component
const AlertMessage = ({ 
  type, 
  message, 
  isVisible, 
  onClose 
}: { 
  type: 'success' | 'warning' | 'error'
  message: string
  isVisible: boolean
  onClose: () => void
}) => {
  if (!isVisible) return null

  const alertConfig = {
    success: {
      icon: CheckCircle2,
      className: "border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
    },
    warning: {
      icon: AlertTriangle,
      className: "border-yellow-500 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
    },
    error: {
      icon: XCircle,
      className: "border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
    }
  }

  const { icon: Icon, className } = alertConfig[type]

  return (
    <Alert className={cn("animate-in slide-in-from-top-2 duration-300", className)}>
      <Icon className="h-4 w-4" />
      <AlertDescription className="flex justify-between items-center">
        {message}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-auto p-1 ml-2"
        >
          ×
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export default function NovoTalento() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoadingCEP, setIsLoadingCEP] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [producers, setProducers] = useState<ProducerData[]>([])
  const [loadingProducers, setLoadingProducers] = useState(true)
  const [alert, setAlert] = useState<{
    type: 'success' | 'warning' | 'error'
    message: string
    isVisible: boolean
  }>({
    type: 'success',
    message: '',
    isVisible: false
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      document: "",
      email: "",
      phone: "",
      gender: "",
      postalcode: "",
      street: "",
      city: "",
      uf: "",
      neighborhood: "",
      numberAddress: "",
      complement: "",
      producerId: "",
    },
  })

  // Load producers on component mount
  useEffect(() => {
    const loadProducers = async () => {
      try {
        const producersData = await getProducers()
        setProducers(producersData)
      } catch (error) {
        console.error('Erro ao carregar produtores:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar lista de produtores",
          variant: "destructive"
        })
      } finally {
        setLoadingProducers(false)
      }
    }
    loadProducers()
  }, [])

  // Format CPF/CNPJ
  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
  }

  // Format phone numbers
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }
  }

  // Format CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{5})(\d{3})/, "$1-$2")
  }

  // Handle CEP change
  const handleCEPChange = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, "")
    if (cleanCEP.length === 8) {
      setIsLoadingCEP(true)
      const isValid = await validateCEP(cleanCEP)
      
      if (isValid) {
        const address = await getAddressFromCEP(cleanCEP)
        if (address) {
          form.setValue("street", address.street)
          form.setValue("city", address.city)
          form.setValue("uf", address.uf)
          form.setValue("neighborhood", address.neighborhood)
        }
      }
      setIsLoadingCEP(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      
      // Check if talent already exists
      const emailToCheck = data.email || undefined
      const exists = await checkTalentExists(emailToCheck, data.document)
      
      if (exists) {
        setAlert({
          type: 'warning',
          message: `Já existe um talento com este email ou documento.`,
          isVisible: true
        })
        return
      }

      // Calculate age from birth date
      const age = differenceInYears(new Date(), data.birthDate)

      // Create talent data
      const talentData = {
        producerId: data.producerId,
        fullName: data.fullName,
        email: data.email || undefined,
        phone: data.phone,
        postalcode: data.postalcode,
        street: data.street,
        neighborhood: data.neighborhood,
        city: data.city,
        numberAddress: data.numberAddress,
        complement: data.complement,
        uf: data.uf,
        document: data.document,
        birthDate: data.birthDate,
        age,
        gender: data.gender,
        inviteSent: false,
        status: true,
        dnaStatus: 'UNDEFINED' as const
      }

      // Create talent
      const newTalent = await createTalent(talentData)

      // Send Clerk invitation if email is provided
      if (data.email) {
        try {
          const nameParts = data.fullName.split(' ')
          const firstName = nameParts[0]
          const lastName = nameParts.slice(1).join(' ') || '-'
          
          await sendClerkInvite(data.email, firstName, lastName, newTalent.id)
          
          toast({
            title: "Sucesso",
            description: `Talento ${data.fullName} criado com sucesso e convite enviado!`,
          })
        } catch (inviteError) {
          console.error('Erro ao enviar convite:', inviteError)
          toast({
            title: "Talento criado",
            description: `Talento ${data.fullName} criado, mas houve erro ao enviar o convite.`,
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "Sucesso",
          description: `Talento ${data.fullName} criado com sucesso!`,
        })
      }

      // Navigate to talent profile
      navigate(`/talentos/perfil/${newTalent.id}`)

    } catch (error: any) {
      console.error('Erro ao criar talento:', error)
      setAlert({
        type: 'error',
        message: error.message || 'Erro ao criar talento',
        isVisible: true
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isVisible: false }))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">
            Novo Talento
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      {/* Alert */}
      <AlertMessage
        type={alert.type}
        message={alert.message}
        isVisible={alert.isVisible}
        onClose={closeAlert}
      />

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Talento</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome Completo */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                 {/* Produtor */}
                 <FormField
                   control={form.control}
                   name="producerId"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Produtor Responsável *</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingProducers}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue placeholder={loadingProducers ? "Carregando..." : "Selecione o produtor"} />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           {producers.map((producer) => (
                             <SelectItem key={producer.id} value={producer.id}>
                               {producer.first_name} {producer.last_name} - {producer.code}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 {/* CPF/CNPJ */}
                 <FormField
                   control={form.control}
                   name="document"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>CPF/CNPJ *</FormLabel>
                       <FormControl>
                         <Input 
                           placeholder="000.000.000-00" 
                           {...field}
                           onChange={(e) => {
                             const formatted = formatDocument(e.target.value)
                             field.onChange(formatted)
                           }}
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 {/* Email */}
                 <FormField
                   control={form.control}
                   name="email"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Email (opcional)</FormLabel>
                       <FormControl>
                         <Input placeholder="email@exemplo.com" {...field} />
                       </FormControl>
                       <FormDescription>
                         Se fornecido, será enviado um convite para acesso à plataforma
                       </FormDescription>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 {/* Telefone */}
                 <FormField
                   control={form.control}
                   name="phone"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Telefone *</FormLabel>
                       <FormControl>
                         <Input 
                           placeholder="(11) 99999-9999" 
                           {...field}
                           onChange={(e) => {
                             const formatted = formatPhone(e.target.value)
                             field.onChange(formatted)
                           }}
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                {/* Data de Nascimento */}
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Nascimento *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                 {/* Idade */}
                 <FormField
                   control={form.control}
                   name="age"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Idade</FormLabel>
                       <FormControl>
                         <Input
                           {...field}
                           type="number"
                           placeholder="Calculado automaticamente"
                           readOnly
                           className="bg-muted"
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 {/* Gênero */}
                 <FormField
                   control={form.control}
                   name="gender"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Gênero *</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue placeholder="Selecione o gênero" />
                           </SelectTrigger>
                         </FormControl>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                            <SelectItem value="nao-binario">Não Binário</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 {/* CEP */}
                 <FormField
                   control={form.control}
                   name="postalcode"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>CEP *</FormLabel>
                       <FormControl>
                         <Input 
                           placeholder="00000-000" 
                           {...field}
                           onChange={(e) => {
                             const formatted = formatCEP(e.target.value)
                             field.onChange(formatted)
                             handleCEPChange(formatted)
                           }}
                           disabled={isLoadingCEP}
                         />
                       </FormControl>
                       {isLoadingCEP && (
                         <FormDescription>Buscando endereço...</FormDescription>
                       )}
                       <FormMessage />
                     </FormItem>
                   )}
                 />
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Rua *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da rua" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade *</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="uf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF *</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro *</FormLabel>
                      <FormControl>
                        <Input placeholder="Bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número *</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="complement"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Apto 101, Bloco A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground shadow-elegant hover:shadow-glow transition-all duration-300"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/talentos')}
                  className="bg-secondary/20 backdrop-blur-sm border border-secondary/30 text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground shadow-elegant hover:shadow-glow transition-all duration-300"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
