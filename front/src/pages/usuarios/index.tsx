import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { toast } from "sonner"
import { Users, UserPlus, Mail, Search, Loader2, RefreshCw, X, Edit2, Trash2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userManagementService, CreateUserRequest, UserResponse } from '../../services/user-management-service'

export default function Usuarios() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  
  // ✅ Formulário completo com FirstName, LastName e Role
  const [inviteData, setInviteData] = useState<CreateUserRequest>({
    email: "",
    firstName: "",
    lastName: "",
    role: "MODEL"
  })

  // ✅ Dados de edição
  const [editData, setEditData] = useState<Partial<UserResponse>>({
    firstName: "",
    lastName: "",
    role: "MODEL"
  })

  // ✅ Query para buscar usuários reais da API
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userManagementService.getAllUsers()
  })

  // ✅ Mutation para enviar convite
  const sendInvitationMutation = useMutation({
    mutationFn: userManagementService.sendInvitation,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      
      toast.success(
        `✅ ${response.message}\n\n📧 Um email foi enviado para ${response.email} com instruções de ativação.`,
        { duration: 5000 }
      )
      
      setIsInviteDialogOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data || error.message || 'Erro ao enviar convite'
      toast.error(`Erro: ${errorMessage}`)
    }
  })

  // ✅ Mutation para reenviar convite
  const resendInvitationMutation = useMutation({
    mutationFn: userManagementService.resendInvitation,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(`✅ Convite reenviado para ${response.email}!`)
    },
    onError: (error: any) => {
      toast.error(`Erro ao reenviar: ${error.response?.data || error.message}`)
    }
  })

  // ✅ Mutation para cancelar convite
  const cancelInvitationMutation = useMutation({
    mutationFn: userManagementService.cancelInvitation,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(`✅ Convite cancelado para ${response.email}`)
    },
    onError: (error: any) => {
      toast.error(`Erro ao cancelar: ${error.response?.data || error.message}`)
    }
  })

  // ✅ Mutation para editar usuário
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateUserRequest> }) => 
      userManagementService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('✅ Usuário atualizado com sucesso!')
      setIsEditDialogOpen(false)
      setSelectedUser(null)
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.response?.data || error.message}`)
    }
  })

  // ✅ Mutation para deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: userManagementService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('✅ Usuário deletado com sucesso!')
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar: ${error.response?.data || error.message}`)
    }
  })

  const handleSendInvite = async () => {
    if (!inviteData.email || !inviteData.firstName || !inviteData.lastName) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    await sendInvitationMutation.mutateAsync(inviteData)
  }

  const handleResendInvite = (userId: string) => {
    resendInvitationMutation.mutate(userId)
  }

  const handleCancelInvite = (userId: string) => {
    cancelInvitationMutation.mutate(userId)
  }

  const handleEditUser = (user: UserResponse) => {
    setSelectedUser(user)
    setEditData({
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as any
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = () => {
    if (!selectedUser) return
    if (!editData.firstName || !editData.lastName) {
      toast.error("Preencha nome e sobrenome")
      return
    }

    updateUserMutation.mutate({ 
      id: selectedUser.id, 
      data: editData as any 
    })
  }

  const handleDeleteUser = (user: UserResponse) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteUser = () => {
    if (!selectedUser) return
    deleteUserMutation.mutate(selectedUser.id)
  }

  const resetForm = () => {
    setInviteData({
      email: "",
      firstName: "",
      lastName: "",
      role: "MODEL"
    })
  }

  // Filtrar usuários por busca
  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Separar por tipo
  const talentUsers = filteredUsers.filter(u => u.role === 'MODEL')
  const employeeUsers = filteredUsers.filter(u => ['ADMIN', 'OPERATOR', 'PRODUCER'].includes(u.role))

  const getStatusBadge = (clerkId: string) => {
    if (!clerkId) {
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendente</Badge>
    }
    return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
  }

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; color: string }> = {
      'ADMIN': { label: 'Administrador', color: 'bg-purple-500' },
      'MODEL': { label: 'Modelo', color: 'bg-blue-500' },
      'PRODUCER': { label: 'Produtor', color: 'bg-orange-500' },
      'OPERATOR': { label: 'Operador', color: 'bg-green-500' },
    }
    const roleInfo = roleMap[role] || { label: role, color: 'bg-gray-500' }
    return <Badge className={`${roleInfo.color} hover:${roleInfo.color}`}>{roleInfo.label}</Badge>
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
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Enviar Convite</DialogTitle>
              <DialogDescription>
                O Clerk enviará automaticamente um email para o usuário com link de ativação.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Nome */}
              <div className="grid gap-2">
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={inviteData.firstName}
                  onChange={(e) => setInviteData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="João"
                  autoComplete="given-name"
                />
              </div>

              {/* ✅ NOVO: Sobrenome */}
              <div className="grid gap-2">
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={inviteData.lastName}
                  onChange={(e) => setInviteData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Silva"
                  autoComplete="family-name"
                />
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  autoComplete="email"
                />
              </div>

              {/* ✅ NOVO: Role (Tipo de Usuário) com Select */}
              <div className="grid gap-2">
                <Label htmlFor="role">Tipo de Usuário *</Label>
                <Select 
                  value={inviteData.role} 
                  onValueChange={(value) => setInviteData(prev => ({ 
                    ...prev, 
                    role: value as 'ADMIN' | 'MODEL' | 'PRODUCER' | 'OPERATOR' 
                  }))}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MODEL">Modelo (Talento)</SelectItem>
                    <SelectItem value="OPERATOR">Operador (CRM)</SelectItem>
                    <SelectItem value="PRODUCER">Produtor</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* ✅ INFO: Convite Clerk */}
                <p className="text-xs text-muted-foreground">
                  ℹ️ O usuário receberá um email do Clerk para definir sua própria senha
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleSendInvite}
                disabled={sendInvitationMutation.isPending || !inviteData.email || !inviteData.firstName || !inviteData.lastName}
              >
                {sendInvitationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando convite...
                  </>
                ) : (
                  <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Convite
                  </>
                )}
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
            Talentos ({talentUsers.length})
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Funcionários ({employeeUsers.length})
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
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Carregando usuários...</span>
                </div>
              ) : (
              <div className="space-y-4">
                {/* Header da tabela */}
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-3">Nome</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Status</div>
                    <div className="col-span-2">Data</div>
                  <div className="col-span-2">Ações</div>
                </div>

                {/* Lista de talentos */}
                  {talentUsers.map((user) => (
                    <div key={user.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-border/50">
                      <div className="col-span-3 font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="col-span-3 text-muted-foreground text-sm">{user.email}</div>
                      <div className="col-span-2">{getStatusBadge(user.clerkId)}</div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    <div className="col-span-2 flex gap-2">
                        {/* Se convite pendente, mostrar botões de reenviar e cancelar */}
                        {!user.clerkId ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleResendInvite(user.id)}
                              disabled={resendInvitationMutation.isPending}
                              title="Reenviar convite"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCancelInvite(user.id)}
                              disabled={cancelInvitationMutation.isPending}
                              title="Cancelar convite"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                        <Button 
                          variant="outline" 
                          size="sm"
                              onClick={() => handleEditUser(user)}
                              title="Editar usuário"
                        >
                              <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button 
                              variant="outline" 
                          size="sm"
                              onClick={() => handleDeleteUser(user)}
                              title="Deletar usuário"
                        >
                              <Trash2 className="h-3 w-3" />
                        </Button>
                          </>
                      )}
                    </div>
                  </div>
                ))}

                  {talentUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum talento encontrado
                  </div>
                )}
              </div>
              )}
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
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Carregando usuários...</span>
                </div>
              ) : (
              <div className="space-y-4">
                {/* Header da tabela */}
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                    <div className="col-span-2">Nome</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Cargo</div>
                  <div className="col-span-2">Status</div>
                    <div className="col-span-1">Data</div>
                  <div className="col-span-2">Ações</div>
                </div>

                {/* Lista de funcionários */}
                  {employeeUsers.map((user) => (
                    <div key={user.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-border/50">
                      <div className="col-span-2 font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="col-span-3 text-muted-foreground text-sm">{user.email}</div>
                      <div className="col-span-2">{getRoleBadge(user.role)}</div>
                      <div className="col-span-2">{getStatusBadge(user.clerkId)}</div>
                      <div className="col-span-1 text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="col-span-2 flex gap-2">
                        {/* Se convite pendente, mostrar botões de reenviar e cancelar */}
                        {!user.clerkId ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleResendInvite(user.id)}
                              disabled={resendInvitationMutation.isPending}
                              title="Reenviar convite"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCancelInvite(user.id)}
                              disabled={cancelInvitationMutation.isPending}
                              title="Cancelar convite"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              title="Editar usuário"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                      <Button 
                              variant="outline" 
                        size="sm"
                              onClick={() => handleDeleteUser(user)}
                              title="Deletar usuário"
                      >
                              <Trash2 className="h-3 w-3" />
                      </Button>
                          </>
                        )}
                      </div>
                  </div>
                ))}

                  {employeeUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum funcionário encontrado
                  </div>
                )}
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere os dados do usuário {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-firstName">Nome *</Label>
              <Input
                id="edit-firstName"
                value={editData.firstName || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Nome"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-lastName">Sobrenome *</Label>
              <Input
                id="edit-lastName"
                value={editData.lastName || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Sobrenome"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-role">Tipo de Usuário *</Label>
              <Select 
                value={editData.role as string} 
                onValueChange={(value) => setEditData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MODEL">Modelo (Talento)</SelectItem>
                  <SelectItem value="OPERATOR">Operador (CRM)</SelectItem>
                  <SelectItem value="PRODUCER">Produtor</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
              <br /><br />
              Esta ação não pode ser desfeita. O usuário será removido permanentemente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir Usuário'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
