
import { get } from '../services/api/api'

export interface UserDto {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export const getProducers = async (): Promise<UserDto[]> => {
  try {
    const users = await get<UserDto[]>('/users/producers')
    return users
  } catch (error) {
    console.error('Error fetching producers:', error)
    throw new Error('Failed to fetch producers')
  }
}

export const getProducerById = async (id: string): Promise<UserDto | null> => {
  await new Promise(resolve => setTimeout(resolve, 200))
  const producers = await getProducers()
  return producers.find(p => p.id === id) || null
}
