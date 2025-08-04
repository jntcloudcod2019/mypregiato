
import { ProducerData } from '@/types/talent'

// Mock producers data
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
  },
  {
    id: '3',
    first_name: 'Pedro',
    last_name: 'Oliveira',
    code: 'PM-003',
    email: 'pedro@pregiato.com'
  }
]

export const getProducers = async (): Promise<ProducerData[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockProducers
}

export const getProducerById = async (id: string): Promise<ProducerData | null> => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockProducers.find(p => p.id === id) || null
}
