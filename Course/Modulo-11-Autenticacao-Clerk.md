# 📚 Módulo 11: Autenticação com Clerk para Desenvolvedores C#

## 🎯 Objetivos deste Módulo

- Entender o que é Clerk e por que usar
- Configurar autenticação completa
- Implementar proteção de rotas
- Gerenciar usuários e roles
- Integrar com backend
- Ver exemplos do projeto real

## 📖 O que é Clerk?

Clerk é uma **plataforma de autenticação** que oferece **identidade completa** para aplicações web e mobile. Diferente de bibliotecas como Firebase Auth ou Auth0, Clerk foca em **experiência do desenvolvedor** e **customização**.

### Clerk vs Outras Soluções

| Recurso | Clerk | Firebase Auth | Auth0 | NextAuth.js |
|---------|-------|---------------|-------|-------------|
| **Setup** | ⚡ Rápido | Médio | Lento | Médio |
| **UI Components** | ✅ Pronto | ❌ Manual | ❌ Manual | ❌ Manual |
| **Social Login** | ✅ Fácil | ✅ Suporte | ✅ Suporte | ✅ Suporte |
| **Multi-tenant** | ✅ Completo | ❌ Limitado | ✅ Suporte | ❌ Limitado |
| **Backend SDK** | ✅ Node.js/.NET | ✅ Multi | ✅ Multi | ❌ Limitado |

## 🚀 Instalação e Configuração

### Passo 1: Criar Conta no Clerk

