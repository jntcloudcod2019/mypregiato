/**
 * KanbanBoard Component
 * Main Kanban board container with all columns
 */

import React from 'react';
import type { KanbanBoardProps } from '../../types/scheduling';
import { KanbanColumn } from './KanbanColumn';
import { Button } from '../ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  kanbanData, 
  isLoading, 
  onCardClick,
  onRefresh 
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-500">Carregando Kanban...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agendamentos de Leads</h1>
          <p className="text-gray-500 text-sm mt-1">
            Total: <span className="font-semibold">{kanbanData.totalLeads}</span> leads
          </p>
        </div>
        {onRefresh && (
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        )}
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {kanbanData.columns.map((column) => (
          <KanbanColumn 
            key={column.status} 
            column={column} 
            onCardClick={onCardClick} 
          />
        ))}
      </div>
    </div>
  );
};

