import React from 'react';
import { useServerConnection } from '@/hooks/useServerConnection';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface ServerMonitorProps {
  showBadge?: boolean;
  className?: string;
}

export const ServerMonitor: React.FC<ServerMonitorProps> = ({ 
  showBadge = true, 
  className = "" 
}) => {
  const { serverStatus } = useServerConnection();

  if (!showBadge) {
    return null;
  }

  const getStatusInfo = () => {
    if (!serverStatus.isOnline) {
      return {
        icon: <WifiOff className="h-3 w-3" />,
        text: 'API Offline',
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-700 border-red-200'
      };
    }

    if (serverStatus.errorCount > 0) {
      return {
        icon: <AlertTriangle className="h-3 w-3" />,
        text: 'API Instável',
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      };
    }

    return {
      icon: <Wifi className="h-3 w-3" />,
      text: 'API Online',
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
