import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Label } from "../../components/ui/label"
import { toast } from "sonner"
import { Users, UserPlus, Mail, Search, RefreshCw } from "lucide-react"

// Mock data para usuários
const mockTalents = [
  {
    id: 1,
    name: "Ana Clara Silva",
    email: "ana.clara@email.com",
    status: "Ativo",
    inviteStatus: "Aceito",
    joinDate: "2024-01-15"
  },
  {
    id: 2,
    name: "Carlos Eduardo Santos",
    email: "carlos.santos@email.com",
    status: "Ativo",
    inviteStatus: "Aceito",
    joinDate: "2024-01-20"
  },
  {
    id: 3,
    name: "Marina Oliveira",
    email: "marina.oliveira@email.com",
    status: "Pendente",
    inviteStatus: "Enviado",
    joinDate: null
  },
  {
    id: 4,
    name: "Rafael Costa",
    email: "rafael.costa@email.com",
    status: "Inativo",
    inviteStatus: "Aceito",
    joinDate: "2024-02-01"
  }
]

const mockEmployees = [
  {
    id: 1,
    name: "João Silva",
    email: "joao@pregiato.com",
    role: "Gerente",
    status: "Ativo",
    joinDate: "2023-06-15"
  },
  {
    id: 2,
    name: "Maria Santos",
    email: "maria@pregiato.com",
    role: "Coordenadora",
    status: "Ativo",
    joinDate: "2023-08-20"
  },
  {
    id: 3,
    name: "Pedro Oliveira",
    email: "pedro@pregiato.com",
    role: "Assistente",
    status: "Ativo",
    joinDate: "2023-10-10"
  }
]

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [userType, setUserType] = useState<"TALENT" | "EMPLOYEE">("TALENT")

  const filteredTalents = mockTalents.filter(talent =>
    talent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    talent.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredEmployees = mockEmployees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendInvite = async (email: string, type: "TALENT" | "EMPLOYEE") => {
    try {
      // TODO: Implementar envio de convite via Clerk
      // const response = await fetch('/api/invites/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     email, 
      //     userType: type,
      //     inviteUrl: `${window.location.origin}/auth/signup?invite=${generateInviteToken()}` 
      //   })
      // })
      
      console.log("API endpoint para envio de convites:")
      console.log(`POST /api/invites/send`)
      console.log("Body:", { 
        email, 
        userType: type,
        name: inviteName,
        inviteUrl: `${window.location.origin}/auth/signup?invite=TOKEN_GENERATED`
      })
      
      toast.success(`Convite enviado para ${email}`)
      setIsInviteDialogOpen(false)
      setInviteEmail("")
      setInviteName("")
    } catch (error) {
      console.error("Erro ao enviar convite:", error)
      toast.error("Erro ao enviar convite")
    }
  }

  const handleResendInvite = async (email: string) => {
    try {
      // TODO: Reenviar convite
      console.log("Reenviando convite para:", email)
      toast.success(`Convite reenviado para ${email}`)
    } catch (error) {
      console.error("Erro ao reenviar convite:", error)
      toast.error("Erro ao reenviar convite")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ativo":
        return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
      case "Inativo":
        return <Badge variant="secondary">Inativo</Badge>
      case "Pendente":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getInviteStatusBadge = (status: string) => {
    switch (status) {
      case "Aceito":
        return <Badge className="bg-green-500 hover:bg-green-600">Aceito</Badge>
      case "Enviado":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Enviado</Badge>
      case "Expirado":
        return <Badge className="bg-red-500 hover:bg-red-600">Expirado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">Gerencie talentos e funcionários do sistema</p>
        </div>

        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="contained">
              <UserPlus className="mr-2 h-4 w-4" />
              Enviar Convite
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enviar Convite</DialogTitle>
              <DialogDescription>
                Envie um convite para um novo usuário se cadastrar no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid gap-2">
                <Label>Tipo de Usuário</Label>
                <Tabs value={userType} onValueChange={(value) => setUserType(value as "TALENT" | "EMPLOYEE")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="TALENT">Talento</TabsTrigger>
                    <TabsTrigger value="EMPLOYEE">Funcionário</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => handleSendInvite(inviteEmail, userType)}
                disabled={!inviteEmail || !inviteName}
              >
                <Mail className="mr-2 h-4 w-4" />
                Enviar Convite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de busca */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs para diferentes tipos de usuários */}
      <Tabs defaultValue="talents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="talents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Talentos ({filteredTalents.length})
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Funcionários ({filteredEmployees.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="talents" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Talentos (Modelos)</CardTitle>
              <CardDescription>
                Gerencie contas de talentos e usuários do sistema. Envie convites para novos modelos se cadastrarem.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Header da tabela */}
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-3">Nome</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Convite</div>
                  <div className="col-span-2">Ações</div>
                </div>

                {/* Lista de talentos */}
                {filteredTalents.map((talent) => (
                  <div key={talent.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-border/50">
                    <div className="col-span-3 font-medium">{talent.name}</div>
                    <div className="col-span-3 text-muted-foreground">{talent.email}</div>
                    <div className="col-span-2">{getStatusBadge(talent.status)}</div>
                    <div className="col-span-2">{getInviteStatusBadge(talent.inviteStatus)}</div>
                    <div className="col-span-2 flex gap-2">
                      {talent.inviteStatus === "Enviado" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResendInvite(talent.email)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reenviar
                        </Button>
                      )}
                      {talent.inviteStatus === "Aceito" && (
                        <Button 
                          variant="contained" 
                          size="sm"
                          onClick={() => handleSendInvite(talent.email, "TALENT")}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Convidar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredTalents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum talento encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Funcionários</CardTitle>
              <CardDescription>
                Gerencie contas de funcionários e operadores do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Header da tabela */}
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-3">Nome</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Cargo</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Ações</div>
                </div>

                {/* Lista de funcionários */}
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-border/50">
                    <div className="col-span-3 font-medium">{employee.name}</div>
                    <div className="col-span-3 text-muted-foreground">{employee.email}</div>
                    <div className="col-span-2">
                      <Badge variant="outline">{employee.role}</Badge>
                    </div>
                    <div className="col-span-2">{getStatusBadge(employee.status)}</div>
                    <div className="col-span-2 flex gap-2">
                      <Button 
                        variant="contained" 
                        size="sm"
                        onClick={() => handleSendInvite(employee.email, "EMPLOYEE")}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Convidar
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredEmployees.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum funcionário encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}