import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
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
        state: data.uf || "",
        neighborhood: data.bairro || ""
      }
    }
  } catch {
    return null
  }
  return null
}

// Form validation schema
const formSchema = z.object({
  fullName: z.string().min(2, "Nome completo é obrigatório"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ é obrigatório"),
  email: z.string().email("Email inválido"),
  whatsapp: z.string().min(10, "WhatsApp é obrigatório"),
  phone: z.string().min(10, "Telefone é obrigatório"),
  birthDate: z.date({
    required_error: "Data de nascimento é obrigatória",
  }),
  gender: z.string().min(1, "Gênero é obrigatório"),
  cep: z.string().min(8, "CEP é obrigatório"),
  street: z.string().min(1, "Rua é obrigatória"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "UF é obrigatório"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  isActive: z.boolean().default(true),
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
  const [isLoadingCEP, setIsLoadingCEP] = useState(false)
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
      isActive: true,
    },
  })

  // Format CPF/CNPJ
  const formatCpfCnpj = (value: string) => {
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
          form.setValue("state", address.state)
          form.setValue("neighborhood", address.neighborhood)
        }
      }
      setIsLoadingCEP(false)
    }
  }

  // Mock data for talent check - Replace with actual Supabase query
  const mockExistingTalents = [
    { name: "Ana Silva", email: "ana.silva@email.com" },
    { name: "Carlos Oliveira", email: "carlos.oliveira@email.com" }
  ]

  // Check if talent exists
  const checkTalentExists = (name: string, email: string) => {
    return mockExistingTalents.some(
      talent => talent.name.toLowerCase() === name.toLowerCase() || 
                talent.email.toLowerCase() === email.toLowerCase()
    )
  }

  const onSubmit = async (data: FormData) => {
    try {
      // Check if talent already exists
      const exists = checkTalentExists(data.fullName, data.email)
      
      if (exists) {
        setAlert({
          type: 'warning',
          message: `Talento ${data.fullName} já existe.`,
          isVisible: true
        })
        return
      }

      // Commented out Supabase insert - Uncomment when Supabase is connected
      /*
      const { error } = await supabase
        .from('talents')
        .insert([
          {
            full_name: data.fullName,
            cpf_cnpj: data.cpfCnpj,
            email: data.email,
            whatsapp: data.whatsapp,
            phone: data.phone,
            birth_date: data.birthDate,
            gender: data.gender,
            cep: data.cep,
            street: data.street,
            city: data.city,
            state: data.state,
            neighborhood: data.neighborhood,
            number: data.number,
            complement: data.complement,
            is_active: data.isActive,
            created_at: new Date().toISOString()
          }
        ])

      if (error) {
        setAlert({
          type: 'error',
          message: 'Erro ao criar talento',
          isVisible: true
        })
        return
      }
      */

      // Success message
      setAlert({
        type: 'success',
        message: `Talento ${data.fullName} criado com sucesso.`,
        isVisible: true
      })

      // Reset form after success
      setTimeout(() => {
        form.reset()
        navigate('/talentos')
      }, 2000)

    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erro ao criar talento',
        isVisible: true
      })
    }
  }

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isVisible: false }))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Novo Talento
        </h1>
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

                {/* CPF/CNPJ */}
                <FormField
                  control={form.control}
                  name="cpfCnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF/CNPJ *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="000.000.000-00" 
                          {...field}
                          onChange={(e) => {
                            const formatted = formatCpfCnpj(e.target.value)
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
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* WhatsApp */}
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp *</FormLabel>
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

                {/* Telefone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(11) 3333-3333" 
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
                  name="cep"
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
                  name="state"
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
                  name="number"
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

              {/* Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Ativo
                      </FormLabel>
                      <FormDescription>
                        Marque esta opção para ativar o talento no sistema
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  Salvar
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/talentos')}
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