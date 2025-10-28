# 📚 Módulo 6: Hooks Avançados do React para Desenvolvedores C#

## 🎯 Objetivos deste Módulo

- Dominar todos os hooks básicos (useState, useEffect, useContext)
- Aprender hooks avançados (useReducer, useMemo, useCallback)
- Criar custom hooks poderosos
- Entender performance optimization
- Ver exemplos práticos do projeto real

## 📖 Hooks Básicos

### useState - Gerenciamento de Estado

```tsx
import { useState } from 'react';

function Contador() {
  // Estado simples
  const [contador, setContador] = useState(0);

  // Estado com objeto
  const [usuario, setUsuario] = useState({
    nome: '',
    email: '',
    idade: 0
  });

  // Estado com array
  const [lista, setLista] = useState<string[]>([]);

  // Estado com função de inicialização
  const [caro, setCaro] = useState(() => {
    console.log('Calculando valor inicial...');
    return 0; // Cálculo pesado
  });

  return (
    <div>
      <h1>Contador: {contador}</h1>
      <button onClick={() => setContador(contador + 1)}>
        Incrementar
      </button>

      <input
        value={usuario.nome}
        onChange={(e) => setUsuario({
          ...usuario,
          nome: e.target.value
        })}
      />
    </div>
  );
}
```

**Equivalente em C#:**
```csharp
// C# - Propriedade com INotifyPropertyChanged
public class ContadorViewModel : INotifyPropertyChanged {
  private int _contador;
  public int Contador {
    get => _contador;
    set {
      _contador = value;
      OnPropertyChanged();
    }
  }
}
```

### useEffect - Efeitos Colaterais

```tsx
import { useState, useEffect } from 'react';

function UsuarioProfile({ usuarioId }: { usuarioId: string }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // componentDidMount + componentDidUpdate
    console.log('Componente montado ou usuarioId mudou');

    const fetchUsuario = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/usuarios/${usuarioId}`);
        const data = await response.json();
        setUsuario(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();

    // Cleanup (componentWillUnmount)
    return () => {
      console.log('Limpando efeito...');
      // Cancelar requests, limpar timers, etc
    };
  }, [usuarioId]); // Dependências

  // Múltiplos useEffect
  useEffect(() => {
    document.title = `Usuário: ${usuario?.nome || 'Carregando...'}`;
  }, [usuario?.nome]);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log('Tick');
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Só executa no mount

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return <div>{usuario?.nome}</div>;
}
```

### useContext - Compartilhar Estado

```tsx
// Criando context
const ThemeContext = createContext<{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
} | undefined>(undefined);

// Provider
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook customizado
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Usando
function App() {
  return (
    <ThemeProvider>
      <Header />
      <MainContent />
      <Footer />
    </ThemeProvider>
  );
}

function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>
      <button onClick={toggleTheme}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>
  );
}
```

## 🌟 Hooks Avançados

### useReducer - Estado Complexo

```tsx
// Definindo actions
type TodoAction =
  | { type: 'ADD_TODO'; payload: string }
  | { type: 'TOGGLE_TODO'; payload: number }
  | { type: 'DELETE_TODO'; payload: number }
  | { type: 'SET_FILTER'; payload: 'all' | 'active' | 'completed' };

// Estado inicial
interface TodoState {
  todos: Array<{ id: number; text: string; completed: boolean }>;
  filter: 'all' | 'active' | 'completed';
  nextId: number;
}

// Reducer
function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [
          ...state.todos,
          { id: state.nextId, text: action.payload, completed: false }
        ],
        nextId: state.nextId + 1
      };

    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      };

    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload)
      };

    case 'SET_FILTER':
      return { ...state, filter: action.payload };

    default:
      return state;
  }
}

