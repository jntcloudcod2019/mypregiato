# 📚 Módulo 5: Componentes React Avançados para Desenvolvedores C#

## 🎯 Objetivos deste Módulo

- Dominar padrões de componentes complexos
- Entender Render Props e Higher-Order Components
- Aprender sobre Compound Components
- Conhecer Controlled vs Uncontrolled Components
- Dominar Portals e Refs
- Ver exemplos avançados do projeto real

## 📖 Componentes Avançados

### Render Props Pattern

Render Props é um padrão onde um componente **aceita uma função como prop** e **chama essa função** para renderizar conteúdo.

```tsx
interface RenderPropsProps {
  children: (data: any) => React.ReactNode;
  data: any;
}

function DataProvider({ children, data }: RenderPropsProps) {
  return <>{children(data)}</>;
}

// Usando Render Props
function App() {
  const userData = { name: "João", age: 25 };

  return (
    <DataProvider data={userData}>
      {(user) => (
        <div>
          <h1>{user.name}</h1>
          <p>{user.age} anos</p>
        </div>
      )}
    </DataProvider>
  );
}
```

**Equivalente em C#:**
```csharp
// C# - usando delegates
public delegate TView RenderProps<in TData, out TView>(TData data);

public class DataProvider<TData> {
  public TView Render<TView>(TData data, RenderProps<TData, TView> render) {
    return render(data);
  }
}
```

### Higher-Order Components (HOC)

HOC é uma função que **recebe um componente** e **retorna um novo componente** com funcionalidades adicionadas.

```tsx
interface WithLoadingProps {
  isLoading: boolean;
  error?: string;
}

function withLoading<T extends object>(
  WrappedComponent: React.ComponentType<T>
) {
  return function WithLoadingComponent(
    props: T & WithLoadingProps
  ) {
    const { isLoading, error, ...restProps } = props;

    if (isLoading) {
      return <div>Carregando...</div>;
    }

    if (error) {
      return <div>Erro: {error}</div>;
    }

    return <WrappedComponent {...(restProps as T)} />;
  };
}

// Usando HOC
const UserProfileWithLoading = withLoading(UserProfile);

function App() {
  return (
    <UserProfileWithLoading
      isLoading={false}
      user={{ name: "João", email: "joao@email.com" }}
    />
  );
}
```

**Equivalente em C#:**
```csharp
// C# - Decorator Pattern
public class UserProfileDecorator : UserProfile {
  private readonly UserProfile _inner;

  public UserProfileDecorator(UserProfile inner) {
    _inner = inner;
  }

  public override void Render() {
    if (IsLoading) {
      Console.WriteLine("Carregando...");
      return;
    }

    _inner.Render();
  }
}
```

## 🎨 Compound Components

Compound Components são **componentes que trabalham juntos** como uma unidade, mas podem ser usados separadamente.

```tsx
// Componentes compostos
interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function Tabs({ children, defaultTab }: { children: React.ReactNode; defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="tabs-list">{children}</div>;
}

function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);

  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  return (
    <button
      className={context.activeTab === value ? 'active' : ''}
      onClick={() => context.setActiveTab(value)}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);

  if (!context) throw new Error('TabsContent must be used within Tabs');

  return context.activeTab === value ? <div>{children}</div> : null;
}

// Usando Compound Components
function App() {
  return (
    <Tabs defaultTab="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Conteúdo 1</TabsContent>
      <TabsContent value="tab2">Conteúdo 2</TabsContent>
    </Tabs>
  );
}
```

## 🎛️ Controlled vs Uncontrolled Components

### Uncontrolled Components

```tsx
function UncontrolledForm() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Valor:', inputRef.current?.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="valor inicial" />
      <button type="submit">Enviar</button>
    </form>
  );
}
```

### Controlled Components

```tsx
function ControlledForm() {
  const [value, setValue] = useState('valor inicial');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Valor:', value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">Enviar</button>
    </form>
  );
}
```

**Equivalente em C#:**
```csharp
// C# - Two-way Data Binding (WPF)
<TextBox Text="{Binding MeuTexto, UpdateSourceTrigger=PropertyChanged}" />
```

