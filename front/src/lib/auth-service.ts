import { get } from '../services/api/api'

// Interface para o token de autenticação
interface AuthToken {
  token: string;
  expiresAt: Date;
}

// Função para obter token do Clerk (mock para desenvolvimento)
export const getClerkToken = async (): Promise<string | null> => {
  try {
    // Em produção, isso seria obtido do Clerk
    // Por enquanto, retornamos null para permitir acesso sem autenticação
    return null;
  } catch (error) {
    console.error('Erro ao obter token do Clerk:', error);
    return null;
  }
}

// Função para verificar se o usuário está autenticado
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await getClerkToken();
    return !!token;
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return false;
  }
}

// Função para obter dados do usuário atual
export const getCurrentUser = async () => {
  try {
    const user = await get('/users/me');
    return user;
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
}