// Componente usando useReducer
function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [],
    filter: 'all',
    nextId: 1
  });

  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim()) {
      dispatch({ type: 'ADD_TODO', payload: inputValue });
      setInputValue('');
    }
  };

  const filteredTodos = state.todos.filter(todo => {
    if (state.filter === 'active') return !todo.completed;
    if (state.filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <div>
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && addTodo()}
      />
      <button onClick={addTodo}>Adicionar</button>

      <div>
        <button onClick={() => dispatch({ type: 'SET_FILTER', payload: 'all' })}>
          Todos
        </button>
        <button onClick={() => dispatch({ type: 'SET_FILTER', payload: 'active' })}>
          Ativos
        </button>
        <button onClick={() => dispatch({ type: 'SET_FILTER', payload: 'completed' })}>
          Concluídos
        </button>
      </div>

      <ul>
        {filteredTodos.map(todo => (
          <li key={todo.id}>
            <span style={{
              textDecoration: todo.completed ? 'line-through' : 'none'
            }}>
              {todo.text}
            </span>
            <button onClick={() => dispatch({ type: 'TOGGLE_TODO', payload: todo.id })}>
              {todo.completed ? 'Desmarcar' : 'Marcar'}
            </button>
            <button onClick={() => dispatch({ type: 'DELETE_TODO', payload: todo.id })}>
              Deletar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Equivalente em C#:**
```csharp
// C# - State Pattern ou Command Pattern
public class TodoStore {
  private List<Todo> _todos = new();
  private string _filter = "all";

  public event Action StateChanged;

  public void AddTodo(string text) {
    _todos.Add(new Todo { Id = _todos.Count + 1, Text = text });
    StateChanged?.Invoke();
  }

  public void ToggleTodo(int id) {
    var todo = _todos.FirstOrDefault(t => t.Id == id);
    if (todo != null) {
      todo.Completed = !todo.Completed;
      StateChanged?.Invoke();
    }
  }
}
```

### useMemo - Memoização de Valores

```tsx
function ExpensiveCalculation({ items }: { items: number[] }) {
  // ✅ Memoiza cálculo caro
  const total = useMemo(() => {
    console.log('Calculando total...');
    return items.reduce((sum, item) => sum + item, 0);
  }, [items]); // Só recalcula quando items mudar

  // ❌ Sem memoização (recalcula em todo render)
  const totalSemMemo = items.reduce((sum, item) => sum + item, 0);

  return (
    <div>
      <h1>Total (com memo): {total}</h1>
      <h1>Total (sem memo): {totalSemMemo}</h1>
    </div>
  );
}
```

### useCallback - Memoização de Funções

```tsx
function TodoList({ todos, onToggleTodo }: Props) {
  // ✅ Memoiza função (evita re-renders desnecessários)
  const handleToggle = useCallback((id: number) => {
    onToggleTodo(id);
  }, [onToggleTodo]);

  // ❌ Sem memoização (nova função a cada render)
  const handleToggleSemMemo = (id: number) => {
    onToggleTodo(id);
  };

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <button onClick={() => handleToggle(todo.id)}>
            Toggle
          </button>
          <span>{todo.text}</span>
        </li>
      ))}
    </ul>
  );
}
```

## 🎯 Custom Hooks

### Hook para Local Storage

```tsx
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao ler localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erro ao salvar localStorage key "${key}":`, error);
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Erro ao remover localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue];
}

// Usando
function ThemeToggle() {
  const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');

  return (
    <div>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <button onClick={removeTheme}>Reset Theme</button>
    </div>
  );
}
```

### Hook para API com Cache

```tsx
interface UseApiOptions {
  cacheTime?: number;
  retry?: number;
  immediate?: boolean;
}

function useApi<T>(
  url: string,
  options: UseApiOptions = {}
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { cacheTime = 300000, retry = 3, immediate = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const cache = useRef<{ data: T; timestamp: number } | null>(null);

  const fetchData = useCallback(async (isRetry = false) => {
    // Verificar cache
    if (cache.current && !isRetry) {
      const isExpired = Date.now() - cache.current.timestamp > cacheTime;
      if (!isExpired) {
        setData(cache.current.data);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      setData(result);

      // Salvar no cache
      cache.current = { data: result, timestamp: Date.now() };

    } catch (err) {
      if (!isRetry && retry > 0) {
        setTimeout(() => fetchData(true), 1000);
      } else {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      }
    } finally {
      setLoading(false);
    }
  }, [url, cacheTime, retry]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  return { data, loading, error, refetch: () => fetchData(true) };
}

// Hook específico
function useUser(userId: string) {
  return useApi(`/api/users/${userId}`);
}
```

### Hook para Debounce

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usando
function SearchInput() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (debouncedSearch) {
      console.log('Pesquisando por:', debouncedSearch);
      // Fazer busca na API
    }
  }, [debouncedSearch]);

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Digite para pesquisar..."
    />
  );
}
```

### Hook para Previous Value

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

// Usando
function ValueChangeDetector({ value }: { value: number }) {
  const previousValue = usePrevious(value);

  useEffect(() => {
    if (previousValue !== undefined && previousValue !== value) {
      console.log(`Valor mudou de ${previousValue} para ${value}`);
    }
  }, [value, previousValue]);

  return <div>Valor atual: {value}</div>;
}
```

## 🚀 Performance Optimization

### React.memo

```tsx
// Componente memoizado
const ExpensiveComponent = React.memo<{
  data: any;
  onClick: () => void;
}>(({ data, onClick }) => {
  console.log('ExpensiveComponent renderizado');
  return (
    <div onClick={onClick}>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
});

// Só re-renderiza se props mudarem
<ExpensiveComponent data={items} onClick={handleClick} />
```

### useMemo para Objects/Arrays

```tsx
function UserList({ users }: { users: User[] }) {
  // ✅ Memoizar objeto de estilo
  const listStyle = useMemo(() => ({
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1rem'
  }), []);

  // ✅ Memoizar array filtrado
  const activeUsers = useMemo(() => {
    return users.filter(user => user.isActive);
  }, [users]);

  // ✅ Memoizar lista renderizada
  const userElements = useMemo(() => {
    return activeUsers.map(user => (
      <UserCard key={user.id} user={user} />
    ));
  }, [activeUsers]);

  return (
    <div style={listStyle}>
      {userElements}
    </div>
  );
}
```

### useCallback para Event Handlers

```tsx
function TodoList({ todos, onToggle, onDelete }: TodoListProps) {
  // ✅ Memoizar handlers
  const handleToggle = useCallback((id: number) => {
    onToggle(id);
  }, [onToggle]);

  const handleDelete = useCallback((id: number) => {
    onDelete(id);
  }, [onDelete]);

  // ✅ Memoizar lista de items
  const todoItems = useMemo(() => {
    return todos.map(todo => (
      <TodoItem
        key={todo.id}
        todo={todo}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    ));
  }, [todos, handleToggle, handleDelete]);

  return <div>{todoItems}</div>;
}
```

## 📦 Hooks do Projeto Real

### 1. useTrainingCourses (React Query + Mutations)

```tsx
// front/src/hooks/use-training-courses.ts
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingService } from '../services/training-service';
import {
  TrainingCourse,
  CreateTrainingCourseDto,
  UpdateTrainingCourseDto,
  TrainingCourseFilters,
  TrainingCourseStats,
} from '../types/training';
import { useToast } from '../hooks/use-toast';

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

  // Mutation para atualizar curso
  const updateCourseMutation = useMutation({
    mutationFn: ({ id, course }: { id: string; course: UpdateTrainingCourseDto }) =>
      trainingService.updateCourse(id, course),
    onSuccess: (updatedCourse) => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      queryClient.invalidateQueries({ queryKey: ['training-course', updatedCourse.id] });
      toast({
        title: 'Curso atualizado!',
        description: `O curso "${updatedCourse.title}" foi atualizado com sucesso.`,
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao atualizar curso.';
      toast({
        title: 'Erro ao atualizar curso',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Mutation para deletar curso
  const deleteCourseMutation = useMutation({
    mutationFn: (id: string) => trainingService.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      toast({
        title: 'Curso deletado!',
        description: 'O curso foi deletado com sucesso.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao deletar curso.';
      toast({
        title: 'Erro ao deletar curso',
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
    updateCourse: updateCourseMutation.mutate,
    deleteCourse: deleteCourseMutation.mutate,
    isCreating: createCourseMutation.isPending,
    isUpdating: updateCourseMutation.isPending,
    isDeleting: deleteCourseMutation.isPending,
  };
};
```

### 2. useWhatsAppConnection (Estado Complexo)

```tsx
// front/src/hooks/useWhatsAppConnection.ts
export const useWhatsAppConnection = () => {
  const [connectionState, setConnectionState] = useState<WhatsAppConnectionState>({
    status: ConnectionStatus.disconnected,
    isConnected: false,
    canGenerateQR: true
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // ✅ Verificação inicial simplificada
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/whatsapp/status`);
        if (response.ok) {
          const statusData = await response.json();
          const isActuallyConnected = Boolean(statusData.sessionConnected);
          const nextStatus = isActuallyConnected ? ConnectionStatus.connected : ConnectionStatus.disconnected;

          setConnectionState(prev => ({
            ...prev,
            status: nextStatus,
            isConnected: isActuallyConnected,
            lastActivity: statusData.lastActivity,
            error: undefined,
            canGenerateQR: !isActuallyConnected,
            connectedNumber: statusData.connectedNumber,
            isFullyValidated: statusData.isFullyValidated
          }));
        }
      } catch (error) {
        console.error('Erro na verificação inicial:', error);
        setConnectionState(prev => ({
          ...prev,
          status: ConnectionStatus.disconnected,
          isConnected: false,
          error: 'Erro de conexão'
        }));
      }
    };

    checkInitialStatus();
  }, []);

  // Listener para atualizações de status via SignalR
  useEffect(() => {
    const handleStatusUpdate = (statusData: BotStatusUpdate) => {
      const isActuallyConnected = Boolean(statusData.sessionConnected);
      const nextStatus = isActuallyConnected ? ConnectionStatus.connected : ConnectionStatus.disconnected;

      setConnectionState(prev => ({
        ...prev,
        status: nextStatus,
        isConnected: isActuallyConnected,
        lastActivity: statusData.lastActivity,
        error: undefined,
        canGenerateQR: !isActuallyConnected,
        connectedNumber: statusData.connectedNumber || prev.connectedNumber,
        hasQRCode: false,
        qrCode: undefined
      }));
    };

    qrCodeQueueService.addListener('bot.status.update', handleStatusUpdate);

    return () => {
      qrCodeQueueService.removeListener('bot.status.update', handleStatusUpdate);
    };
  }, []);

  const getQRCode = useCallback(async () => {
    try {
      const qrResponse: QRCodeResponse = await rabbitMQService.getQRCode();
      setConnectionState(prev => ({
        ...prev,
        qrCode: qrResponse.qrCode,
        hasQRCode: true
      }));
      return qrResponse.qrCode;
    } catch (error) {
      return null;
    }
  }, []);

  const generateQR = useCallback(async () => {
    if (isGeneratingQR) return;
    setIsGeneratingQR(true);
    setConnectionState(prev => ({ ...prev, status: ConnectionStatus.generating, error: undefined }));

    try {
      const result = await rabbitMQService.generateQR();
      if (!result.success) {
        setConnectionState(prev => ({
          ...prev,
          error: result.message || 'Falha ao gerar QR code',
          status: ConnectionStatus.disconnected
        }));
        return;
      }
      toast?.('Comando enviado. Aguardando QR...');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao comunicar com o servidor';
      setConnectionState(prev => ({ ...prev, error: errorMessage, status: ConnectionStatus.disconnected }));
    } finally {
      setIsGeneratingQR(false);
    }
  }, [isGeneratingQR]);

  return {
    ...connectionState,
    isConnecting,
    isGeneratingQR,
    generateQR,
    getQRCode,
  };
};
```

### 3. useAuthPermissions (Context + Hooks)

```tsx
// front/src/contexts/AuthPermissionsContext.tsx
export const AuthPermissionsProvider: React.FC<AuthPermissionsProviderProps> = ({ children }) => {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!isSignedIn || !clerkUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const email = clerkUser.primaryEmailAddress?.emailAddress;

      if (!email) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await apiClient.get<UserData>(`/api/Users/by-email/${encodeURIComponent(email)}`);

      setUser(response);
      setError(null);
    } catch (err) {
      console.warn('Usuário não encontrado no banco de dados, permitindo acesso em modo degradado');
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, clerkUser]);

  useEffect(() => {
    if (isClerkLoaded) {
      fetchUserData();
    }
  }, [isClerkLoaded, fetchUserData]);

  // Funções de verificação de permissão
  const checkPermission = useCallback((permission: Permission): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  }, [role]);

  const checkAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!role) return false;
    return hasAllPermissions(role, permissions);
  }, [role]);

  const checkAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!role) return false;
    return hasAnyPermission(role, permissions);
  }, [role]);

  // Helpers de role
  const isAdmin = role === UserRole.ADMIN;
  const isInstructor = role === UserRole.INSTRUCTOR;
  const isOperator = role === UserRole.OPERATOR;
  const isProducer = role === UserRole.PRODUCER;
  const isModel = role === UserRole.MODEL;
  const isStudent = role === UserRole.STUDENT;

  const value: AuthPermissionsContextType = {
    user,
    role,
    isLoading,
    error,
    hasPermission: checkPermission,
    hasAllPermissions: checkAllPermissions,
    hasAnyPermission: checkAnyPermission,
    isAdmin,
    isInstructor,
    isOperator,
    isProducer,
    isModel,
    isStudent,
    refetch: fetchUserData,
  };

  return (
    <AuthPermissionsContext.Provider value={value}>
      {children}
    </AuthPermissionsContext.Provider>
  );
};
```

## 🧪 Exercícios Práticos

### Exercício 1: Todo App com useReducer

```tsx
// Criar um todo app completo usando useReducer
interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

type TodoAction =
  | { type: 'ADD_TODO'; payload: { text: string; priority: Todo['priority'] } }
  | { type: 'TOGGLE_TODO'; payload: number }
  | { type: 'DELETE_TODO'; payload: number }
  | { type: 'SET_FILTER'; payload: 'all' | 'active' | 'completed' }
  | { type: 'SET_PRIORITY'; payload: { id: number; priority: Todo['priority'] } }
  | { type: 'CLEAR_COMPLETED' };

interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  nextId: number;
}

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [
          ...state.todos,
          {
            id: state.nextId,
            text: action.payload.text,
            completed: false,
            priority: action.payload.priority
          }
        ],
        nextId: state.nextId + 1
      };

    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      };

    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload)
      };

    case 'SET_FILTER':
      return { ...state, filter: action.payload };

    case 'SET_PRIORITY':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload.id
            ? { ...todo, priority: action.payload.priority }
            : todo
        )
      };

    case 'CLEAR_COMPLETED':
      return {
        ...state,
        todos: state.todos.filter(todo => !todo.completed)
      };

    default:
      return state;
  }
}

function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [],
    filter: 'all',
    nextId: 1
  });

  const [inputText, setInputText] = useState('');
  const [inputPriority, setInputPriority] = useState<Todo['priority']>('medium');

  const addTodo = () => {
    if (inputText.trim()) {
      dispatch({
        type: 'ADD_TODO',
        payload: { text: inputText, priority: inputPriority }
      });
      setInputText('');
    }
  };

  const filteredTodos = state.todos.filter(todo => {
    if (state.filter === 'active') return !todo.completed;
    if (state.filter === 'completed') return todo.completed;
    return true;
  });

  const priorityColors = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-red-600'
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Todo App</h1>

      {/* Formulário */}
      <div className="mb-6">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Nova tarefa..."
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <select
            value={inputPriority}
            onChange={(e) => setInputPriority(e.target.value as Todo['priority'])}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <button
          onClick={addTodo}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
        >
          Adicionar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'completed'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => dispatch({ type: 'SET_FILTER', payload: filter })}
            className={`px-3 py-1 rounded-lg ${
              state.filter === filter
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {filter === 'all' ? 'Todos' : filter === 'active' ? 'Ativos' : 'Concluídos'}
          </button>
        ))}
        <button
          onClick={() => dispatch({ type: 'CLEAR_COMPLETED' })}
          className="ml-auto px-3 py-1 bg-red-500 text-white rounded-lg"
        >
          Limpar Concluídos
        </button>
      </div>

      {/* Lista de todos */}
      <div className="space-y-2">
        {filteredTodos.map(todo => (
          <div
            key={todo.id}
            className={`flex items-center gap-3 p-3 border rounded-lg ${
              todo.completed ? 'bg-gray-100' : 'bg-white'
            }`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => dispatch({ type: 'TOGGLE_TODO', payload: todo.id })}
              className="w-4 h-4"
            />
            <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
              {todo.text}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${priorityColors[todo.priority]}`}>
              {todo.priority}
            </span>
            <select
              value={todo.priority}
              onChange={(e) => dispatch({
                type: 'SET_PRIORITY',
                payload: { id: todo.id, priority: e.target.value as Todo['priority'] }
              })}
              className="text-xs px-2 py-1 border rounded"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
            <button
              onClick={() => dispatch({ type: 'DELETE_TODO', payload: todo.id })}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Estatísticas */}
      <div className="mt-6 text-sm text-gray-600">
        Total: {state.todos.length} |
        Ativos: {state.todos.filter(t => !t.completed).length} |
        Concluídos: {state.todos.filter(t => t.completed).length}
      </div>
    </div>
  );
}
```

### Exercício 2: Custom Hook para API

```tsx
// Criar hooks customizados para diferentes tipos de API
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  cacheTime?: number;
  retry?: number;
}

function useApi<T>(
  url: string,
  options: UseApiOptions = {}
): UseApiState<T> & {
  refetch: () => Promise<void>;
  mutate: (data: T) => void;
} {
  const { immediate = true, cacheTime = 300000, retry = 3 } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const cache = useRef<{ data: T; timestamp: number } | null>(null);

  const fetchData = useCallback(async (isRetry = false) => {
    // Verificar cache
    if (cache.current && !isRetry) {
      const isExpired = Date.now() - cache.current.timestamp > cacheTime;
      if (!isExpired) {
        setData(cache.current.data);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      setData(result);

      // Salvar no cache
      cache.current = { data: result, timestamp: Date.now() };

    } catch (err) {
      if (!isRetry && retry > 0) {
        setTimeout(() => fetchData(true), 1000);
      } else {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      }
    } finally {
      setLoading(false);
    }
  }, [url, cacheTime, retry]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
    cache.current = { data: newData, timestamp: Date.now() };
  }, []);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    mutate
  };
}

// Hook específico para usuários
function useUsers() {
  const { data: users, loading, error, refetch } = useApi<User[]>('/api/users');

  return {
    users: users || [],
    loading,
    error,
    refetch
  };
}

// Hook específico para usuário individual
function useUser(userId: string) {
  const { data: user, loading, error, refetch, mutate } = useApi<User>(`/api/users/${userId}`);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        mutate(updatedUser);
      }
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
    }
  }, [userId, mutate]);

  return {
    user,
    loading,
    error,
    refetch,
    updateUser
  };
}
```

### Exercício 3: Performance com Memo e Callback

```tsx
// Otimizar um componente com muitos cálculos e renders
interface Item {
  id: number;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
}

interface ShoppingCartProps {
  items: Item[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
}

function ShoppingCart({ items, onUpdateQuantity, onRemoveItem, onClearCart }: ShoppingCartProps) {
  // ✅ Memoizar cálculos caros
  const totalItems = useMemo(() => {
    return items.reduce((total, item) => total + (item.inStock ? 1 : 0), 0);
  }, [items]);

  const totalValue = useMemo(() => {
    return items.reduce((total, item) => total + (item.price * (item.inStock ? 1 : 0)), 0);
  }, [items]);

  const itemsByCategory = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, Item[]>);
  }, [items]);

  const availableItems = useMemo(() => {
    return items.filter(item => item.inStock);
  }, [items]);

  // ✅ Memoizar handlers
  const handleUpdateQuantity = useCallback((id: number, quantity: number) => {
    onUpdateQuantity(id, quantity);
  }, [onUpdateQuantity]);

  const handleRemoveItem = useCallback((id: number) => {
    onRemoveItem(id);
  }, [onRemoveItem]);

  const handleClearCart = useCallback(() => {
    onClearCart();
  }, [onClearCart]);

  // ✅ Memoizar elementos renderizados
  const cartItems = useMemo(() => {
    return availableItems.map(item => (
      <CartItem
        key={item.id}
        item={item}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveItem}
      />
    ));
  }, [availableItems, handleUpdateQuantity, handleRemoveItem]);

  const categorySections = useMemo(() => {
    return Object.entries(itemsByCategory).map(([category, categoryItems]) => (
      <CategorySection
        key={category}
        category={category}
        items={categoryItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveItem}
      />
    ));
  }, [itemsByCategory, handleUpdateQuantity, handleRemoveItem]);

  return (
    <div className="shopping-cart">
      <div className="cart-header">
        <h1>Carrinho de Compras</h1>
        <div className="cart-summary">
          <span>Total de itens: {totalItems}</span>
          <span>Valor total: R$ {totalValue.toFixed(2)}</span>
        </div>
        <button onClick={handleClearCart} className="clear-cart-btn">
          Limpar Carrinho
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-cart">
          <p>Seu carrinho está vazio</p>
        </div>
      ) : (
        <div className="cart-content">
          {cartItems}
          {categorySections}
        </div>
      )}
    </div>
  );
}

// Componente memoizado
const CartItem = React.memo<{
  item: Item;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}>(({ item, onUpdateQuantity, onRemove }) => {
  console.log(`Renderizando item: ${item.name}`);

  return (
    <div className="cart-item">
      <h3>{item.name}</h3>
      <p>Categoria: {item.category}</p>
      <p>Preço: R$ {item.price.toFixed(2)}</p>
      <p className={item.inStock ? 'text-green-600' : 'text-red-600'}>
        {item.inStock ? 'Em estoque' : 'Fora de estoque'}
      </p>

      <div className="item-controls">
        <button onClick={() => onUpdateQuantity(item.id, -1)}>-</button>
        <span>1</span>
        <button onClick={() => onUpdateQuantity(item.id, 1)}>+</button>
        <button onClick={() => onRemove(item.id)}>Remover</button>
      </div>
    </div>
  );
});
```

## 🎯 Pontos Críticos para Desenvolvedores C#

### 1. **Dependências em useEffect**

```tsx
// ❌ Ruim - pode causar loops infinitos
useEffect(() => {
  fetchData(); // fetchData não está nas dependências
}, [data]); // data muda a cada render

// ✅ Correto
useEffect(() => {
  fetchData();
}, []); // Só executa no mount

// ✅ Correto - quando função é estável
const stableFetchData = useCallback(() => {
  fetchData();
}, []);

useEffect(() => {
  stableFetchData();
}, [stableFetchData]);
```

### 2. **Re-renderização Excessiva**

```tsx
// ❌ Ruim - função inline em cada render
<button onClick={() => setCount(count + 1)}>
  Incrementar
</button>

// ✅ Correto - useCallback
const handleIncrement = useCallback(() => {
  setCount(count + 1);
}, [count]);

<button onClick={handleIncrement}>Incrementar</button>
```

### 3. **Context Performance**

```tsx
// ❌ Ruim - context re-renderiza todos os consumidores
function AppContext({ children }) {
  const [state, setState] = useState({ user: null, theme: 'light' });

  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
}

// ✅ Correto - split context ou useMemo
const contextValue = useMemo(() => ({
  state,
  setState
}), [state]);

<MyContext.Provider value={contextValue}>
```

### 4. **Cleanup em useEffect**

```tsx
// ❌ Ruim - sem cleanup
useEffect(() => {
  const interval = setInterval(() => {
    console.log('tick');
  }, 1000);
  // Memory leak!
}, []);

// ✅ Correto - com cleanup
useEffect(() => {
  const interval = setInterval(() => {
    console.log('tick');
  }, 1000);

  return () => clearInterval(interval);
}, []);
```

## 🏁 Conclusão

Hooks são a **base moderna do React** e seguem os mesmos princípios do C#:

1. **Separação de responsabilidades** (um hook = uma responsabilidade)
2. **Reutilização de código** (custom hooks)
3. **Estado imutável** (useState, useReducer)
4. **Efeitos colaterais** (useEffect)
5. **Performance** (useMemo, useCallback)

## 📚 Próximos Passos

Agora que você domina hooks, está pronto para:

- **Módulo 7:** Gerenciar estado complexo com React Query e Zustand
- **Módulo 8:** Implementar roteamento avançado
- **Módulo 9:** Usar sistema de UI profissional

## 🎯 Resumo do que Aprendemos

✅ **useState e useEffect**
✅ **useContext e useReducer**
✅ **useMemo e useCallback**
✅ **Custom hooks avançados**
✅ **Performance optimization**
✅ **Error handling**
✅ **Exemplos do projeto real**

---

**🎓 Parabéns! Você completou o Módulo 6!**

**Continue para o [Módulo 7: Gerenciamento de Estado](Modulo-7-Gerenciamento-Estado.md)**

