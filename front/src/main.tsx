import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { RootApp } from '@/components/root-app';
import { ClerkErrorFallback } from '@/components/auth/clerk-fallback';
import { LoadingFallback } from '@/components/ui/loading-fallback';
import { detectClerkAvailability, getClerkPublishableKey, shouldEnableClerk } from '@/utils/clerk-utils';

/**
 * Ponto de entrada da aplicação
 * 
 * Configura:
 * - StrictMode para desenvolvimento
 * - ErrorBoundary para tratamento de erros
 * - Clerk para autenticação
 * - Suspense para carregamento assíncrono
 */

// Verifica se o Clerk deve ser usado
const shouldUseClerk = shouldEnableClerk() && detectClerkAvailability(true);

// Obtém a chave publishable do Clerk
const PUBLISHABLE_KEY = getClerkPublishableKey();

// Renderiza a árvore de componentes
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary 
      fallback={
        <ClerkErrorFallback />
      }
    >
      <Suspense fallback={<LoadingFallback />}>
        <ClerkProvider 
          publishableKey={PUBLISHABLE_KEY}
          afterSignInUrl="/"
          afterSignUpUrl="/"
        >
          <RootApp />
        </ClerkProvider>
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);