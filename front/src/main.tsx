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
          afterSignInUrl="/login"
          afterSignUpUrl="/login"
        >
          <RootApp />
        </ClerkProvider>
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);