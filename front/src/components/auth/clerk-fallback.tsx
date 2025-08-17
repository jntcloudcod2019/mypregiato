import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Shield } from 'lucide-react';

interface ClerkErrorFallbackProps {
  onRetry?: () => void;
  onContinue?: () => void;
}

export function ClerkErrorFallback({ onRetry, onContinue }: ClerkErrorFallbackProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      // Limpar o status de falha e continuar
      try {
        sessionStorage.removeItem('clerk_failed');
        window.location.reload();
      } catch (e) {
        console.error('Erro ao limpar status de falha:', e);
        window.location.reload();
      }
    }
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
                A aplicação continuará funcionando com recursos limitados. 
                Algumas funcionalidades podem não estar disponíveis.
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
                onClick={handleContinue}
                className="w-full"
              >
                Continuar sem Autenticação
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
