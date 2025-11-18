# 📚 Módulo 8: Roteamento com React Router para Desenvolvedores C#

## 🎯 Objetivos deste Módulo

- Entender o que é React Router
- Configurar rotas básicas e dinâmicas
- Implementar rotas protegidas
- Dominar navegação programática
- Usar lazy loading e code splitting
- Ver exemplos práticos do projeto real

## 📖 O que é React Router?

React Router é a **biblioteca padrão** para roteamento em aplicações React. Permite navegar entre diferentes "páginas" sem recarregar o navegador.

### React Router vs Navegação Tradicional

| Navegação Tradicional | React Router | C# (ASP.NET) |
|----------------------|--------------|---------------|
| `window.location.href` | `<Link>` | `Response.Redirect()` |
| `a href="#"` | `<NavLink>` | `<a asp-action="Index">` |
| `history.back()` | `navigate(-1)` | `return RedirectToAction()` |
| URL Parameters | `useParams()` | `RouteData.Values` |

## 🚀 Instalação e Configuração

### Instalação

```bash
npm install react-router-dom
```

### Configuração Básica

```tsx
// main.tsx
import { BrowserRouter } from 'react-router-dom';
import App from './App';

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);
```

### App.tsx Básico

```tsx
import { Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/users">Users</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users" element={<Users />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
```

## 📋 Rotas Básicas

### Rota Simples

```tsx
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sobre" element={<AboutPage />} />
      <Route path="/contato" element={<ContactPage />} />
    </Routes>
  );
}
```

### Rota com Parâmetros

```tsx
// URL: /users/123
<Route path="/users/:id" element={<UserProfile />} />

// URL: /products/abc-123
<Route path="/products/:slug" element={<ProductDetail />} />

// URL: /categories/electronics/phones
<Route path="/categories/:category/:subcategory" element={<CategoryPage />} />
```

### Rota com Query Parameters

```tsx
// URL: /products?category=electronics&page=2&sort=price
function ProductList() {
  const [searchParams] = useSearchParams();

  const category = searchParams.get('category');
  const page = searchParams.get('page');
  const sort = searchParams.get('sort');

  return (
    <div>
      <p>Category: {category}</p>
      <p>Page: {page}</p>
      <p>Sort: {sort}</p>
    </div>
  );
}
```

## 🎯 Hooks de Roteamento

### useParams - Parâmetros da URL

```tsx
function UserProfile() {
  const { id, tab } = useParams<{
    id: string;
    tab?: string;
  }>();

  return (
    <div>
      <h1>User ID: {id}</h1>
      <p>Tab: {tab || 'overview'}</p>
    </div>
  );
}
```

### useNavigate - Navegação Programática

```tsx
function LoginForm() {
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      navigate('/dashboard'); // Navegar para dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Voltar para página anterior
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />
      <button type="submit">Login</button>
      <button type="button" onClick={handleCancel}>Cancel</button>
    </form>
  );
}
```

### useLocation - Informações da URL

```tsx
function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  return (
    <nav>
      <Link to="/">Home</Link>
      {pathnames.map((name, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return isLast ? (
          <span key={to}> / {name}</span>
        ) : (
          <Link key={to} to={to}> / {name}</Link>
        );
      })}
    </nav>
  );
}
```

### useSearchParams - Query Parameters

```tsx
function ProductFilter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  const updateFilters = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
  };

  return (
    <div>
      <select
        value={category || ''}
        onChange={(e) => updateFilters({ category: e.target.value })}
      >
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>

      <input
        type="number"
        placeholder="Min Price"
        value={minPrice || ''}
        onChange={(e) => updateFilters({ minPrice: e.target.value })}
      />
    </div>
  );
}
```

## 🔒 Rotas Protegidas

### Componente de Proteção Básico

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Usando
<Routes>
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />
</Routes>
```

### Proteção com Roles

```tsx
function RoleProtectedRoute({
  children,
  requiredRoles
}: {
  children: React.ReactNode;
  requiredRoles: string[];
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// Usando
<Routes>
  <Route path="/admin" element={
    <RoleProtectedRoute requiredRoles={['admin']}>
      <AdminPanel />
    </RoleProtectedRoute>
  } />

  <Route path="/instructor" element={
    <RoleProtectedRoute requiredRoles={['admin', 'instructor']}>
      <InstructorDashboard />
    </RoleProtectedRoute>
  } />
</Routes>
```

## 📱 Lazy Loading e Code Splitting

### Componente Lazy

```tsx
// Criar componente lazy
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Suspense wrapper
function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users/:id" element={<UserProfile />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Suspense>
  );
}
```

### Loading Component

```tsx
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}
```

## 🎨 Nested Routes

### Roteamento Aninhado

```tsx
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
      </Route>
    </Routes>
  );
}

