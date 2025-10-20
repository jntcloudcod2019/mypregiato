export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MODEL' | 'PRODUCER' | 'OPERATOR';
}

export interface UserResponse {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationResponse {
  message: string;
  invitationId: string;
  status: string;
  email: string;
  note: string;
}

export class UserManagementService {
  // ✅ URL base explícita - pode ser sobrescrita via env ou deixar como está
  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pregiato-api-production.up.railway.app';
  
  constructor() {
    console.log('🔧 [USER-SERVICE] Inicializando com API_BASE_URL:', this.API_BASE_URL);
  }

  /**
   * Enviar convite via Clerk (Clerk envia email automaticamente)
   */
  async sendInvitation(data: CreateUserRequest): Promise<InvitationResponse> {
    try {
      const url = `${this.API_BASE_URL}/api/users/send-invitation`;
      console.log('📤 [USER-SERVICE] URL completa:', url);
      console.log('📤 [USER-SERVICE] Enviando convite para:', data);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      throw error;
    }
  }

  /**
   * Obter token de autenticação do Clerk
   */
  private async getAuthToken(): Promise<string> {
    try {
      const clerk = (window as { Clerk?: { session?: { getToken: () => Promise<string> } } }).Clerk;
      if (clerk?.session) {
        return await clerk.session.getToken() || '';
      }
      return '';
    } catch (error) {
      console.warn('Erro ao obter token do Clerk:', error);
      return '';
    }
  }

  /**
   * Listar todos os usuários (opcionalmente filtrados por role)
   */
  async getAllUsers(role?: string): Promise<UserResponse[]> {
    try {
      const params = role ? `?role=${role}` : '';
      const url = `${this.API_BASE_URL}/api/users${params}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  }

  /**
   * Buscar usuário por email
   */
  async getUserByEmail(email: string): Promise<UserResponse> {
    try {
      const url = `${this.API_BASE_URL}/api/users/by-email/${encodeURIComponent(email)}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  /**
   * Buscar usuário por Clerk ID
   */
  async getUserByClerkId(clerkId: string): Promise<UserResponse> {
    try {
      const url = `${this.API_BASE_URL}/api/users/by-clerk-id/${clerkId}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar usuário por Clerk ID:', error);
      throw error;
    }
  }

  /**
   * Buscar usuário atual (logado)
   */
  async getCurrentUser(): Promise<UserResponse> {
    try {
      const url = `${this.API_BASE_URL}/api/users/me`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
      throw error;
    }
  }

  /**
   * Atualizar usuário
   */
  async updateUser(id: string, data: Partial<CreateUserRequest>): Promise<UserResponse> {
    try {
      const url = `${this.API_BASE_URL}/api/users/${id}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  /**
   * Deletar usuário
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const url = `${this.API_BASE_URL}/api/users/${id}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  }

  /**
   * Listar operadores
   */
  async getOperators(): Promise<UserResponse[]> {
    try {
      const url = `${this.API_BASE_URL}/api/users/operators`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar operadores:', error);
      throw error;
    }
  }

  /**
   * Listar produtores
   */
  async getProducers(): Promise<UserResponse[]> {
    try {
      const url = `${this.API_BASE_URL}/api/users/producers`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar produtores:', error);
      throw error;
    }
  }

  /**
   * Verificar se usuário é admin
   */
  async checkAdminRole(email: string): Promise<boolean> {
    try {
      const url = `${this.API_BASE_URL}/api/users/check-admin/${encodeURIComponent(email)}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao verificar role de admin:', error);
      throw error;
    }
  }

  /**
   * Reenviar convite para usuário pendente
   */
  async resendInvitation(userId: string): Promise<{ message: string; invitationId: string; email: string }> {
    try {
      const url = `${this.API_BASE_URL}/api/users/resend-invitation/${userId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao reenviar convite:', error);
      throw error;
    }
  }

  /**
   * Cancelar convite pendente
   */
  async cancelInvitation(userId: string): Promise<{ message: string; email: string }> {
    try {
      const url = `${this.API_BASE_URL}/api/users/cancel-invitation/${userId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      throw error;
    }
  }
}

export const userManagementService = new UserManagementService();

