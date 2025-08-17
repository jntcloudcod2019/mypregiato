
import { get, post, put, del } from '@/services/api/api'
import { TalentData, ProducerData, CreateTalentData, UpdateTalentData } from '@/types/talent'

export interface PaginatedTalentsResponse {
  data: TalentData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPageUrl?: string;
  previousPageUrl?: string;
  executionTimeMs: number;
  recordsReturned: number;
}

export const getTalentsPaginated = async (
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  sortBy?: string,
  sortDescending: boolean = false
): Promise<PaginatedTalentsResponse> => {
  try {
    const params: Record<string, string | number | boolean> = {
      page,
      pageSize,
      sortBy,
      sortDescending
    };
    
    if (search) {
      params.search = search;
    }
    
    const data = await get<PaginatedTalentsResponse>('/api/talents', params)
    return data
  } catch (error) {
    console.error('Error fetching talents:', error)
    throw new Error('Failed to fetch talents')
  }
}

export const getTalents = async (): Promise<TalentData[]> => {
  try {
    const data = await get<TalentData[]>('/api/talents')
    return data
  } catch (error) {
    console.error('Error fetching talents:', error)
    throw new Error('Failed to fetch talents')
  }
}

export const getTalentById = async (id: string): Promise<TalentData | null> => {
  try {
    const data = await get<TalentData>(`/api/talents/${id}`)
    return data
  } catch (error) {
    console.error('Error fetching talent:', error)
    throw new Error('Failed to fetch talent')
  }
}

export const createTalent = async (data: CreateTalentData): Promise<TalentData> => {
  try {
    const talent = await post<TalentData>('/api/talents', {
      ...data,
      inviteSent: false,
      status: true,
      dnaStatus: 'UNDEFINED'
    })
    return talent
  } catch (error: unknown) {
    console.error('Error creating talent:', error)
    
    // Se o erro vem do servidor com uma mensagem específica
    if (error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response &&
        error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
      throw new Error((error.response.data as { error: string }).error)
    }
    
    throw new Error('Failed to create talent')
  }
}

export const updateTalent = async (id: string, data: UpdateTalentData): Promise<TalentData | null> => {
  try {
    const talent = await put<TalentData>(`/api/talents/${id}`, data)
    return talent
  } catch (error) {
    console.error('Error updating talent:', error)
    throw new Error('Failed to update talent')
  }
}

export const checkTalentExists = async (email?: string, document?: string): Promise<boolean> => {
  try {
    const params: Record<string, string> = {}
    if (email) params.email = email
    if (document) params.document = document
    
    const data = await get<boolean>('/api/talents/check-exists', params)
    return data
  } catch (error) {
    console.error('Error checking talent exists:', error)
    return false
  }
}

export const deleteTalent = async (id: string): Promise<boolean> => {
  try {
    await del(`/api/talents/${id}`)
    return true
  } catch (error) {
    console.error('Error deleting talent:', error)
    throw new Error('Failed to delete talent')
  }
}

export const getProducers = async (): Promise<ProducerData[]> => {
  try {
    const data = await get<ProducerData[]>('/producers')
    return data
  } catch (error) {
    console.error('Error fetching producers:', error)
    return []
  }
}
