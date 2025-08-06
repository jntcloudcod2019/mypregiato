import axios, { AxiosResponse, AxiosError } from 'axios';

// Configuração da instância principal do axios
const api = axios.create({
  baseURL: 'http://localhost:5001/api', // API .NET
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação (se necessário)
api.interceptors.request.use(
  (config) => {
    // Exemplo: Adicionar token de autorização
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
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

// Função genérica para requisições GET
// Exemplo de uso:
// const users = await get<User[]>('/users');
// const user = await get<User>('/users/123');
export const get = async <T>(url: string, params?: Record<string, any>): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await api.get(url, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Função genérica para requisições POST
// Exemplo de uso:
// await post('/users', {
//   name: "João Silva",
//   email: "joao@email.com",
//   role: "admin"
// });
export const post = async <T>(url: string, data: any): Promise<T> => {
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
export const put = async <T>(url: string, data: any): Promise<T> => {
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
export const patch = async <T>(url: string, data: any): Promise<T> => {
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
const handleApiError = (error: any) => {
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
  } else {
    // Erro na configuração da requisição
    return {
      status: -1,
      message: error.message || 'Erro desconhecido',
      data: null,
    };
  }
};

// Exportar a instância do axios para uso avançado
export { api };

// Tipos auxiliares
export interface ApiError {
  status: number;
  message: string;
  data: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}