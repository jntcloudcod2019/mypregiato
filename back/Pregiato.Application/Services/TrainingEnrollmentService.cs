using AutoMapper;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;

namespace Pregiato.Application.Services
{
    public class TrainingEnrollmentService : ITrainingEnrollmentService
    {
        private readonly ITrainingEnrollmentRepository _enrollmentRepository;
        private readonly ITrainingCourseRepository _courseRepository;
        private readonly ITrainingCertificateService _certificateService;
        private readonly IMapper _mapper;

        public TrainingEnrollmentService(
            ITrainingEnrollmentRepository enrollmentRepository,
            ITrainingCourseRepository courseRepository,
            ITrainingCertificateService certificateService,
            IMapper mapper)
        {
            _enrollmentRepository = enrollmentRepository;
            _courseRepository = courseRepository;
            _certificateService = certificateService;
            _mapper = mapper;
        }

        public async Task<TrainingEnrollmentDto?> GetByIdAsync(Guid id)
        {
            var enrollment = await _enrollmentRepository.GetByIdAsync(id);
            return enrollment != null ? _mapper.Map<TrainingEnrollmentDto>(enrollment) : null;
        }

        public async Task<TrainingEnrollmentDto?> GetByUserAndCourseAsync(string userId, Guid courseId)
        {
            var enrollment = await _enrollmentRepository.GetByUserAndCourseAsync(userId, courseId);
            return enrollment != null ? _mapper.Map<TrainingEnrollmentDto>(enrollment) : null;
        }

        public async Task<IEnumerable<TrainingEnrollmentDto>> GetByUserIdAsync(string userId)
        {
            var enrollments = await _enrollmentRepository.GetByUserIdAsync(userId);
            return _mapper.Map<IEnumerable<TrainingEnrollmentDto>>(enrollments);
        }

        public async Task<IEnumerable<TrainingEnrollmentDto>> GetByCourseIdAsync(Guid courseId)
        {
            var enrollments = await _enrollmentRepository.GetByCourseIdAsync(courseId);
            return _mapper.Map<IEnumerable<TrainingEnrollmentDto>>(enrollments);
        }

        public async Task<IEnumerable<TrainingEnrollmentDto>> GetCompletedByUserIdAsync(string userId)
        {
            var enrollments = await _enrollmentRepository.GetCompletedByUserIdAsync(userId);
            return _mapper.Map<IEnumerable<TrainingEnrollmentDto>>(enrollments);
        }

        public async Task<IEnumerable<TrainingEnrollmentDto>> GetInProgressByUserIdAsync(string userId)
        {
            var enrollments = await _enrollmentRepository.GetInProgressByUserIdAsync(userId);
            return _mapper.Map<IEnumerable<TrainingEnrollmentDto>>(enrollments);
        }

        public async Task<TrainingEnrollmentDto> EnrollAsync(CreateTrainingEnrollmentDto createDto)
        {
            // Verificar se já está matriculado
            var existingEnrollment = await _enrollmentRepository.GetByUserAndCourseAsync(createDto.UserId, createDto.CourseId);
            if (existingEnrollment != null)
            {
                throw new InvalidOperationException("Usuário já está matriculado neste curso.");
            }

            // Verificar se o curso existe
            var course = await _courseRepository.GetByIdAsync(createDto.CourseId);
            if (course == null)
            {
                throw new ArgumentException("Curso não encontrado.");
            }

            var enrollment = new TrainingEnrollment
            {
                Id = Guid.NewGuid(),
                UserId = createDto.UserId,
                CourseId = createDto.CourseId,
                EnrolledAt = DateTime.UtcNow,
                StartedAt = null,
                CompletedAt = null,
                LastAccessedAt = null,
                ProgressPercentage = 0,
                CompletedLessons = 0,
                TotalTimeWatchedMinutes = 0,
                CertificateIssued = false,
                CertificateIssuedAt = null,
                CertificateUrl = null,
                CertificateObjectName = null
            };

            Console.WriteLine($"🆕 [SERVICE] Criando enrollment com valores iniciais: Progress=0%, TimeWatched=0min");

            var createdEnrollment = await _enrollmentRepository.AddAsync(enrollment);
            
            // ✅ Buscar novamente com todas as relações (Course, LessonProgress)
            var fullEnrollment = await _enrollmentRepository.GetByIdAsync(createdEnrollment.Id);
            
            Console.WriteLine($"✅ [SERVICE] Enrollment criado com sucesso: {fullEnrollment?.Id}");
            
            return _mapper.Map<TrainingEnrollmentDto>(fullEnrollment);
        }

