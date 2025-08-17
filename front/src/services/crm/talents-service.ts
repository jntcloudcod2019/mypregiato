import api from '../whatsapp-api';

export interface Talent {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  city?: string;
  status?: string;
  stage?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface TalentCreateDto {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  description?: string;
  source?: string;
  status?: string;
  extras?: Record<string, any>;
}

export const talentsService = {
  async list(): Promise<Talent[]> {
    try {
      const { data } = await api.get('/talents');
      return Array.isArray(data) ? data : (data?.items || []);
    } catch (error) {
      console.error('Error fetching talents:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Talent | null> {
    try {
      const { data } = await api.get(`/talents/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching talent ${id}:`, error);
      return null;
    }
  },

  async create(talent: TalentCreateDto): Promise<Talent | null> {
    try {
      const { data } = await api.post('/talents', talent);
      return data;
    } catch (error) {
      console.error('Error creating talent:', error);
      return null;
    }
  },

  async update(id: string, talent: Partial<Talent>): Promise<Talent | null> {
    try {
      const { data } = await api.put(`/talents/${id}`, talent);
      return data;
    } catch (error) {
      console.error(`Error updating talent ${id}:`, error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/talents/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting talent ${id}:`, error);
      return false;
    }
  },

  async bulkImport(talents: TalentCreateDto[]): Promise<{ success: number; failed: number }> {
    try {
      const { data } = await api.post('/talents/bulk', talents);
      return data || { success: 0, failed: 0 };
    } catch (error) {
      console.error('Error bulk importing talents:', error);
      return { success: 0, failed: talents.length };
    }
  }
};
