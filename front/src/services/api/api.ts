import axios, { AxiosResponse, AxiosError } from 'axios';

// Configuração da instância principal do axios
const api = axios.create({
  baseURL: 'http://localhost:5656/api', // API .NET
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Cache de token para evitar requisições constantes ao Clerk
interface TokenCache {
  token: string | null;
  expiresAt: number;
}

let tokenCache: TokenCache = {
  token: null,
  expiresAt: 0
};

// Função para obter token do Clerk (será sobrescrita pelos componentes)
let getClerkTokenFunction: (() => Promise<string | null>) | null = null;

// Função para configurar o getClerkToken
export const setClerkTokenFunction = (fn: () => Promise<string | null>) => {
  getClerkTokenFunction = fn;
};

// Função para limpar o cache de token (útil para logout)
export const clearTokenCache = () => {
  tokenCache = {
    token: null,
    expiresAt: 0
  };
  console.log('[API] Cache de token limpo');
};

// Função para obter token com cache
const getCachedToken = async (): Promise<string | null> => {
  const now = Date.now();
  
  // Se o token ainda é válido (com margem de 5 minutos), usar do cache
  if (tokenCache.token && now < tokenCache.expiresAt - 300000) {
    return tokenCache.token;
  }
  
  // Se não há função para obter token, retornar null
  if (!getClerkTokenFunction) {
    return null;
  }
  
  try {
    const token = await getClerkTokenFunction();
    
    // Cache do token por 1 hora (3600000ms)
    tokenCache = {
      token,
      expiresAt: now + 3600000
    };
    
    return token;
  } catch (error) {
    console.error('Erro ao obter token do Clerk:', error);
    return null;
  }
};

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  async (config) => {
    try {
      // Adicionar token de autorização se disponível
      const token = await getCachedToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erro ao obter token do Clerk:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros globalmente
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Tratamento global de erros
    console.error('API Error:', error.response?.data || error.message);
    
    // Exemplo: Redirecionar para login se não autorizado
    // if (error.response?.status === 401) {
    //   localStorage.removeItem('authToken');
    //   window.location.href = '/login';
    // }
    
    return Promise.reject(error);
  }
);


export const get = async <T>(url: string, params?: Record<string, string | number | boolean>): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await api.get(url, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};


export const post = async <T>(url: string, data: Record<string, unknown>): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await api.post(url, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Função genérica para requisições PUT
// Exemplo de uso:
// await put('/users/123', {
//   name: "João Santos",
//   email: "joao.santos@email.com",
//   role: "user"
// });
export const put = async <T>(url: string, data: Record<string, unknown>): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await api.put(url, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Função genérica para requisições PATCH
// Exemplo de uso:
// await patch('/users/123', {
//   name: "João Santos"
// });
export const patch = async <T>(url: string, data: Record<string, unknown>): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await api.patch(url, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Função genérica para requisições DELETE
// Exemplo de uso:
// await del('/users/123');
export const del = async <T>(url: string): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await api.delete(url);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Função para upload de arquivos
// Exemplo de uso:
// const formData = new FormData();
// formData.append('file', file);
// formData.append('userId', '123');
// await uploadFile('/upload', formData);
export const uploadFile = async <T>(url: string, formData: FormData): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Função para tratar erros da API
const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Erro de resposta do servidor
      return {
        status: error.response.status,
        message: error.response.data?.message || 'Erro no servidor',
        data: error.response.data,
      };
    } else if (error.request) {
      // Erro de rede
      return {
        status: 0,
        message: 'Erro de conexão com o servidor',
        data: null,
      };
    }
  }
  
  // Erro na configuração da requisição ou erro desconhecido
  return {
    status: -1,
    message: error instanceof Error ? error.message : 'Erro desconhecido',
    data: null,
  };
};

// Exportar a instância do axios para uso avançado
export { api };

// Tipos auxiliares
export interface ApiError {
  status: number;
  message: string;
  data: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}