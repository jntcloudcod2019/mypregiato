
import { TalentData, TalentDNAData, FileData, ProducerData } from '@/types/talent'

// Mock database using localStorage
class MockDatabase {
  private getFromStorage<T>(key: string): T[] {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data))
  }

  // Talent operations
  getTalents(): TalentData[] {
    return this.getFromStorage<TalentData>('talents')
  }

  getTalentById(id: string): TalentData | null {
    const talents = this.getTalents()
    return talents.find(t => t.id === id) || null
  }

  createTalent(data: Omit<TalentData, 'id' | 'createdAt' | 'updatedAt'>): TalentData {
    const talents = this.getTalents()
    const newTalent: TalentData = {
      ...data,
      id: `talent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    talents.push(newTalent)
    this.saveToStorage('talents', talents)
    return newTalent
  }

  updateTalent(id: string, updates: Partial<TalentData>): TalentData | null {
    const talents = this.getTalents()
    const index = talents.findIndex(t => t.id === id)
    if (index === -1) return null

    talents[index] = { ...talents[index], ...updates, updatedAt: new Date() }
    this.saveToStorage('talents', talents)
    return talents[index]
  }

  // DNA operations
  getTalentDNA(talentId: string): TalentDNAData | null {
    const dnaRecords = this.getFromStorage<TalentDNAData>('talent_dna')
    return dnaRecords.find(dna => dna.talentId === talentId) || null
  }

  createOrUpdateTalentDNA(talentId: string, data: Partial<TalentDNAData>): TalentDNAData {
    const dnaRecords = this.getFromStorage<TalentDNAData>('talent_dna')
    const existingIndex = dnaRecords.findIndex(dna => dna.talentId === talentId)

    const dnaData: TalentDNAData = {
      id: existingIndex >= 0 ? dnaRecords[existingIndex].id : `dna_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      talentId,
      travelAvailability: data.travelAvailability ?? false, // Fix: ensure required field is always present
      ...data,
      createdAt: existingIndex >= 0 ? dnaRecords[existingIndex].createdAt : new Date(),
      updatedAt: new Date()
    }

    if (existingIndex >= 0) {
      dnaRecords[existingIndex] = dnaData
    } else {
      dnaRecords.push(dnaData)
    }

    this.saveToStorage('talent_dna', dnaRecords)

    // Update talent DNA status
    const isComplete = this.checkDNACompleteness(dnaData)
    this.updateTalent(talentId, { dnaStatus: isComplete ? 'COMPLETE' : 'PARTIAL' })

    return dnaData
  }

  private checkDNACompleteness(dna: TalentDNAData): boolean {
    const requiredFields = ['height', 'weight', 'hairColor', 'eyeColor', 'skinTone', 'shoeSize']
    return requiredFields.every(field => dna[field as keyof TalentDNAData] && String(dna[field as keyof TalentDNAData]).trim() !== '')
  }

  // File operations
  getTalentFiles(talentId: string, type?: 'PHOTO' | 'DOCUMENT'): FileData[] {
    const files = this.getFromStorage<FileData>('files')
    return files.filter(file => {
      if (file.talentId !== talentId) return false
      if (type && file.type !== type) return false
      return true
    }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  }

  createFile(data: Omit<FileData, 'id' | 'uploadedAt'>): FileData {
    const files = this.getFromStorage<FileData>('files')
    const newFile: FileData = {
      ...data,
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: new Date()
    }
    files.push(newFile)
    this.saveToStorage('files', files) // Fix: save array instead of single file
    return newFile
  }

  deleteFile(fileId: string): boolean {
    const files = this.getFromStorage<FileData>('files')
    const filteredFiles = files.filter(file => file.id !== fileId)
    if (filteredFiles.length !== files.length) {
      this.saveToStorage('files', filteredFiles)
      return true
    }
    return false
  }

  // Check if talent exists
  checkTalentExists(email?: string, document?: string): boolean {
    const talents = this.getTalents()
    return talents.some(talent => 
      (email && talent.email === email) || 
      (document && talent.document === document)
    )
  }

  // Initialize with sample data if empty
  initializeSampleData(): void {
    const talents = this.getTalents()
    if (talents.length === 0) {
      const sampleTalents: TalentData[] = [
        {
          id: 'talent_1',
          fullName: 'Ana Clara Silva',
          email: 'ana.clara@example.com',
          phone: '(11) 99999-9999',
          city: 'São Paulo',
          uf: 'SP',
          age: 25,
          gender: 'Feminino',
          createdAt: new Date('2023-01-15'),
          updatedAt: new Date('2023-01-15'),
          inviteSent: false,
          status: true,
          dnaStatus: 'COMPLETE' as const,
          producer: {
            id: 'prod_1',
            first_name: 'João',
            last_name: 'Santos',
            email: 'joao@pregiato.com'
          }
        },
        {
          id: 'talent_2',
          fullName: 'Carlos Eduardo',
          email: 'carlos@example.com',
          phone: '(21) 88888-8888',
          city: 'Rio de Janeiro',
          uf: 'RJ',
          age: 30,
          gender: 'Masculino',
          createdAt: new Date('2023-02-10'),
          updatedAt: new Date('2023-02-10'),
          inviteSent: true,
          status: true,
          dnaStatus: 'PARTIAL' as const,
          producer: {
            id: 'prod_2',
            first_name: 'Maria',
            last_name: 'Oliveira',
            email: 'maria@pregiato.com'
          }
        }
      ]
      this.saveToStorage('talents', sampleTalents)

      // Add sample DNA data
      const sampleDNA: TalentDNAData[] = [
        {
          id: 'dna_1',
          talentId: 'talent_1',
          height: '1.70',
          weight: '60',
          hairColor: 'Castanho',
          eyeColor: 'Verde',
          skinTone: 'Clara',
          shoeSize: '37',
          bodyType: 'Fitness',
          travelAvailability: true, // Fix: ensure required field is present
          createdAt: new Date('2023-01-15'),
          updatedAt: new Date('2023-01-15')
        }
      ]
      this.saveToStorage('talent_dna', sampleDNA)

      // Add sample files
      const sampleFiles: FileData[] = [
        {
          id: 'file_1',
          url: '/src/assets/ana-clara-profile.jpg',
          type: 'PHOTO' as const,
          talentId: 'talent_1',
          fileName: 'ana-clara-profile.jpg',
          mimeType: 'image/jpeg',
          uploadedAt: new Date('2023-01-15')
        }
      ]
      this.saveToStorage('files', sampleFiles)
    }
  }
}

export const mockDb = new MockDatabase()

// Initialize sample data on first load
mockDb.initializeSampleData()
