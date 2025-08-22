import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import App from '../App';
import { Toaster } from "./ui/toaster";

// Criando o cliente de query fora do componente para evitar recriações
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minuto
      retry: 1,
    },
  },
});

type RootAppProps = React.PropsWithChildren<{
  /**
   * Modo de inicialização do tema
   * @default "light"
   */
  initialTheme?: string;
  
  /**
   * Flag para ativar/desativar animações
   * @default true
   */
  enableAnimations?: boolean;
}>;

/**
 * Componente raiz da aplicação que configura providers e tema
 */
export function RootApp({ 
  children, 
  initialTheme = "light",
  enableAnimations = true 
}: RootAppProps = {}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme={initialTheme} enableSystem>
        <App />
        <Toaster />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
