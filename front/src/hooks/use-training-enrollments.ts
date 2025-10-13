import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingService } from '../services/training-service';
import {
  TrainingEnrollment,
  TrainingProgressSummaryDto,
  TrainingEnrollmentStats,
  CreateTrainingEnrollmentDto,
  UpdateTrainingProgressDto,
  TrainingEnrollmentFilters,
} from '../types/training';
import { useToast } from '../hooks/use-toast';

export const useTrainingEnrollments = (filters?: TrainingEnrollmentFilters) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar matrículas
  const {
    data: enrollments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['training-enrollments', filters],
    queryFn: () => trainingService.getEnrollments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Mutation para matricular em um curso
  const enrollMutation = useMutation({
    mutationFn: (enrollment: CreateTrainingEnrollmentDto) => trainingService.enrollInCourse(enrollment),
    onSuccess: (newEnrollment) => {
      queryClient.invalidateQueries({ queryKey: ['training-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      toast({
        title: 'Matrícula realizada!',
        description: 'Você foi matriculado no curso com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao se matricular',
        description: error.response?.data?.message || 'Erro inesperado ao se matricular.',
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar progresso
  const updateProgressMutation = useMutation({
    mutationFn: ({ enrollmentId, progress }: { enrollmentId: string; progress: UpdateTrainingProgressDto }) =>
      trainingService.updateProgress(enrollmentId, progress),
    onSuccess: (updatedEnrollment) => {
      queryClient.invalidateQueries({ queryKey: ['training-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['training-course', updatedEnrollment.courseId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar progresso',
        description: error.response?.data?.message || 'Erro inesperado ao atualizar progresso.',
        variant: 'destructive',
      });
    },
  });

  // Mutation para marcar como concluído
  const markCompletedMutation = useMutation({
    mutationFn: (enrollmentId: string) => trainingService.markAsCompleted(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      toast({
        title: 'Curso concluído!',
        description: 'Parabéns! Você concluiu o curso com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao marcar como concluído',
        description: error.response?.data?.message || 'Erro inesperado ao marcar curso como concluído.',
        variant: 'destructive',
      });
    },
  });

  return {
    enrollments,
    isLoading,
    error,
    refetch,
    enroll: enrollMutation.mutate,
    updateProgress: updateProgressMutation.mutate,
    markCompleted: markCompletedMutation.mutate,
    isEnrolling: enrollMutation.isPending,
    isUpdatingProgress: updateProgressMutation.isPending,
    isMarkingCompleted: markCompletedMutation.isPending,
  };
};

export const useUserEnrollments = (userId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar matrículas do usuário
  const {
    data: enrollments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-enrollments', userId],
    queryFn: () => trainingService.getEnrollments({ userId }),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Query para matrículas concluídas
  const {
    data: completedEnrollments = [],
    isLoading: isLoadingCompleted,
    refetch: refetchCompleted,
  } = useQuery({
    queryKey: ['user-completed-enrollments', userId],
    queryFn: () => trainingService.getCompletedEnrollments(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para matrículas em progresso
  const {
    data: inProgressEnrollments = [],
    isLoading: isLoadingInProgress,
    refetch: refetchInProgress,
  } = useQuery({
    queryKey: ['user-in-progress-enrollments', userId],
    queryFn: () => trainingService.getInProgressEnrollments(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Query para resumo de progresso
  const {
    data: progressSummary = [],
    isLoading: isLoadingProgressSummary,
    refetch: refetchProgressSummary,
  } = useQuery({
    queryKey: ['user-progress-summary', userId],
    queryFn: () => trainingService.getUserProgressSummary(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  return {
    enrollments,
    completedEnrollments,
    inProgressEnrollments,
    progressSummary,
    isLoading,
    isLoadingCompleted,
    isLoadingInProgress,
    isLoadingProgressSummary,
    error,
    refetch,
    refetchCompleted,
    refetchInProgress,
    refetchProgressSummary,
  };
};

export const useTrainingEnrollment = (id: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar uma matrícula específica
  const {
    data: enrollment,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['training-enrollment', id],
    queryFn: () => trainingService.getEnrollmentById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  return {
    enrollment,
    isLoading,
    error,
    refetch,
  };
};

export const useTrainingProgress = (userId: string, courseId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar progresso específico
  const {
    data: progress,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['training-progress', userId, courseId],
    queryFn: () => trainingService.getProgressSummary(userId, courseId),
    enabled: !!userId && !!courseId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });

  // Mutation para atualizar progresso
  const updateProgressMutation = useMutation({
    mutationFn: ({ enrollmentId, progress }: { enrollmentId: string; progress: UpdateTrainingProgressDto }) =>
      trainingService.updateProgress(enrollmentId, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-progress', userId, courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollments', userId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar progresso',
        description: error.response?.data?.message || 'Erro inesperado ao atualizar progresso.',
        variant: 'destructive',
      });
    },
  });

  return {
    progress,
    isLoading,
    error,
    refetch,
    updateProgress: updateProgressMutation.mutate,
    isUpdating: updateProgressMutation.isPending,
  };
};

export const useTrainingEnrollmentStats = (courseId: string) => {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['training-enrollment-stats', courseId],
    queryFn: () => trainingService.getCourseEnrollmentStats(courseId),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
};

export const useIsEnrolled = (userId: string, courseId: string) => {
  const {
    data: isEnrolled = false,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['is-enrolled', userId, courseId],
    queryFn: () => trainingService.isEnrolled(userId, courseId),
    enabled: !!userId && !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    isEnrolled,
    isLoading,
    error,
    refetch,
  };
};
