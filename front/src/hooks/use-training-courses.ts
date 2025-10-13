import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingService } from '../services/training-service';
import {
  TrainingCourse,
  CreateTrainingCourseDto,
  UpdateTrainingCourseDto,
  TrainingCourseFilters,
  TrainingCourseStats,
} from '../types/training';
import { useToast } from '../hooks/use-toast';

export const useTrainingCourses = (filters?: TrainingCourseFilters) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar cursos
  const {
    data: courses = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['training-courses', filters],
    queryFn: () => trainingService.getCourses(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para criar curso
  const createCourseMutation = useMutation({
    mutationFn: (course: CreateTrainingCourseDto) => trainingService.createCourse(course),
    onSuccess: (newCourse) => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      toast({
        title: 'Curso criado!',
        description: `O curso "${newCourse.title}" foi criado com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar curso',
        description: error.response?.data?.message || 'Erro inesperado ao criar curso.',
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar curso
  const updateCourseMutation = useMutation({
    mutationFn: ({ id, course }: { id: string; course: UpdateTrainingCourseDto }) =>
      trainingService.updateCourse(id, course),
    onSuccess: (updatedCourse) => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      queryClient.invalidateQueries({ queryKey: ['training-course', updatedCourse.id] });
      toast({
        title: 'Curso atualizado!',
        description: `O curso "${updatedCourse.title}" foi atualizado com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar curso',
        description: error.response?.data?.message || 'Erro inesperado ao atualizar curso.',
        variant: 'destructive',
      });
    },
  });

  // Mutation para deletar curso
  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => trainingService.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      toast({
        title: 'Curso deletado!',
        description: 'O curso foi deletado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao deletar curso',
        description: error.response?.data?.message || 'Erro inesperado ao deletar curso.',
        variant: 'destructive',
      });
    },
  });

  return {
    courses,
    isLoading,
    error,
    refetch,
    createCourse: createCourseMutation.mutate,
    updateCourse: updateCourseMutation.mutate,
    deleteCourse: deleteCourseMutation.mutate,
    isCreating: createCourseMutation.isPending,
    isUpdating: updateCourseMutation.isPending,
    isDeleting: deleteCourseMutation.isPending,
  };
};

export const useTrainingCourse = (id: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar um curso específico
  const {
    data: course,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['training-course', id],
    queryFn: () => trainingService.getCourseById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para buscar curso com matrículas
  const {
    data: courseWithEnrollments,
    isLoading: isLoadingWithEnrollments,
    refetch: refetchWithEnrollments,
  } = useQuery({
    queryKey: ['training-course-enrollments', id],
    queryFn: () => trainingService.getCourseWithEnrollments(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Query para estatísticas do curso
  const {
    data: courseStats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['training-course-stats', id],
    queryFn: () => trainingService.getCourseStats(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para atualizar curso
  const updateCourseMutation = useMutation({
    mutationFn: (course: UpdateTrainingCourseDto) => trainingService.updateCourse(id, course),
    onSuccess: (updatedCourse) => {
      queryClient.invalidateQueries({ queryKey: ['training-course', id] });
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      toast({
        title: 'Curso atualizado!',
        description: `O curso "${updatedCourse.title}" foi atualizado com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar curso',
        description: error.response?.data?.message || 'Erro inesperado ao atualizar curso.',
        variant: 'destructive',
      });
    },
  });

  return {
    course,
    courseWithEnrollments,
    courseStats,
    isLoading,
    isLoadingWithEnrollments,
    isLoadingStats,
    error,
    refetch,
    refetchWithEnrollments,
    refetchStats,
    updateCourse: updateCourseMutation.mutate,
    isUpdating: updateCourseMutation.isPending,
  };
};

export const useTopRatedCourses = (limit: number = 10) => {
  const {
    data: courses = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['top-rated-courses', limit],
    queryFn: () => trainingService.getTopRatedCourses(limit),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    courses,
    isLoading,
    error,
    refetch,
  };
};

export const useMostPopularCourses = (limit: number = 10) => {
  const {
    data: courses = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['most-popular-courses', limit],
    queryFn: () => trainingService.getMostPopularCourses(limit),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    courses,
    isLoading,
    error,
    refetch,
  };
};

export const useTrainingCategories = () => {
  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['training-categories'],
    queryFn: () => trainingService.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });

  const {
    data: categoryStats = {},
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['training-category-stats'],
    queryFn: () => trainingService.getCategoryStats(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });

  return {
    categories,
    categoryStats,
    isLoading,
    isLoadingStats,
    error,
    refetch,
    refetchStats,
  };
};

export const useTrainingCourseStats = (courseId: string) => {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['training-course-stats', courseId],
    queryFn: () => trainingService.getCourseStats(courseId),
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
