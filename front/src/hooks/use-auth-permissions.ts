import { useContext } from 'react';
import AuthPermissionsContext, { type AuthPermissionsContextType } from '@/contexts/AuthPermissionsContext';

/**
 * Hook para acessar o contexto de permissões e autenticação
 * @throws {Error} Se usado fora do AuthPermissionsProvider
 */
export const useAuthPermissions = (): AuthPermissionsContextType => {
  const context = useContext(AuthPermissionsContext);
  if (context === undefined) {
    throw new Error('useAuthPermissions must be used within an AuthPermissionsProvider');
  }
  return context;
};