function Layout() {
  return (
    <div>
      <Header />
      <main>
        <Outlet /> {/* Renderiza a rota filha aqui */}
      </main>
      <Footer />
    </div>
  );
}
```

### Outlet Hook

```tsx
import { Outlet } from 'react-router-dom';

function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <Outlet /> {/* Renderiza a rota filha */}
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardOverview />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
```

## 🔄 Navegação Programática

### Navigate Function

```tsx
function LoginForm() {
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    try {
      await login(credentials);

      // Navegar com state
      navigate('/dashboard', {
        state: { message: 'Login successful!' }
      });

      // Navegar e substituir no history
      navigate('/dashboard', { replace: true });

      // Navegar para rota anterior
      navigate(-1);

      // Navegar para frente
      navigate(1);

    } catch (error) {
      console.error('Login failed');
    }
  };
}
```

### Redirect com Condições

```tsx
function AuthRedirect() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    // Redirecionar para a página que o usuário tentou acessar
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <LoginForm />;
}
```

## 📊 Roteamento no Projeto Real

### 1. Configuração Completa de Rotas

```tsx
// front/src/App.tsx
const App = () => (
  <BrowserRouter>
    <RouteTracker />
    <AuthInitializer>
      <AutoLogout>
        <AuthGuard>
          <AuthPermissionsProvider>
            <Routes>
        {/* Rotas públicas (não requerem autenticação) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/ficha/:token" element={<FichaDigitalPage />} />

        {/* Redirecionamento da raiz com verificação de autenticação */}
        <Route path="/" element={<RootRedirect />} />

        {/* Rotas protegidas - requerem autenticação */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/apps/:slug" element={
          <ProtectedRoute>
            <MainLayout>
              <ModulePage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Rotas CRM */}
        <Route path="/crm" element={
          <ProtectedRoute>
            <MainLayout>
              <CRMWorkspace />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/crm/importar" element={
          <ProtectedRoute>
            <MainLayout>
              <ImportarDadosPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/crm/leads" element={
          <ProtectedRoute>
            <MainLayout>
              <LeadsPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/crm/leads/kanban" element={
          <ProtectedRoute>
            <MainLayout>
              <LeadsKanban />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/crm/leads/novo" element={
          <ProtectedRoute>
            <MainLayout>
              <NovoLead />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/crm/leads/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <DetalheLead />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/crm/leads/:id/editar" element={
          <ProtectedRoute>
            <MainLayout>
              <NovoLead />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Rotas de treinamento */}
        <Route path="/treinamentos" element={
          <ProtectedRoute>
            <MainLayout>
              <TreinamentosPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/treinamentos/criar" element={
          <ProtectedRoute>
            <MainLayout>
              <CriarTreinamentoPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/treinamentos/gerenciar" element={
          <ProtectedRoute>
            <MainLayout>
              <GerenciarTreinamentosPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/treinamentos/editar/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <EditarTreinamentoPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/treinamentos/curso/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <CursoPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Rota 404 - redireciona para login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
          </AuthPermissionsProvider>
        </AuthGuard>
      </AutoLogout>
    </AuthInitializer>
  </BrowserRouter>
);
```

### 2. Rotas Dinâmicas - Cursos

```tsx
// front/src/pages/treinamentos/curso/[id].tsx
const CursoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoaded: isUserLoaded } = useUser();

  // Estados
  const [curso, setCurso] = useState<TrainingCourse | null>(null);
  const [aulas, setAulas] = useState<TrainingLesson[]>([]);
  const [enrollment, setEnrollment] = useState<TrainingEnrollment | null>(null);
  const [progresso, setProgresso] = useState<TrainingProgressSummaryDto | null>(null);
  const [aulaAtiva, setAulaAtiva] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do curso
  useEffect(() => {
    const carregarCurso = async () => {
      if (!id || !isUserLoaded) return;

      setIsLoading(true);
      setError(null);

      try {
        // Buscar curso
        const cursoData = await trainingService.getCourseById(id);
        setCurso(cursoData);

        // Buscar aulas do curso
        const aulasData = await trainingService.getCourseLessons(id);
        const aulasOrdenadas = aulasData.sort((a, b) => a.orderIndex - b.orderIndex);
        setAulas(aulasOrdenadas);

        // Se primeira aula, definir como ativa
        if (aulasOrdenadas.length > 0 && !aulaAtiva) {
          setAulaAtiva(aulasOrdenadas[0].id);
        }

      } catch (err) {
        console.error('Erro ao carregar curso:', err);
        setError('Erro ao carregar curso. Tente novamente mais tarde.');
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o curso.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    carregarCurso();
  }, [id, isUserLoaded, toast]);

  // Função para navegar entre aulas
  const navegarParaAula = useCallback((aulaId: string) => {
    const aula = aulas.find(a => a.id === aulaId);
    if (aula) {
      setAulaAtiva(aulaId);
      if (aula.videoUrl) {
        setVideoUrl(aula.videoUrl);
      }
    }
  }, [aulas]);

  // Função para voltar para lista de cursos
  const voltarParaCursos = () => {
    navigate('/treinamentos');
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Carregando curso...</p>
        </div>
      </div>
    );
  }

  if (error || !curso) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Curso não encontrado.'}</AlertDescription>
        </Alert>
        <Button onClick={voltarParaCursos} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Cursos
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={voltarParaCursos}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Treinamentos
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{curso.title}</h1>
            <p className="text-muted-foreground mt-2">{curso.description}</p>
          </div>
        </div>
      </div>

      {/* Lista de aulas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Aulas ({aulas.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {aulas.map((aula, index) => (
                <button
                  key={aula.id}
                  onClick={() => navegarParaAula(aula.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    aulaAtiva === aula.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Aula {index + 1}</span>
                    {aula.videoUrl && <Play className="h-4 w-4" />}
                  </div>
                  <p className="text-sm opacity-90">{aula.title}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Player de vídeo */}
        <div className="lg:col-span-3">
          {aulaAtiva && (
            <VideoPlayer
              videoUrl={videoUrl}
              objectName="curso-video"
              enrollmentId={enrollment?.id || ''}
              lessonId={aulaAtiva}
              userId={user?.id || ''}
              onProgressUpdate={(progress) => console.log('Progress:', progress)}
              onVideoComplete={() => console.log('Video completed')}
            />
          )}
        </div>
      </div>
    </div>
  );
};
```

### 3. Protected Route

```tsx
// front/src/components/auth/protected-route.tsx
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isSignedIn, isLoaded } = useUser();

  // Aguarda carregamento do Clerk
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    // 🔑 Preserva a rota de origem
    console.log('🔐 [ProtectedRoute] Usuário não autenticado, redirecionando para login');
    console.log('🔐 [ProtectedRoute] Rota de origem:', location.pathname);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
