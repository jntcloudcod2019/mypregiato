import { apiClient } from './api-client';

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
  private readonly baseUrl = '/api/users';

  /**
   * Enviar convite via Clerk (Clerk envia email automaticamente)
   */
  async sendInvitation(data: CreateUserRequest): Promise<InvitationResponse> {
    return await apiClient.post<InvitationResponse>(`${this.baseUrl}/send-invitation`, data);
  }

  /**
   * Listar todos os usuários (opcionalmente filtrados por role)
   */
  async getAllUsers(role?: string): Promise<UserResponse[]> {
    const params = role ? `?role=${role}` : '';
    return await apiClient.get<UserResponse[]>(`${this.baseUrl}${params}`);
  }

  /**
   * Buscar usuário por email
   */
  async getUserByEmail(email: string): Promise<UserResponse> {
    return await apiClient.get<UserResponse>(`${this.baseUrl}/by-email/${encodeURIComponent(email)}`);
  }

  /**
   * Buscar usuário por Clerk ID
   */
  async getUserByClerkId(clerkId: string): Promise<UserResponse> {
    return await apiClient.get<UserResponse>(`${this.baseUrl}/by-clerk-id/${clerkId}`);
  }

  /**
   * Buscar usuário atual (logado)
   */
  async getCurrentUser(): Promise<UserResponse> {
    return await apiClient.get<UserResponse>(`${this.baseUrl}/me`);
  }

  /**
   * Atualizar usuário
   */
  async updateUser(id: string, data: Partial<CreateUserRequest>): Promise<UserResponse> {
    return await apiClient.put<UserResponse>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Deletar usuário
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Listar operadores
   */
  async getOperators(): Promise<UserResponse[]> {
    return await apiClient.get<UserResponse[]>(`${this.baseUrl}/operators`);
  }

  /**
   * Listar produtores
   */
  async getProducers(): Promise<UserResponse[]> {
    return await apiClient.get<UserResponse[]>(`${this.baseUrl}/producers`);
  }

  /**
   * Verificar se usuário é admin
   */
  async checkAdminRole(email: string): Promise<boolean> {
    return await apiClient.get<boolean>(`${this.baseUrl}/check-admin/${encodeURIComponent(email)}`);
  }

  /**
   * Reenviar convite para usuário pendente
   */
  async resendInvitation(userId: string): Promise<{ message: string; invitationId: string; email: string }> {
    return await apiClient.post(`${this.baseUrl}/resend-invitation/${userId}`, {});
  }

  /**
   * Cancelar convite pendente
   */
  async cancelInvitation(userId: string): Promise<{ message: string; email: string }> {
    return await apiClient.post(`${this.baseUrl}/cancel-invitation/${userId}`, {});
  }
}

export const userManagementService = new UserManagementService();

