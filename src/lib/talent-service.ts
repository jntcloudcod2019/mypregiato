
import { mockDb } from './mock-database'
import { TalentData, ProducerData, CreateTalentData } from '@/types/talent'

export const getTalents = async (): Promise<TalentData[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300)) // Simulate API delay
    return mockDb.getTalents()
  } catch (error) {
    console.error('Error fetching talents:', error)
    throw new Error('Failed to fetch talents')
  }
}

export const getTalentById = async (id: string): Promise<TalentData | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200))
    return mockDb.getTalentById(id)
  } catch (error) {
    console.error('Error fetching talent:', error)
    throw new Error('Failed to fetch talent')
  }
}

export const createTalent = async (data: CreateTalentData): Promise<TalentData> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockDb.createTalent(data)
  } catch (error) {
    console.error('Error creating talent:', error)
    throw new Error('Failed to create talent')
  }
}

export const updateTalent = async (id: string, data: Partial<TalentData>): Promise<TalentData | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 400))
    return mockDb.updateTalent(id, data)
  } catch (error) {
    console.error('Error updating talent:', error)
    throw new Error('Failed to update talent')
  }
}

export const checkTalentExists = async (email?: string, document?: string): Promise<boolean> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200))
    return mockDb.checkTalentExists(email, document)
  } catch (error) {
    console.error('Error checking talent existence:', error)
    return false
  }
}

export const getProducers = async (): Promise<ProducerData[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    // Mock producers data
    return [
      {
        id: 'prod_1',
        first_name: 'João',
        last_name: 'Santos',
        email: 'joao@pregiato.com',
        code: 'PM-001'
      },
      {
        id: 'prod_2',
        first_name: 'Maria',
        last_name: 'Oliveira',
        email: 'maria@pregiato.com',
        code: 'PM-002'
      },
      {
        id: 'prod_3',
        first_name: 'Pedro',
        last_name: 'Silva',
        email: 'pedro@pregiato.com',
        code: 'PM-003'
      }
    ]
  } catch (error) {
    console.error('Error fetching producers:', error)
    return []
  }
}