1. **Acesse** [clerk.com](https://clerk.com)
2. **Crie uma aplicação** (React)
3. **Configure URLs** de desenvolvimento e produção
4. **Obtenha as chaves** (Publishable Key e Secret Key)

### Passo 2: Instalar Dependências

```bash
npm install @clerk/clerk-react
```

### Passo 3: Configurar no Projeto

```tsx
// main.tsx
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Suspense fallback={<div>Loading...</div>}>
        <App />
      </Suspense>
    </ClerkProvider>
  </StrictMode>
);
```

### Passo 4: Variáveis de Ambiente

```bash
# .env.local
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_ENABLE_CLERK=true
```

## 📋 Componentes Básicos do Clerk

### useUser Hook

```tsx
import { useUser } from '@clerk/clerk-react';

function UserProfile() {
  const { user, isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Sign in required</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
      <img src={user.imageUrl} alt="Profile" />
    </div>
  );
}
```

### SignInButton e SignOutButton

```tsx
import { SignInButton, SignOutButton, SignedIn, SignedOut } from '@clerk/clerk-react';

function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton mode="modal">
          <button>Sign In</button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <SignOutButton>
          <button>Sign Out</button>
        </SignOutButton>
      </SignedIn>
    </header>
  );
}
```

### SignedIn e SignedOut

```tsx
function App() {
  return (
    <div>
      <SignedOut>
        <div>Welcome! Please sign in.</div>
        <SignInButton mode="modal">
          <button>Sign In</button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <UserProfile />
      </SignedIn>
    </div>
  );
}
```

## 🔒 Proteção de Rotas

### Protected Route Básico

```tsx
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
```

### Role-based Protection

```tsx
function RoleProtectedRoute({
  children,
  requiredRoles
}: {
  children: React.ReactNode;
  requiredRoles: string[];
}) {
  const { user } = useUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Verificar se usuário tem role necessária
  const userRole = user.publicMetadata?.role as string;
  if (!requiredRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

## 👤 Gerenciamento de Usuários

### User Profile Management

```tsx
import { useUser } from '@clerk/clerk-react';

function UserProfile() {
  const { user } = useUser();

  const updateProfile = async () => {
    try {
      await user?.update({
        firstName: 'New Name',
        lastName: 'New Last Name'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div>
      <h1>{user?.firstName} {user?.lastName}</h1>
      <p>{user?.primaryEmailAddress?.emailAddress}</p>
      <img src={user?.imageUrl} alt="Profile" />

      <button onClick={updateProfile}>Update Profile</button>
    </div>
  );
}
```

### Custom User Metadata

```tsx
// Backend - Adicionar metadata customizada
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  const user = await currentUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Atualizar metadata customizada
  await user.update({
    publicMetadata: {
      role: 'admin',
      department: 'engineering'
    }
  });

  return Response.json({ success: true });
}

// Frontend - Usar metadata
function AdminPanel() {
  const { user } = useUser();

  const userRole = user?.publicMetadata?.role;
  const department = user?.publicMetadata?.department;

  if (userRole !== 'admin') {
    return <div>Access denied</div>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Department: {department}</p>
    </div>
  );
}
```

## 🔗 Integração com Backend

### Clerk Webhook para Sincronização

```typescript
// Backend - Webhook handler
import { Webhook } from 'svix';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const payload = await request.text();
  const headersList = await headers();

  const svixId = headersList.get('svix-id');
  const svixTimestamp = headersList.get('svix-timestamp');
  const svixSignature = headersList.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  try {
    const evt = webhook.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as any;

    const { id, ...attributes } = evt.data;

    // Handle user events
    switch (evt.type) {
      case 'user.created':
        await createUserInDatabase(attributes);
        break;
      case 'user.updated':
        await updateUserInDatabase(id, attributes);
        break;
      case 'user.deleted':
        await deleteUserFromDatabase(id);
        break;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return new Response('Verification failed', { status: 400 });
  }
}
```

### Sincronização Manual

```tsx
// Hook para sincronizar usuário com backend
import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { userManagementService } from '../services/user-management-service';

export function useUserSync() {
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !isSignedIn || !user) return;

      try {
        const email = user.primaryEmailAddress?.emailAddress;
        if (!email) return;

        // Verificar se usuário existe no backend
        const dbUser = await userManagementService.getUserByEmail(email);

        // Se não existe, criar
        if (!dbUser) {
          await userManagementService.createUser({
            email,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            clerkId: user.id
          });
        } else {
          // Se existe mas ClerkId está vazio, atualizar
          if (!dbUser.clerkId) {
            await userManagementService.updateUser(dbUser.id, {
              clerkId: user.id
            });
          }
        }
      } catch (error) {
        console.error('Erro ao sincronizar usuário:', error);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user]);
}
```

## 🎨 UI Components do Clerk

### SignIn e SignUp Forms

```tsx
import { SignIn, SignUp } from '@clerk/clerk-react';

function AuthPage() {
  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex items-center justify-center">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary text-primary-foreground',
              card: 'shadow-lg',
            }
          }}
        />
      </div>
    </div>
  );
}
```

### User Profile

```tsx
import { UserProfile } from '@clerk/clerk-react';

function ProfilePage() {
  return (
    <div>
      <UserProfile
        path="/user-profile"
        routing="path"
        appearance={{
          elements: {
            card: 'shadow-lg',
            navbar: 'hidden', // Esconder navbar se não quiser
          }
        }}
      />
    </div>
  );
}
```

### Organization Profile

```tsx
import { OrganizationProfile } from '@clerk/clerk-react';

function OrgSettings() {
  return (
    <OrganizationProfile
      appearance={{
        elements: {
          card: 'shadow-lg',
        }
      }}
    />
  );
}
```

## 🔐 Configuração Avançada

### Custom SignIn Flow

```tsx
import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