        public async Task<TrainingEnrollmentDto?> UpdateProgressAsync(Guid enrollmentId, UpdateTrainingProgressDto progressDto)
        {
            var enrollment = await _enrollmentRepository.GetByIdAsync(enrollmentId);
            if (enrollment == null) return null;

            // Atualizar última aula acessada
            enrollment.LastAccessedAt = DateTime.UtcNow;
            enrollment.TotalTimeWatchedMinutes = progressDto.TimeWatchedMinutes;
            
            // Definir StartedAt se for primeira vez
            if (!enrollment.StartedAt.HasValue)
            {
                enrollment.StartedAt = DateTime.UtcNow;
            }

            await _enrollmentRepository.UpdateAsync(enrollment);
            return await GetByIdAsync(enrollmentId);
        }

        public async Task<TrainingEnrollmentDto?> UpdateLessonProgressAsync(Guid enrollmentId, Guid lessonId, int timeWatchedSeconds, bool isCompleted)
        {
            var enrollment = await _enrollmentRepository.GetByIdAsync(enrollmentId);
            if (enrollment == null) return null;

            // Buscar ou criar progresso da aula
            var lessonProgress = enrollment.LessonProgress.FirstOrDefault(lp => lp.LessonId == lessonId);
            
            if (lessonProgress == null)
            {
                // Criar novo registro de progresso
                lessonProgress = new TrainingLessonProgress
                {
                    Id = Guid.NewGuid(),
                    EnrollmentId = enrollmentId,
                    LessonId = lessonId,
                    IsCompleted = isCompleted,
                    CompletedAt = isCompleted ? DateTime.UtcNow : null,
                    WatchedSeconds = timeWatchedSeconds,
                    LastPositionSeconds = timeWatchedSeconds,
                    StartedAt = DateTime.UtcNow,
                    LastWatchedAt = DateTime.UtcNow,
                    WatchCount = 1
                };
                enrollment.LessonProgress.Add(lessonProgress);
                Console.WriteLine($"🆕 [SERVICE] Criado novo lesson progress: {lessonId}");
            }
            else
            {
                // Atualizar progresso existente
                lessonProgress.WatchedSeconds = timeWatchedSeconds;
                lessonProgress.LastPositionSeconds = timeWatchedSeconds;
                lessonProgress.LastWatchedAt = DateTime.UtcNow;
                lessonProgress.WatchCount++;

                if (isCompleted && !lessonProgress.IsCompleted)
                {
                    lessonProgress.IsCompleted = true;
                    lessonProgress.CompletedAt = DateTime.UtcNow;
                    Console.WriteLine($"✅ [SERVICE] Aula marcada como concluída: {lessonId}");
                }
            }

            // Atualizar enrollment
            enrollment.LastAccessedAt = DateTime.UtcNow;
            
            // Definir StartedAt se for primeira vez
            if (!enrollment.StartedAt.HasValue)
            {
                enrollment.StartedAt = DateTime.UtcNow;
            }

            // Calcular progresso geral do curso
            var course = await _courseRepository.GetByIdAsync(enrollment.CourseId);
            if (course != null)
            {
                var totalLessons = course.Lessons.Count;
                var completedLessons = enrollment.LessonProgress.Count(lp => lp.IsCompleted);
                var progressPercentage = totalLessons > 0 ? (decimal)completedLessons / totalLessons * 100 : 0;

                Console.WriteLine($"📊 [SERVICE] Recalculando progresso: {completedLessons}/{totalLessons} = {progressPercentage}%");

                await _enrollmentRepository.UpdateProgressAsync(enrollmentId, progressPercentage, completedLessons);
                
                // Verificar se curso foi concluído
                if (progressPercentage >= 100 && !enrollment.CompletedAt.HasValue)
                {
                    Console.WriteLine($"🎉 [SERVICE] Curso 100% completo! Marcando como concluído...");
                    await MarkAsCompletedAsync(enrollmentId);
                }
            }

            return await GetByIdAsync(enrollmentId);
        }

