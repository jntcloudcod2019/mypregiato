# 📚 Módulo 12: Consumo de APIs para Desenvolvedores C#

## 🎯 Objetivos deste Módulo

- Entender diferentes formas de consumir APIs
- Dominar Axios e Fetch API
- Implementar tratamento de erros robusto
- Gerenciar autenticação e tokens
- Usar React Query para cache
- Ver exemplos do projeto real

## 📖 Formas de Consumir APIs

### Fetch API (Nativo)

```tsx
// Fetch básico
const response = await fetch('/api/users');
const users = await response.json();

// Fetch com opções
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ name: 'João' })
});

// Fetch com timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch('/api/users', {
    signal: controller.signal
  });
  const users = await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request timeout');
  }
} finally {
  clearTimeout(timeoutId);
}
```

### Axios (Biblioteca Popular)

```bash
npm install axios
```

```tsx
import axios from 'axios';

// Configuração global
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptors
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado, fazer logout
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Usando
const users = await api.get('/users');
const newUser = await api.post('/users', { name: 'João' });
```

**Equivalente em C#:**
```csharp
// C# - HttpClient
using var client = new HttpClient();
var response = await client.GetAsync("/api/users");
var users = await response.Content.ReadAsAsync<List<User>>();
```

## 🔧 Tratamento de Erros

### Tipos de Erro

```tsx
// Erros de rede
try {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const users = await response.json();
} catch (error) {
  if (error instanceof TypeError) {
    console.log('Erro de rede:', error.message);
  } else {
    console.log('Erro HTTP:', error.message);
  }
}

// Erros de validação
const validateUser = (user) => {
  if (!user.name) throw new Error('Nome é obrigatório');
  if (!user.email) throw new Error('Email é obrigatório');
  return user;
};

// Erros customizados
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### Error Boundaries para APIs

```tsx
function ApiErrorBoundary({ children, fallback }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (error) => {
      setError(error);
    };

    window.addEventListener('unhandledrejection', handleError);
    return () => window.removeEventListener('unhandledrejection', handleError);
  }, []);

  if (error) {
    return fallback || <div>Erro na API: {error.message}</div>;
  }

  return children;
}
```

## 🔐 Autenticação e Tokens

### JWT (JSON Web Tokens)

```tsx
// Obter token
const token = localStorage.getItem('token');

// Adicionar ao header
const response = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Verificar expiração
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Refresh token
const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });

    const { token } = await response.json();
    localStorage.setItem('token', token);
    return token;
  } catch (error) {
    // Fazer logout
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
};
```

### Clerk Authentication

```tsx
import { useAuth } from '@clerk/clerk-react';

function ApiClient() {
  const { getToken } = useAuth();

  const request = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  };

  return { request };
}
```

## 📦 React Query para Cache

### Configuração Básica

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MyApp />
    </QueryClientProvider>
  );
}
```

### Queries

