
import { mockDb } from './mock-database'
import { TalentDNAData } from '@/types/talent'

export const getTalentDNA = async (talentId: string): Promise<TalentDNAData | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200))
    return mockDb.getTalentDNA(talentId)
  } catch (error) {
    console.error('Error fetching talent DNA:', error)
    return null
  }
}

export const createOrUpdateTalentDNA = async (talentId: string, data: Partial<TalentDNAData>): Promise<TalentDNAData> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 400))
    return mockDb.createOrUpdateTalentDNA(talentId, data)
  } catch (error) {
    console.error('Error updating talent DNA:', error)
    throw new Error('Failed to update DNA')
  }
}
