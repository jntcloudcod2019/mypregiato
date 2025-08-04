
import { TalentData, ProducerData } from '@/types/talent'

// Mock data for development - replace with actual API calls
const mockTalents: TalentData[] = [
  {
    id: '1',
    fullName: 'Ana Clara Santos',
    email: 'ana.clara@email.com',
    phone: '(11) 99999-9999',
    document: '123.456.789-00',
    birthDate: new Date('1995-06-15'),
    age: 28,
    gender: 'feminino',
    postalcode: '01310-100',
    street: 'Av. Paulista',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    uf: 'SP',
    numberAddress: '1578',
    complement: 'Conjunto 1405',
    producerId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const mockProducers: ProducerData[] = [
  {
    id: '1',
    first_name: 'João',
    last_name: 'Silva',
    code: 'PM-001',
    email: 'joao@pregiato.com'
  },
  {
    id: '2',
    first_name: 'Maria',
    last_name: 'Santos',
    code: 'PM-002',
    email: 'maria@pregiato.com'
  }
]

export const getTalents = async (): Promise<TalentData[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  return mockTalents
}

export const getTalentById = async (id: string): Promise<TalentData | null> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockTalents.find(t => t.id === id) || null
}

export const createTalent = async (data: Omit<TalentData, 'id' | 'createdAt' | 'updatedAt'>): Promise<TalentData> => {
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const newTalent: TalentData = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  mockTalents.push(newTalent)
  return newTalent
}

export const updateTalent = async (id: string, data: Partial<TalentData>): Promise<TalentData | null> => {
  await new Promise(resolve => setTimeout(resolve, 600))
  
  const index = mockTalents.findIndex(t => t.id === id)
  if (index === -1) return null
  
  mockTalents[index] = {
    ...mockTalents[index],
    ...data,
    updatedAt: new Date()
  }
  
  return mockTalents[index]
}

export const checkTalentExists = async (email?: string, document?: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  return mockTalents.some(t => 
    (email && t.email === email) || 
    (document && t.document === document)
  )
}

export const getProducers = async (): Promise<ProducerData[]> => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockProducers
}