function CustomSignIn() {
  const navigate = useNavigate();

  return (
    <SignIn
      path="/sign-in"
      routing="path"
      signUpUrl="/sign-up"
      redirectUrl="/dashboard"
      appearance={{
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
          card: 'shadow-2xl border-0',
          headerTitle: 'text-2xl font-bold',
          headerSubtitle: 'text-gray-600',
          socialButtons: 'space-y-2',
          dividerLine: 'bg-gray-200',
          dividerText: 'text-gray-500',
          formFieldInput: 'border-gray-300 focus:border-blue-500',
          formFieldLabel: 'text-gray-700',
          footerAction: 'text-blue-600 hover:text-blue-700',
        }
      }}
    />
  );
}
```

### Middleware para Proteção

```tsx
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/profile(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});
```

## 📦 Exemplos do Projeto Real

### 1. Configuração Clerk Completa

```tsx
// front/src/main.tsx
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { RootApp } from '@/components/root-app';
import { ClerkErrorFallback } from '@/components/auth/clerk-fallback';
import { LoadingFallback } from '@/components/ui/loading-fallback';
import { detectClerkAvailability, getClerkPublishableKey, shouldEnableClerk, clearClerkFailedStatus } from '@/utils/clerk-utils';
import { checkAuthDataIssues, checkServerRestart, forceImmediateLogout } from '@/utils/auth-cleanup';

/**
 * Ponto de entrada da aplicação
 *
 * Configura:
 * - StrictMode para desenvolvimento
 * - ErrorBoundary para tratamento de erros
 * - Clerk para autenticação
 * - Suspense para carregamento assíncrono
 */

// Verificar e limpar dados de autenticação problemáticos
checkAuthDataIssues();

// TEMPORARIAMENTE DESABILITADO: Verificação de servidor reiniciado
// if (checkServerRestart() && window.location.pathname !== '/login') {
//   forceImmediateLogout();
// }

// Limpar status de falha do Clerk no carregamento inicial
clearClerkFailedStatus();

// Verifica se o Clerk deve ser usado
const shouldUseClerk = shouldEnableClerk() && detectClerkAvailability(true);

// Obtém a chave publishable do Clerk
const PUBLISHABLE_KEY = getClerkPublishableKey();

// Logs de debug para verificar configuração do Clerk
console.log('🔍 [DEBUG] Configuração do Clerk:', {
  shouldUseClerk,
  publishableKey: PUBLISHABLE_KEY,
  envKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  enableClerk: import.meta.env.VITE_ENABLE_CLERK,
  clerkFailed: sessionStorage.getItem('clerk_failed')
});

