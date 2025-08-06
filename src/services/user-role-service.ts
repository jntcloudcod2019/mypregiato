import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { useState, useEffect } from 'react';

export interface UserRole {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

export class UserRoleService {
  static async getUserRoleByEmail(email: string): Promise<UserRole | null> {
    try {
      const response = await axios.get(`http://localhost:5001/api/users/by-email/${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar role do usuário:', error);
      return null;
    }
  }

  static async getUserRoleByClerkId(clerkId: string): Promise<UserRole | null> {
    try {
      const response = await axios.get(`http://localhost:5001/api/users/by-clerk-id/${clerkId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar role do usuário:', error);
      return null;
    }
  }

  static isAdmin(role: string): boolean {
    return role?.toUpperCase() === 'ADMIN';
  }

  static isOperator(role: string): boolean {
    return ['ADMIN', 'OPERATOR', 'SUPERVISOR'].includes(role?.toUpperCase() || '');
  }
}

export const useUserRole = () => {
  const { user } = useUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const email = user.emailAddresses[0]?.emailAddress;
        const clerkId = user.id;

        if (email) {
          const role = await UserRoleService.getUserRoleByEmail(email);
          setUserRole(role);
        } else if (clerkId) {
          const role = await UserRoleService.getUserRoleByClerkId(clerkId);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Erro ao buscar role do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return {
    userRole,
    loading,
    isAdmin: userRole ? UserRoleService.isAdmin(userRole.role) : false,
    isOperator: userRole ? UserRoleService.isOperator(userRole.role) : false
  };
}; 