## 🚪 Portals

Portals permitem **renderizar componentes fora da árvore DOM** normal, útil para modals, tooltips, etc.

```tsx
const ModalPortal: React.FC<{ children: React.ReactNode; isOpen: boolean }> = ({
  children,
  isOpen
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        {children}
      </div>
    </div>,
    document.body // Renderiza no body, não no componente pai
  );
};

// Usando Portal
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Abrir Modal
      </button>

      <ModalPortal isOpen={isModalOpen}>
        <h1>Modal Content</h1>
        <button onClick={() => setIsModalOpen(false)}>
          Fechar
        </button>
      </ModalPortal>
    </div>
  );
}
```

## 🎯 Refs e DOM Manipulation

### useRef Hook

```tsx
function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div>
      <video ref={videoRef} src="video.mp4" />
      <button onClick={togglePlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}
```

### Forward Ref

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div>
        <label>{label}</label>
        <input ref={ref} className={className} {...props} />
      </div>
    );
  }
);

Input.displayName = 'Input';

// Usando
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <Input ref={inputRef} label="Nome" />;
}
```

## 🔄 Custom Hooks Avançados

### Hook para Local Storage

```tsx
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
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

  return [storedValue, setValue];
}

// Usando
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### Hook para API com Cache

```tsx
interface UseApiOptions {
  cacheTime?: number;
  retry?: number;
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
  const { cacheTime = 300000, retry = 3 } = options; // 5min cache, 3 retries
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `api_${url}`;
  const cache = useRef<{ data: T; timestamp: number } | null>(null);

  const fetchData = async (isRetry = false) => {
    // Verificar cache
    if (cache.current) {
      const isExpired = Date.now() - cache.current.timestamp > cacheTime;
      if (!isExpired && !isRetry) {
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
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { data, loading, error, refetch: () => fetchData(true) };
}
```

## 🎪 Error Boundaries

Error Boundaries capturam **erros JavaScript** em componentes filhos e exibem uma UI alternativa.

```tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Algo deu errado!</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usando Error Boundary
function App() {
  return (
    <ErrorBoundary>
      <ProblematicComponent />
    </ErrorBoundary>
  );
}
```

## 🎯 Context Avançado

### Context com Reducer

```tsx
type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  systemPreference: Theme;
}

type ThemeAction =
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_SYSTEM_PREFERENCE'; payload: Theme };

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'SET_SYSTEM_PREFERENCE':
      return { ...state, systemPreference: action.payload };
    default:
      return state;
  }
}

interface ThemeContextType {
  state: ThemeState;
  dispatch: React.Dispatch<ThemeAction>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(themeReducer, {
    theme: 'light',
    systemPreference: 'light'
  });

  return (
    <ThemeContext.Provider value={{ state, dispatch }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

## 📦 Performance Patterns

### React.memo

```tsx
const ExpensiveComponent = React.memo<{ data: any }>(({ data }) => {
  console.log('Expensive component rendered');
  return <div>{data.value}</div>;
});