// Renderiza a árvore de componentes
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      fallback={
        <ClerkErrorFallback />
      }
    >
      <Suspense fallback={<LoadingFallback />}>
        {shouldUseClerk ? (
          <ClerkProvider
            publishableKey={PUBLISHABLE_KEY}
            afterSignInUrl="/login"
            afterSignUpUrl="/login"
          >
            <RootApp />
          </ClerkProvider>
        ) : (
          <RootApp />
        )}
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);
```

### 2. Protected Route com Fallback

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

### 3. Login Page com Redirecionamento Inteligente

```tsx
// front/src/pages/login.tsx
const LoginPage: React.FC = () => {
  const location = useLocation();
  const [params] = useSearchParams();
  const { user } = useUser();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  // 1️⃣ Origem via ProtectedRoute
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  // 2️⃣ Via query param (?return_to=/treinamentos/criar)
  const returnTo = params.get("return_to") || undefined;

  // 3️⃣ Última rota válida salva
  const lastRoute = sessionStorage.getItem("lastRoute") || undefined;

  // ✅ Verificar role do usuário e definir redirecionamento
  useEffect(() => {
    const checkUserRoleAndRedirect = async () => {
      if (!user?.primaryEmailAddress?.emailAddress || !user?.id) {
        setIsCheckingUser(false);
        return;
      }

      try {
        console.log("🔐 [Login] Buscando dados do usuário:", user.primaryEmailAddress.emailAddress);

        // Buscar dados do usuário no banco
        const dbUser = await userManagementService.getUserByEmail(user.primaryEmailAddress.emailAddress);

        // ✅ FALLBACK: Se ClerkId estiver vazio, atualizar automaticamente
        if (!dbUser.clerkId || dbUser.clerkId.trim() === '') {
          console.log("⚠️ [Login] ClerkId vazio detectado, atualizando...");
          try {
            await userManagementService.updateUser(dbUser.id, {
              clerkId: user.id, email: user.primaryEmailAddress.emailAddress
            });
            dbUser.clerkId = user.id;
          } catch (updateError) {
            console.error("❌ [Login] Erro ao atualizar ClerkId:", updateError);
          }
        }

        // Se for MODEL, redirecionar para o perfil
        if (dbUser.role === 'MODEL') {
          console.log("🎭 [Login] Usuário é MODEL, redirecionando para perfil");
          setRedirectTo(`/talentos/perfil/${dbUser.id}`);
        } else {
          // Para outros roles, usar a ordem de prioridade normal
          const defaultRedirect = fromPath || returnTo || lastRoute || "/dashboard";
          console.log("🔐 [Login] Usuário não é MODEL, usando redirecionamento padrão:", defaultRedirect);
          setRedirectTo(defaultRedirect);
        }
      } catch (error) {
        console.error("❌ [Login] Erro ao buscar usuário:", error);
        const defaultRedirect = fromPath || returnTo || lastRoute || "/dashboard";
        setRedirectTo(defaultRedirect);
      } finally {
        setIsCheckingUser(false);
      }
    };

    if (user) {
      checkUserRoleAndRedirect();
    } else {
      setIsCheckingUser(false);
    }
  }, [user, fromPath, returnTo, lastRoute]);

  return (
    <>
      <SignedIn>
        {isCheckingUser ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Verificando usuário...</p>
            </div>
          </div>
        ) : redirectTo ? (
          <Navigate to={redirectTo} replace />
        ) : null}
      </SignedIn>

      <SignedOut>
        <CustomLogin />
      </SignedOut>
    </>
  );
};
```

### 4. Context de Permissões

```tsx
// front/src/contexts/AuthPermissionsContext.tsx
export interface UserData {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  role: string; // API retorna como string, não como enum
  createdAt: string;
  updatedAt: string;
}

export interface AuthPermissionsContextType {
  user: UserData | null;
  role: string | null;
  isLoading: boolean;
  error: string | null;

  // Funções de verificação de permissão
  hasPermission: (permission: Permission) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;

  // Helpers de role
  isAdmin: boolean;
  isInstructor: boolean;
  isOperator: boolean;
  isProducer: boolean;
  isModel: boolean;
  isStudent: boolean;

