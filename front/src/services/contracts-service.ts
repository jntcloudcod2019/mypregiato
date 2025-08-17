import api from '@/services/whatsapp-api'

export interface ContractRecord {
  id: string
  tipo: string
  cliente: string
  produtor: string
  data: string
  status: 'Ativo' | 'Pendente' | 'Concluído' | 'Enviado'
  valor: string
  documentId?: string
  whatsappLink?: string
  createdAt: string
  updatedAt: string
}

type ContractDto = {
  id: string
  contractType: string
  status: string
  talentName?: string
  value?: number
  createdAt: string
  updatedAt: string
  createdBy?: string
}

type CreateContractDto = {
  contractType: string
  talentName?: string
  startDate?: string | null
  endDate?: string | null
  value?: number | null
}

type UpdateContractDto = {
  contractType?: string
  status?: string
  talentName?: string
  startDate?: string | null
  endDate?: string | null
  value?: number | null
  pdfPath?: string | null
  signedPdfPath?: string | null
}

function toRecord(c: ContractDto): ContractRecord {
  return {
    id: c.id,
    tipo: c.contractType || '—',
    cliente: c.talentName || '—',
    produtor: c.createdBy || '—',
    data: new Date(c.createdAt).toISOString(),
    status: (c.status as any) || 'Pendente',
    valor: typeof c.value === 'number' ? `R$ ${c.value.toFixed(2)}` : '—',
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  }
}

export class ContractsService {
  static async getAll(): Promise<ContractRecord[]> {
    const { data } = await api.get('/contracts')
    const items = Array.isArray(data) ? data : (data?.items || [])
    return (items as ContractDto[]).map(toRecord)
  }

  static async save(contract: Omit<ContractRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContractRecord> {
    const parseValue = (v?: string) => {
      if (!v) return undefined
      const num = Number(String(v).replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.'))
      return isNaN(num) ? undefined : num
    }
    const payload: CreateContractDto = {
      contractType: contract.tipo,
      talentName: contract.cliente,
      startDate: undefined,
      endDate: undefined,
      value: parseValue(contract.valor)
    }
    const { data } = await api.post('/contracts', payload)
    let created: ContractRecord = toRecord(data as ContractDto)

    // Se status foi informado, atualiza após criação
    if (contract.status) {
      const { data: upd } = await api.put(`/contracts/${created.id}`, { status: contract.status } as UpdateContractDto)
      created = toRecord(upd as ContractDto)
    }
    return created
  }

  static async update(id: string, updates: Partial<ContractRecord>): Promise<ContractRecord | null> {
    const parseValue = (v?: string) => {
      if (!v) return undefined
      const num = Number(String(v).replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.'))
      return isNaN(num) ? undefined : num
    }
    const dto: UpdateContractDto = {
      contractType: updates.tipo,
      status: updates.status,
      talentName: updates.cliente,
      value: parseValue(updates.valor)
    }
    const { data } = await api.put(`/contracts/${id}`, dto)
    return toRecord(data as ContractDto)
  }

  static async remove(id: string): Promise<boolean> {
    await api.delete(`/contracts/${id}`)
    return true
  }

  static getContractTypeDisplayName(tipo: string): string {
    const types: Record<string, string> = {
      'super-fotos': 'Super Fotos',
      'agenciamento': 'Agenciamento',
      'super-fotos-menor': 'Super Fotos (Menor Idade)',
      'agenciamento-menor': 'Agenciamento (Menor Idade)',
      'comprometimento': 'Comprometimento'
    }
    return types[tipo] || tipo
  }
}