// Só re-renderiza se 'data' mudar
<ExpensiveComponent data={someData} />
```

### useMemo e useCallback

```tsx
function OptimizedComponent({ items, onItemClick }: Props) {
  // Memoiza cálculo caro
  const filteredItems = useMemo(() => {
    return items.filter(item => item.active);
  }, [items]);

  // Memoiza função
  const handleClick = useCallback((itemId: string) => {
    onItemClick(itemId);
  }, [onItemClick]);

  return (
    <div>
      {filteredItems.map(item => (
        <button key={item.id} onClick={() => handleClick(item.id)}>
          {item.name}
        </button>
      ))}
    </div>
  );
}
```

## 🎯 Exemplos do Projeto Real

### 1. Dialog Component (Radix UI)

```tsx
// front/src/components/ui/dialog.tsx
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
```

### 2. Main Layout com Error Boundary

```tsx
// front/src/components/layout/main-layout.tsx
interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [bypassAuth, setBypassAuth] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  // Fallback gracioso para quando Clerk falha
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const clerkFailed = sessionStorage.getItem('clerk_failed') === 'true';
        if (clerkFailed) {
          console.log("Clerk desabilitado devido a falhas anteriores");
          setBypassAuth(true);
        }
      } catch (e) {
        // Ignorar erros de sessão
      }
    }
  }, [])

  const handleLogout = async () => {
    try {
      if (isSignedIn) {
        await signOut();
      }

      try {
        sessionStorage.removeItem('clerk_failed');
      } catch (e) {
        console.error('Error clearing sessionStorage:', e);
      }

      if (bypassAuth) {
        setBypassAuth(false);
      }
    } catch (e) {
      console.error("Erro ao fazer logout:", e);
      window.location.reload();
    }
  };

  return (
    <SidebarProvider>
      <ErrorBoundary fallback={<ClerkErrorFallback />}>
        <div className="min-h-screen flex w-full">
          {/* Sidebar */}
          <AppSidebar />

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-4">
                  {bypassAuth ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        Modo desenvolvimento
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                      </Button>
                    </div>
                  ) : (
                    <SignedIn>
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/perfil')}
                        >
                          <User className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sair
                        </Button>
                      </div>
                    </SignedIn>
                  )}
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </ErrorBoundary>
    </SidebarProvider>
  );
}
```

### 3. Video Player Complexo com Refs

```tsx
// front/src/components/training/VideoPlayer.tsx
interface VideoPlayerProps {
  videoUrl: string;
  objectName: string;
  enrollmentId: string;
  lessonId: string;
  userId: string;
  onProgressUpdate?: (progress: number) => void;
  onVideoComplete?: () => void;
  className?: string;
  autoPlay?: boolean;
  showControls?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  objectName,
  enrollmentId,
  lessonId,
  userId,
  onProgressUpdate,
  onVideoComplete,
  className,
  autoPlay = false,
  showControls = true,
}) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressTimeoutRef = useRef<NodeJS.Timeout>();

  // Estados do player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [lastSavedPosition, setLastSavedPosition] = useState(0);

  // Função para controlar play/pause
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  // Controlar volume
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Formatar tempo
  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Event listeners do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onVideoComplete?.();
      saveProgress(duration);
    };

    // Adicionar event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [duration, onVideoComplete]);

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative bg-black rounded-lg overflow-hidden">
          {/* Vídeo */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-auto"
            preload="metadata"
            autoPlay={autoPlay}
          />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="flex items-center space-x-2 text-white">
                <RotateCcw className="h-6 w-6 animate-spin" />
                <span>Carregando...</span>
              </div>
            </div>
          )}

          {/* Controles */}
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              {/* Controles principais */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  {/* Volume */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-white hover:bg-opacity-20"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <Slider
                      value={[volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-20"
                    />
                  </div>

                  {/* Tempo */}
                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Fullscreen */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 4. Formulário Complexo com Validação

```tsx
// front/src/pages/treinamentos/criar/index.tsx
interface LessonWithBase64 extends CreateTrainingLessonDto {
  videoBase64Data?: string;
  videoFileName?: string;
  videoFileSize?: number;
  durationSeconds?: number;
  durationMinutes?: number;
}

const CriarTreinamentoPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const { createCourse, isCreating } = useTrainingCourses();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'Normal',
    isActive: true
  });

  const [lessons, setLessons] = useState<LessonWithBase64[]>([]);
  const [currentLesson, setCurrentLesson] = useState<LessonWithBase64>({
    title: '',
    description: '',
    orderIndex: 1,
    videoDurationSeconds: 0,
    durationMinutes: 0,
    videoUrl: '',
    videoObjectName: '',
    videoBase64Data: '',
    videoFileName: '',
    videoFileSize: 0,
    videoMimeType: ''
  });

  const [activeStep, setActiveStep] = useState<'course' | 'lessons' | 'videos' | 'preview'>('course');

  // Função para adicionar aula
  const addLesson = () => {
    if (!currentLesson.title.trim()) {
      toast({
        title: 'Erro',
        description: 'Título da aula é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    const newLesson: LessonWithBase64 = {
      ...currentLesson,
      orderIndex: lessons.length + 1,
      isActive: true
    };

    setLessons([...lessons, newLesson]);
    setCurrentLesson({
      title: '',
      description: '',
      orderIndex: lessons.length + 2,
      videoDurationSeconds: 0,
      durationMinutes: 0,
      videoUrl: '',
      videoObjectName: '',
      videoBase64Data: '',
      videoFileName: '',
      videoFileSize: 0,
      videoMimeType: ''
    });

    toast({
      title: 'Aula adicionada',
      description: `Aula "${newLesson.title}" foi adicionada com sucesso`
    });
  };

  // Função para criar curso
  const handleCreateCourse = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Erro',
        description: 'Título do curso é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (lessons.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos uma aula',
        variant: 'destructive'
      });
      return;
    }

    setIsCreatingCourse(true);

    try {
      const courseData: CreateTrainingCourseDto = {
        ...formData,
        createdBy: user?.id || 'anonymous',
        lessons: lessons.map(lesson => ({
          title: lesson.title,
          description: lesson.description,
          orderIndex: lesson.orderIndex,
          videoUrl: lesson.videoUrl,
          videoObjectName: lesson.videoObjectName,
          videoSize: lesson.videoFileSize,
          videoDurationSeconds: lesson.videoDurationSeconds,
          videoMimeType: lesson.videoMimeType,
          isActive: lesson.isActive
        }))
      };

      await createCourse(courseData);

      toast({
        title: 'Curso criado!',
        description: `O curso "${formData.title}" foi criado com sucesso`
      });

      navigate('/treinamentos');
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      toast({
        title: 'Erro ao criar curso',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingCourse(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/treinamentos')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Treinamentos
        </Button>

        <h1 className="text-3xl font-bold">Criar Novo Curso</h1>
        <p className="text-muted-foreground">
          Crie um curso completo com aulas em vídeo
        </p>
      </div>

      {/* Steps */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          {[
            { key: 'course', label: 'Informações do Curso' },
            { key: 'lessons', label: 'Adicionar Aulas' },
            { key: 'videos', label: 'Upload de Vídeos' },
            { key: 'preview', label: 'Preview' }
          ].map((step, index) => (
            <React.Fragment key={step.key}>
              <button
                onClick={() => setActiveStep(step.key as any)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeStep === step.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {step.label}
              </button>
              {index < 3 && <div className="w-8 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Formulário */}
      {activeStep === 'course' && (
        <Card>
          <CardHeader>
            <CardTitle>Informações do Curso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Curso</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Digite o título do curso"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="Ex: Desenvolvimento, Design..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva o conteúdo do curso..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Dificuldade</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({...formData, difficulty: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Iniciante">Iniciante</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Avançado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="isActive">Curso ativo</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setActiveStep('lessons')}
                disabled={!formData.title.trim()}
              >
                Próximo: Adicionar Aulas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de aulas */}
      {activeStep === 'lessons' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Aulas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lessonTitle">Título da Aula</Label>
                  <Input
                    id="lessonTitle"
                    value={currentLesson.title}
                    onChange={(e) => setCurrentLesson({...currentLesson, title: e.target.value})}
                    placeholder="Digite o título da aula"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessonOrder">Ordem</Label>
                  <Input
                    id="lessonOrder"
                    type="number"
                    value={currentLesson.orderIndex}
                    onChange={(e) => setCurrentLesson({...currentLesson, orderIndex: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessonDescription">Descrição</Label>
                <Textarea
                  id="lessonDescription"
                  value={currentLesson.description}
                  onChange={(e) => setCurrentLesson({...currentLesson, description: e.target.value})}
                  placeholder="Descreva o conteúdo da aula..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={addLesson}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Aula
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de aulas adicionadas */}
          {lessons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Aulas Adicionadas ({lessons.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lessons.map((lesson, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">{lesson.orderIndex}</Badge>
                        <div>
                          <h4 className="font-medium">{lesson.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {lesson.description || 'Sem descrição'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLessons(lessons.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Botões de navegação */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => {
            const steps = ['course', 'lessons', 'videos', 'preview'] as const;
            const currentIndex = steps.indexOf(activeStep);
            if (currentIndex > 0) {
              setActiveStep(steps[currentIndex - 1]);
            }
          }}
          disabled={activeStep === 'course'}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        <div className="flex space-x-2">
          {activeStep === 'preview' ? (
            <Button onClick={handleCreateCourse} disabled={isCreatingCourse}>
              {isCreatingCourse ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Criar Curso
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => {
                const steps = ['course', 'lessons', 'videos', 'preview'] as const;
                const currentIndex = steps.indexOf(activeStep);
                if (currentIndex < steps.length - 1) {
                  setActiveStep(steps[currentIndex + 1]);
                }
              }}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
```

## 🧪 Exercícios Práticos

### Exercício 1: Render Props Pattern

```tsx
// Criar um componente DataProvider com Render Props
interface DataProviderProps<T> {
  url: string;
  children: (data: T | null, loading: boolean, error: string | null) => React.ReactNode;
}

function DataProvider<T>({ url, children }: DataProviderProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(url)
      .then(response => response.json())
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  return <>{children(data, loading, error)}</>;
}

// Usando Render Props
function UserProfile() {
  return (
    <DataProvider url="/api/users/1">
      {(user, loading, error) => {
        if (loading) return <div>Carregando...</div>;
        if (error) return <div>Erro: {error}</div>;
        if (!user) return <div>Usuário não encontrado</div>;

        return (
          <div>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            <img src={user.avatar} alt={user.name} />
          </div>
        );
      }}
    </DataProvider>
  );
}
```

### Exercício 2: Higher-Order Component

```tsx
// Criar HOC para autenticação
interface AuthProps {
  isAuthenticated: boolean;
  user?: { name: string; role: string };
}

function withAuth<T extends object>(
  WrappedComponent: React.ComponentType<T>
) {
  return function WithAuthComponent(props: T & AuthProps) {
    const { isAuthenticated, user, ...restProps } = props;

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground mb-4">
              Você precisa estar logado para acessar esta página.
            </p>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
              Fazer Login
            </button>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...(restProps as T)} />;
  };
}

// Componente protegido
interface AdminPanelProps {
  title: string;
  features: string[];
}

function AdminPanel({ title, features }: AdminPanelProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Usando HOC
const ProtectedAdminPanel = withAuth(AdminPanel);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | undefined>();

  return (
    <div>
      <button onClick={() => setIsAuthenticated(!isAuthenticated)}>
        {isAuthenticated ? 'Logout' : 'Login'}
      </button>

      <ProtectedAdminPanel
        isAuthenticated={isAuthenticated}
        user={user}
        title="Painel Administrativo"
        features={['Gerenciar usuários', 'Configurações do sistema', 'Relatórios']}
      />
    </div>
  );
}
```

### Exercício 3: Custom Hook com Context

```tsx
// Criar um sistema de modal com Context
interface ModalContextType {
  modals: Record<string, boolean>;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<Record<string, boolean>>({});

  const openModal = useCallback((id: string) => {
    setModals(prev => ({ ...prev, [id]: true }));
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals(prev => ({ ...prev, [id]: false }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals({});
  }, []);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal, closeAllModals }}>
      {children}
    </ModalContext.Provider>
  );
}

function useModal() {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within ModalProvider');
  return context;
}

// Componente Modal
interface ModalProps {
  id: string;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

function Modal({ id, title, children, size = 'md' }: ModalProps) {
  const { modals, closeModal } = useModal();
  const isOpen = modals[id];

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-white rounded-lg shadow-xl max-w-${size === 'sm' ? 'md' : size === 'xl' ? '6xl' : size === 'lg' ? '4xl' : '2xl'} w-full mx-4`}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={() => closeModal(id)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Usando o sistema de modal
function App() {
  const { openModal } = useModal();

  return (
    <ModalProvider>
      <div>
        <button
          onClick={() => openModal('confirm')}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg mr-4"
        >
          Confirmar Ação
        </button>

        <button
          onClick={() => openModal('info')}
          className="bg-green-500 text-white px-4 py-2 rounded-lg"
        >
          Mostrar Info
        </button>

        <Modal id="confirm" title="Confirmar">
          <p>Tem certeza que deseja continuar?</p>
          <div className="flex justify-end space-x-2 mt-4">
            <button className="bg-gray-300 px-4 py-2 rounded-lg">Cancelar</button>
            <button className="bg-red-500 text-white px-4 py-2 rounded-lg">Confirmar</button>
          </div>
        </Modal>

        <Modal id="info" title="Informação" size="lg">
          <p>Esta é uma informação importante sobre o sistema.</p>
          <div className="flex justify-end mt-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">Entendi</button>
          </div>
        </Modal>
      </div>
    </ModalProvider>
  );
}
```

## 🎯 Pontos Críticos para Desenvolvedores C#

### 1. **Re-renderização Excessiva**

```tsx
// ❌ Ruim - função inline em cada render
<button onClick={() => console.log('clicado')}>
  Botão
</button>

// ✅ Correto - useCallback
const handleClick = useCallback(() => {
  console.log('clicado');
}, []);

<button onClick={handleClick}>Botão</button>
```

### 2. **Context Performance**

```tsx
// ❌ Ruim - context re-renderiza todos os consumidores
const ThemeContext = createContext('light');

function App() {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={theme}>
      <Header />
      <Sidebar />
      <Content />
    </ThemeContext.Provider>
  );
}

// ✅ Correto - useMemo para objetos complexos
const themeContextValue = useMemo(() => ({
  theme,
  setTheme,
  isDark: theme === 'dark'
}), [theme, setTheme]);

<ThemeContext.Provider value={themeContextValue}>
```

### 3. **Ref Forwarding**

```tsx
// ❌ Ruim - não pode acessar input interno
function FormField({ label, ...props }) {
  return (
    <div>
      <label>{label}</label>
      <input {...props} />
    </div>
  );
}

// ✅ Correto - forward ref
const FormField = React.forwardRef<
  HTMLInputElement,
  { label: string } & React.InputHTMLAttributes<HTMLInputElement>
>(({ label, ...props }, ref) => {
  return (
    <div>
      <label>{label}</label>
      <input ref={ref} {...props} />
    </div>
  );
});
```

### 4. **Error Boundary**

```tsx
// ❌ Ruim - sem error boundary
function App() {
  return (
    <div>
      <ProblematicComponent />
      <OtherComponent />
    </div>
  );
}

// ✅ Correto - com error boundary
function App() {
  return (
    <ErrorBoundary>
      <ProblematicComponent />
    </ErrorBoundary>
    <OtherComponent />
  );
}
```

## 🏁 Conclusão

Componentes avançados em React seguem os mesmos princípios do C#, mas com sintaxe diferente:

1. **Separação de responsabilidades** (Render Props, HOC)
2. **Reutilização de código** (Compound Components)
3. **Controle de estado** (Controlled vs Uncontrolled)
4. **Manipulação do DOM** (Refs, Portals)
5. **Tratamento de erros** (Error Boundaries)

## 📚 Próximos Passos

Agora que você domina componentes avançados, está pronto para:

- **Módulo 6:** Dominar hooks customizados
- **Módulo 7:** Gerenciar estado complexo
- **Módulo 8:** Implementar roteamento avançado

## 🎯 Resumo do que Aprendemos

✅ **Render Props Pattern**
✅ **Higher-Order Components**
✅ **Compound Components**
✅ **Controlled vs Uncontrolled**
✅ **Portals e Refs**
✅ **Error Boundaries**
✅ **Context avançado**
✅ **Performance patterns**
✅ **Exemplos do projeto real**

---

**🎓 Parabéns! Você completou o Módulo 5!**

**Continue para o [Módulo 6: Hooks Avançados do React](Modulo-6-Hooks-React.md)**

