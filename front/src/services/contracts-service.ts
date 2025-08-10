
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

const CONTRACTS_STORAGE_KEY = 'pregiato_contratos'

export class ContractsService {
  static getAll(): ContractRecord[] {
    try {
      const stored = localStorage.getItem(CONTRACTS_STORAGE_KEY)
      if (!stored) return []
      
      const contracts = JSON.parse(stored) as ContractRecord[]
      // Ordenar por data de criação, mais recente primeiro
      return contracts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error('Erro ao carregar contratos:', error)
      return []
    }
  }

  static save(contract: Omit<ContractRecord, 'id' | 'createdAt' | 'updatedAt'>): ContractRecord {
    try {
      const contracts = this.getAll()
      const now = new Date().toISOString()
      
      const newContract: ContractRecord = {
        ...contract,
        id: `contract_${Date.now()}`,
        createdAt: now,
        updatedAt: now
      }

      contracts.unshift(newContract) // Adicionar no início da lista
      localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts))
      
      console.log('[CONTRACTS_SERVICE] Contrato salvo:', newContract)
      return newContract
    } catch (error) {
      console.error('Erro ao salvar contrato:', error)
      throw error
    }
  }

  static update(id: string, updates: Partial<ContractRecord>): ContractRecord | null {
    try {
      const contracts = this.getAll()
      const index = contracts.findIndex(c => c.id === id)
      
      if (index === -1) return null
      
      const updatedContract = {
        ...contracts[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      contracts[index] = updatedContract
      localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts))
      
      return updatedContract
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error)
      return null
    }
  }

  static delete(id: string): boolean {
    try {
      const contracts = this.getAll()
      const filtered = contracts.filter(c => c.id !== id)
      localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('Erro ao excluir contrato:', error)
      return false
    }
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
