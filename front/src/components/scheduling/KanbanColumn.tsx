/**
 * KanbanColumn Component
 * Represents a single column in the Kanban board
 */

import React from 'react';
import type { KanbanColumnProps } from '../../types/scheduling';
import { KanbanCard } from './KanbanCard';
import { ColumnPagination } from './ColumnPagination';
import { Badge } from '../ui/badge';

interface ExtendedKanbanColumnProps extends KanbanColumnProps {
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onPageChange?: (page: number) => void;
}

export const KanbanColumn: React.FC<ExtendedKanbanColumnProps> = ({ 
  column, 
  onCardClick,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange
}) => {
  const getColumnIcon = (): string => {
    switch (column.status) {
      case 'new':
        return '🆕';
      case 'scheduled':
        return '📅';
      case 'pending':
        return '⏳';
      default:
        return '📋';
    }
  };

  const getColumnColor = (): string => {
    switch (column.status) {
      case 'new':
        return 'bg-blue-100 border-blue-300';
      case 'scheduled':
        return 'bg-green-100 border-green-300';
      case 'pending':
        return 'bg-amber-100 border-amber-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="flex-1 min-w-[320px] max-w-[450px]">
      {/* Column Header */}
      <div className={`rounded-lg p-4 mb-4 border-2 ${getColumnColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getColumnIcon()}</span>
            <h2 className="text-lg font-bold">{column.label}</h2>
          </div>
          <Badge variant="secondary" className="text-sm font-semibold">
            {column.count}
          </Badge>
        </div>
      </div>

      {/* Column Content */}
      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-2 custom-scrollbar">
        {column.leads.length === 0 ? (
          <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm">Nenhum lead nesta coluna</p>
          </div>
        ) : (
          column.leads.map((lead) => (
            <KanbanCard 
              key={lead.id} 
              lead={lead} 
              onCardClick={onCardClick} 
            />
          ))
        )}
      </div>
    </div>
  );
};

