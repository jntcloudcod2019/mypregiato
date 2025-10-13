import { useState, useEffect } from 'react';
import apiClient from '@/services/api-client';

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export const useAuthUser = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implementar busca do email do usuário autenticado via Clerk
      // Por enquanto, vamos usar um email fixo para teste
      const userEmail = 'usuario@exemplo.com'; // Substituir pela implementação real do Clerk
      
      const response = await apiClient.get<AuthUser>(`/api/Users/email/${encodeURIComponent(userEmail)}`);
      setUser(response.data);
    } catch (err: any) {
      setError(err.response?.data || err.message || 'Erro ao buscar dados do usuário');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const isModel = user?.role === 'MODEL';
  const isAdmin = user?.role === 'ADMIN';
  const isInstructor = user?.role === 'INSTRUCTOR';

  return {
    user,
    loading,
    error,
    isModel,
    isAdmin,
    isInstructor,
    refetch: fetchUserData
  };
};
