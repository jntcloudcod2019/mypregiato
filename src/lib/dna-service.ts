
import { TalentDNAData } from '@/types/talent'
import { getMockDNA, getMockTalents, saveMockDNA, saveMockTalents } from './mock-database'

export const getTalentDNA = async (talentId: string): Promise<TalentDNAData | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300)) // Simulate network delay
    const dnaData = getMockDNA()
    const dna = dnaData.find(d => d.talentId === talentId)
    
    return dna ? {
      ...dna,
      createdAt: new Date(dna.createdAt),
      updatedAt: new Date(dna.updatedAt)
    } : null
  } catch (error) {
    console.error('Error fetching talent DNA:', error)
    return null
  }
}

export const createOrUpdateTalentDNA = async (talentId: string, data: Partial<TalentDNAData>): Promise<TalentDNAData> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 600)) // Simulate network delay
    const dnaData = getMockDNA()
    const talents = getMockTalents()
    
    const existingIndex = dnaData.findIndex(d => d.talentId === talentId)
    
    let updatedDNA: TalentDNAData
    
    if (existingIndex >= 0) {
      // Update existing DNA
      updatedDNA = {
        ...dnaData[existingIndex],
        ...data,
        travelAvailability: data.travelAvailability ?? false,
        updatedAt: new Date()
      }
      dnaData[existingIndex] = updatedDNA
    } else {
      // Create new DNA
      updatedDNA = {
        id: `dna_${Date.now()}`,
        talentId,
        ...data,
        travelAvailability: data.travelAvailability ?? false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      dnaData.push(updatedDNA)
    }
    
    // Update talent DNA status
    const talentIndex = talents.findIndex(t => t.id === talentId)
    if (talentIndex >= 0) {
      talents[talentIndex] = {
        ...talents[talentIndex],
        dnaStatus: 'PARTIAL',
        updatedAt: new Date()
      }
      saveMockTalents(talents)
    }
    
    saveMockDNA(dnaData)
    return updatedDNA
  } catch (error) {
    console.error('Error updating talent DNA:', error)
    throw new Error('Failed to update DNA')
  }
}
