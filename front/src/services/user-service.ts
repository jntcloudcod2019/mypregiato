
import { CurrentUser } from '@/types/whatsapp'

// Interface para resultado paginado
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Interface para usuário operador
export interface OperatorUser {
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

export class UserService {
  // Get user by email (API call)
  static async getUserByEmail(email: string): Promise<CurrentUser | null> {
    try {
      // Fazer chamada real à API
      const response = await fetch(`/api/users/by-email/${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        return null;
      }
      
      const user = await response.json();
      return {
        id: user.id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.role
      };
      
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      return null;
    }
  }

  // Get user by Clerk ID
  static async getUserByClerkId(clerkId: string): Promise<CurrentUser | null> {
    try {
      // Fazer chamada real à API
      const response = await fetch(`/api/users/by-clerk-id/${clerkId}`);
      
      if (!response.ok) {
        return null;
      }
      
      const user = await response.json();
      return {
        id: user.id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.role
      };
      
    } catch (error) {
      console.error('Erro ao buscar usuário por Clerk ID:', error);
      return null;
    }
  }

  // Get operators (API retorna lista simples)
  static async getOperators(page: number = 1, pageSize: number = 20, searchTerm?: string): Promise<PagedResult<OperatorUser>> {
    try {
      // Fazer chamada real à API
      const response = await fetch(`/api/users/operators`);
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      // API retorna lista simples de operadores
      const operators: OperatorUser[] = await response.json();
      
      // Aplicar filtro de busca se fornecido
      let filteredOperators = operators;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredOperators = operators.filter(op => 
          op.firstName.toLowerCase().includes(term) ||
          op.lastName.toLowerCase().includes(term) ||
          op.email.toLowerCase().includes(term)
        );
      }
      
      const totalCount = filteredOperators.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // Aplicar paginação
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const items = filteredOperators.slice(startIndex, endIndex);
      
      return {
        items,
        totalCount,
        page,
        pageSize,
        totalPages
      };
      
    } catch (error) {
      console.error('Erro ao buscar operadores da API:', error);
      
      // Fallback: retornar dados vazios em caso de erro
      return {
        items: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 0
      };
    }
  }

  // Check if user has permission to access WhatsApp features
  static hasWhatsAppAccess(userRole: string): boolean {
    return userRole !== 'TALENT'
  }
}
