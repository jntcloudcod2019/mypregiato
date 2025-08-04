
import { TalentDNAData } from '@/types/talent'

// Mock DNA data storage
const mockDNAData: Record<string, TalentDNAData> = {
  '1': {
    id: '1',
    talentId: '1',
    height: '170',
    weight: '65',
    eyeColor: 'Castanhos',
    hairColor: 'Castanho',
    skinTone: 'Morena',
    shirtSize: 'M',
    pantsSize: '40',
    shoeSize: '37',
    faceShape: 'Oval',
    travelAvailability: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export const getTalentDNA = async (talentId: string): Promise<TalentDNAData | null> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockDNAData[talentId] || null
}

export const createOrUpdateTalentDNA = async (talentId: string, data: Partial<TalentDNAData>): Promise<TalentDNAData> => {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const existingDNA = mockDNAData[talentId]
  
  const updatedDNA: TalentDNAData = {
    id: existingDNA?.id || Date.now().toString(),
    talentId,
    ...existingDNA,
    ...data,
    createdAt: existingDNA?.createdAt || new Date(),
    updatedAt: new Date()
  }
  
  mockDNAData[talentId] = updatedDNA
  return updatedDNA
}
