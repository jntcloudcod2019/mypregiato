import apiClient from './api-client';

export interface TalentPhotoDto {
  id: string;
  fileName: string;
  filePath: string;
  contentType: string;
  fileSize: number;
  originalFileName?: string | null;
  description?: string | null;
  tags?: string | null;
  talentId?: string | null;
  contractId?: string | null;
  uploadedAt: Date;
  uploadedBy?: string | null;
}

export interface TalentPhotoUploadDto {
  fileName: string;
  base64Data: string;
  contentType: string;
  fileSize: number;
  description?: string;
}

class TalentPhotosService {
  /**
   * Listar todas as fotos de um talento
   */
  async getTalentPhotos(talentId: string): Promise<TalentPhotoDto[]> {
    try {
      console.log('📸 [TALENT-PHOTOS] Buscando fotos do talento:', talentId);
      const response = await apiClient.get<TalentPhotoDto[]>(
        `/api/FileUploads/talent/${talentId}`
      );
      console.log('✅ [TALENT-PHOTOS] Fotos encontradas:', response.length);
      return response;
    } catch (error) {
      console.error('❌ [TALENT-PHOTOS] Erro ao buscar fotos do talento:', error);
      return [];
    }
  }

  /**
   * Upload de foto para um talento
   */
  async uploadPhoto(
    talentId: string,
    file: File
  ): Promise<TalentPhotoDto> {
    try {
      // Converter arquivo para base64
      const base64Data = await this.fileToBase64(file);

      const uploadDto: TalentPhotoUploadDto = {
        fileName: file.name,
        base64Data,
        contentType: file.type,
        fileSize: file.size,
        description: `Foto de perfil - ${file.name}`
      };

      const response = await apiClient.post<TalentPhotoDto>(
        `/api/FileUploads`,
        {
          ...uploadDto,
          talentId: talentId
        }
      );

      return response;
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      throw error;
    }
  }

  /**
   * Deletar uma foto
   */
  async deletePhoto(talentId: string, photoId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/FileUploads/${photoId}`);
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      throw error;
    }
  }

  /**
   * Converter File para Base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remover o prefixo "data:image/...;base64,"
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  }
}

export const talentPhotosService = new TalentPhotosService();

