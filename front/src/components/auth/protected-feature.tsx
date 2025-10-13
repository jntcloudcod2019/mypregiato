import React from 'react';
import { useAuthPermissions } from '@/contexts/AuthPermissionsContext';
import { Permission, UserRole } from '@/config/permissions';

interface ProtectedFeatureProps {
  children: React.ReactNode;
  
  // Verificação por permissão
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // Se true, requer todas as permissões. Se false, requer pelo menos uma
  
  // Verificação por role
  allowedRoles?: UserRole[];
  
  // Verificação por role bloqueada
  blockedRoles?: UserRole[];
  
  // Componente fallback se não tiver permissão
  fallback?: React.ReactNode;
  
  // Se true, renderiza null em vez de fallback
  hideWhenDenied?: boolean;
}

/**
 * Componente para proteger features baseado em permissões e roles
 * 
 * Exemplos de uso:
 * 
 * // Por permissão única
 * <ProtectedFeature permission={Permission.CREATE_TRAINING}>
 *   <Button>Criar Treinamento</Button>
 * </ProtectedFeature>
 * 
 * // Por múltiplas permissões (precisa de todas)
 * <ProtectedFeature permissions={[Permission.EDIT_TRAINING, Permission.DELETE_TRAINING]} requireAll>
 *   <Button>Gerenciar</Button>
 * </ProtectedFeature>
 * 
 * // Por múltiplas permissões (precisa de pelo menos uma)
 * <ProtectedFeature permissions={[Permission.VIEW_CRM, Permission.VIEW_ATTENDANCE]}>
 *   <MenuItem>Operacional</MenuItem>
 * </ProtectedFeature>
 * 
 * // Por roles permitidas
 * <ProtectedFeature allowedRoles={[UserRole.ADMIN, UserRole.INSTRUCTOR]}>
 *   <AdminPanel />
 * </ProtectedFeature>
 * 
 * // Por roles bloqueadas (útil para MODEL)
 * <ProtectedFeature blockedRoles={[UserRole.MODEL]}>
 *   <Button>Criar Treinamento</Button>
 * </ProtectedFeature>
 * 
 * // Com fallback personalizado
 * <ProtectedFeature permission={Permission.CREATE_TRAINING} fallback={<LockedMessage />}>
 *   <Button>Criar</Button>
 * </ProtectedFeature>
 */
export const ProtectedFeature: React.FC<ProtectedFeatureProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  allowedRoles,
  blockedRoles,
  fallback,
  hideWhenDenied = false,
}) => {
  const { role, hasPermission, hasAllPermissions, hasAnyPermission } = useAuthPermissions();

  // Se não há role, negar acesso
  if (!role) {
    return hideWhenDenied ? null : (fallback || null);
  }

  // Verificar roles bloqueadas
  if (blockedRoles && blockedRoles.includes(role)) {
    return hideWhenDenied ? null : (fallback || null);
  }

  // Verificar roles permitidas
  if (allowedRoles && !allowedRoles.includes(role)) {
    return hideWhenDenied ? null : (fallback || null);
  }

  // Verificar permissão única
  if (permission && !hasPermission(permission)) {
    return hideWhenDenied ? null : (fallback || null);
  }

  // Verificar múltiplas permissões
  if (permissions) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasAccess) {
      return hideWhenDenied ? null : (fallback || null);
    }
  }

  // Se passou por todas as verificações, renderizar children
  return <>{children}</>;
};

/**
 * Hook alternativo para verificação condicional inline
 */
export const useFeatureAccess = () => {
  const { role, hasPermission, hasAllPermissions, hasAnyPermission } = useAuthPermissions();

  const canAccess = React.useCallback((options: Omit<ProtectedFeatureProps, 'children' | 'fallback' | 'hideWhenDenied'>) => {
    if (!role) return false;

    if (options.blockedRoles && options.blockedRoles.includes(role)) {
      return false;
    }

    if (options.allowedRoles && !options.allowedRoles.includes(role)) {
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

export default ProtectedFeature;