```tsx
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // Refetch a cada 30s
  });
}

function UserList() {
  const { data: users, isLoading, error, refetch } = useUsers();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Mutations

```tsx
function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newUser) =>
      fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
        headers: { 'Content-Type': 'application/json' }
      }).then(res => res.json()),

    onSuccess: (data) => {
      // Atualizar cache
      queryClient.setQueryData(['users'], (old: User[] | undefined) => {
        return old ? [...old, data] : [data];
      });

      // Ou invalidar queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },

    onError: (error) => {
      console.error('Erro ao criar usuário:', error);
    }
  });
}
```

## 🎯 Padrões de API

### RESTful API

```tsx
// CRUD operations
const userService = {
  // GET /api/users
  getAll: () => api.get('/users'),

  // GET /api/users/123
  getById: (id: string) => api.get(`/users/${id}`),

  // POST /api/users
  create: (user: CreateUserDto) => api.post('/users', user),

  // PUT /api/users/123
  update: (id: string, user: UpdateUserDto) => api.put(`/users/${id}`, user),

  // DELETE /api/users/123
  delete: (id: string) => api.delete(`/users/${id}`),

  // GET /api/users/search?q=joao
  search: (query: string) => api.get(`/users/search?q=${query}`),
};
```

### Pagination

```tsx
interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function useUsersWithPagination(params: PaginationParams = {}) {
  return useQuery({
    queryKey: ['users', 'paginated', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });

      return fetch(`/api/users?${searchParams}`)
        .then(res => res.json());
    },
  });
}
```

### Upload de Arquivos

```tsx
function useFileUpload() {
  const uploadFile = async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      // Progress tracking para uploads grandes
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });

    return response.json();
  };

  return { uploadFile };
}
```

## 🔄 Real-time APIs

### WebSockets

```tsx
function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = (message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  };

  return { messages, isConnected, sendMessage };
}
```

### Server-Sent Events (SSE)

```tsx
function useSSE(url: string) {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('SSE connected');
    };

    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setData(message);
    };

    eventSource.onerror = (error) => {
      setIsConnected(false);
      console.error('SSE error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [url]);

  return { data, isConnected };
}
```

## 📋 Configuração do Projeto Real

### API Client com Axios

```tsx
// front/src/services/api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pregiato-api-production.up.railway.app';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor para adicionar token de autenticação
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const clerk = (window as { Clerk?: { session?: { getToken: () => Promise<string> } } }).Clerk;
          if (clerk?.session) {
            const token = await clerk.session.getToken();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
        } catch (error) {
          console.warn('[API] Erro ao obter token do Clerk:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor para tratamento de erros
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('[API] 401 Unauthorized - Token inválido ou expirado');
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    const response = await this.client.post<T>(url, formData, config);
    return response.data;
  }

  async uploadVideoChunk(
    url: string,
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    onProgress?: (progress: number) => void
  ): Promise<unknown> {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    const response = await this.client.post(url, formData, config);
    return response.data;
  }

  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
```

### Service Pattern

```tsx
// front/src/services/user-management-service.ts
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

export class UserManagementService {
  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pregiato-api-production.up.railway.app';

  async getAllUsers(): Promise<UserResponse[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/users`, {
        headers: {
          'Content-Type': 'application/json'
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

  async getUserByEmail(email: string): Promise<UserResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/Users/by-email/${encodeURIComponent(email)}`, {
        headers: {
          'Content-Type': 'application/json'
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

  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<CreateUserRequest>): Promise<UserResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
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

  async deleteUser(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
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
}

export const userManagementService = new UserManagementService();
```

### React Query Integration

```tsx
// front/src/hooks/use-training-courses.ts
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
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      const responseData = response as { course?: TrainingCourse; message?: string };
      const courseData = responseData.course || response;
      const message = responseData.message || `O curso "${courseData.title}" foi criado com sucesso.`;

      toast({
        title: 'Curso criado!',
        description: message,
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao criar curso.';
      toast({
        title: 'Erro ao criar curso',
        description: errorMessage,
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
    isCreating: createCourseMutation.isPending,
  };
};
```

## 🧪 Exercícios Práticos

### Exercício 1: API Client Completo

```tsx
// Criar um API client completo com todas as funcionalidades
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  retries?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private config: ApiConfig;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseURL: config.baseURL || '/api',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Adicionar token de autenticação
        if (!config.skipAuth) {
          const token = await this.getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Adicionar timestamp para cache busting
        config.headers['X-Request-Time'] = Date.now().toString();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { config } = error;

        // Retry logic
        if (config && !config.retriesUsed && this.shouldRetry(error)) {
          config.retriesUsed = (config.retriesUsed || 0) + 1;

          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          return this.client.request(config);
        }

        // Handle 401 errors
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const clerk = (window as any).Clerk;
      if (clerk?.session) {
        return await clerk.session.getToken();
      }
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  }

  private shouldRetry(error: any): boolean {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    return retryableStatusCodes.includes(error.response?.status);
  }

  private handleUnauthorized() {
    localStorage.removeItem('token');
    // Trigger logout in auth system
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  private transformError(error: any) {
    return {
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      code: error.response?.data?.code,
      details: error.response?.data?.details,
    };
  }

  // HTTP Methods
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // File Upload
  async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    return this.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  // Batch requests
  async batch<T>(requests: Array<{ url: string; method?: string; data?: any }>): Promise<T[]> {
    const promises = requests.map(async (req) => {
      const { url, method = 'GET', data } = req;
      return this.request(url, { method, data });
    });

    return Promise.all(promises);
  }

  // Generic request method
  async request<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.client.request<T>({ url, ...config });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

// Service específico
class UserService extends ApiClient {
  async getUsers(params?: { page?: number; limit?: number }) {
    return this.get<{ users: User[]; total: number }>('/users', { params });
  }

  async getUser(id: string) {
    return this.get<User>(`/users/${id}`);
  }

  async createUser(userData: CreateUserDto) {
    return this.post<User>('/users', userData);
  }

  async updateUser(id: string, userData: UpdateUserDto) {
    return this.put<User>(`/users/${id}`, userData);
  }

  async deleteUser(id: string) {
    return this.delete(`/users/${id}`);
  }

  async uploadAvatar(userId: string, file: File) {
    return this.uploadFile<{ url: string }>(`/users/${userId}/avatar`, file);
  }
}

export const apiClient = new ApiClient();
export const userService = new UserService();
```

### Exercício 2: Real-time API com WebSockets

```tsx
// Criar um sistema de chat em tempo real
import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
  type: 'message' | 'system';
}

interface ChatState {
  messages: Message[];
  users: string[];
  isConnected: boolean;
  error: string | null;
}

function useChat(roomId: string) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    users: [],
    isConnected: false,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(`ws://localhost:3001/chat/${roomId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Chat WebSocket connected');
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        setState(prev => {
          switch (message.type) {
            case 'message':
              return {
                ...prev,
                messages: [...prev.messages, {
                  id: message.id,
                  user: message.user,
                  text: message.text,
                  timestamp: new Date(message.timestamp),
                  type: 'message',
                }],
              };

            case 'user_joined':
              return {
                ...prev,
                users: [...prev.users, message.user],
                messages: [...prev.messages, {
                  id: message.id,
                  user: 'System',
                  text: `${message.user} joined the chat`,
                  timestamp: new Date(),
                  type: 'system',
                }],
              };

            case 'user_left':
              return {
                ...prev,
                users: prev.users.filter(u => u !== message.user),
                messages: [...prev.messages, {
                  id: message.id,
                  user: 'System',
                  text: `${message.user} left the chat`,
                  timestamp: new Date(),
                  type: 'system',
                }],
              };

            default:
              return prev;
          }
        });
      };

      ws.onclose = () => {
        console.log('Chat WebSocket disconnected');
        setState(prev => ({ ...prev, isConnected: false }));

        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
        setState(prev => ({
          ...prev,
          error: 'Connection error',
          isConnected: false
        }));
      };

    } catch (error) {
      console.error('Failed to connect to chat:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to connect',
        isConnected: false
      }));
    }
  }, [roomId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (wsRef.current && state.isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        text,
        timestamp: new Date().toISOString(),
      }));
    }
  }, [state.isConnected]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    sendMessage,
    reconnect: connect,
  };
}

// Componente Chat
function Chat({ roomId }: { roomId: string }) {
  const { messages, users, isConnected, error, sendMessage } = useChat(roomId);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat Room: {roomId}</h2>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        <div className="users-online">
          {users.length} users online
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="messages-container">
        <div className="messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.type === 'system' ? 'system' : ''}`}
            >
              <div className="message-header">
                <span className="user">{msg.user}</span>
                <span className="timestamp">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="message-text">{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="message-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        <button type="submit" disabled={!isConnected || !message.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
```

### Exercício 3: GraphQL Client

```tsx
// Implementar GraphQL client
import { useState, useEffect } from 'react';

interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
}

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

class GraphQLClient {
  private endpoint: string;
  private headers: Record<string, string>;

  constructor(endpoint: string, headers: Record<string, string> = {}) {
    this.endpoint = endpoint;
    this.headers = {
      'Content-Type': 'application/json',
      ...headers,
    };
  }

  async request<T>(request: GraphQLRequest): Promise<GraphQLResponse<T>> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await this.request<T>({ query, variables });
    if (response.errors) {
      throw new Error(response.errors[0].message);
    }
    return response.data;
  }

  async mutate<T>(mutation: string, variables?: Record<string, any>): Promise<T> {
    return this.query(mutation, variables);
  }
}

// Hook para GraphQL
function useGraphQL<T>(
  query: string,
  variables?: Record<string, any>,
  options: { enabled?: boolean; refetchInterval?: number } = {}
) {
  const { enabled = true, refetchInterval } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const client = new GraphQLClient('/graphql');

  const fetchData = async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      const result = await client.query<T>(query, variables);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [query, JSON.stringify(variables), enabled]);

  useEffect(() => {
    if (!refetchInterval) return;

    const interval = setInterval(fetchData, refetchInterval);
    return () => clearInterval(interval);
  }, [refetchInterval]);

  return { data, loading, error, refetch: fetchData };
}

// Usando GraphQL
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error } = useGraphQL(`
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
        posts {
          id
          title
          content
        }
      }
    }
  `, { id: userId });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>

      <h2>Posts</h2>
      {user?.posts?.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🎯 Pontos Críticos para Desenvolvedores C#

### 1. **Async/Await vs Promises**

```tsx
// ❌ Callbacks (pyramid of doom)
fetch('/api/users')
  .then(response => response.json())
  .then(users => {
    fetch(`/api/users/${users[0].id}`)
      .then(response => response.json())
      .then(user => console.log(user))
      .catch(error => console.error(error));
  })
  .catch(error => console.error(error));

// ✅ Async/Await
try {
  const users = await fetch('/api/users').then(r => r.json());
  const user = await fetch(`/api/users/${users[0].id}`).then(r => r.json());
  console.log(user);
} catch (error) {
  console.error(error);
}
```

### 2. **Error Handling**

```tsx
// ❌ Sem tratamento de erro
const users = await api.get('/users');

// ✅ Com tratamento de erro
try {
  const users = await api.get('/users');
} catch (error) {
  if (error.response?.status === 404) {
    // Usuário não encontrado
  } else if (error.response?.status === 401) {
    // Token expirado
    logout();
  } else {
    // Erro genérico
    showError('Erro ao carregar usuários');
  }
}
```

### 3. **Type Safety**

```tsx
// ❌ Sem tipagem
const users = await api.get('/users');

// ✅ Com tipagem
interface User {
  id: string;
  name: string;
  email: string;
}

const users = await api.get<User[]>('/users');
```

### 4. **Loading States**

```tsx
// ❌ Sem loading state
const users = await api.get('/users');

// ✅ Com loading state
const { data: users, loading, error } = useUsers();

// No componente
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <UserList users={users} />;
```

## 🏁 Conclusão

Consumo de APIs em React envolve **múltiplas estratégias**:

1. **Fetch API** para casos simples
2. **Axios** para aplicações complexas
3. **React Query** para gerenciamento de cache
4. **WebSockets** para tempo real
5. **GraphQL** para queries flexíveis

## 📚 Próximos Passos

Agora que você domina consumo de APIs, está pronto para:

- **Módulo 13:** Padrões de design e boas práticas
- **Módulo 14:** Projetos práticos completos

## 🎯 Resumo do que Aprendemos

✅ **Fetch API vs Axios**
✅ **Tratamento de erros robusto**
✅ **Autenticação e tokens**
✅ **React Query para cache**
✅ **WebSockets e tempo real**
✅ **GraphQL básico**
✅ **Upload de arquivos**
✅ **Exemplos do projeto real**

---

**🎓 Parabéns! Você completou o Módulo 12!**

**Continue para o [Módulo 13: Padrões de Design e Boas Práticas](Modulo-13-Padroes-Design.md)**

