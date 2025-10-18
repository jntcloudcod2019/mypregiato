import { apiClient } from './api-client';
import {
  TrainingCourse,
  TrainingLesson,
  TrainingEnrollment,
  TrainingCertificate,
  TrainingProgressSummaryDto,
  TrainingRatingSummaryDto,
  TrainingCourseStats,
  TrainingEnrollmentStats,
  CreateTrainingCourseDto,
  UpdateTrainingCourseDto,
  CreateTrainingLessonDto,
  UpdateTrainingLessonDto,
  CreateTrainingEnrollmentDto,
  UpdateTrainingProgressDto,
  CreateTrainingRatingDto,
  UpdateTrainingRatingDto,
  TrainingVideoUploadDto,
  VideoUploadResultDto,
  VideoPresignedUrlDto,
  VideoMetadataDto,
  CreateTrainingCertificateDto,
  CertificateValidationResultDto,
  TrainingCourseFilters,
  TrainingEnrollmentFilters,
} from '../types/training';

export class TrainingService {
  private readonly baseUrl = '/api';

  // === COURSES ===
  async getCourses(filters?: TrainingCourseFilters): Promise<TrainingCourse[]> {
    const params = new URLSearchParams();
    
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/TrainingCourses?${queryString}` : `${this.baseUrl}/TrainingCourses`;
    
    return await apiClient.get<TrainingCourse[]>(url);
  }

  async getCourseById(id: string): Promise<TrainingCourse> {
    return await apiClient.get<TrainingCourse>(`${this.baseUrl}/TrainingCourses/${id}`);
  }

  async getCourseLessons(id: string): Promise<TrainingLesson[]> {
    return await apiClient.get<TrainingLesson[]>(`${this.baseUrl}/TrainingCourses/${id}/lessons`);
  }

  async getCourseWithEnrollments(id: string): Promise<TrainingCourse> {
    return await apiClient.get<TrainingCourse>(`${this.baseUrl}/TrainingCourses/${id}/with-enrollments`);
  }

  async getTopRatedCourses(limit: number = 10): Promise<TrainingCourse[]> {
    return await apiClient.get<TrainingCourse[]>(`${this.baseUrl}/TrainingCourses/top-rated?limit=${limit}`);
  }

  async getMostPopularCourses(limit: number = 10): Promise<TrainingCourse[]> {
    return await apiClient.get<TrainingCourse[]>(`${this.baseUrl}/TrainingCourses/most-popular?limit=${limit}`);
  }

  async getCategories(): Promise<string[]> {
    return await apiClient.get<string[]>(`${this.baseUrl}/TrainingCourses/categories`);
  }

  async getCategoryStats(): Promise<Record<string, number>> {
    return await apiClient.get<Record<string, number>>(`${this.baseUrl}/TrainingCourses/category-stats`);
  }

  async getCourseStats(courseId: string): Promise<TrainingCourseStats> {
    return await apiClient.get<TrainingCourseStats>(`${this.baseUrl}/TrainingCourses/${courseId}/stats`);
  }

  async createCourse(course: CreateTrainingCourseDto): Promise<TrainingCourse> {
    // ✅ AUMENTAR TIMEOUT PARA 10 MINUTOS (criação de cursos com múltiplas aulas pode demorar)
    const axiosInstance = apiClient.getAxiosInstance();
    const response = await axiosInstance.post<TrainingCourse>(`${this.baseUrl}/TrainingCourses`, course, {
      timeout: 600000 // 10 minutos
    });
    
    // Retornar resposta (pode ser { course, message } ou direto o curso)
    return response.data;
  }

  async updateCourse(id: string, course: UpdateTrainingCourseDto): Promise<TrainingCourse> {
    return await apiClient.put<TrainingCourse>(`${this.baseUrl}/TrainingCourses/${id}`, course);
  }

  async deleteCourse(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.baseUrl}/TrainingCourses/${id}`);
  }

  async addCourseRating(courseId: string, rating: CreateTrainingRatingDto, userEmail: string): Promise<TrainingCourse> {
    console.log('⭐ [RATING] Enviando avaliação:', {
      courseId,
      ratingType: rating.ratingType,
      stars: rating.stars,
      userEmail
    });
    
    return await apiClient.post<TrainingCourse>(
      `${this.baseUrl}/TrainingCourses/${courseId}/rating?userEmail=${encodeURIComponent(userEmail)}`,
      rating
    );
  }

  // === ENROLLMENT ===
  async getOrCreateEnrollment(userId: string, courseId: string): Promise<TrainingEnrollment> {
    console.log('🎓 [ENROLLMENT] Buscando ou criando enrollment:', { userId, courseId });
    return await apiClient.get<TrainingEnrollment>(
      `${this.baseUrl}/TrainingEnrollments/get-or-create?userId=${userId}&courseId=${courseId}`
    );
  }

  async updateLessonProgress(enrollmentId: string, lessonId: string, timeWatchedSeconds: number, isCompleted: boolean): Promise<TrainingEnrollment> {
    console.log('🎬 [LESSON] Atualizando progresso:', { enrollmentId, lessonId, timeWatchedSeconds, isCompleted });
    return await apiClient.post<TrainingEnrollment>(
      `${this.baseUrl}/TrainingEnrollments/${enrollmentId}/lesson-progress`,
      { 
        lessonId,
        watchedSeconds: timeWatchedSeconds,
        lastPositionSeconds: timeWatchedSeconds,
        isCompleted 
      }
    );
  }

  async updateEnrollmentProgress(enrollmentId: string, currentLessonId: string, timeWatchedMinutes: number): Promise<TrainingEnrollment> {
    console.log('📊 [ENROLLMENT] Atualizando progresso geral:', { enrollmentId, currentLessonId, timeWatchedMinutes });
    return await apiClient.put<TrainingEnrollment>(
      `${this.baseUrl}/TrainingEnrollments/${enrollmentId}/progress`,
      { currentLessonId, timeWatchedMinutes }
    );
  }

  // === VIDEO UPLOAD ===
  async uploadVideo(uploadData: TrainingVideoUploadDto): Promise<VideoUploadResultDto> {
    console.log('📤 [TRAINING-SERVICE] Iniciando upload de vídeo:', {
      fileName: uploadData.fileName,
      fileSize: uploadData.fileSize,
      courseTitle: uploadData.courseTitle,
      lessonTitle: uploadData.lessonTitle
    });

    try {
      // ✅ AUMENTAR TIMEOUT PARA 10 MINUTOS (vídeos grandes podem demorar)
      const axiosInstance = apiClient.getAxiosInstance();
      const response = await axiosInstance.post<VideoUploadResultDto>(
        `${this.baseUrl}/TrainingVideos/upload`,
        uploadData,
        {
          timeout: 600000 // 10 minutos
        }
      );

      console.log('✅ [TRAINING-SERVICE] Upload concluído com sucesso:', {
        videoUrl: response.data.videoUrl,
        objectName: response.data.objectName
      });

      return response.data;
    } catch (error) {
      console.error('❌ [TRAINING-SERVICE] Erro no upload de vídeo:', error);
      throw error;
    }
  }

  // === ENROLLMENTS ===
  async getEnrollments(filters?: TrainingEnrollmentFilters): Promise<TrainingEnrollment[]> {
    const params = new URLSearchParams();
    
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.courseId) params.append('courseId', filters.courseId);
    
    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/TrainingEnrollments?${queryString}` : `${this.baseUrl}/TrainingEnrollments`;
    
    return await apiClient.get<TrainingEnrollment[]>(url);
  }

  async getEnrollmentById(id: string): Promise<TrainingEnrollment> {
    return await apiClient.get<TrainingEnrollment>(`${this.baseUrl}/TrainingEnrollments/${id}`);
  }

  async getCompletedEnrollments(userId: string): Promise<TrainingEnrollment[]> {
    return await apiClient.get<TrainingEnrollment[]>(`${this.baseUrl}/TrainingEnrollments/user/${userId}/completed`);
  }

  async getInProgressEnrollments(userId: string): Promise<TrainingEnrollment[]> {
    return await apiClient.get<TrainingEnrollment[]>(`${this.baseUrl}/TrainingEnrollments/user/${userId}/in-progress`);
  }

  async getUserProgressSummary(userId: string): Promise<TrainingProgressSummaryDto[]> {
    return await apiClient.get<TrainingProgressSummaryDto[]>(`${this.baseUrl}/TrainingEnrollments/user/${userId}/progress-summary`);
  }

  async getCourseEnrollmentStats(courseId: string): Promise<TrainingEnrollmentStats> {
    return await apiClient.get<TrainingEnrollmentStats>(`${this.baseUrl}/TrainingEnrollments/course/${courseId}/stats`);
  }

  async enrollInCourse(enrollment: CreateTrainingEnrollmentDto): Promise<TrainingEnrollment> {
    return await apiClient.post<TrainingEnrollment>(`${this.baseUrl}/TrainingEnrollments`, enrollment);
  }

  async updateProgress(enrollmentId: string, progress: UpdateTrainingProgressDto): Promise<TrainingEnrollment> {
    return await apiClient.put<TrainingEnrollment>(`${this.baseUrl}/TrainingEnrollments/${enrollmentId}/progress`, progress);
  }

  async markAsCompleted(enrollmentId: string): Promise<void> {
    await apiClient.put<void>(`${this.baseUrl}/TrainingEnrollments/${enrollmentId}/complete`, {});
  }

  async getProgressSummary(userId: string, courseId: string): Promise<TrainingProgressSummaryDto> {
    return await apiClient.get<TrainingProgressSummaryDto>(`${this.baseUrl}/TrainingEnrollments/user/${userId}/course/${courseId}/progress`);
  }

  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    return await apiClient.get<boolean>(`${this.baseUrl}/TrainingEnrollments/user/${userId}/course/${courseId}/is-enrolled`);
  }

  // === VIDEO UPLOAD (MÉTODOS COMPLEMENTARES) ===
  async generatePresignedUrl(uploadDto: TrainingVideoUploadDto): Promise<VideoPresignedUrlDto> {
    return await apiClient.post<VideoPresignedUrlDto>(`${this.baseUrl}/TrainingVideos/presigned-url`, uploadDto);
  }

  // ✅ MÉTODO MANTIDO: Upload em chunks (para compatibilidade)
  async uploadVideoChunk(uploadDto: TrainingVideoUploadDto, chunkData: string): Promise<VideoUploadResultDto> {
    return await apiClient.post<VideoUploadResultDto>(`${this.baseUrl}/TrainingVideos/upload-chunk`, {
      ...uploadDto,
      chunkData
    });
  }

  async getStreamingUrl(objectName: string, expiresInHours: number = 1): Promise<VideoPresignedUrlDto> {
    return await apiClient.get<VideoPresignedUrlDto>(`${this.baseUrl}/TrainingVideos/stream/${objectName}?expiresInHours=${expiresInHours}`);
  }

  async getPublicUrl(objectName: string): Promise<{ url: string }> {
    return await apiClient.get<{ url: string }>(`${this.baseUrl}/TrainingVideos/public/${objectName}`);
  }

  async getVideoMetadata(objectName: string): Promise<VideoMetadataDto> {
    return await apiClient.get<VideoMetadataDto>(`${this.baseUrl}/TrainingVideos/metadata/${objectName}`);
  }

  async videoExists(objectName: string): Promise<boolean> {
    return await apiClient.get<boolean>(`${this.baseUrl}/TrainingVideos/exists/${objectName}`);
  }

  async deleteVideo(objectName: string): Promise<void> {
    await apiClient.delete<void>(`${this.baseUrl}/TrainingVideos/${objectName}`);
  }

  // === CERTIFICATES ===
  async generateCertificate(request: { userEmail: string; courseId: string; completionDate: Date }): Promise<Blob> {
    // Endpoint retorna PDF diretamente como arquivo
    const response = await fetch(`${window.location.origin}${this.baseUrl}/TrainingCertificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: request.userEmail,
        courseId: request.courseId,
        completionDate: request.completionDate
      })
    });

    if (!response.ok) {
      throw new Error(`Erro ao gerar certificado: ${response.statusText}`);
    }

    return await response.blob();
  }

  async validateCertificate(validationCode: string): Promise<CertificateValidationResultDto> {
    return await apiClient.post<CertificateValidationResultDto>(`${this.baseUrl}/TrainingCertificates/validate`, {
      validationCode
    });
  }

  async getCertificateDownloadUrl(certificateId: string): Promise<{ downloadUrl: string }> {
    return await apiClient.get<{ downloadUrl: string }>(`${this.baseUrl}/TrainingCertificates/${certificateId}/download-url`);
  }

  async checkCertificateExists(enrollmentId: string): Promise<{ exists: boolean }> {
    return await apiClient.get<{ exists: boolean }>(`${this.baseUrl}/TrainingCertificates/enrollment/${enrollmentId}/exists`);
  }

  

  // Método para obter estatísticas gerais
  async getGeneralStats(): Promise<{
    totalCourses: number;
    totalEnrollments: number;
    totalCompleted: number;
    averageCompletionRate: number;
  }> {
    try {
      const categories = await this.getCategoryStats();
      const totalCourses = Object.values(categories).reduce((sum, count) => sum + count, 0);
      
      // Implementar outras estatísticas conforme necessário
      return {
        totalCourses,
        totalEnrollments: 0, // Implementar quando disponível
        totalCompleted: 0, // Implementar quando disponível
        averageCompletionRate: 0, // Implementar quando disponível
      };
    } catch (error) {
      console.error('Error getting general stats:', error);
      return {
        totalCourses: 0,
        totalEnrollments: 0,
        totalCompleted: 0,
        averageCompletionRate: 0,
      };
    }
  }
}

// Instância singleton
export const trainingService = new TrainingService();
export default trainingService;
