
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
    const params: Record<string, any> = {
      page,
      pageSize,
      sortBy,
      sortDescending
    };
    
    if (search) {
      params.search = search;
    }
    
    const data = await get<PaginatedTalentsResponse>('/talents', params)
    return data
  } catch (error) {
    console.error('Error fetching talents:', error)
    throw new Error('Failed to fetch talents')
  }
}

export const getTalents = async (): Promise<TalentData[]> => {
  try {
    const data = await get<TalentData[]>('/talents')
    return data
  } catch (error) {
    console.error('Error fetching talents:', error)
    throw new Error('Failed to fetch talents')
  }
}

export const getTalentById = async (id: string): Promise<TalentData | null> => {
  try {
    const data = await get<TalentData>(`/talents/${id}`)
    return data
  } catch (error) {
    console.error('Error fetching talent:', error)
    throw new Error('Failed to fetch talent')
  }
}

export const createTalent = async (data: CreateTalentData): Promise<TalentData> => {
  try {
    const talent = await post<TalentData>('/talents', {
      ...data,
      inviteSent: false,
      status: true,
      dnaStatus: 'UNDEFINED'
    })
    return talent
  } catch (error: any) {
    console.error('Error creating talent:', error)
    
    // Se o erro vem do servidor com uma mensagem específica
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    
    throw new Error('Failed to create talent')
  }
}

export const updateTalent = async (id: string, data: UpdateTalentData): Promise<TalentData | null> => {
  try {
    const talent = await put<TalentData>(`/talents/${id}`, data)
    return talent
  } catch (error) {
    console.error('Error updating talent:', error)
    throw new Error('Failed to update talent')
  }
}

export const checkTalentExists = async (email?: string, document?: string): Promise<boolean> => {
  try {
    const params: Record<string, any> = {}
    if (email) params.email = email
    if (document) params.document = document
    
    const data = await get<{ exists: boolean }>('/talents/check-exists', params)
    return data.exists
  } catch (error) {
    console.error('Error checking talent existence:', error)
    return false
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
