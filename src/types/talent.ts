export interface TalentData {
  id: string
  producerId?: string | null
  fullName: string
  email?: string | null
  phone?: string | null
  postalcode?: string | null
  street?: string | null
  neighborhood?: string | null
  city?: string | null
  numberAddress?: string | null
  complement?: string | null
  uf?: string | null
  document?: string | null
  birthDate?: Date | null
  age: number
  gender?: string | null
  inviteSent: boolean
  status: boolean
  dnaStatus: 'UNDEFINED' | 'COMPLETE' | 'PARTIAL'
  inviteSentAt?: Date | null
  inviteToken?: string | null
  clerkInviteId?: string | null
  updatedAt: Date
  createdAt: Date
  producer?: {
    id: string
    first_name: string
    last_name: string
    email: string
  } | null
  dna?: TalentDNAData | null
  files?: FileData[]
}

export interface TalentDNAData {
  id: string
  talentId: string
  height?: string | null
  weight?: string | null
  hairColor?: string | null
  hairType?: string | null
  hairLength?: string | null
  eyeColor?: string | null
  skinTone?: string | null
  chestSize?: string | null
  waistSize?: string | null
  hipSize?: string | null
  shoeSize?: string | null
  dressSize?: string | null
  pantsSize?: string | null
  shirtSize?: string | null
  jacketSize?: string | null
  faceShape?: string | null
  ethnicFeatures?: string | null
  bodyType?: string | null
  specialFeatures?: string | null
  accent?: string | null
  languages?: string | null
  intellectualDisability?: string | null
  physicalDisability?: string | null
  religion?: string | null
  travelAvailability: boolean
  visualDisability?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface FileData {
  id: string
  url: string
  type: 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'COMPOSITE'
  talentId?: string | null
  projectId?: string | null
  uploadedAt: Date
  fileName?: string | null
  mimeType?: string | null
}

export interface ProducerData {
  id: string
  first_name: string
  last_name: string
  email: string
  code: string
}

export interface CreateTalentData {
  producerId?: string
  fullName: string
  email?: string
  phone?: string
  postalcode?: string
  street?: string
  neighborhood?: string
  city?: string
  numberAddress?: string
  complement?: string
  uf?: string
  document?: string
  birthDate?: Date
  age: number
  gender?: string
}