        public async Task<TrainingProgressSummaryDto?> GetProgressSummaryAsync(string userId, Guid courseId)
        {
            var enrollment = await _enrollmentRepository.GetByUserAndCourseAsync(userId, courseId);
            if (enrollment == null) return null;

            var course = await _courseRepository.GetByIdAsync(courseId);
            if (course == null) return null;

            return new TrainingProgressSummaryDto
            {
                CourseId = courseId,
                CourseTitle = course.Title,
                ProgressPercentage = enrollment.ProgressPercentage,
                CompletedLessons = enrollment.CompletedLessons,
                TotalLessons = course.TotalLessons,
                TotalTimeWatchedMinutes = enrollment.TotalTimeWatchedMinutes,
                LastWatchedAt = enrollment.LastAccessedAt,
                IsCompleted = enrollment.CompletedAt.HasValue,
                CertificateIssued = enrollment.CertificateIssued
            };
        }

        public async Task<IEnumerable<TrainingProgressSummaryDto>> GetUserProgressSummaryAsync(string userId)
        {
            var enrollments = await _enrollmentRepository.GetByUserIdAsync(userId);
            var summaries = new List<TrainingProgressSummaryDto>();

            foreach (var enrollment in enrollments)
            {
                var course = await _courseRepository.GetByIdAsync(enrollment.CourseId);
                if (course != null)
                {
                    summaries.Add(new TrainingProgressSummaryDto
                    {
                        CourseId = enrollment.CourseId,
                        CourseTitle = course.Title,
                        ProgressPercentage = enrollment.ProgressPercentage,
                        CompletedLessons = enrollment.CompletedLessons,
                        TotalLessons = course.TotalLessons,
                        TotalTimeWatchedMinutes = enrollment.TotalTimeWatchedMinutes,
                        LastWatchedAt = enrollment.LastAccessedAt,
                        IsCompleted = enrollment.CompletedAt.HasValue,
                        CertificateIssued = enrollment.CertificateIssued
                    });
                }
            }

            return summaries;
        }

        public async Task<bool> MarkAsCompletedAsync(Guid enrollmentId)
        {
            // Marcar como concluído
            await _enrollmentRepository.MarkAsCompletedAsync(enrollmentId);
            
            // Buscar matrícula para obter dados do usuário
            var enrollment = await _enrollmentRepository.GetByIdAsync(enrollmentId);
            if (enrollment != null)
            {
                try
                {
                    // Buscar dados do curso para gerar certificado
                    var course = await _courseRepository.GetByIdAsync(enrollment.CourseId);
                    if (course != null)
                    {
                        // Buscar dados do usuário para obter nome completo
                        // TODO: Implementar busca do usuário ou passar dados necessários
                        var userFullName = "Usuário"; // Placeholder - implementar busca real
                        
                        // Gerar certificado automaticamente
                        await _certificateService.GenerateCertificateAsync(
                            enrollment.UserId, 
                            userFullName, 
                            course.Title, 
                            enrollment.CompletedAt ?? DateTime.UtcNow);
                    }
                }
                catch (Exception ex)
                {
                    // Log do erro mas não falha a operação de conclusão
                    // O certificado pode ser gerado manualmente depois
                    // TODO: Implementar logging adequado
                    Console.WriteLine($"Erro ao gerar certificado automaticamente: {ex.Message}");
                }
            }
            
            return true;
        }

        public async Task<bool> IsEnrolledAsync(string userId, Guid courseId)
        {
            return await _enrollmentRepository.IsEnrolledAsync(userId, courseId);
        }

        public async Task<Dictionary<string, object>> GetEnrollmentStatsAsync(Guid courseId)
        {
            var enrollmentCount = await _enrollmentRepository.GetEnrollmentCountByCourseAsync(courseId);
            var completionCount = await _enrollmentRepository.GetCompletionCountByCourseAsync(courseId);
            var averageProgress = await _enrollmentRepository.GetAverageProgressByCourseAsync(courseId);

            return new Dictionary<string, object>
            {
                { "totalEnrollments", enrollmentCount },
                { "completedEnrollments", completionCount },
                { "completionRate", enrollmentCount > 0 ? (double)completionCount / enrollmentCount * 100 : 0 },
                { "averageProgress", averageProgress }
            };
        }
    }
}
