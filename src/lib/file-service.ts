
import { prisma } from './prisma'
import { FileData } from '@/types/talent'

export const getTalentPhotos = async (talentId: string): Promise<FileData[]> => {
  try {
    const photos = await prisma.file.findMany({
      where: {
        talentId,
        type: 'PHOTO'
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })
    
    return photos.map(photo => ({
      ...photo,
      type: photo.type as 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'COMPOSITE'
    }))
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
    
    return files.map(file => ({
      ...file,
      type: file.type as 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'COMPOSITE'
    }))
  } catch (error) {
    console.error('Error fetching talent files:', error)
    return []
  }
}

export const uploadPhoto = async (talentId: string, file: File): Promise<FileData> => {
  try {
    // In a real app, you would upload to cloud storage first
    // For now, we'll create a placeholder URL
    const url = URL.createObjectURL(file)
    
    const newFile = await prisma.file.create({
      data: {
        url,
        type: 'PHOTO',
        talentId,
        fileName: file.name,
        mimeType: file.type
      }
    })
    
    return {
      ...newFile,
      type: newFile.type as 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'COMPOSITE'
    }
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
    const url = URL.createObjectURL(file)
    
    const newFile = await prisma.file.create({
      data: {
        url,
        type,
        talentId,
        fileName: file.name,
        mimeType: file.type
      }
    })
    
    return {
      ...newFile,
      type: newFile.type as 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'COMPOSITE'
    }
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
