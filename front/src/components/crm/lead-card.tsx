import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, MoreHorizontal } from 'lucide-react';

interface LeadCardProps {
  name: string;
  subtitle?: string;
  badge?: string;
  accentClassName?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onClick?: () => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  name,
  subtitle,
  badge,
  accentClassName = 'bg-primary',
  draggable = false,
  onDragStart,
  onClick
}) => {
  return (
    <Card 
      className={`relative overflow-hidden transition-all hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
    >
      {/* Barra de acento lateral */}
      <div className={`absolute left-0 top-0 w-1 h-full ${accentClassName}`} />
      
      <CardContent className="p-3 pl-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{name}</div>
              {subtitle && (
                <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {badge && (
              <Badge variant="outline" className="text-[10px] h-5 px-1">
                {badge}
              </Badge>
            )}
            <button className="h-6 w-6 rounded-full hover:bg-muted flex items-center justify-center">
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
