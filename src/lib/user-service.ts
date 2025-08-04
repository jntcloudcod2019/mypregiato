import { prisma } from './prisma'
import { ProducerData } from '@/types/talent'

export async function getProducers(): Promise<ProducerData[]> {
  const producers = await prisma.user.findMany({
    where: {
      role: 'PRODUCER'
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
    },
    orderBy: [
      { first_name: 'asc' },
      { last_name: 'asc' }
    ]
  })

  // Gerar códigos únicos para cada produtor
  return producers.map(producer => ({
    ...producer,
    code: `PM-${Math.floor(1000 + Math.random() * 9000)}`
  }))
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id }
  })
}

export async function createUser(data: {
  clerk_id: string
  email: string
  first_name: string
  last_name: string
  image_url?: string
  role?: 'ADMIN' | 'PRODUCER' | 'BOOKER' | 'ASSISTANT' | 'TALENT'
}) {
  return await prisma.user.create({
    data: {
      ...data,
      updatedAt: new Date()
    }
  })
}

export async function updateUser(id: string, data: Partial<{
  clerk_id: string
  email: string
  first_name: string
  last_name: string
  image_url: string
  role: 'ADMIN' | 'PRODUCER' | 'BOOKER' | 'ASSISTANT' | 'TALENT'
}>) {
  return await prisma.user.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
    }
  })
}