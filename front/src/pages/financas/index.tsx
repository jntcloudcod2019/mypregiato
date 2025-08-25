import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, DollarSign, FileText, Calendar } from "lucide-react"

// Mock data - será substituído por dados reais da API
const mockContracts = {
  day: 12,
  week: 47,
  month: 186
}

const mockRevenue = {
  day: 25400.00,
  week: 128650.00,
  month: 486700.00
}

const revenueChartData = [
  { name: 'Jan', valor: 45000 },
  { name: 'Fev', valor: 52000 },
  { name: 'Mar', valor: 48000 },
  { name: 'Abr', valor: 61000 },
  { name: 'Mai', valor: 55000 },
  { name: 'Jun', valor: 67000 },
  { name: 'Jul', valor: 58000 },
  { name: 'Ago', valor: 72000 },
  { name: 'Set', valor: 65000 },
  { name: 'Out', valor: 78000 },
  { name: 'Nov', valor: 82000 },
  { name: 'Dez', valor: 86700 }
]

const contractsChartData = [
  { name: 'Jan', contratos: 120 },
  { name: 'Fev', contratos: 135 },
  { name: 'Mar', contratos: 128 },
  { name: 'Abr', contratos: 156 },
  { name: 'Mai', contratos: 145 },
  { name: 'Jun', contratos: 172 },
  { name: 'Jul', contratos: 158 },
  { name: 'Ago', contratos: 185 },
  { name: 'Set', contratos: 168 },
  { name: 'Out', contratos: 195 },
  { name: 'Nov', contratos: 201 },
  { name: 'Dez', contratos: 186 }
]

const pieData = [
  { name: 'Agenciamento', value: 45, color: '#4A90E2' },
  { name: 'Super Fotos', value: 30, color: '#FF4C29' },
  { name: 'Comprometimento', value: 25, color: '#AEB3B7' }
]

export default function Financas() {
  const [contracts, setContracts] = useState(mockContracts)
  const [revenue, setRevenue] = useState(mockRevenue)
  const [isLoading, setIsLoading] = useState(false)

  // Simulação de atualização em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      // Simula pequenas variações nos dados
      setContracts(prev => ({
        day: prev.day + Math.floor(Math.random() * 3) - 1,
        week: prev.week + Math.floor(Math.random() * 5) - 2,
        month: prev.month + Math.floor(Math.random() * 10) - 5
      }))
      
      setRevenue(prev => ({
        day: prev.day + (Math.random() * 1000 - 500),
        week: prev.week + (Math.random() * 5000 - 2500),
        month: prev.month + (Math.random() * 10000 - 5000)
      }))
    }, 5000) // Atualiza a cada 5 segundos

    return () => clearInterval(interval)
  }, [])

  // Função para buscar dados da API
  const fetchFinancialData = async () => {
    setIsLoading(true)
    try {
      // TODO: Implementar chamadas para API
      // const [contractsDay, contractsWeek, contractsMonth, revenueDay, revenueWeek, revenueMonth] = await Promise.all([
      //   fetch('/api/contracts/day').then(res => res.json()),
      //   fetch('/api/contracts/week').then(res => res.json()),
      //   fetch('/api/contracts/month').then(res => res.json()),
      //   fetch('/api/revenue/day').then(res => res.json()),
      //   fetch('/api/revenue/week').then(res => res.json()),
      //   fetch('/api/revenue/month').then(res => res.json())
      // ])
      
      // setContracts({ day: contractsDay.count, week: contractsWeek.count, month: contractsMonth.count })
      // setRevenue({ day: revenueDay.total, week: revenueWeek.total, month: revenueMonth.total })
      
      console.log("API endpoints a serem implementados:")
      console.log("- GET /api/contracts/day - Retorna: { count: number }")
      console.log("- GET /api/contracts/week - Retorna: { count: number }")
      console.log("- GET /api/contracts/month - Retorna: { count: number }")
      console.log("- GET /api/revenue/day - Retorna: { total: number }")
      console.log("- GET /api/revenue/week - Retorna: { total: number }")
      console.log("- GET /api/revenue/month - Retorna: { total: number }")
      
    } catch (error) {
      console.error("Erro ao buscar dados financeiros:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Finanças</h1>
          <p className="text-muted-foreground">Dashboard financeiro em tempo real</p>
        </div>
        <Badge variant="secondary" className="animate-pulse">
          Atualizando automaticamente
        </Badge>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Hoje</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{contracts.day}</div>
            <p className="text-xs text-muted-foreground">Contratos gerados hoje</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{contracts.week}</div>
            <p className="text-xs text-muted-foreground">Contratos desta semana</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{contracts.month}</div>
            <p className="text-xs text-muted-foreground">Contratos este mês</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(revenue.day)}</div>
            <p className="text-xs text-muted-foreground">Valor faturado hoje</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Semana</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(revenue.week)}</div>
            <p className="text-xs text-muted-foreground">Valor desta semana</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(revenue.month)}</div>
            <p className="text-xs text-muted-foreground">Valor este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Faturamento</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="types">Tipos de Contrato</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Faturamento Mensal</CardTitle>
              <CardDescription>Evolução do faturamento ao longo do ano</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), 'Faturamento']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#4A90E2" 
                    strokeWidth={3}
                    dot={{ fill: '#4A90E2', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#4A90E2', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Contratos por Mês</CardTitle>
              <CardDescription>Quantidade de contratos gerados mensalmente</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={contractsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [value, 'Contratos']}
                  />
                  <Bar dataKey="contratos" fill="#4A90E2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Distribuição por Tipo de Contrato</CardTitle>
              <CardDescription>Percentual de cada tipo de contrato</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}