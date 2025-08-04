
export interface ContractData {
  cidade: string
  uf: string
  dia: string
  mes: string
  ano: string
  modelo: {
    id: string
    fullName: string
    document: string
    email: string
    phone: string
    postalcode: string
    street: string
    neighborhood: string
    city: string
    numberAddress: string
    complement: string
  }
  valorContrato: string
  metodoPagamento: string[]
  paymentData: any
}

export interface AutentiqueResponse {
  data: {
    createDocument: {
      id: string
      name: string
      signatures: Array<{
        public_id: string
        name: string
        email: string
        action: { name: string }
        link: { short_link: string }
      }>
    }
  }
}

export interface ContractResult {
  success: boolean
  message: string
  documentId?: string
  whatsappLink?: string
}
