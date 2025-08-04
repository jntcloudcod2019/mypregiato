import { TalentData, TalentDNAData, FileData, ProducerData } from '@/types/talent'

// Mock User Interface
export interface MockUser {
  id: string
  first_name: string
  last_name: string
  email: string
  role: 'PRODUCER' | 'ADMIN' | 'USER'
  code: string
}

// Mock Users (including Producers)
export const mockUsers: MockUser[] = [
  {
    id: '1',
    first_name: 'Maria',
    last_name: 'Silva',
    email: 'maria.silva@pregiato.com',
    role: 'PRODUCER',
    code: 'PM-001'
  },
  {
    id: '2', 
    first_name: 'João',
    last_name: 'Santos',
    email: 'joao.santos@pregiato.com',
    role: 'PRODUCER',
    code: 'PM-002'
  },
  {
    id: '3',
    first_name: 'Ana',
    last_name: 'Costa',
    email: 'ana.costa@pregiato.com',
    role: 'PRODUCER',
    code: 'PM-003'
  }
]

// Mock Producers
export const mockProducers: ProducerData[] = [
  {
    id: '1',
    first_name: 'Maria',
    last_name: 'Silva',
    email: 'maria.silva@pregiato.com',
    code: 'PM-001'
  },
  {
    id: '2', 
    first_name: 'João',
    last_name: 'Santos',
    email: 'joao.santos@pregiato.com',
    code: 'PM-002'
  },
  {
    id: '3',
    first_name: 'Ana',
    last_name: 'Costa',
    email: 'ana.costa@pregiato.com', 
    code: 'PM-003'
  }
]

// Mock Files
export const mockFiles: FileData[] = [
  {
    id: 'f1',
    url: 'https://images.unsplash.com/photo-1494790108755-2616b89e0015?w=300&h=400&fit=crop',
    type: 'PHOTO',
    talentId: '1',
    projectId: null,
    uploadedAt: new Date('2024-01-15'),
    fileName: 'profile1.jpg',
    mimeType: 'image/jpeg'
  },
  {
    id: 'f2',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
    type: 'PHOTO',
    talentId: '2',
    projectId: null,
    uploadedAt: new Date('2024-01-16'),
    fileName: 'profile2.jpg',
    mimeType: 'image/jpeg'
  },
  {
    id: 'f3',
    url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop',
    type: 'PHOTO',
    talentId: '3',
    projectId: null,
    uploadedAt: new Date('2024-01-17'),
    fileName: 'profile3.jpg',
    mimeType: 'image/jpeg'
  }
]

// Mock DNA Data
export const mockDNAData: TalentDNAData[] = [
  {
    id: 'dna1',
    talentId: '1',
    height: '1.75',
    weight: '65',
    hairColor: 'Castanho',
    hairType: 'Ondulado',
    hairLength: 'Médio',
    eyeColor: 'Castanhos',
    skinTone: 'Morena',
    chestSize: '90',
    waistSize: '65',
    hipSize: '95',
    shoeSize: '38',
    dressSize: 'M',
    pantsSize: '40',
    shirtSize: 'M',
    jacketSize: 'M',
    faceShape: 'Oval',
    ethnicFeatures: 'Brasileira',
    bodyType: 'Atlético',
    specialFeatures: 'Tatuagem no braço',
    accent: 'Paulista',
    languages: 'Português, Inglês',
    intellectualDisability: null,
    physicalDisability: null,
    religion: 'Católica',
    travelAvailability: true,
    visualDisability: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'dna2',
    talentId: '2',
    height: '1.80',
    weight: '75',
    hairColor: 'Preto',
    hairType: 'Liso',
    hairLength: 'Curto',
    eyeColor: 'Pretos',
    skinTone: 'Moreno',
    chestSize: null,
    waistSize: '80',
    hipSize: null,
    shoeSize: '42',
    dressSize: null,
    pantsSize: '42',
    shirtSize: 'G',
    jacketSize: 'G',
    faceShape: 'Quadrado',
    ethnicFeatures: 'Afro-brasileiro',
    bodyType: 'Atlético',
    specialFeatures: null,
    accent: 'Carioca',
    languages: 'Português',
    intellectualDisability: null,
    physicalDisability: null,
    religion: null,
    travelAvailability: true,
    visualDisability: null,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  }
]