  // Função para recarregar dados do usuário
  refetch: () => Promise<void>;
}

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
        console.warn('[AuthPermissions] Email não encontrado no Clerk - modo degradado');
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Buscar usuário no banco de dados
      const response = await apiClient.get<UserData>(`/api/Users/by-email/${encodeURIComponent(email)}`);

      setUser(response);
      setError(null);
    } catch (err) {
      console.warn('[AuthPermissions] Usuário não encontrado no banco de dados, permitindo acesso em modo degradado');
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

  // A role vem da API como string
  const role = user?.role || null;

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

### 5. Fallback para quando Clerk falha

```tsx
// front/src/components/auth/clerk-fallback.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';
import { clearClerkFailedStatus } from '@/utils/clerk-utils';

export const ClerkErrorFallback: React.FC = () => {
  const handleRetry = () => {
    clearClerkFailedStatus();
    window.location.reload();
  };

  const handleContinueWithoutAuth = () => {
    // Implementar modo de desenvolvimento sem Clerk
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Erro de Autenticação</CardTitle>
          <CardDescription>
            Ocorreu um problema ao conectar com o serviço de autenticação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p>Possíveis causas:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Problemas de conectividade com a internet</li>
              <li>Serviço de autenticação temporariamente indisponível</li>
              <li>Configuração incorreta do Clerk</li>
              <li>Limite de taxa excedido</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-2">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>

            {import.meta.env.DEV && (
              <Button variant="outline" onClick={handleContinueWithoutAuth} className="w-full">
                <LogIn className="w-4 h-4 mr-2" />
                Continuar sem Autenticação (Dev Mode)
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-500 text-center">
            Se o problema persistir, entre em contato com o suporte.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 6. Hook para Token do Clerk

```tsx
// front/src/hooks/use-clerk-auth.ts
import { useAuth } from '@clerk/clerk-react';

export const useClerkAuth = () => {
  const { getToken, isSignedIn } = useAuth();

  const getClerkToken = async (): Promise<string | null> => {
    try {
      if (!isSignedIn) {
        return null;
      }
      const token = await getToken();
      return token;
    } catch (error) {
      console.error('Erro ao obter token do Clerk:', error);
      return null;
    }
  };

  return {
    getClerkToken,
    isSignedIn
  };
};
```

## 🧪 Exercícios Práticos

### Exercício 1: Sistema de Autenticação Completo

```tsx
// Criar um sistema de autenticação completo com Clerk
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

function AuthSystem() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      setIsLoading(false);
    }
  }, [isLoaded]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isSignedIn && user) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Perfil do Usuário</CardTitle>
            <CardDescription>Informações da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <img
                src={user.imageUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full"
              />
              <div>
                <h3 className="font-semibold">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Primeiro Nome</Label>
              <Input value={user.firstName || ''} readOnly />
            </div>

            <div className="space-y-2">
              <Label>Sobrenome</Label>
              <Input value={user.lastName || ''} readOnly />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.primaryEmailAddress?.emailAddress || ''} readOnly />
            </div>

            <Button onClick={handleSignOut} variant="outline" className="w-full">
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Login Necessário</CardTitle>
          <CardDescription>
            Você precisa estar logado para acessar esta página.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Fazer Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Exercício 2: Proteção de Rotas por Roles

```tsx
// Implementar proteção de rotas baseada em roles
import { useUser } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

function RoleGuard({ children, allowedRoles, fallbackPath = '/unauthorized' }: RoleGuardProps) {
  const { user, isLoaded } = useUser();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const userRole = user.publicMetadata?.role as string;

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

// Hook para verificar permissões
function usePermissions() {
  const { user } = useUser();

  const hasPermission = (permission: string): boolean => {
    const userPermissions = user?.publicMetadata?.permissions as string[] || [];
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    const userPermissions = user?.publicMetadata?.permissions as string[] || [];
    return permissions.some(permission => userPermissions.includes(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    const userPermissions = user?.publicMetadata?.permissions as string[] || [];
    return permissions.every(permission => userPermissions.includes(permission));
  };

  const hasRole = (role: string): boolean => {
    const userRole = user?.publicMetadata?.role as string;
    return userRole === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    const userRole = user?.publicMetadata?.role as string;
    return roles.includes(userRole);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    userRole: user?.publicMetadata?.role as string,
    permissions: user?.publicMetadata?.permissions as string[]
  };
}

// Usando o sistema de permissões
function AdminPanel() {
  const { hasPermission } = usePermissions();

  if (!hasPermission('admin:read')) {
    return <div>Acesso negado</div>;
  }

  return (
    <div>
      <h1>Painel Administrativo</h1>
      {/* Conteúdo do admin */}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/admin" element={
        <RoleGuard allowedRoles={['admin', 'super-admin']}>
          <AdminPanel />
        </RoleGuard>
      } />

      <Route path="/instructor" element={
        <RoleGuard allowedRoles={['admin', 'instructor']}>
          <InstructorDashboard />
        </RoleGuard>
      } />

      <Route path="/user-management" element={
        <RoleGuard allowedRoles={['admin']}>
          <UserManagement />
        </RoleGuard>
      } />
    </Routes>
  );
}
```

### Exercício 3: Integração com Backend

