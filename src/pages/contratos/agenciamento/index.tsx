import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Construction } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function ContratosAgenciamento() {
  const navigate = useNavigate()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/contratos')}
          className="border-border"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contratos de Agenciamento</h1>
          <p className="text-muted-foreground">
            Gerencie contratos de agenciamento de modelos
          </p>
        </div>
      </div>

      {/* Em Construção */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader className="text-center">
          <Construction className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle>Página em Construção</CardTitle>
          <CardDescription>
            Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => navigate('/contratos')} className="bg-primary hover:bg-primary-hover">
            Voltar para Contratos
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}