```

### 4. Role-based Routing

```tsx
// front/src/components/auth/auth-guard.tsx
export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, isLoading } = useAuthPermissions();
  const location = useLocation();

  if (isLoading) {
    return <LoadingFallback />;
  }

  // Verificar se usuário tem permissão para a rota atual
  if (user && !canAccessRoute(location.pathname, role || '')) {
    console.log('🚫 [AuthGuard] Usuário não tem permissão para acessar:', location.pathname);

    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground mb-4">
              Você não tem permissão para acessar esta página.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return <>{children}</>;
};
```

### 5. Route Tracker

```tsx
// front/src/components/common/route-tracker.tsx
export const RouteTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    console.log('📍 [RouteTracker] Rota alterada:', location.pathname);

    // Google Analytics (exemplo)
    if (typeof gtag !== 'undefined') {
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: location.pathname,
      });
    }

    // Custom tracking
    // trackPageView(location.pathname);
  }, [location]);

  return null;
};
```

## 🧪 Exercícios Práticos

### Exercício 1: Sistema de Roteamento Completo

```tsx
// Criar um sistema de roteamento para e-commerce
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Layout components
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

// Pages
function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Bem-vindo à Loja</h1>
      <ProductGrid />
    </div>
  );
}

function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-blue-500 hover:text-blue-700"
      >
        ← Voltar
      </button>
      <ProductDetail productId={id!} />
    </div>
  );
}

function CheckoutPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const step = searchParams.get('step') || '1';

  return (
    <div className="container mx-auto px-4 py-8">
      <CheckoutWizard currentStep={parseInt(step)} />
    </div>
  );
}

function ProfilePage() {
  const { tab } = useParams<{ tab: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileTabs activeTab={tab || 'overview'} />
    </div>
  );
}

// Protected routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// Router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout><HomePage /></MainLayout>,
  },
  {
    path: '/products',
    element: <MainLayout><ProductListPage /></MainLayout>,
  },
  {
    path: '/products/:id',
    element: <MainLayout><ProductDetailPage /></MainLayout>,
  },
  {
    path: '/categories/:slug',
    element: <MainLayout><CategoryPage /></MainLayout>,
  },
  {
    path: '/checkout',
    element: (
      <ProtectedRoute>
        <MainLayout><CheckoutPage /></MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/:tab?',
    element: (
      <ProtectedRoute>
        <MainLayout><ProfilePage /></MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout><AdminDashboard /></AdminLayout>
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminOverview />,
      },
      {
        path: 'users',
        element: <UserManagement />,
      },
      {
        path: 'products',
        element: <ProductManagement />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
```

### Exercício 2: Lazy Loading com Suspense

```tsx
// Implementar lazy loading para todas as rotas
import { lazy, Suspense } from 'react';

// Lazy load components
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const ProductManagement = lazy(() => import('./pages/admin/ProductManagement'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading fallback
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando página...</p>
      </div>
    </div>
  );
}

// Router com lazy loading
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <MainLayout>
        <Suspense fallback={<LoadingSpinner />}>
          <HomePage />
        </Suspense>
      </MainLayout>
    ),
  },
  {
    path: '/products',
    element: (
      <MainLayout>
        <Suspense fallback={<LoadingSpinner />}>
          <ProductListPage />
        </Suspense>
      </MainLayout>
    ),
  },
  {
    path: '/products/:id',
    element: (
      <MainLayout>
        <Suspense fallback={<LoadingSpinner />}>
          <ProductDetailPage />
        </Suspense>
      </MainLayout>
    ),
  },
  {
    path: '/checkout',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Suspense fallback={<LoadingSpinner />}>
            <CheckoutPage />
          </Suspense>
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout>
          <Suspense fallback={<LoadingSpinner />}>
            <AdminDashboard />
          </Suspense>
        </AdminLayout>
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <AdminOverview />
          </Suspense>
        ),
      },
      {
        path: 'users',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <UserManagement />
          </Suspense>
        ),
      },
    ],
  },
]);
```

### Exercício 3: Roteamento com Estado

```tsx
// Criar um sistema de roteamento com preservação de estado
import { create } from 'zustand';

interface NavigationState {
  history: string[];
  canGoBack: boolean;
  canGoForward: boolean;

  push: (path: string) => void;
  goBack: () => void;
  goForward: () => void;
  go: (delta: number) => void;
  replace: (path: string) => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  history: ['/'],
  canGoBack: false,
  canGoForward: false,

  push: (path) => set((state) => ({
    history: [...state.history, path],
    canGoBack: state.history.length > 0,
    canGoForward: false
  })),

  goBack: () => set((state) => {
    if (state.history.length <= 1) return state;

    const newHistory = state.history.slice(0, -1);
    return {
      history: newHistory,
      canGoBack: newHistory.length > 1,
      canGoForward: true
    };
  }),

  goForward: () => set((state) => {
    // Implementar lógica de forward
    return state;
  }),

  go: (delta) => set((state) => {
    const newIndex = state.history.length + delta;
    if (newIndex < 0 || newIndex >= state.history.length) return state;

    return {
      history: state.history.slice(0, newIndex + 1),
      canGoBack: newIndex > 0,
      canGoForward: newIndex < state.history.length - 1
    };
  }),

  replace: (path) => set((state) => ({
    history: [...state.history.slice(0, -1), path],
  })),
}));

