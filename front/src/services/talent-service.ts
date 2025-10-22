import { apiClient } from './api-client';

export interface TalentDto {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  document?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  nationality?: string;
  height?: number;
  weight?: number;
  eyeColor?: string;
  hairColor?: string;
  skinTone?: string;
  bodyType?: string;
  experience?: string;
  specialties?: string[];
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
  };
  profilePicture?: string;
  portfolio?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TalentPhotoDto {
  id: string;
  filePath: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  description?: string;
  tags?: string;
  talentId?: string;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export class TalentService {
  private readonly baseUrl = '/api';

  /**
   * Busca um talent por email
   */
  async getTalentByEmail(email: string): Promise<TalentDto> {
    console.log(`🔍 [TALENT-SERVICE] Buscando talent por email: ${email}`);
    
    const response = await apiClient.get<TalentDto>(`${this.baseUrl}/talents/by-email/${encodeURIComponent(email)}`);
    
    console.log(`✅ [TALENT-SERVICE] Talent encontrado:`, response);
    return response;
  }

  /**
   * Busca fotos de um talent por ID
   */
  async getTalentPhotos(talentId: string): Promise<TalentPhotoDto[]> {
    console.log(`📸 [TALENT-SERVICE] Buscando fotos do talent: ${talentId}`);
    
    const response = await apiClient.get<TalentPhotoDto[]>(`${this.baseUrl}/FileUploads/talent/${talentId}`);
    
    console.log(`✅ [TALENT-SERVICE] ${response.length} fotos encontradas`);
    return response;
  }

  /**
   * Busca talent e suas fotos por email
   */
  async getTalentWithPhotos(email: string): Promise<{ talent: TalentDto; photos: TalentPhotoDto[] }> {
    console.log(`🎭 [TALENT-SERVICE] Buscando talent e fotos por email: ${email}`);
    
    try {
      // Buscar talent por email
      const talent = await this.getTalentByEmail(email);
      
      // Buscar fotos do talent
      const photos = await this.getTalentPhotos(talent.id);
      
      console.log(`✅ [TALENT-SERVICE] Talent e fotos carregados: ${talent.fullName} (${photos.length} fotos)`);
      
      return { talent, photos };
    } catch (error) {
      console.error(`❌ [TALENT-SERVICE] Erro ao buscar talent e fotos:`, error);
      throw error;
    }
  }
}

export const talentService = new TalentService();
