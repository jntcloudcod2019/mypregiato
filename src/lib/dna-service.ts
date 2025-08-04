import { prisma } from './prisma'
import { TalentDNAData } from '@/types/talent'

export async function getTalentDNA(talentId: string): Promise<TalentDNAData | null> {
  const dna = await prisma.talentDNA.findUnique({
    where: { talentId }
  })
  
  return dna as TalentDNAData | null
}

export async function createOrUpdateTalentDNA(
  talentId: string,
  data: Partial<Omit<TalentDNAData, 'id' | 'talentId' | 'createdAt' | 'updatedAt'>>
): Promise<TalentDNAData> {
  // Upsert DNA
  const dna = await prisma.talentDNA.upsert({
    where: { talentId },
    update: {
      ...data,
      updatedAt: new Date()
    },
    create: {
      talentId,
      ...data,
      updatedAt: new Date()
    }
  })
  
  // Atualizar status do DNA no talento
  const dnaStatus = calculateDNAStatus(data)
  await prisma.talent.update({
    where: { id: talentId },
    data: {
      dnaStatus,
      updatedAt: new Date()
    }
  })
  
  return dna as TalentDNAData
}

function calculateDNAStatus(data: Partial<TalentDNAData>): 'UNDEFINED' | 'PARTIAL' | 'COMPLETE' {
  const requiredFields = [
    'height', 'weight', 'hairColor', 'hairType', 'eyeColor', 
    'skinTone', 'bodyType', 'chestSize', 'waistSize', 'hipSize'
  ]
  
  const filledFields = requiredFields.filter(field => data[field as keyof typeof data])
  
  if (filledFields.length === 0) return 'UNDEFINED'
  if (filledFields.length === requiredFields.length) return 'COMPLETE'
  return 'PARTIAL'
}

export async function deleteTalentDNA(talentId: string): Promise<void> {
  await prisma.talentDNA.delete({
    where: { talentId }
  })
  
  // Atualizar status do DNA no talento
  await prisma.talent.update({
    where: { id: talentId },
    data: {
      dnaStatus: 'UNDEFINED',
      updatedAt: new Date()
    }
  })
}