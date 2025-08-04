
import { prisma } from './prisma'
import { TalentData, ProducerData, CreateTalentData } from '@/types/talent'

export const getTalents = async (): Promise<TalentData[]> => {
  try {
    const talents = await prisma.talent.findMany({
      include: {
        producer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        dna: true,
        files: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return talents as TalentData[]
  } catch (error) {
    console.error('Error fetching talents:', error)
    throw new Error('Failed to fetch talents')
  }
}

export const getTalentById = async (id: string): Promise<TalentData | null> => {
  try {
    const talent = await prisma.talent.findUnique({
      where: { id },
      include: {
        producer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        dna: true,
        files: true
      }
    })
    return talent as TalentData | null
  } catch (error) {
    console.error('Error fetching talent:', error)
    throw new Error('Failed to fetch talent')
  }
}

export const createTalent = async (data: CreateTalentData): Promise<TalentData> => {
  try {
    const talent = await prisma.talent.create({
      data: {
        ...data,
        inviteSent: false,
        status: true,
        dnaStatus: 'UNDEFINED'
      },
      include: {
        producer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        dna: true,
        files: true
      }
    })
    return talent as TalentData
  } catch (error) {
    console.error('Error creating talent:', error)
    throw new Error('Failed to create talent')
  }
}

export const updateTalent = async (id: string, data: Partial<TalentData>): Promise<TalentData | null> => {
  try {
    const talent = await prisma.talent.update({
      where: { id },
      data,
      include: {
        producer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        dna: true,
        files: true
      }
    })
    return talent as TalentData
  } catch (error) {
    console.error('Error updating talent:', error)
    throw new Error('Failed to update talent')
  }
}

export const checkTalentExists = async (email?: string, document?: string): Promise<boolean> => {
  try {
    const existingTalent = await prisma.talent.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          document ? { document } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    })
    return !!existingTalent
  } catch (error) {
    console.error('Error checking talent existence:', error)
    return false
  }
}

export const getProducers = async (): Promise<ProducerData[]> => {
  try {
    const producers = await prisma.user.findMany({
      where: {
        role: {
          in: ['PRODUCER', 'ADMIN']
        }
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        clerk_id: true
      }
    })
    
    return producers.map(producer => ({
      ...producer,
      code: `PM-${producer.id.slice(-3).toUpperCase()}`
    })) as ProducerData[]
  } catch (error) {
    console.error('Error fetching producers:', error)
    return []
  }
}
