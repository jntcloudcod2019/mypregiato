import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Upload } from "lucide-react"

interface PaymentFieldsProps {
  paymentMethods: string[]
  paymentData: any
  onPaymentDataChange: (data: any) => void
}

export function PaymentFields({ paymentMethods, paymentData, onPaymentDataChange }: PaymentFieldsProps) {
  const [fileBase64, setFileBase64] = useState("")

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setFileBase64(base64String)
        onPaymentDataChange({
          ...paymentData,
          anexo: base64String
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '')
    if (numbers.length !== 11) return false
    
    // Validação básica de CPF
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(numbers.charAt(9))) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    return remainder === parseInt(numbers.charAt(10))
  }

  return (
    <div className="space-y-4">
      {/* Cartão de Crédito */}
      {paymentMethods.includes("Cartão de Crédito") && (
        <Card className="bg-background/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              💳 Detalhes do Cartão de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cartao-parcelas">Quantidade de Parcelas *</Label>
                <Input 
                  id="cartao-parcelas"
                  type="number"
                  min="1"
                  value={paymentData.cartao?.parcelas || ""}
                  onChange={(e) => onPaymentDataChange({
                    ...paymentData,
                    cartao: { ...paymentData.cartao, parcelas: e.target.value }
                  })}
                  className="bg-background border-border"
                  placeholder="Ex: 3"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cartao-valor">Valor *</Label>
                <Input 
                  id="cartao-valor"
                  value={paymentData.cartao?.valor || ""}
                  onChange={(e) => onPaymentDataChange({
                    ...paymentData,
                    cartao: { ...paymentData.cartao, valor: e.target.value }
                  })}
                  className="bg-background border-border"
                  placeholder="Ex: R$ 2.500,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Status do Pagamento *</Label>
                <Select 
                  value={paymentData.cartao?.status || "pendente"} 
                  onValueChange={(value) => onPaymentDataChange({
                    ...paymentData,
                    cartao: { ...paymentData.cartao, status: value }
                  })}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Pagamento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background border-border",
                        !paymentData.cartao?.dataPagamento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentData.cartao?.dataPagamento ? (
                        format(paymentData.cartao.dataPagamento, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={paymentData.cartao?.dataPagamento}
                      onSelect={(date) => onPaymentDataChange({
                        ...paymentData,
                        cartao: { ...paymentData.cartao, dataPagamento: date }
                      })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cartao-provedor">Provedor do Pagamento *</Label>
                <Input 
                  id="cartao-provedor"
                  value={paymentData.cartao?.provedor || ""}
                  onChange={(e) => onPaymentDataChange({
                    ...paymentData,
                    cartao: { ...paymentData.cartao, provedor: e.target.value }
                  })}
                  className="bg-background border-border"
                  placeholder="Ex: Mercado Pago"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Acordo de Pagamento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background border-border",
                        !paymentData.cartao?.dataAcordo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentData.cartao?.dataAcordo ? (
                        format(paymentData.cartao.dataAcordo, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={paymentData.cartao?.dataAcordo}
                      onSelect={(date) => onPaymentDataChange({
                        ...paymentData,
                        cartao: { ...paymentData.cartao, dataAcordo: date }
                      })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cartao-autorizacao">Número de Autorização *</Label>
                <Input 
                  id="cartao-autorizacao"
                  value={paymentData.cartao?.numeroAutorizacao || ""}
                  onChange={(e) => onPaymentDataChange({
                    ...paymentData,
                    cartao: { ...paymentData.cartao, numeroAutorizacao: e.target.value }
                  })}
                  className="bg-background border-border"
                  placeholder="Ex: 123456789"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PIX */}
      {paymentMethods.includes("PIX") && (
        <Card className="bg-background/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              🔗 Detalhes do PIX
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pix-valor">Valor *</Label>
                <Input 
                  id="pix-valor"
                  value={paymentData.pix?.valor || ""}
                  onChange={(e) => onPaymentDataChange({
                    ...paymentData,
                    pix: { ...paymentData.pix, valor: e.target.value }
                  })}
                  className="bg-background border-border"
                  placeholder="Ex: R$ 500,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data do Pagamento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background border-border",
                        !paymentData.pix?.dataPagamento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentData.pix?.dataPagamento ? (
                        format(paymentData.pix.dataPagamento, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={paymentData.pix?.dataPagamento}
                      onSelect={(date) => onPaymentDataChange({
                        ...paymentData,
                        pix: { ...paymentData.pix, dataPagamento: date }
                      })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Status do Pagamento *</Label>
                <Select 
                  value={paymentData.pix?.status || "pendente"} 
                  onValueChange={(value) => onPaymentDataChange({
                    ...paymentData,
                    pix: { ...paymentData.pix, status: value }
                  })}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pix-comprovante">Comprovante de Pagamento</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pix-comprovante"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="bg-background border-border"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Anexe o comprovante em PDF ou imagem (JPG, PNG)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dinheiro */}
      {paymentMethods.includes("Dinheiro") && (
        <Card className="bg-background/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              💵 Pagamento em Dinheiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dinheiro-valor">Valor *</Label>
                <Input 
                  id="dinheiro-valor"
                  value={paymentData.dinheiro?.valor || ""}
                  onChange={(e) => onPaymentDataChange({
                    ...paymentData,
                    dinheiro: { ...paymentData.dinheiro, valor: e.target.value }
                  })}
                  className="bg-background border-border"
                  placeholder="Ex: R$ 300,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data do Pagamento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background border-border",
                        !paymentData.dinheiro?.dataPagamento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentData.dinheiro?.dataPagamento ? (
                        format(paymentData.dinheiro.dataPagamento, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={paymentData.dinheiro?.dataPagamento}
                      onSelect={(date) => onPaymentDataChange({
                        ...paymentData,
                        dinheiro: { ...paymentData.dinheiro, dataPagamento: date }
                      })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Status do Pagamento *</Label>
                <Select 
                  value={paymentData.dinheiro?.status || "pendente"} 
                  onValueChange={(value) => onPaymentDataChange({
                    ...paymentData,
                    dinheiro: { ...paymentData.dinheiro, status: value }
                  })}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cartão de Débito */}
      {paymentMethods.includes("Débito") && (
        <Card className="bg-background/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              💳 Cartão de Débito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="debito-valor">Valor *</Label>
                <Input 
                  id="debito-valor"
                  value={paymentData.debito?.valor || ""}
                  onChange={(e) => onPaymentDataChange({
                    ...paymentData,
                    debito: { ...paymentData.debito, valor: e.target.value }
                  })}
                  className="bg-background border-border"
                  placeholder="Ex: R$ 800,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Status do Pagamento *</Label>
                <Select 
                  value={paymentData.debito?.status || "pendente"} 
                  onValueChange={(value) => onPaymentDataChange({
                    ...paymentData,
                    debito: { ...paymentData.debito, status: value }
                  })}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Pagamento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background border-border",
                        !paymentData.debito?.dataPagamento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentData.debito?.dataPagamento ? (
                        format(paymentData.debito.dataPagamento, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={paymentData.debito?.dataPagamento}
                      onSelect={(date) => onPaymentDataChange({
                        ...paymentData,
                        debito: { ...paymentData.debito, dataPagamento: date }
                      })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="debito-autorizacao">Número de Autorização *</Label>
                <Input 
                  id="debito-autorizacao"
                  value={paymentData.debito?.numeroAutorizacao || ""}
                  onChange={(e) => onPaymentDataChange({
                    ...paymentData,
                    debito: { ...paymentData.debito, numeroAutorizacao: e.target.value }
                  })}
                  className="bg-background border-border"
                  placeholder="Ex: 987654321"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link de Pagamento */}
      {paymentMethods.includes("Link de Pagamento") && (
        <Card className="bg-background/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              🔗 Link de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="link-valor">Valor *</Label>
                <Input 
                  id="link-valor"
                  value={paymentData.link?.valor || ""}
                  onChange={(e) => onPaymentDataChange({
                    ...paymentData,
                    link: { ...paymentData.link, valor: e.target.value }
                  })}
                  className="bg-background border-border"
                  placeholder="Ex: R$ 1.200,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data do Pagamento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background border-border",
                        !paymentData.link?.dataPagamento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentData.link?.dataPagamento ? (
                        format(paymentData.link.dataPagamento, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={paymentData.link?.dataPagamento}
                      onSelect={(date) => onPaymentDataChange({
                        ...paymentData,
                        link: { ...paymentData.link, dataPagamento: date }
                      })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Status do Pagamento *</Label>
                <Select 
                  value={paymentData.link?.status || "pendente"} 
                  onValueChange={(value) => onPaymentDataChange({
                    ...paymentData,
                    link: { ...paymentData.link, status: value }
                  })}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-comprovante">Comprovante de Pagamento</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="link-comprovante"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="bg-background border-border"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Anexe o comprovante em PDF ou imagem (JPG, PNG)
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}