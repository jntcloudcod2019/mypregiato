import api from '@/services/whatsapp-api'

export type ImportedFile = {
  id: string
  fileName: string
  payloadJson: string
  rowCount?: number
  createdAtUtc?: string
  updatedAtUtc?: string
}

export const importsApi = {
  async list(page = 1, pageSize = 20): Promise<{ items: ImportedFile[]; total: number }> {
    const { data } = await api.get('/imports', { params: { page, pageSize } })
    return data
  },
  async get(id: string): Promise<ImportedFile> {
    const { data } = await api.get(`/imports/${id}`)
    return data
  },
  async create(fileName: string, payload: unknown, rowCount?: number): Promise<ImportedFile> {
    const { data } = await api.post('/imports', {
      fileName,
      payloadJson: JSON.stringify(payload),
      rowCount
    })
    return data
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/imports/${id}`)
  }
}


