import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthUser } from '@/hooks/use-auth-user';

interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  allowedRoles?: string[];
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Menu Principal',
    href: '/dashboard',
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT']
  },
  {
    label: 'Dashboard',
    href: '/dashboard',
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT']
  },
  {
    label: 'CRM',
    href: '/crm',
    allowedRoles: ['ADMIN', 'INSTRUCTOR']
  },
  {
    label: 'Atendimento',
    href: '/atendimento',
    allowedRoles: ['ADMIN', 'INSTRUCTOR']
  },
  {
    label: 'Ponto Eletrônico',
    href: '/ponto-eletronico',
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT']
  },
  {
    label: 'Contratos',
    href: '/contratos',
    allowedRoles: ['ADMIN', 'INSTRUCTOR']
  },
  {
    label: 'Talentos',
    href: '/talentos',
    allowedRoles: ['ADMIN', 'INSTRUCTOR']
  },
  {
    label: 'Finanças',
    href: '/financas',
    allowedRoles: ['ADMIN']
  },
  {
    label: 'Usuários',
    href: '/usuarios',
    allowedRoles: ['ADMIN']
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    allowedRoles: ['ADMIN', 'INSTRUCTOR']
  },
  {
    label: 'Treinamentos',
    href: '/treinamentos',
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT', 'MODEL']
  }
];

interface RoleBasedNavigationProps {
  className?: string;
}

export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({ className }) => {
  const { user, isModel } = useAuthUser();
  const location = useLocation();

  // Filtrar itens de navegação baseado na role do usuário
  const allowedItems = navigationItems.filter(item => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(user?.role || '');
  });

  return (
    <nav className={cn('space-y-2', className)}>
      {allowedItems.map((item) => {
        const isActive = location.pathname === item.href;
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default RoleBasedNavigation;
