import React from 'react';
import { useAuthPermissions } from './use-auth-permissions';
import { Permission, UserRole } from '@/config/permissions';

interface FeatureAccessOptions {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  allowedRoles?: UserRole[];
  blockedRoles?: UserRole[];
}

/**
 * Hook alternativo para verificação condicional inline de permissões
 * 
 * @example
 * const { canAccess } = useFeatureAccess();
 * 
 * if (canAccess({ permission: Permission.CREATE_TRAINING })) {
 *   // Renderizar botão de criar
 * }
 */
export const useFeatureAccess = () => {
  const { role, hasPermission, hasAllPermissions, hasAnyPermission } = useAuthPermissions();

  const canAccess = React.useCallback((options: FeatureAccessOptions) => {
    if (!role) return false;

    // Verificar roles bloqueadas (comparar string com enum)
    if (options.blockedRoles && options.blockedRoles.some(blockedRole => blockedRole === role.toUpperCase())) {
      return false;
    }

    // Verificar roles permitidas (comparar string com enum)
    if (options.allowedRoles && !options.allowedRoles.some(allowedRole => allowedRole === role.toUpperCase())) {
      return false;
    }

    if (options.permission && !hasPermission(options.permission)) {
      return false;
    }

    if (options.permissions) {
      const hasAccess = options.requireAll
        ? hasAllPermissions(options.permissions)
        : hasAnyPermission(options.permissions);
      
      if (!hasAccess) return false;
    }

    return true;
  }, [role, hasPermission, hasAllPermissions, hasAnyPermission]);

  return { canAccess };
};

