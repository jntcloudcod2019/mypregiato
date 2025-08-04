
// Mock file service for frontend-only environment
export interface FileData {
  id: string
  filename: string
  url: string
  talentId: string
  type: 'photo' | 'document'
  createdAt: Date
}

// Mock storage for files
const mockFiles: Record<string, FileData[]> = {
  '1': [
    {
      id: '1',
      filename: 'ana-clara-profile.jpg',
      url: '/src/assets/ana-clara-profile.jpg',
      talentId: '1',
      type: 'photo',
      createdAt: new Date()
    },
    {
      id: '2',
      filename: 'ana-clara-fashion1.jpg',
      url: '/src/assets/ana-clara-fashion1.jpg',
      talentId: '1',
      type: 'photo',
      createdAt: new Date()
    }
  ]
}

export const getTalentFiles = async (talentId: string, type?: 'photo' | 'document'): Promise<FileData[]> => {
  await new Promise(resolve => setTimeout(resolve, 200))
  
  const files = mockFiles[talentId] || []
  return type ? files.filter(f => f.type === type) : files
}

export const uploadTalentFile = async (
  talentId: string, 
  file: File, 
  type: 'photo' | 'document'
): Promise<FileData> => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // In a real implementation, this would upload to a file storage service
  const url = URL.createObjectURL(file)
  
  const newFile: FileData = {
    id: Date.now().toString(),
    filename: file.name,
    url,
    talentId,
    type,
    createdAt: new Date()
  }
  
  if (!mockFiles[talentId]) {
    mockFiles[talentId] = []
  }
  mockFiles[talentId].push(newFile)
  
  return newFile
}

export const deleteTalentFile = async (fileId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  for (const talentId in mockFiles) {
    const index = mockFiles[talentId].findIndex(f => f.id === fileId)
    if (index > -1) {
      const file = mockFiles[talentId][index]
      // Revoke the blob URL to free memory
      if (file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url)
      }
      mockFiles[talentId].splice(index, 1)
      return true
    }
  }
  
  return false
}
