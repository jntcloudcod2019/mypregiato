import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Switch } from "../../../components/ui/switch"
import { Textarea } from "../../../components/ui/textarea"
import { Badge } from "../../../components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Globe, 
  Mail, 
  Phone, 
  Key,
  Webhook,
  MessageSquare
} from "lucide-react"
import { useToast } from "../../../hooks/use-toast"

export default function ConfiguracoesPage() {
  const { toast } = useToast()

  const [etapas, setEtapas] = useState([
    { id: 1, nome: "Novo Lead", ordem: 1, cor: "#3b82f6", ativo: true },
    { id: 2, nome: "Em Contato", ordem: 2, cor: "#eab308", ativo: true },
    { id: 3, nome: "Proposta Enviada", ordem: 3, cor: "#f97316", ativo: true },
    { id: 4, nome: "Fechado Ganho", ordem: 4, cor: "#22c55e", ativo: true },
    { id: 5, nome: "Perdido", ordem: 5, cor: "#ef4444", ativo: true }
  ])

  const [categoriasTarefa, setCategoriasTarefa] = useState([
    { id: 1, nome: "Ligação", ativo: true },
    { id: 2, nome: "E-mail", ativo: true },
    { id: 3, nome: "Reunião", ativo: true },
    { id: 4, nome: "Proposta", ativo: true },
    { id: 5, nome: "Follow-up", ativo: true }
  ])

  const [configuracoes, setConfiguracoes] = useState({
    empresa: {
      nome: "Minha Empresa",
      email: "contato@empresa.com",
      telefone: "(11) 9999-9999",
      website: "www.empresa.com",
      cnpj: "00.000.000/0001-00"
    },
    notificacoes: {
      emailTarefas: true,
      emailLeads: true,
      whatsappNotif: false,
      relatoriosAuto: true
    },
    integracoes: {
      apiKey: "",
      webhookUrl: "",
      whatsappToken: "",
      emailProvider: "smtp"
    }
  })

  const [novaEtapa, setNovaEtapa] = useState({ nome: "", cor: "#3b82f6" })
  const [novaCategoria, setNovaCategoria] = useState("")

  const handleSalvarConfiguracoes = () => {
    toast({
      title: "Configurações salvas!",
      description: "Todas as alterações foram aplicadas com sucesso."
    })
  }

  const handleAdicionarEtapa = () => {
    if (!novaEtapa.nome.trim()) return

    const novaEtapaObj = {
      id: Date.now(),
      nome: novaEtapa.nome,
      ordem: etapas.length + 1,
      cor: novaEtapa.cor,
      ativo: true
    }

    setEtapas([...etapas, novaEtapaObj])
    setNovaEtapa({ nome: "", cor: "#3b82f6" })
    
    toast({
      title: "Etapa adicionada!",
      description: `Etapa "${novaEtapa.nome}" foi criada.`
    })
  }

  const handleAdicionarCategoria = () => {
    if (!novaCategoria.trim()) return

    const novaCategoriaObj = {
      id: Date.now(),
      nome: novaCategoria,
      ativo: true
    }

    setCategoriasTarefa([...categoriasTarefa, novaCategoriaObj])
    setNovaCategoria("")
    
    toast({
      title: "Categoria adicionada!",
      description: `Categoria "${novaCategoria}" foi criada.`
    })
  }

  const handleRemoverEtapa = (id: number) => {
    setEtapas(etapas.filter(etapa => etapa.id !== id))
    toast({
      title: "Etapa removida!",
      description: "A etapa foi excluída do sistema."
    })
  }

  const handleRemoverCategoria = (id: number) => {
    setCategoriasTarefa(categoriasTarefa.filter(cat => cat.id !== id))
    toast({
      title: "Categoria removida!",
      description: "A categoria foi excluída do sistema."
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Configurações do CRM
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure e personalize seu sistema CRM
        </p>
      </div>

      <Tabs defaultValue="etapas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="etapas">Etapas</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>

        {/* Etapas do Funil */}
        <TabsContent value="etapas">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Etapas do Funil de Vendas</CardTitle>
                  <CardDescription>
                    Configure as etapas do seu processo de vendas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {etapas.map((etapa) => (
                      <div key={etapa.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: etapa.cor }}
                          />
                          <span className="font-medium">{etapa.nome}</span>
                          <Badge variant="outline">Ordem: {etapa.ordem}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={etapa.ativo} />
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => handleRemoverEtapa(etapa.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Nova Etapa</CardTitle>
                <CardDescription>
                  Adicione uma nova etapa ao funil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeEtapa">Nome da Etapa</Label>
                  <Input
                    id="nomeEtapa"
                    value={novaEtapa.nome}
                    onChange={(e) => setNovaEtapa(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Negociação"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="corEtapa">Cor</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="corEtapa"
                      type="color"
                      value={novaEtapa.cor}
                      onChange={(e) => setNovaEtapa(prev => ({ ...prev, cor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={novaEtapa.cor}
                      onChange={(e) => setNovaEtapa(prev => ({ ...prev, cor: e.target.value }))}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <Button onClick={handleAdicionarEtapa} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Etapa
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categorias de Tarefas */}
        <TabsContent value="categorias">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Categorias de Tarefas</CardTitle>
                  <CardDescription>
                    Gerencie os tipos de tarefas disponíveis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoriasTarefa.map((categoria) => (
                      <div key={categoria.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{categoria.nome}</span>
                        <div className="flex items-center gap-2">
                          <Switch checked={categoria.ativo} />
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => handleRemoverCategoria(categoria.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Nova Categoria</CardTitle>
                <CardDescription>
                  Adicione um novo tipo de tarefa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeCategoria">Nome da Categoria</Label>
                  <Input
                    id="nomeCategoria"
                    value={novaCategoria}
                    onChange={(e) => setNovaCategoria(e.target.value)}
                    placeholder="Ex: Visita Comercial"
                  />
                </div>

                <Button onClick={handleAdicionarCategoria} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Categoria
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Dados da Empresa */}
        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>
                Informações que aparecerão em relatórios e documentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
                  <Input
                    id="nomeEmpresa"
                    value={configuracoes.empresa.nome}
                    onChange={(e) => setConfiguracoes(prev => ({
                      ...prev,
                      empresa: { ...prev.empresa, nome: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpjEmpresa">CNPJ</Label>
                  <Input
                    id="cnpjEmpresa"
                    value={configuracoes.empresa.cnpj}
                    onChange={(e) => setConfiguracoes(prev => ({
                      ...prev,
                      empresa: { ...prev.empresa, cnpj: e.target.value }
                    }))}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emailEmpresa">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="emailEmpresa"
                      value={configuracoes.empresa.email}
                      onChange={(e) => setConfiguracoes(prev => ({
                        ...prev,
                        empresa: { ...prev.empresa, email: e.target.value }
                      }))}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefoneEmpresa">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefoneEmpresa"
                      value={configuracoes.empresa.telefone}
                      onChange={(e) => setConfiguracoes(prev => ({
                        ...prev,
                        empresa: { ...prev.empresa, telefone: e.target.value }
                      }))}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteEmpresa">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="websiteEmpresa"
                    value={configuracoes.empresa.website}
                    onChange={(e) => setConfiguracoes(prev => ({
                      ...prev,
                      empresa: { ...prev.empresa, website: e.target.value }
                    }))}
                    className="pl-9"
                  />
                </div>
              </div>

              <Button onClick={handleSalvarConfiguracoes} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Dados da Empresa
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Configure como e quando receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificações de Tarefas por E-mail</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba lembretes de tarefas vencendo por e-mail
                    </p>
                  </div>
                  <Switch 
                    checked={configuracoes.notificacoes.emailTarefas}
                    onCheckedChange={(checked) => setConfiguracoes(prev => ({
                      ...prev,
                      notificacoes: { ...prev.notificacoes, emailTarefas: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificações de Novos Leads</Label>
                    <p className="text-sm text-muted-foreground">
                      Seja notificado quando novos leads forem criados
                    </p>
                  </div>
                  <Switch 
                    checked={configuracoes.notificacoes.emailLeads}
                    onCheckedChange={(checked) => setConfiguracoes(prev => ({
                      ...prev,
                      notificacoes: { ...prev.notificacoes, emailLeads: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificações WhatsApp</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações via WhatsApp (requer integração)
                    </p>
                  </div>
                  <Switch 
                    checked={configuracoes.notificacoes.whatsappNotif}
                    onCheckedChange={(checked) => setConfiguracoes(prev => ({
                      ...prev,
                      notificacoes: { ...prev.notificacoes, whatsappNotif: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Relatórios Automáticos</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba relatórios semanais por e-mail automaticamente
                    </p>
                  </div>
                  <Switch 
                    checked={configuracoes.notificacoes.relatoriosAuto}
                    onCheckedChange={(checked) => setConfiguracoes(prev => ({
                      ...prev,
                      notificacoes: { ...prev.notificacoes, relatoriosAuto: checked }
                    }))}
                  />
                </div>
              </div>

              <Button onClick={handleSalvarConfiguracoes} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Notificações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrações */}
        <TabsContent value="integracoes">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API e Webhooks</CardTitle>
                <CardDescription>
                  Configure integrações com sistemas externos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="apiKey"
                      type="password"
                      value={configuracoes.integracoes.apiKey}
                      onChange={(e) => setConfiguracoes(prev => ({
                        ...prev,
                        integracoes: { ...prev.integracoes, apiKey: e.target.value }
                      }))}
                      placeholder="Chave da API para integrações"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">URL do Webhook</Label>
                  <div className="relative">
                    <Webhook className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="webhookUrl"
                      value={configuracoes.integracoes.webhookUrl}
                      onChange={(e) => setConfiguracoes(prev => ({
                        ...prev,
                        integracoes: { ...prev.integracoes, webhookUrl: e.target.value }
                      }))}
                      placeholder="https://sua-api.com/webhook"
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Business</CardTitle>
                <CardDescription>
                  Configure a integração com WhatsApp para envio de mensagens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappToken">Token do WhatsApp</Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="whatsappToken"
                      type="password"
                      value={configuracoes.integracoes.whatsappToken}
                      onChange={(e) => setConfiguracoes(prev => ({
                        ...prev,
                        integracoes: { ...prev.integracoes, whatsappToken: e.target.value }
                      }))}
                      placeholder="Token da API do WhatsApp"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Para configurar o WhatsApp, você precisará de uma conta WhatsApp Business 
                    e acesso à API oficial do WhatsApp. Consulte a documentação para mais detalhes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSalvarConfiguracoes} className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Integrações
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}