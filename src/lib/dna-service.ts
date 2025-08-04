
import { prisma } from './prisma'
import { TalentDNAData } from '@/types/talent'

export const getTalentDNA = async (talentId: string): Promise<TalentDNAData | null> => {
  try {
    const dna = await prisma.talentDNA.findUnique({
      where: { talentId }
    })
    
    return dna
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
        updatedAt: new Date()
      },
      create: {
        talentId,
        ...data
      }
    })

    // Update talent DNA status based on completeness
    const isComplete = checkDNACompleteness(dna)
    const dnaStatus = isComplete ? 'COMPLETE' : 'PARTIAL'
    
    await prisma.talent.update({
      where: { id: talentId },
      data: { dnaStatus }
    })

    return dna
  } catch (error) {
    console.error('Error updating talent DNA:', error)
    throw new Error('Failed to update DNA')
  }
}

function checkDNACompleteness(dna: any): boolean {
  const requiredFields = ['height', 'weight', 'hairColor', 'eyeColor', 'skinTone', 'shoeSize']
  return requiredFields.every(field => dna[field] && dna[field].trim() !== '')
}
