import React from 'react';

/**
 * Componente de loading para usar com Suspense
 */
export function LoadingFallback() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