// Mock Talents
export const mockTalents: TalentData[] = [
  {
    id: '1',
    producerId: '1',
    fullName: 'Isabella Santos',
    email: 'isabella.santos@email.com',
    phone: '(11) 99999-1111',
    postalcode: '01310-100',
    street: 'Avenida Paulista',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    numberAddress: '1000',
    complement: 'Apto 101',
    uf: 'SP',
    document: '123.456.789-10',
    birthDate: new Date('1995-05-15'),
    age: 29,
    gender: 'Feminino',
    inviteSent: true,
    status: true,
    dnaStatus: 'COMPLETE',
    inviteSentAt: new Date('2024-01-15'),
    inviteToken: 'token123',
    clerkInviteId: 'clerk123',
    updatedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    producer: mockProducers[0],
    dna: mockDNAData[0],
    files: [mockFiles[0]]
  },
  {
    id: '2',
    producerId: '2',
    fullName: 'Carlos Oliveira',
    email: 'carlos.oliveira@email.com',
    phone: '(21) 99999-2222',
    postalcode: '22071-900',
    street: 'Avenida Atlântica',
    neighborhood: 'Copacabana',
    city: 'Rio de Janeiro',
    numberAddress: '2000',
    complement: null,
    uf: 'RJ',
    document: '987.654.321-10',
    birthDate: new Date('1992-08-20'),
    age: 32,
    gender: 'Masculino',
    inviteSent: true,
    status: true,
    dnaStatus: 'PARTIAL',
    inviteSentAt: new Date('2024-01-16'),
    inviteToken: 'token456',
    clerkInviteId: 'clerk456',
    updatedAt: new Date('2024-01-16'),
    createdAt: new Date('2024-01-16'),
    producer: mockProducers[1],
    dna: mockDNAData[1],
    files: [mockFiles[1]]
  },
  {
    id: '3',
    producerId: '3',
    fullName: 'Lucia Ferreira',
    email: 'lucia.ferreira@email.com',
    phone: '(31) 99999-3333',
    postalcode: '30112-000',
    street: 'Rua da Bahia',
    neighborhood: 'Centro',
    city: 'Belo Horizonte',
    numberAddress: '500',
    complement: 'Sala 12',
    uf: 'MG',
    document: '456.789.123-10',
    birthDate: new Date('1988-12-10'),
    age: 35,
    gender: 'Feminino',
    inviteSent: false,
    status: true,
    dnaStatus: 'UNDEFINED',
    inviteSentAt: null,
    inviteToken: null,
    clerkInviteId: null,
    updatedAt: new Date('2024-01-17'),
    createdAt: new Date('2024-01-17'),
    producer: mockProducers[2],
    dna: null,
    files: [mockFiles[2]]
  },
  {
    id: '4',
    producerId: '1',
    fullName: 'Ricardo Mendes',
    email: 'ricardo.mendes@email.com',
    phone: '(85) 99999-4444',
    postalcode: '60025-100',
    street: 'Rua Barão do Rio Branco',
    neighborhood: 'Centro',
    city: 'Fortaleza',
    numberAddress: '123',
    complement: null,
    uf: 'CE',
    document: '789.123.456-10',
    birthDate: new Date('1990-03-22'),
    age: 34,
    gender: 'Masculino',
    inviteSent: true,
    status: true,
    dnaStatus: 'UNDEFINED',
    inviteSentAt: new Date('2024-01-18'),
    inviteToken: 'token789',
    clerkInviteId: 'clerk789',
    updatedAt: new Date('2024-01-18'),
    createdAt: new Date('2024-01-18'),
    producer: mockProducers[0],
    dna: null,
    files: []
  },
  {
    id: '5',
    producerId: '2',
    fullName: 'Fernanda Lima',
    email: 'fernanda.lima@email.com',
    phone: '(47) 99999-5555',
    postalcode: '89010-100',
    street: 'Rua XV de Novembro',
    neighborhood: 'Centro',
    city: 'Blumenau',
    numberAddress: '789',
    complement: 'Casa',
    uf: 'SC',
    document: '159.753.486-10',
    birthDate: new Date('1993-07-08'),
    age: 31,
    gender: 'Feminino',
    inviteSent: false,
    status: false,
    dnaStatus: 'UNDEFINED',
    inviteSentAt: null,
    inviteToken: null,
    clerkInviteId: null,
    updatedAt: new Date('2024-01-19'),
    createdAt: new Date('2024-01-19'),
    producer: mockProducers[1],
    dna: null,
    files: []
  }
]

// Local Storage Keys
export const STORAGE_KEYS = {
  TALENTS: 'mockTalents',
  DNA: 'mockDNA',
  FILES: 'mockFiles',
  PRODUCERS: 'mockProducers',
  USERS: 'mockUsers'
}

// Initialize mock data in localStorage if not exists
export const initializeMockData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.TALENTS)) {
    localStorage.setItem(STORAGE_KEYS.TALENTS, JSON.stringify(mockTalents))
  }
  if (!localStorage.getItem(STORAGE_KEYS.DNA)) {
    localStorage.setItem(STORAGE_KEYS.DNA, JSON.stringify(mockDNAData))
  }
  if (!localStorage.getItem(STORAGE_KEYS.FILES)) {
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(mockFiles))
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCERS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCERS, JSON.stringify(mockProducers))
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers))
  }
}

// Helper functions to get data from localStorage
export const getMockTalents = (): TalentData[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TALENTS)
  return data ? JSON.parse(data) : mockTalents
}

export const getMockDNA = (): TalentDNAData[] => {
  const data = localStorage.getItem(STORAGE_KEYS.DNA)
  return data ? JSON.parse(data) : mockDNAData
}

export const getMockFiles = (): FileData[] => {
  const data = localStorage.getItem(STORAGE_KEYS.FILES)
  return data ? JSON.parse(data) : mockFiles
}

export const getMockProducers = (): ProducerData[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PRODUCERS)
  return data ? JSON.parse(data) : mockProducers
}

export const getMockUsers = (): MockUser[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS)
  return data ? JSON.parse(data) : mockUsers
}

// Helper functions to save data to localStorage
export const saveMockTalents = (talents: TalentData[]) => {
  localStorage.setItem(STORAGE_KEYS.TALENTS, JSON.stringify(talents))
}

export const saveMockDNA = (dna: TalentDNAData[]) => {
  localStorage.setItem(STORAGE_KEYS.DNA, JSON.stringify(dna))
}

export const saveMockFiles = (files: FileData[]) => {
  localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files))
}

// Initialize on module load
initializeMockData()
