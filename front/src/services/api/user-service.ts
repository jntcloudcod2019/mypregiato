import { get } from '@/services/api/api'
import { ProducerData } from '@/types/talent'

// Interface para dados normalizados de usuário (agora sempre em maiúsculo)
interface UserDto {
  Id: string;
  ClerkId: string;
  Email: string;
  FirstName: string;
  LastName: string;
  Role: string;
  CreatedAt: string | Date;
  UpdatedAt: string | Date;
}

export const getProducers = async (): Promise<ProducerData[]> => {
  try {
    const data = await get<UserDto[]>('/users/producers')
    
    return data.map(user => ({
      id: user.Id,
      first_name: user.FirstName,
      last_name: user.LastName,
      email: user.Email,
      code: user.Id ? user.Id.substring(0, 8).toUpperCase() : 'N/A'
    })).filter(producer => producer.id && producer.first_name)
  } catch (error) {
    console.error('Error fetching producers:', error)
    return []
  }
}

export const getProducerById = async (id: string): Promise<ProducerData | null> => {
  try {
    const producers = await getProducers()
    return producers.find(p => p.id === id) || null
  } catch (error) {
    console.error('Error fetching producer by id:', error)
    return null
  }
}
