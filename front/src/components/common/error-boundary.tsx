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
    
    // Verificar se é um erro relacionado ao Clerk
    const errorString = error.toString().toLowerCase();
    if (errorString.includes('clerk') || errorString.includes('authentication')) {
      console.log('Clerk authentication error detected, disabling Clerk for this session');
      try {
        // Marca o erro do Clerk para esta sessão
        sessionStorage.setItem('clerk_failed', 'true');
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
