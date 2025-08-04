
import { mockDb } from './mock-database'
import { FileData } from '@/types/talent'

export const getTalentPhotos = async (talentId: string): Promise<FileData[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200))
    return mockDb.getTalentFiles(talentId, 'PHOTO')
  } catch (error) {
    console.error('Error fetching talent photos:', error)
    return []
  }
}

export const getTalentFiles = async (talentId: string, type?: 'PHOTO' | 'DOCUMENT'): Promise<FileData[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200))
    return mockDb.getTalentFiles(talentId, type)
  } catch (error) {
    console.error('Error fetching talent files:', error)
    return []
  }
}

export const uploadPhoto = async (talentId: string, file: File): Promise<FileData> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800)) // Simulate upload time
    const url = URL.createObjectURL(file)
    
    return mockDb.createFile({
      url,
      type: 'PHOTO',
      talentId,
      fileName: file.name,
      mimeType: file.type
    })
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
    await new Promise(resolve => setTimeout(resolve, 800))
    const url = URL.createObjectURL(file)
    
    return mockDb.createFile({
      url,
      type,
      talentId,
      fileName: file.name,
      mimeType: file.type
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    throw new Error('Failed to upload file')
  }
}

export const deletePhoto = async (fileId: string): Promise<boolean> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockDb.deleteFile(fileId)
  } catch (error) {
    console.error('Error deleting photo:', error)
    return false
  }
}

export const deleteTalentFile = async (fileId: string): Promise<boolean> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockDb.deleteFile(fileId)
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}
