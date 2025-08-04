import { prisma } from './prisma'
import { FileData } from '@/types/talent'
import sharp from 'sharp'

export async function uploadPhoto(
  file: File,
  talentId: string
): Promise<FileData> {
  try {
    // Converter file para buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Comprimir imagem usando sharp
    const compressedBuffer = await sharp(buffer)
      .resize(1200, 1200, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: 80,
        progressive: true 
      })
      .toBuffer()
    
    // Converter para base64
    const base64 = `data:${file.type};base64,${compressedBuffer.toString('base64')}`
    
    // Salvar no banco de dados
    const fileRecord = await prisma.file.create({
      data: {
        url: base64,
        type: 'PHOTO',
        talentId,
        fileName: file.name,
        mimeType: file.type,
        uploadedAt: new Date()
      }
    })
    
    return fileRecord as FileData
  } catch (error) {
    console.error('Erro ao fazer upload da foto:', error)
    throw new Error('Erro ao processar a imagem')
  }
}

export async function getTalentPhotos(talentId: string): Promise<FileData[]> {
  const files = await prisma.file.findMany({
    where: {
      talentId,
      type: 'PHOTO'
    },
    orderBy: {
      uploadedAt: 'desc'
    }
  })
  
  return files as FileData[]
}

export async function deletePhoto(fileId: string): Promise<void> {
  await prisma.file.delete({
    where: { id: fileId }
  })
}

export async function saveComposite(
  compositeData: string,
  talentId: string,
  fileName: string
): Promise<FileData> {
  const fileRecord = await prisma.file.create({
    data: {
      url: compositeData,
      type: 'COMPOSITE',
      talentId,
      fileName,
      mimeType: 'application/pdf',
      uploadedAt: new Date()
    }
  })
  
  return fileRecord as FileData
}