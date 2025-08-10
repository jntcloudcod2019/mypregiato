
import { ProducerData } from '@/types/talent'
import { getMockUsers } from './mock-database'

export const getProducers = async (): Promise<ProducerData[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const users = getMockUsers()
  const producers = users
    .filter(user => user.role === 'PRODUCER')
    .map(user => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      code: user.code
    }))
  
  return producers
}

export const getProducerById = async (id: string): Promise<ProducerData | null> => {
  await new Promise(resolve => setTimeout(resolve, 200))
  const producers = await getProducers()
  return producers.find(p => p.id === id) || null
}
