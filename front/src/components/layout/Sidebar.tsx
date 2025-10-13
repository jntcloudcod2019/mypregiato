import React from 'react';
import { RoleBasedNavigation } from '@/components/navigation/RoleBasedNavigation';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={`w-64 bg-background border-r p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-64 bg-background border-r p-4 ${className}`}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Pregiato Management</h2>
        {user && (
          <p className="text-sm text-muted-foreground">
            {user.firstName} {user.lastName} ({user.role})
          </p>
        )}
      </div>
      
      <RoleBasedNavigation />
    </div>
  );
};

export default Sidebar;
