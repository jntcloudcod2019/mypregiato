
import { TalentData, ProducerData, CreateTalentData } from '@/types/talent'
import { 
  getMockTalents, 
  getMockProducers, 
  getMockDNA, 
  getMockFiles, 
  saveMockTalents, 
  saveMockDNA 
} from './mock-database'

export const getTalents = async (): Promise<TalentData[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
    const talents = getMockTalents()
    const producers = getMockProducers()
    const dnaData = getMockDNA()
    const files = getMockFiles()
    
    // Enrich talents with related data
    const enrichedTalents = talents.map(talent => ({
      ...talent,
      producer: producers.find(p => p.id === talent.producerId) || null,
      dna: dnaData.find(d => d.talentId === talent.id) || null,
      files: files.filter(f => f.talentId === talent.id),
      birthDate: talent.birthDate ? new Date(talent.birthDate) : null,
      inviteSentAt: talent.inviteSentAt ? new Date(talent.inviteSentAt) : null,
      updatedAt: new Date(talent.updatedAt),
      createdAt: new Date(talent.createdAt)
    }))
    
    return enrichedTalents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error('Error fetching talents:', error)
    throw new Error('Failed to fetch talents')
  }
}

export const getTalentById = async (id: string): Promise<TalentData | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300)) // Simulate network delay
    const talents = getMockTalents()
    const producers = getMockProducers()
    const dnaData = getMockDNA()
    const files = getMockFiles()
    
    const talent = talents.find(t => t.id === id)
    if (!talent) return null
    
    return {
      ...talent,
      producer: producers.find(p => p.id === talent.producerId) || null,
      dna: dnaData.find(d => d.talentId === talent.id) || null,
      files: files.filter(f => f.talentId === talent.id),
      birthDate: talent.birthDate ? new Date(talent.birthDate) : null,
      inviteSentAt: talent.inviteSentAt ? new Date(talent.inviteSentAt) : null,
      updatedAt: new Date(talent.updatedAt),
      createdAt: new Date(talent.createdAt)
    }
  } catch (error) {
    console.error('Error fetching talent:', error)
    throw new Error('Failed to fetch talent')
  }
}

export const createTalent = async (data: CreateTalentData): Promise<TalentData> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800)) // Simulate network delay
    const talents = getMockTalents()
    const producers = getMockProducers()
    
    const newTalent: TalentData = {
      id: `talent_${Date.now()}`,
      ...data,
      inviteSent: false,
      status: true,
      dnaStatus: 'UNDEFINED',
      inviteSentAt: null,
      inviteToken: null,
      clerkInviteId: null,
      updatedAt: new Date(),
      createdAt: new Date(),
      producer: producers.find(p => p.id === data.producerId) || null,
      dna: null,
      files: []
    }
    
    const updatedTalents = [newTalent, ...talents]
    saveMockTalents(updatedTalents)
    
    return newTalent
  } catch (error) {
    console.error('Error creating talent:', error)
    throw new Error('Failed to create talent')
  }
}

export const updateTalent = async (id: string, data: Partial<TalentData>): Promise<TalentData | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 600)) // Simulate network delay
    const talents = getMockTalents()
    const producers = getMockProducers()
    const dnaData = getMockDNA()
    const files = getMockFiles()
    
    const talentIndex = talents.findIndex(t => t.id === id)
    if (talentIndex === -1) return null
    
    const updatedTalent = {
      ...talents[talentIndex],
      ...data,
      updatedAt: new Date()
    }
    
    talents[talentIndex] = updatedTalent
    saveMockTalents(talents)
    
    return {
      ...updatedTalent,
      producer: producers.find(p => p.id === updatedTalent.producerId) || null,
      dna: dnaData.find(d => d.talentId === updatedTalent.id) || null,
      files: files.filter(f => f.talentId === updatedTalent.id),
      birthDate: updatedTalent.birthDate ? new Date(updatedTalent.birthDate) : null,
      inviteSentAt: updatedTalent.inviteSentAt ? new Date(updatedTalent.inviteSentAt) : null,
      updatedAt: new Date(updatedTalent.updatedAt),
      createdAt: new Date(updatedTalent.createdAt)
    }
  } catch (error) {
    console.error('Error updating talent:', error)
    throw new Error('Failed to update talent')
  }
}

export const checkTalentExists = async (email?: string, document?: string): Promise<boolean> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200)) // Simulate network delay
    const talents = getMockTalents()
    
    const existingTalent = talents.find(talent => 
      (email && talent.email === email) || 
      (document && talent.document === document)
    )
    
    return !!existingTalent
  } catch (error) {
    console.error('Error checking talent existence:', error)
    return false
  }
}

export const getProducers = async (): Promise<ProducerData[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300)) // Simulate network delay
    return getMockProducers()
  } catch (error) {
    console.error('Error fetching producers:', error)
    return []
  }
}
