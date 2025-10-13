import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('❌ Error caught by ErrorBoundary:', error, errorInfo);
    
    const errorString = error.toString().toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';
    
    // ✅ CRÍTICO: Apenas marcar como falha do Clerk se for REALMENTE um erro crítico de inicialização
    const isClerkCriticalError = (
      errorString.includes('clerk initialization failed') ||
      errorString.includes('clerk provider not found') ||
      errorString.includes('clerk context is undefined')
    );
    
    // ✅ Detectar erros JavaScript comuns que NÃO são do Clerk
    const isCommonJSError = (
      errorString.includes('is not defined') ||
      errorString.includes('cannot read property') ||
      errorString.includes('cannot read properties of') ||
      errorString.includes('undefined is not') ||
      errorString.includes('null is not') ||
      errorString.includes('is not a function')
    );
    
    // ✅ NÃO marcar clerk_failed para erros comuns de JavaScript
    if (isCommonJSError && !isClerkCriticalError) {
      console.warn('⚠️ JavaScript error (não relacionado ao Clerk):', error.toString());
      console.error('📍 Component Stack:', errorInfo.componentStack);
      // NÃO marcar clerk_failed
      return;
    }
    
    if (isClerkCriticalError) {
      console.error('🔴 CLERK CRITICAL ERROR - Desabilitando Clerk');
      try {
        sessionStorage.setItem('clerk_failed', 'true');
        sessionStorage.setItem('clerk_last_failure', Date.now().toString());
      } catch (e) {
        console.error('Failed to update sessionStorage:', e);
      }
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-4 border border-red-300 rounded bg-red-50 text-red-800">
          <h3 className="text-lg font-medium mb-2">Algo deu errado</h3>
          <p className="text-sm">{this.state.error?.message || 'Erro desconhecido'}</p>
          <button 
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
