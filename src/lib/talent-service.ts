
import { prisma } from './prisma'
import { TalentData, ProducerData, CreateTalentData } from '@/types/talent'

export const getTalents = async (): Promise<TalentData[]> => {
  try {
    const talents = await prisma.talent.findMany({
      include: {
        producer: true,
        dna: true,
        files: {
          where: {
            type: 'PHOTO'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return talents.map(talent => ({
      ...talent,
      producer: talent.producer ? {
        id: talent.producer.id,
        first_name: talent.producer.first_name,
        last_name: talent.producer.last_name,
        email: talent.producer.email
      } : null
    }))
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
        producer: true,
        dna: true,
        files: {
          where: {
            type: 'PHOTO'
          }
        }
      }
    })

    if (!talent) return null

    return {
      ...talent,
      producer: talent.producer ? {
        id: talent.producer.id,
        first_name: talent.producer.first_name,
        last_name: talent.producer.last_name,
        email: talent.producer.email
      } : null
    }
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
        producer: true,
        dna: true,
        files: {
          where: {
            type: 'PHOTO'
          }
        }
      }
    })

    return {
      ...talent,
      producer: talent.producer ? {
        id: talent.producer.id,
        first_name: talent.producer.first_name,
        last_name: talent.producer.last_name,
        email: talent.producer.email
      } : null
    }
  } catch (error) {
    console.error('Error creating talent:', error)
    throw new Error('Failed to create talent')
  }
}

export const updateTalent = async (id: string, data: Partial<TalentData>): Promise<TalentData | null> => {
  try {
    const talent = await prisma.talent.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        producer: true,
        dna: true,
        files: {
          where: {
            type: 'PHOTO'
          }
        }
      }
    })

    return {
      ...talent,
      producer: talent.producer ? {
        id: talent.producer.id,
        first_name: talent.producer.first_name,
        last_name: talent.producer.last_name,
        email: talent.producer.email
      } : null
    }
  } catch (error) {
    console.error('Error updating talent:', error)
    throw new Error('Failed to update talent')
  }
}

export const checkTalentExists = async (email?: string, document?: string): Promise<boolean> => {
  try {
    const existing = await prisma.talent.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(document ? [{ document }] : [])
        ]
      }
    })
    
    return !!existing
  } catch (error) {
    console.error('Error checking talent existence:', error)
    return false
  }
}

export const getProducers = async (): Promise<ProducerData[]> => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['PRODUCER', 'ADMIN']
        }
      }
    })

    return users.map(user => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      code: `PM-${user.id.slice(-3)}`
    }))
  } catch (error) {
    console.error('Error fetching producers:', error)
    return []
  }
}
