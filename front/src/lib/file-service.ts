
import { FileData } from '@/types/talent'
import { getMockFiles, saveMockFiles } from './mock-database'

export const getTalentPhotos = async (talentId: string): Promise<FileData[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200)) // Simulate network delay
    const files = getMockFiles()
    const photos = files
      .filter(f => f.talentId === talentId && f.type === 'PHOTO')
      .map(f => ({
        ...f,
        uploadedAt: new Date(f.uploadedAt)
      }))
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    
    return photos
  } catch (error) {
    console.error('Error fetching talent photos:', error)
    return []
  }
}

export const getTalentFiles = async (talentId: string, type?: 'PHOTO' | 'DOCUMENT'): Promise<FileData[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200)) // Simulate network delay
    const files = getMockFiles()
    const filteredFiles = files
      .filter(f => f.talentId === talentId && (!type || f.type === type))
      .map(f => ({
        ...f,
        uploadedAt: new Date(f.uploadedAt)
      }))
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    
    return filteredFiles
  } catch (error) {
    console.error('Error fetching talent files:', error)
    return []
  }
}

export const uploadPhoto = async (talentId: string, file: File): Promise<FileData> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate upload delay
    
    // Create object URL for local display
    const fileUrl = URL.createObjectURL(file)
    
    const files = getMockFiles()
    const newFile: FileData = {
      id: `file_${Date.now()}`,
      url: fileUrl,
      type: 'PHOTO',
      talentId,
      projectId: null,
      uploadedAt: new Date(),
      fileName: file.name,
      mimeType: file.type
    }
    
    files.push(newFile)
    saveMockFiles(files)
    
    return newFile
  } catch (error) {
    console.error('Error uploading photo:', error)
    throw new Error('Failed to upload photo')
  }
}

export const uploadTalentFile = async (talentId: string, file: File, type: 'PHOTO' | 'DOCUMENT'): Promise<FileData> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate upload delay
    
    // Create object URL for local display
    const fileUrl = URL.createObjectURL(file)
    
    const files = getMockFiles()
    const newFile: FileData = {
      id: `file_${Date.now()}`,
      url: fileUrl,
      type,
      talentId,
      projectId: null,
      uploadedAt: new Date(),
      fileName: file.name,
      mimeType: file.type
    }
    
    files.push(newFile)
    saveMockFiles(files)
    
    return newFile
  } catch (error) {
    console.error('Error uploading file:', error)
    throw new Error('Failed to upload file')
  }
}

export const deletePhoto = async (fileId: string): Promise<boolean> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300)) // Simulate network delay
    const files = getMockFiles()
    const filteredFiles = files.filter(f => f.id !== fileId)
    saveMockFiles(filteredFiles)
    return true
  } catch (error) {
    console.error('Error deleting photo:', error)
    return false
  }
}

export const deleteTalentFile = async (fileId: string): Promise<boolean> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300)) // Simulate network delay
    const files = getMockFiles()
    const filteredFiles = files.filter(f => f.id !== fileId)
    saveMockFiles(filteredFiles)
    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}
