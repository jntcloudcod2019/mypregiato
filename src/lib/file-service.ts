
import { prisma } from './prisma'
import { FileData } from '@/types/talent'

export const getTalentPhotos = async (talentId: string): Promise<FileData[]> => {
  try {
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
  } catch (error) {
    console.error('Error fetching talent photos:', error)
    return []
  }
}

export const getTalentFiles = async (talentId: string, type?: 'PHOTO' | 'DOCUMENT'): Promise<FileData[]> => {
  try {
    const files = await prisma.file.findMany({
      where: {
        talentId,
        ...(type && { type })
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })
    return files as FileData[]
  } catch (error) {
    console.error('Error fetching talent files:', error)
    return []
  }
}

export const uploadPhoto = async (talentId: string, file: File): Promise<FileData> => {
  try {
    // TODO: Implement real file upload to cloud storage (AWS S3, Cloudinary, etc.)
    // For now, using object URL for local development
    const url = URL.createObjectURL(file)
    
    const uploadedFile = await prisma.file.create({
      data: {
        url,
        type: 'PHOTO',
        talentId,
        fileName: file.name,
        mimeType: file.type
      }
    })
    
    return uploadedFile as FileData
  } catch (error) {
    console.error('Error uploading photo:', error)
    throw new Error('Failed to upload photo')
  }
}

export const uploadTalentFile = async (
  talentId: string, 
  file: File, 
  type: 'PHOTO' | 'DOCUMENT'
): Promise<FileData> => {
  try {
    // TODO: Implement real file upload to cloud storage
    const url = URL.createObjectURL(file)
    
    const uploadedFile = await prisma.file.create({
      data: {
        url,
        type,
        talentId,
        fileName: file.name,
        mimeType: file.type
      }
    })
    
    return uploadedFile as FileData
  } catch (error) {
    console.error('Error uploading file:', error)
    throw new Error('Failed to upload file')
  }
}

export const deletePhoto = async (fileId: string): Promise<boolean> => {
  try {
    await prisma.file.delete({
      where: { id: fileId }
    })
    return true
  } catch (error) {
    console.error('Error deleting photo:', error)
    return false
  }
}

export const deleteTalentFile = async (fileId: string): Promise<boolean> => {
  try {
    await prisma.file.delete({
      where: { id: fileId }
    })
    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}
