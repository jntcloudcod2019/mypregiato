import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, RefreshCw, Shield, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClerkErrorFallbackProps {
  onRetry?: () => void;
}

export function ClerkErrorFallback({ onRetry }: ClerkErrorFallbackProps) {
  const navigate = useNavigate();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Limpar o status de falha e tentar novamente
      try {
        sessionStorage.removeItem('clerk_failed');
        window.location.reload();
      } catch (e) {
        console.error('Erro ao limpar status de falha:', e);
        window.location.reload();
      }
    }
  };

  const handleGoToLogin = () => {
    // Limpar o status de falha e ir para login
    try {
      sessionStorage.removeItem('clerk_failed');
    } catch (e) {
      console.error('Erro ao limpar status de falha:', e);
    }
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center border border-red-200 dark:border-red-800">
                <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
                Sistema de Autenticação Indisponível
              </CardTitle>
              <CardDescription>
                Estamos enfrentando problemas temporários com nosso provedor de autenticação.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                A autenticação é obrigatória para acessar a aplicação. 
                Tente novamente ou entre em contato com o suporte técnico.
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handleRetry}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              
              <Button 
                onClick={handleGoToLogin}
                className="w-full"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Ir para Login
              </Button>
            </div>

            {/* Info */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Se o problema persistir, entre em contato com o suporte técnico.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
