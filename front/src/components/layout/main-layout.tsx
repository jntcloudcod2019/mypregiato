import React, { useEffect, useState } from 'react';
import { SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { SignedIn, SignedOut, useUser, useClerk } from "@clerk/clerk-react";
import { Button } from "../ui/button";
import { LogOut, RotateCcw, User } from "lucide-react";
import CustomLogin from "../auth/custom-login";
import { ErrorBoundary } from "../common/error-boundary";
import { ClerkErrorFallback } from "../auth/clerk-fallback";
import { LoadingFallback } from "../ui/loading-fallback";

interface MainLayoutProps {
  children: React.ReactNode;
}

// Modo de desenvolvimento para fallback gracioso quando Clerk falha
const DEV_MODE = import.meta.env.DEV;

export default function MainLayout({ children }: MainLayoutProps) {
  const [bypassAuth, setBypassAuth] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  
  // Verificar se o Clerk já falhou antes (via sessionStorage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const clerkFailed = sessionStorage.getItem('clerk_failed') === 'true';
        if (clerkFailed) {
          console.log("Clerk desabilitado devido a falhas anteriores, ativando modo de bypass");
          setBypassAuth(true);
        }
      } catch (e) {
        // Ignorar erros de sessão
      }
    }
  }, []);

  // Verificar se o Clerk está carregando por tempo demais
  useEffect(() => {
    if (DEV_MODE && !bypassAuth && isLoaded === false) {
      const timer = setTimeout(() => {
        console.log("Verificação de timeout do Clerk, ativando modo de fallback");
        
        // Salvar status de falha
        try {
          sessionStorage.setItem('clerk_failed', 'true');
        } catch (e) {
          console.error('Error saving clerk_failed:', e);
        }
        
        setBypassAuth(true);
      }, 5000); // 5 segundos para dar tempo ao Clerk
      return () => clearTimeout(timer);
    }
  }, [bypassAuth, isLoaded]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      // Fazer logout do Clerk se estiver autenticado
      if (isSignedIn) {
        await signOut();
      }
      
      // Limpar sessionStorage
      try {
        sessionStorage.removeItem('clerk_failed');
      } catch (e) {
        console.error('Error clearing sessionStorage:', e);
      }
      
      // Se estiver em modo bypass, voltar para autenticação
      if (bypassAuth) {
        setBypassAuth(false);
      }
    } catch (e) {
      console.error("Erro ao fazer logout:", e);
      // Em caso de erro, recarregar a página
      window.location.reload();
    }
  };

  const handleContinueWithoutAuth = () => {
    setBypassAuth(true);
  };

  const handleRetryAuth = () => {
    try {
      sessionStorage.removeItem('clerk_failed');
    } catch (e) {
      console.error('Error clearing sessionStorage:', e);
    }
    window.location.reload();
  };

  // Renderizar conteúdo principal
  const renderMainContent = () => {
    return (
      <>
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur">
            <div className="flex items-center gap-3">
              {bypassAuth && (
                <span className="text-sm font-medium text-muted-foreground">
                  Modo de Visualização
                </span>
              )}
              {isSignedIn && user && (
                <span className="text-sm font-medium text-muted-foreground">
                  Olá, {user.firstName || user.emailAddresses[0]?.emailAddress || 'Usuário'}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
                title={bypassAuth ? "Voltar à Autenticação" : "Fazer Logout"}
              >
                <LogOut className="h-4 w-4" />
              </Button>
              
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </>
    );
  };

  // Se está em modo de bypass
  if (bypassAuth) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          {renderMainContent()}
        </div>
      </SidebarProvider>
    );
  }

  // Se o Clerk ainda está carregando
  if (!isLoaded) {
    return <LoadingFallback />;
  }

  // Renderizar com autenticação do Clerk
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ErrorBoundary 
          fallback={
            <ClerkErrorFallback 
              onRetry={handleRetryAuth}
              onContinue={handleContinueWithoutAuth}
            />
          }
        >
          <SignedIn>
            {renderMainContent()}
          </SignedIn>

          <SignedOut>
            {DEV_MODE ? (
              <div className="w-full flex flex-col items-center justify-center">
                <CustomLogin />
                <Button 
                  className="mt-4" 
                  onClick={handleContinueWithoutAuth}
                  size="sm"
                  variant="outline"
                >
                  Modo Desenvolvimento: Pular Login
                </Button>
              </div>
            ) : (
              <CustomLogin />
            )}
          </SignedOut>
        </ErrorBoundary>
      </div>
    </SidebarProvider>
  );
}