```tsx
// Criar integração completa com backend
import { useUser } from '@clerk/clerk-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';

// Hook para sincronizar usuário
function useUserSync() {
  const { user, isLoaded, isSignedIn } = useUser();
  const queryClient = useQueryClient();

  const { mutate: syncUser, isLoading } = useMutation({
    mutationFn: async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        throw new Error('Email não encontrado');
      }

      const response = await apiClient.post('/auth/sync', {
        email: user.primaryEmailAddress.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        clerkId: user.id
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      syncUser();
    }
  }, [isLoaded, isSignedIn, user]);

  return { isLoading };
}

// Hook para dados do usuário do backend
function useUserData() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['user', user?.id],
    queryFn: async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        throw new Error('Usuário não autenticado');
      }

      const response = await apiClient.get(`/users/by-email/${encodeURIComponent(user.primaryEmailAddress.emailAddress)}`);
      return response;
    },
    enabled: !!user?.primaryEmailAddress?.emailAddress,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Componente que usa a integração
function UserProfile() {
  const { data: userData, isLoading, error } = useUserData();
  const { isLoading: isSyncing } = useUserSync();

  if (isLoading || isSyncing) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro ao carregar dados do usuário</div>;
  }

  return (
    <div>
      <h1>Perfil do Usuário</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Clerk</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Nome: {user?.firstName} {user?.lastName}</p>
            <p>Email: {user?.primaryEmailAddress?.emailAddress}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Role: {userData?.role}</p>
            <p>Departamento: {userData?.department}</p>
            <p>Último Login: {new Date(userData?.lastLogin).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

## 🎯 Pontos Críticos para Desenvolvedores C#

### 1. **Estado de Loading**

```tsx
// ❌ Ruim - não trata estado de loading
function ProtectedRoute({ children }) {
  const { isSignedIn } = useUser();

  if (!isSignedIn) {
    return <Navigate to="/login" />;
  }

  return children;
}

// ✅ Correto - trata loading
function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" />;
  }

  return children;
}
```

### 2. **Preservar Rota de Origem**

```tsx
// ❌ Ruim - não preserva onde usuário estava
return <Navigate to="/login" />;

// ✅ Correto - preserva rota
return <Navigate to="/login" state={{ from: location }} />;
```

### 3. **Metadata do Usuário**

```tsx
// ❌ Ruim - acessar metadata sem verificação
const userRole = user.publicMetadata.role;

// ✅ Correto - com verificação
const userRole = user?.publicMetadata?.role as string;
const permissions = user?.publicMetadata?.permissions as string[];
```

### 4. **Error Handling**

```tsx
// ❌ Ruim - sem tratamento de erro
await user.update({ firstName: 'New Name' });

// ✅ Correto - com tratamento de erro
try {
  await user.update({ firstName: 'New Name' });
} catch (error) {
  console.error('Erro ao atualizar usuário:', error);
  // Mostrar erro para usuário
}
```

## 🏁 Conclusão

Clerk oferece uma **solução completa** para autenticação:

1. **Setup rápido** e fácil
2. **UI components** prontos para usar
3. **Integração com backend** via webhooks
4. **Role-based access control**
5. **Multi-tenant** support
6. **Social login** integrado

## 📚 Próximos Passos

Agora que você domina autenticação, está pronto para:

- **Módulo 12:** Consumir APIs REST e GraphQL
- **Módulo 13:** Padrões de design e boas práticas
- **Módulo 14:** Projetos práticos completos

## 🎯 Resumo do que Aprendemos

✅ **Configuração do Clerk**
✅ **Componentes básicos (useUser, SignIn, SignOut)**
✅ **Proteção de rotas**
✅ **Role-based access control**
✅ **User management**
✅ **Integração com backend**
✅ **Custom UI components**
✅ **Error handling**
✅ **Exemplos do projeto real**

---

**🎓 Parabéns! Você completou o Módulo 11!**

**Continue para o [Módulo 12: Consumo de APIs](Modulo-12-Consumo-API.md)**
