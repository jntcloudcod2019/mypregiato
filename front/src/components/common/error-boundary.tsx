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
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Verificar se é um erro CRÍTICO do Clerk (mais específico)
    const errorString = error.toString().toLowerCase();
    const isClerkCriticalError = (
      errorString.includes('clerk initialization failed') ||
      errorString.includes('clerk is not defined') ||
      errorString.includes('clerk provider not found') ||
      (errorString.includes('clerk') && errorString.includes('initialization'))
    );
    
    if (isClerkCriticalError) {
      console.log('Clerk CRITICAL error detected, disabling Clerk for this session');
      try {
        // Marca o erro do Clerk para esta sessão
        sessionStorage.setItem('clerk_failed', 'true');
      } catch (e) {
        console.error('Failed to update sessionStorage:', e);
      }
    } else if (errorString.includes('authentication')) {
      // Para erros de autenticação genéricos, apenas logar sem marcar como falha do Clerk
      console.log('Authentication error (não crítico do Clerk):', error.toString());
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
