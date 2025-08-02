import { useState, useEffect } from "react"
import { Clock, MapPin, Users, FileText, Settings, User, Calendar, Download, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface PontoRecord {
  id: string
  tipo: 'entrada' | 'saida' | 'almoco_saida' | 'almoco_volta'
  horario: string
  localizacao: {
    lat: number
    lng: number
    endereco: string
  }
  data: string
}

interface UserStatus {
  id: string
  nome: string
  status: 'online' | 'pausado' | 'offline' | 'fora_estacao'
  ultimoRegistro: string
  horasHoje: string
}

export default function PontoEletronicoPage() {
  const [userRole, setUserRole] = useState<'colaborador' | 'admin'>('colaborador')
  const [currentStatus, setCurrentStatus] = useState<'offline' | 'trabalhando' | 'almoco' | 'fora_estacao'>('offline')
  const [todayHours, setTodayHours] = useState('00:00:00')
  const [lunchTime, setLunchTime] = useState('00:00:00')
  const [entryTime, setEntryTime] = useState<string | null>(null)
  const [isIdle, setIsIdle] = useState(false)
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [pontoRecords, setPontoRecords] = useState<PontoRecord[]>([])
  const [users, setUsers] = useState<UserStatus[]>([])
  const { toast } = useToast()

  // Simular dados iniciais
  useEffect(() => {
    // TODO: Carregar dados da API
    const mockUsers: UserStatus[] = [
      { id: '1', nome: 'Ana Clara Silva', status: 'online', ultimoRegistro: '08:00:00', horasHoje: '07:30:00' },
      { id: '2', nome: 'João Santos', status: 'pausado', ultimoRegistro: '12:00:00', horasHoje: '04:00:00' },
      { id: '3', nome: 'Maria Oliveira', status: 'offline', ultimoRegistro: '17:30:00', horasHoje: '08:00:00' },
    ]
    setUsers(mockUsers)

    const mockRecords: PontoRecord[] = [
      {
        id: '1',
        tipo: 'entrada',
        horario: '08:00:15',
        data: '2024-01-15',
        localizacao: { lat: -23.550520, lng: -46.633309, endereco: 'São Paulo, SP' }
      },
      {
        id: '2',
        tipo: 'almoco_saida',
        horario: '12:00:30',
        data: '2024-01-15',
        localizacao: { lat: -23.550520, lng: -46.633309, endereco: 'São Paulo, SP' }
      },
    ]
    setPontoRecords(mockRecords)
  }, [])

  // Detectar inatividade
  useEffect(() => {
    let idleTimer: NodeJS.Timeout
    
    const resetIdleTimer = () => {
      clearTimeout(idleTimer)
      if (isIdle) {
        setIsIdle(false)
        toast({
          title: "Bem-vindo de volta!",
          description: "Sua sessão foi reativada."
        })
      }
      
      idleTimer = setTimeout(() => {
        if (currentStatus === 'trabalhando') {
          setIsIdle(true)
          toast({
            title: "Usuário inativo detectado",
            description: "O tempo de inatividade será computado separadamente."
          })
        }
      }, 300000) // 5 minutos
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true)
    })

    resetIdleTimer()

    return () => {
      clearTimeout(idleTimer)
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true)
      })
    }
  }, [currentStatus, isIdle, toast])

  // Obter localização
  const getCurrentLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  // Bater ponto
  const handleBaterPonto = async (tipo: 'entrada' | 'saida' | 'almoco_saida' | 'almoco_volta') => {
    try {
      const currentLocation = await getCurrentLocation()
      const agora = new Date()
      
      // TODO: Enviar para API
      const pontoData = {
        tipo,
        horario: agora.toLocaleTimeString('pt-BR'),
        data: agora.toLocaleDateString('pt-BR'),
        localizacao: {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          endereco: 'Obtendo endereço...' // TODO: Usar API de geocoding
        }
      }

      console.log('Enviando ponto para API:', pontoData)
      
      // Atualizar estado local
      if (tipo === 'entrada') {
        setCurrentStatus('trabalhando')
        setEntryTime(agora.toLocaleTimeString('pt-BR'))
      } else if (tipo === 'saida') {
        setCurrentStatus('offline')
      } else if (tipo === 'almoco_saida') {
        setCurrentStatus('almoco')
      } else if (tipo === 'almoco_volta') {
        setCurrentStatus('trabalhando')
      }

      toast({
        title: "Ponto registrado!",
        description: `${tipo.replace('_', ' ').toUpperCase()} registrado às ${agora.toLocaleTimeString('pt-BR')}`
      })

    } catch (error) {
      toast({
        title: "Erro ao registrar ponto",
        description: "Verifique sua localização e tente novamente.",
        variant: "destructive"
      })
    }
  }

  // Gerar PDF
  const handleGerarPDF = async (periodo: string) => {
    // TODO: Integrar com jsPDF ou API backend
    console.log('Gerando PDF para período:', periodo)
    toast({
      title: "Gerando relatório...",
      description: "O PDF será baixado em breve."
    })
  }

  // Enviar para assinatura
  const handleEnviarAssinatura = async (userId: string) => {
    // TODO: Integrar com Authentic Sign API
    console.log('Enviando para assinatura:', userId)
    toast({
      title: "Enviado para assinatura",
      description: "O colaborador receberá um e-mail com o link para assinar."
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'trabalhando':
        return 'bg-green-500'
      case 'pausado':
      case 'almoco':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-gray-500'
      case 'fora_estacao':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online'
      case 'trabalhando':
        return 'Trabalhando'
      case 'pausado':
      case 'almoco':
        return 'Em Pausa'
      case 'offline':
        return 'Offline'
      case 'fora_estacao':
        return 'Fora da Estação'
      default:
        return 'Desconhecido'
    }
  }

  if (isIdle && currentStatus === 'trabalhando') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <Clock className="h-16 w-16 mx-auto text-orange-500 animate-pulse" />
            <CardTitle className="text-xl">Aguardando retorno...</CardTitle>
            <CardDescription>
              Usuário ausente da estação de trabalho
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              O tempo de ausência está sendo computado separadamente
            </p>
            <Badge variant="outline" className="text-orange-600">
              Tempo de inatividade: {/* TODO: Calcular tempo real */} 00:05:23
            </Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-elegant bg-clip-text text-transparent">
            Controle de Ponto Eletrônico
          </h1>
          <p className="text-muted-foreground">
            Sistema de controle de jornada de trabalho
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={userRole === 'colaborador' ? 'default' : 'outline'}
            onClick={() => setUserRole('colaborador')}
            size="sm"
          >
            <User className="h-4 w-4 mr-2" />
            Colaborador
          </Button>
          <Button 
            variant={userRole === 'admin' ? 'default' : 'outline'}
            onClick={() => setUserRole('admin')}
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Administrador
          </Button>
        </div>
      </div>

      <Tabs value={userRole} className="space-y-6">
        <TabsContent value="colaborador" className="space-y-6">
          {/* Status Current */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className={`h-3 w-3 rounded-full ${getStatusColor(currentStatus)}`} />
                  <span className="font-semibold">{getStatusText(currentStatus)}</span>
                </div>
                {entryTime && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Entrada: {entryTime}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Horas Trabalhadas Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{todayHours}</div>
                <p className="text-sm text-muted-foreground">Tempo de almoço: {lunchTime}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Localização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {location ? 'Localização obtida' : 'Obtendo localização...'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botões de Ponto */}
          <Card>
            <CardHeader>
              <CardTitle>Registrar Ponto</CardTitle>
              <CardDescription>
                Clique no botão correspondente para registrar sua jornada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button 
                  onClick={() => handleBaterPonto('entrada')}
                  disabled={currentStatus !== 'offline'}
                  className="h-16"
                  variant={currentStatus === 'offline' ? 'default' : 'outline'}
                >
                  <Clock className="h-5 w-5 mr-2" />
                  Entrada
                </Button>
                
                <Button 
                  onClick={() => handleBaterPonto('almoco_saida')}
                  disabled={currentStatus !== 'trabalhando'}
                  className="h-16"
                  variant={currentStatus === 'trabalhando' ? 'secondary' : 'outline'}
                >
                  <Clock className="h-5 w-5 mr-2" />
                  Saída Almoço
                </Button>
                
                <Button 
                  onClick={() => handleBaterPonto('almoco_volta')}
                  disabled={currentStatus !== 'almoco'}
                  className="h-16"
                  variant={currentStatus === 'almoco' ? 'secondary' : 'outline'}
                >
                  <Clock className="h-5 w-5 mr-2" />
                  Volta Almoço
                </Button>
                
                <Button 
                  onClick={() => handleBaterPonto('saida')}
                  disabled={currentStatus !== 'trabalhando'}
                  className="h-16"
                  variant={currentStatus === 'trabalhando' ? 'destructive' : 'outline'}
                >
                  <Clock className="h-5 w-5 mr-2" />
                  Saída
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Histórico do Dia */}
          <Card>
            <CardHeader>
              <CardTitle>Registros de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Localização</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pontoRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {record.tipo.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.horario}</TableCell>
                      <TableCell className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{record.localizacao.endereco}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          {/* Dashboard Administrativo */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Colaboradores Online</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.status === 'online').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Em Pausa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {users.filter(u => u.status === 'pausado').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Offline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {users.filter(u => u.status === 'offline').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Alertas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">3</div>
                <p className="text-xs text-muted-foreground">Atrasos detectados</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Colaboradores */}
          <Card>
            <CardHeader>
              <CardTitle>Status dos Colaboradores</CardTitle>
              <CardDescription>
                Monitoramento em tempo real da jornada de trabalho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Registro</TableHead>
                    <TableHead>Horas Hoje</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nome}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`h-2 w-2 rounded-full ${getStatusColor(user.status)}`} />
                          <span className="text-sm">{getStatusText(user.status)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.ultimoRegistro}</TableCell>
                      <TableCell>{user.horasHoje}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleGerarPDF(user.id)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEnviarAssinatura(user.id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Relatórios */}
          <Card>
            <CardHeader>
              <CardTitle>Relatórios e Exportação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Período</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="semana">Esta Semana</SelectItem>
                      <SelectItem value="mes">Este Mês</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Colaborador</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os colaboradores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Formato</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="PDF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button onClick={() => handleGerarPDF('relatorio')}>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
                <Button variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar por Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}