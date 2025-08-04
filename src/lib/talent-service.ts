import { prisma } from './prisma'
import { CreateTalentData, TalentData } from '@/types/talent'
import { differenceInYears } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

export async function getAllTalents(
  page: number = 1,
  limit: number = 12,
  search?: string,
  filters?: {
    gender?: string
    bodyType?: string
    ageMin?: number
    ageMax?: number
    city?: string
    travelAvailability?: boolean
  }
): Promise<{ talents: TalentData[], total: number, totalPages: number }> {
  const skip = (page - 1) * limit

  const where: any = {
    status: true,
  }

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (filters) {
    if (filters.gender) {
      where.gender = filters.gender
    }
    if (filters.ageMin || filters.ageMax) {
      where.age = {}
      if (filters.ageMin) where.age.gte = filters.ageMin
      if (filters.ageMax) where.age.lte = filters.ageMax
    }
    if (filters.city) {
      where.city = filters.city
    }
    if (filters.bodyType) {
      where.dna = {
        bodyType: filters.bodyType
      }
    }
    if (filters.travelAvailability !== undefined) {
      where.dna = {
        ...where.dna,
        travelAvailability: filters.travelAvailability
      }
    }
  }

  const [talents, total] = await Promise.all([
    prisma.talent.findMany({
      where,
      skip,
      take: limit,
      include: {
        producer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          }
        },
        dna: true,
        files: {
          where: { type: 'PHOTO' },
          take: 1,
          orderBy: { uploadedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.talent.count({ where })
  ])

  return {
    talents: talents as TalentData[],
    total,
    totalPages: Math.ceil(total / limit)
  }
}

export async function getTalentById(id: string): Promise<TalentData | null> {
  const talent = await prisma.talent.findUnique({
    where: { id },
    include: {
      producer: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        }
      },
      dna: true,
      files: {
        where: { type: 'PHOTO' },
        orderBy: { uploadedAt: 'desc' }
      }
    }
  })

  return talent as TalentData | null
}

export async function createTalent(data: CreateTalentData): Promise<TalentData> {
  // Verificar duplicatas
  if (data.email) {
    const existingByEmail = await prisma.talent.findUnique({
      where: { email: data.email }
    })
    if (existingByEmail) {
      throw new Error('Já existe um talento com este email')
    }
  }

  if (data.document) {
    const existingByDocument = await prisma.talent.findUnique({
      where: { document: data.document }
    })
    if (existingByDocument) {
      throw new Error('Já existe um talento com este documento')
    }
  }

  // Calcular idade se birthDate foi fornecida
  let age = data.age
  if (data.birthDate) {
    age = differenceInYears(new Date(), data.birthDate)
  }

  // Criar talento e usuário em transação
  const result = await prisma.$transaction(async (tx) => {
    // Criar talento
    const talent = await tx.talent.create({
      data: {
        ...data,
        age,
        updatedAt: new Date()
      }
    })

    // Criar usuário correspondente
    if (data.email && data.fullName) {
      const nameParts = data.fullName.split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || '-'

      await tx.user.create({
        data: {
          id: uuidv4(),
          clerk_id: `temp_${talent.id}`, // Será atualizado quando o usuário aceitar o convite
          email: data.email,
          first_name: firstName,
          last_name: lastName,
          role: 'TALENT',
          updatedAt: new Date()
        }
      })
    }

    return talent
  })

  // Buscar o talento criado com todas as relações
  const talentWithRelations = await getTalentById(result.id)
  return talentWithRelations!
}

export async function updateTalent(id: string, data: Partial<CreateTalentData>): Promise<TalentData> {
  // Calcular idade se birthDate foi atualizada
  let updateData = { ...data }
  if (data.birthDate) {
    updateData.age = differenceInYears(new Date(), data.birthDate)
  }

  const talent = await prisma.talent.update({
    where: { id },
    data: {
      ...updateData,
      updatedAt: new Date()
    }
  })

  const talentWithRelations = await getTalentById(id)
  return talentWithRelations!
}

export async function deleteTalent(id: string): Promise<void> {
  await prisma.talent.update({
    where: { id },
    data: { status: false, updatedAt: new Date() }
  })
}

export async function checkTalentExists(email?: string, document?: string): Promise<boolean> {
  if (!email && !document) return false

  const where: any = { OR: [] }
  if (email) where.OR.push({ email })
  if (document) where.OR.push({ document })

  const existing = await prisma.talent.findFirst({ where })
  return !!existing
}