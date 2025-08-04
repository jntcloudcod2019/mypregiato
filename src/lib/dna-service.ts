
import { prisma } from './prisma'
import { TalentDNAData } from '@/types/talent'

export const getTalentDNA = async (talentId: string): Promise<TalentDNAData | null> => {
  try {
    const dna = await prisma.talentDNA.findUnique({
      where: { talentId }
    })
    return dna as TalentDNAData | null
  } catch (error) {
    console.error('Error fetching talent DNA:', error)
    return null
  }
}

export const createOrUpdateTalentDNA = async (talentId: string, data: Partial<TalentDNAData>): Promise<TalentDNAData> => {
  try {
    const dna = await prisma.talentDNA.upsert({
      where: { talentId },
      update: {
        ...data,
        travelAvailability: data.travelAvailability ?? false
      },
      create: {
        talentId,
        ...data,
        travelAvailability: data.travelAvailability ?? false
      }
    })
    
    // Update talent DNA status
    await prisma.talent.update({
      where: { id: talentId },
      data: { dnaStatus: 'PARTIAL' }
    })
    
    return dna as TalentDNAData
  } catch (error) {
    console.error('Error updating talent DNA:', error)
    throw new Error('Failed to update DNA')
  }
}
