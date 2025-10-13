// Tipos para o módulo de Treinamentos

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  thumbnailObjectName?: string;
  category?: string;
  difficulty?: string;
  isActive: boolean;
  totalLessons: number;
  totalDurationMinutes: number;
  totalLikes: number;
  totalDislikes: number;
  averageRating: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  lessons?: TrainingLesson[];
  enrollments?: TrainingEnrollment[];
  ratings?: TrainingRating[];
}

export interface TrainingLesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  orderIndex: number;
  videoUrl?: string;
  videoObjectName?: string;
  videoSize?: number;
  videoDurationSeconds?: number;
  videoMimeType?: string;
  attachmentsJson?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course?: TrainingCourse;
  progressRecords?: TrainingLessonProgress[];
}

export interface TrainingEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
  progressPercentage: number;
  completedLessons: number;
  totalTimeWatchedMinutes: number;
  certificateIssued: boolean;
  certificateIssuedAt?: string;
  certificateUrl?: string;
  certificateObjectName?: string;
  course?: TrainingCourse;
  lessonProgress?: TrainingLessonProgress[];
  certificates?: TrainingCertificate[];
}

export interface TrainingLessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  isCompleted: boolean;
  completedAt?: string;
  watchedSeconds: number;
  lastPositionSeconds: number;
  startedAt?: string;
  lastWatchedAt?: string;
  watchCount: number;
  enrollment?: TrainingEnrollment;
  lesson?: TrainingLesson;
}

export interface TrainingRating {
  id: string;
  courseId: string;
  userId: string;
  ratingType: string;
  stars: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  course?: TrainingCourse;
}

export interface TrainingCertificate {
  id: string;
  enrollmentId: string;
  courseId: string;
  userId: string;
  certificateNumber: string;
  userFullName: string;
  courseName: string;
  completionDate: string;
  totalHours: number;
  pdfUrl?: string;
  pdfObjectName?: string;
  htmlContent?: string;
  validationCode: string;
  isValid: boolean;
  issuedAt: string;
  enrollment?: TrainingEnrollment;
}

// DTOs para criação e atualização
export interface CreateTrainingCourseDto {
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
  isActive?: boolean;
  createdBy: string;
  lessons?: CreateTrainingLessonDto[];
}

export interface UpdateTrainingCourseDto {
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
  isActive: boolean;
}

export interface CreateTrainingLessonDto {
  title: string;
  description: string;
  orderIndex: number;
  videoUrl?: string;
  videoObjectName?: string;
  videoSize?: number;
  videoDurationSeconds?: number;
  durationSeconds?: number; // Adicionado para compatibilidade
  videoMimeType?: string;
  attachmentsJson?: string;
  isActive?: boolean;
}

export interface UpdateTrainingLessonDto {
  title: string;
  description: string;
  orderIndex: number;
  videoUrl?: string;
  videoObjectName?: string;
  videoSize?: number;
  videoDurationSeconds?: number;
  videoMimeType?: string;
  attachmentsJson?: string;
  isActive: boolean;
}

export interface CreateTrainingEnrollmentDto {
  userId: string;
  courseId: string;
}

export interface UpdateTrainingProgressDto {
  lessonId: string;
  watchedSeconds: number;
  lastPositionSeconds: number;
  isCompleted: boolean;
}

export interface TrainingProgressSummaryDto {
  courseId: string;
  courseTitle: string;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  totalTimeWatchedMinutes: number;
  lastWatchedAt?: string;
  isCompleted: boolean;
  certificateIssued: boolean;
}

export interface CreateTrainingRatingDto {
  courseId: string;
  ratingType: string;
  stars: number;
  comment?: string;
}

export interface UpdateTrainingRatingDto {
  stars: number;
  comment?: string;
}

export interface TrainingRatingSummaryDto {
  courseId: string;
  totalLikes: number;
  totalDislikes: number;
  averageStars: number;
  totalStarRatings: number;
  totalComments: number;
  recentComments?: TrainingRating[];
}

// DTOs para upload de vídeo
export interface TrainingVideoUploadDto {
  courseId: string;
  lessonId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  chunkId?: string;
  chunkIndex?: number;
  totalChunks?: number;
}

export interface VideoUploadResultDto {
  success: boolean;
  objectName?: string;
  videoUrl?: string;
  presignedUrl?: string;
  errorMessage?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface VideoPresignedUrlDto {
  objectName: string;
  presignedUrl: string;
  expiresAt: string;
  videoUrl?: string;
}

export interface VideoMetadataDto {
  objectName: string;
  fileSize: number;
  mimeType: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  createdAt: string;
}

// DTOs para certificados
export interface CreateTrainingCertificateDto {
  enrollmentId: string;
  courseId: string;
  userId: string;
  userFullName: string;
  courseName: string;
  completionDate: string;
  totalHours: number;
}

export interface CertificateValidationDto {
  validationCode: string;
}

export interface CertificateValidationResultDto {
  isValid: boolean;
  userFullName?: string;
  courseName?: string;
  completionDate?: string;
  totalHours?: number;
  issuedAt?: string;
  errorMessage?: string;
}

// Tipos para filtros e paginação
export interface TrainingCourseFilters {
  category?: string;
  search?: string;
  difficulty?: string;
  isActive?: boolean;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

export interface TrainingEnrollmentFilters {
  userId?: string;
  courseId?: string;
  isCompleted?: boolean;
  limit?: number;
  offset?: number;
}

// Tipos para estatísticas
export interface TrainingCourseStats {
  enrollmentCount: number;
  completionCount: number;
  completionRate: number;
  averageProgress: number;
  totalLikes: number;
  totalDislikes: number;
  averageRating: number;
  totalLessons: number;
}

export interface TrainingEnrollmentStats {
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  averageProgress: number;
}
