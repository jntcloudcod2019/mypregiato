import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectivityMonitorProps {
  showBadge?: boolean;
  className?: string;
}

export const ConnectivityMonitor: React.FC<ConnectivityMonitorProps> = ({ 
  showBadge = true, 
  className = "" 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBadge) {
    return null;
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="h-3 w-3" />,
        text: 'Sem Internet',
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-700 border-red-200'
      };
    }

    return {
      icon: <Wifi className="h-3 w-3" />,
      text: 'Online',
      variant: 'default' as const,
      className: 'bg-green-100 text-green-700 border-green-200'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Badge 
      variant={statusInfo.variant}
      className={`${statusInfo.className} ${className} text-xs px-2 py-1 flex items-center gap-1`}
    >
      {statusInfo.icon}
      {statusInfo.text}
    </Badge>
  );
};