// Custom hook para navegação
function useAppNavigation() {
  const navigate = useNavigate();
  const { push, goBack, goForward, go, replace } = useNavigationStore();

  const navigateWithState = (path: string, options?: NavigateOptions) => {
    push(path);
    navigate(path, options);
  };

  const goBackWithState = () => {
    goBack();
    navigate(-1);
  };

  const goForwardWithState = () => {
    goForward();
    navigate(1);
  };

  const goWithState = (delta: number) => {
    go(delta);
    navigate(delta);
  };

  const replaceWithState = (path: string, options?: NavigateOptions) => {
    replace(path);
    navigate(path, { ...options, replace: true });
  };

  return {
    navigate: navigateWithState,
    goBack: goBackWithState,
    goForward: goForwardWithState,
    go: goWithState,
    replace: replaceWithState,
  };
}

// Componente de navegação customizada
function NavigationControls() {
  const { canGoBack, canGoForward } = useNavigationStore();
  const { goBack, goForward } = useAppNavigation();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={goBack}
        disabled={!canGoBack}
        className="px-3 py-1 bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
      >
        ← Back
      </button>
      <button
        onClick={goForward}
        disabled={!canGoForward}
        className="px-3 py-1 bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
      >
        Forward →
      </button>
    </div>
  );
}

// Hook para breadcrumbs
function useBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const breadcrumbs = useMemo(() => {
    const crumbs = [{ label: 'Home', path: '/' }];

    pathnames.forEach((name, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      const label = name.charAt(0).toUpperCase() + name.slice(1);
      crumbs.push({ label, path });
    });

    return crumbs;
  }, [pathnames]);

  return breadcrumbs;
}

// Componente de breadcrumbs
function Breadcrumbs() {
  const breadcrumbs = useBreadcrumbs();
  const navigate = useNavigate();

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && <span>/</span>}
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-gray-900">{crumb.label}</span>
          ) : (
            <button
              onClick={() => navigate(crumb.path)}
              className="text-blue-500 hover:text-blue-700"
            >
              {crumb.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
```

## 🎯 Pontos Críticos para Desenvolvedores C#

### 1. **Roteamento Declarativo vs Imperativo**

```tsx
// ❌ Imperativo (não recomendado)
useEffect(() => {
  if (condition) {
    navigate('/somewhere');
  }
}, [condition]);

// ✅ Declarativo (recomendado)
<Routes>
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />
</Routes>
```

### 2. **Key Prop em Listas de Rotas**

```tsx
// ❌ Ruim - sem key
{routes.map(route => (
  <Route key={route.path} path={route.path} element={route.element} />
))}

// ✅ Correto - key estável
{routes.map(route => (
  <Route key={`${route.path}-${route.method}`} path={route.path} element={route.element} />
))}
```

### 3. **Navigate Replace**

```tsx
// ❌ Ruim - polui o history
<Navigate to="/dashboard" />

// ✅ Correto - substitui no history
<Navigate to="/dashboard" replace />

// Quando usar replace:
// - Login redirect
// - After form submission
// - 404 redirects
```

### 4. **State Preservation**

```tsx
// ❌ Ruim - perde state ao navegar
navigate('/products');

// ✅ Correto - preserva state
navigate('/products', {
  state: { from: location.pathname }
});
```

## 🏁 Conclusão

React Router oferece uma **API rica e flexível** para roteamento:

1. **Roteamento declarativo** com `<Routes>` e `<Route>`
2. **Navegação programática** com `useNavigate()`
3. **Parâmetros e query strings** com hooks específicos
4. **Roteamento aninhado** com `<Outlet>`
5. **Lazy loading** para performance
6. **Roteamento protegido** com guards

## 📚 Próximos Passos

Agora que você domina roteamento, está pronto para:

- **Módulo 9:** Usar sistema de UI profissional (Shadcn/Radix)
- **Módulo 10:** Integrar autenticação completa com Clerk
- **Módulo 11:** Consumir APIs REST e GraphQL

## 🎯 Resumo do que Aprendemos

✅ **React Router básico**
✅ **Rotas dinâmicas e parâmetros**
✅ **Navegação programática**
✅ **Roteamento aninhado**
✅ **Lazy loading e Suspense**
✅ **Rotas protegidas**
✅ **State preservation**
✅ **Exemplos do projeto real**

---

**🎓 Parabéns! Você completou o Módulo 8!**

**Continue para o [Módulo 9: Sistema de UI (Shadcn/Radix)](Modulo-9-Sistema-UI-Shadcn.md)**









