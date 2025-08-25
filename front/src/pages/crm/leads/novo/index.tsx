import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { Textarea } from "../../../../components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select"
import { ArrowLeft, Save, X } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useToast } from "../../../../hooks/use-toast"
import { talentsService } from '@/services/crm/talents-service'

export default function NovoLead() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    empresa: "",
    cargo: "",
    etapa: "novo",
    responsavel: "",
    valor: "",
    origem: "",
    observacoes: ""
  })

  const etapas = [
    { value: "novo", label: "Novo Lead" },
    { value: "contato", label: "Em Contato" },
    { value: "proposta", label: "Proposta Enviada" },
    { value: "fechado", label: "Fechado Ganho" }
  ]

  const responsaveis = [
    { value: "maria", label: "Maria Santos" },
    { value: "pedro", label: "Pedro Lima" },
    { value: "ana", label: "Ana Silva" }
  ]

  const origens = [
    { value: "site", label: "Site" },
    { value: "indicacao", label: "Indicação" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "evento", label: "Evento" },
    { value: "telefone", label: "Ligação" },
    { value: "email", label: "E-mail" },
    { value: "outros", label: "Outros" }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.nome || !formData.email || !formData.responsavel) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha Nome, E-mail e Responsável",
        variant: "destructive"
      })
      return
    }

    try {
      await talentsService.create({
        fullName: formData.nome,
        email: formData.email,
        phone: formData.telefone,
        city: formData.empresa,
        notes: formData.observacoes,
        status: formData.etapa === 'fechado' ? 'aprovado' : formData.etapa === 'contato' ? 'avaliacao' : 'novo',
        stage: (formData.etapa as any)
      })
      toast({ title: 'Lead criado com sucesso!', description: `${formData.nome} foi adicionado.` })
      navigate('/crm/leads')
    } catch {
      toast({ title: 'Erro ao salvar lead', variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/crm/leads">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Novo Lead
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastre um novo lead no sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Básicas */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Dados principais do lead
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      placeholder="Nome completo do lead"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange("telefone", e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={formData.cargo}
                      onChange={(e) => handleInputChange("cargo", e.target.value)}
                      placeholder="Diretor, Gerente, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    value={formData.empresa}
                    onChange={(e) => handleInputChange("empresa", e.target.value)}
                    placeholder="Nome da empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange("observacoes", e.target.value)}
                    placeholder="Informações adicionais sobre o lead..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configurações do Lead */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>
                  Etapa e responsável pelo lead
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Etapa do Funil *</Label>
                  <Select value={formData.etapa} onValueChange={(value) => handleInputChange("etapa", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {etapas.map(etapa => (
                        <SelectItem key={etapa.value} value={etapa.value}>
                          {etapa.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Responsável *</Label>
                  <Select value={formData.responsavel} onValueChange={(value) => handleInputChange("responsavel", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {responsaveis.map(responsavel => (
                        <SelectItem key={responsavel.value} value={responsavel.value}>
                          {responsavel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor Estimado</Label>
                  <Input
                    id="valor"
                    value={formData.valor}
                    onChange={(e) => handleInputChange("valor", e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Origem do Lead</Label>
                  <Select value={formData.origem} onValueChange={(value) => handleInputChange("origem", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Como conheceu?" />
                    </SelectTrigger>
                    <SelectContent>
                      {origens.map(origem => (
                        <SelectItem key={origem.value} value={origem.value}>
                          {origem.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button type="submit" className="w-full gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Lead
                  </Button>
                  <Link to="/crm/leads" className="block">
                    <Button type="button" variant="outline" className="w-full gap-2">
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}