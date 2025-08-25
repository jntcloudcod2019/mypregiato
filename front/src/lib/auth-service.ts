import { get } from '../services/api/api'

// Interface para o token de autenticação
interface AuthToken {
  token: string;
  expiresAt: Date;
}

// Função para obter token do Clerk
// Esta função deve ser chamada dentro de um componente React que usa o hook useClerkAuth
export const getClerkToken = async (): Promise<string | null> => {
  try {
    // Esta função agora será implementada nos componentes que precisam do token
    // usando o hook useClerkAuth
    console.warn('getClerkToken deve ser chamado através do hook useClerkAuth');
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
